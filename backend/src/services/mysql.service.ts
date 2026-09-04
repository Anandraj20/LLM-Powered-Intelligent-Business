import { dbConfig } from '../config/database';
import http from 'http';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export interface SalesRecordInput {
  transaction_date?: string;
  product_name: string;
  category?: string;
  quantity: number;
  unit_price: number;
  revenue: number;
  cost: number;
  customer_region?: string;
}

class MySQLPipelineService {
  /**
   * Intelligently map flexible CSV/Excel row columns into standard business records
   */
  normalizeGenericRow(row: any, datasetType: string = 'sales'): SalesRecordInput {
    // Normalization keys
    const pName = row.product_name || row.product || row.item || row.item_name || row.service || row.name || row.customer_name || row.account || 'Enterprise Item';
    const cat = row.category || row.cat || row.type || row.sector || row.department || (datasetType.charAt(0).toUpperCase() + datasetType.slice(1));
    const qty = Math.max(1, Number(row.quantity || row.qty || row.units || row.count || row.deals || 1) || 1);
    const price = Number(row.unit_price || row.price || row.rate || row.unit_cost || 0) || 0;
    
    let rev = Number(row.revenue || row.total || row.sales || row.amount || row.total_amount || 0);
    if (!rev && price > 0) {
      rev = qty * price;
    }
    if (rev <= 0 && price <= 0) {
      rev = 10000.00; // fallback standard unit
    }

    let cost = Number(row.cost || row.expense || row.cogs || 0);
    if (!cost) {
      cost = Math.round(rev * 0.60 * 100) / 100; // 40% margin assumption
    }

    const reg = row.customer_region || row.region || row.geography || row.country || row.location || row.market || 'Domestic';
    let txDate = row.transaction_date || row.date || row.order_date || row.invoice_date || row.created_at;
    if (!txDate || isNaN(Date.parse(String(txDate)))) {
      txDate = new Date().toISOString().split('T')[0];
    } else {
      txDate = new Date(txDate).toISOString().split('T')[0];
    }

    return {
      transaction_date: txDate,
      product_name: String(pName).trim(),
      category: String(cat).trim(),
      quantity: qty,
      unit_price: price || Math.round((rev / qty) * 100) / 100,
      revenue: Math.round(rev * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      customer_region: String(reg).trim()
    };
  }

  async saveSalesDataset(
    fileName: string,
    records: SalesRecordInput[],
    userId?: string,
    organizationId?: string
  ): Promise<{ success: boolean; insertedCount: number; datasetId: string; ragTrained: boolean; trainingInfo?: any }> {
    let insertedCount = 0;
    const datasetId = `dataset-${Date.now()}`;

    // Ensure database connection is active
    if (!dbConfig.isConnected) {
      await dbConfig.testConnection();
    }

    // Step 1: Save records to MySQL Database
    if (dbConfig.isConnected) {
      try {
        const fileExt = fileName.endsWith('.xlsx') ? 'Excel' : fileName.endsWith('.json') ? 'JSON' : 'CSV';
        await dbConfig.query(
          `INSERT INTO uploaded_datasets (id, file_name, file_type, total_rows, indexed_in_rag, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)`,
          [datasetId, fileName, fileExt, records.length, 1, userId || 'admin']
        );

        // Fast batch insert in chunks of 100
        const CHUNK_SIZE = 100;
        for (let i = 0; i < records.length; i += CHUNK_SIZE) {
          const chunk = records.slice(i, i + CHUNK_SIZE);
          const values: any[] = [];
          const placeholders: string[] = [];

          for (const row of chunk) {
            const recordId = `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            values.push(
              recordId,
              organizationId || 'default-org-id',
              row.transaction_date || new Date().toISOString().split('T')[0],
              (row.product_name || 'Standard Item').slice(0, 250),
              (row.category || 'General').slice(0, 95),
              Math.max(1, Math.round(Number(row.quantity) || 1)),
              Math.max(0, Math.min(999999999.99, Number(row.unit_price) || 0)),
              Math.max(0, Math.min(999999999.99, Number(row.revenue) || 0)),
              Math.max(0, Math.min(999999999.99, Number(row.cost) || 0)),
              (row.customer_region || 'Domestic').slice(0, 95)
            );
          }

          if (placeholders.length > 0) {
            const sql = `INSERT INTO sales_records 
              (id, organization_id, transaction_date, product_name, category, quantity, unit_price, revenue, cost, customer_region)
              VALUES ${placeholders.join(', ')}`;
            await dbConfig.query(sql, values);
            insertedCount += chunk.length;
          }
        }

        // Update dataset row with actual verified inserted count
        await dbConfig.query(
          `UPDATE uploaded_datasets SET total_rows = ? WHERE id = ?`,
          [insertedCount, datasetId]
        );
      } catch (err: any) {
        console.error('Error inserting dataset into MySQL:', err.message);
        throw new Error(`Failed to commit dataset to MySQL businessmind_db: ${err.message}`);
      }
    } else {
      throw new Error('MySQL Database connection is not available. Please verify MySQL service.');
    }

    // Step 2: Trigger instant Ollama RAG training from fresh database records
    let ragTrained = false;
    let trainingInfo = null;
    try {
      trainingInfo = await this.triggerOllamaTraining();
      ragTrained = trainingInfo?.success || false;
    } catch (trainErr: any) {
      console.warn('Ollama training sync notice:', trainErr.message);
    }

    return {
      success: true,
      insertedCount,
      datasetId,
      ragTrained,
      trainingInfo
    };
  }

  /**
   * Request Python AI service to train Ollama RAG on latest MySQL tables
   */
  async triggerOllamaTraining(): Promise<any> {
    return new Promise((resolve) => {
      const urlObj = new URL(`${AI_SERVICE_URL}/api/v1/ai/train`);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 8000,
        path: urlObj.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve({ success: res.statusCode === 200, raw: body });
          }
        });
      });

      req.on('error', (err) => {
        console.warn('[Ollama Training Trigger Failed]:', err.message);
        resolve({ success: false, error: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Training request timed out' });
      });

      req.end();
    });
  }

  /**
   * Get comprehensive live monitoring metrics from MySQL and AI service
   */
  async getMonitoringStats(): Promise<any> {
    let dbSummary: any = null;
    let uploadedDatasets: any[] = [];

    if (!dbConfig.isConnected) {
      await dbConfig.testConnection();
    }

    if (dbConfig.isConnected) {
      try {
        const sumRows: any = await dbConfig.query(`
          SELECT 
            COUNT(*) as total_records,
            COALESCE(ROUND(SUM(revenue), 2), 0) as total_revenue,
            COALESCE(ROUND(SUM(cost), 2), 0) as total_cost,
            COALESCE(ROUND(SUM(profit), 2), 0) as total_profit,
            COUNT(DISTINCT category) as categories_count,
            COUNT(DISTINCT product_name) as products_count
          FROM sales_records
        `);
        dbSummary = Array.isArray(sumRows) ? (sumRows[0] || {}) : (sumRows || {});

        const datasetRows: any = await dbConfig.query(`
          SELECT id, file_name, file_type, total_rows, indexed_in_rag, created_at
          FROM uploaded_datasets
          ORDER BY created_at DESC
          LIMIT 100
        `);
        uploadedDatasets = Array.isArray(datasetRows) ? datasetRows : (datasetRows ? [datasetRows] : []);
      } catch (err: any) {
        console.error('Error fetching database monitoring stats:', err.message);
      }
    }

    // Fetch AI microservice resource metrics
    let aiMonitoring: any = null;
    try {
      aiMonitoring = await new Promise((resolve) => {
        const urlObj = new URL(`${AI_SERVICE_URL}/api/v1/ai/monitoring`);
        const req = http.get({
          hostname: urlObj.hostname,
          port: urlObj.port || 8000,
          path: urlObj.pathname,
          timeout: 5000
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(data)); } catch { resolve(null); }
          });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
      });
    } catch {
      aiMonitoring = null;
    }

    return {
      database: {
        name: 'businessmind_db',
        connected: dbConfig.isConnected,
        summary: dbSummary,
        uploaded_datasets: uploadedDatasets,
        total_datasets: uploadedDatasets.length
      },
      ai_engine: aiMonitoring?.ollama || { online: false, target_model: 'qwen3.5:4b' },
      rag_store: aiMonitoring?.rag_vector_store || { total_chunks: 0, engine: 'FAISS' },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Delete uploaded dataset record and re-train AI
   */
  async deleteDataset(datasetId: string): Promise<{ success: boolean; message: string }> {
    if (dbConfig.isConnected) {
      try {
        await dbConfig.query(`DELETE FROM uploaded_datasets WHERE id = ?`, [datasetId]);
        // Trigger re-training so RAG reflects deleted dataset
        await this.triggerOllamaTraining();
        return { success: true, message: 'Dataset removed and AI knowledge base updated' };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    }
    return { success: false, message: 'Database not connected' };
  }
}

export const mysqlPipelineService = new MySQLPipelineService();

