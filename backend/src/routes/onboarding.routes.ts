import { Router, Response } from 'express';
import multer from 'multer';
import { dataPipelineService } from '../services/dataPipeline.service';
import { onboardingStore, DatasetType } from '../models/dataOnboarding.model';
import { authenticateJWT, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// Configure Multer for in-memory file parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB limit
});

// FR2.2a, FR2.3, FR2.4, FR2.5: File Upload (CSV/Excel) with validation pipeline & sample preview
router.post(
  '/upload-preview',
  authenticateJWT,
  requirePermission('onboarding:upload'),
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file attached. Please select a CSV or Excel file.'
        });
      }

      const datasetType = (req.body.datasetType || 'sales') as DatasetType;
      const organizationId = req.user!.organizationId || 'default-org-id';

      const batch = await dataPipelineService.processFileUpload({
        fileBuffer: req.file.buffer,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        datasetType,
        organizationId,
        userId: req.user!.id
      });

      return res.status(200).json({
        success: true,
        message: 'File processed and normalized successfully',
        data: batch
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'File processing failed'
      });
    }
  }
);

// FR2.2b, FR2.3, FR2.4, FR2.5: External ERP / POS System API Sync Connection
router.post(
  '/erp-sync',
  authenticateJWT,
  requirePermission('onboarding:erp_sync'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { erpProvider, datasetType, apiKey } = req.body;
      const organizationId = req.user!.organizationId || 'default-org-id';

      if (!erpProvider) {
        return res.status(400).json({
          success: false,
          message: 'ERP provider name is required (e.g., QuickBooks, Square, Shopify, SAP)'
        });
      }

      const batch = await dataPipelineService.processErpSync({
        erpProvider,
        datasetType: datasetType || 'sales',
        organizationId,
        userId: req.user!.id,
        apiKey
      });

      return res.status(200).json({
        success: true,
        message: `Successfully connected to ${erpProvider} API and ingested data`,
        data: batch
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'ERP sync connection failed'
      });
    }
  }
);

// FR2.5: Confirm Final Import
router.post(
  '/confirm-import',
  authenticateJWT,
  requirePermission('onboarding:import'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { batchId } = req.body;
      const organizationId = req.user!.organizationId || 'default-org-id';

      if (!batchId) {
        return res.status(400).json({
          success: false,
          message: 'Batch ID is required'
        });
      }

      const result = await dataPipelineService.confirmImport(batchId, organizationId);

      return res.status(200).json({
        success: true,
        message: `Import confirmed! ${result.importedCount} records saved to business database.`,
        data: result
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Import confirmation failed'
      });
    }
  }
);

// GET onboarding batches for org
router.get(
  '/batches',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const organizationId = req.user!.organizationId || 'default-org-id';
      const batches = await onboardingStore.listBatchesByOrg(organizationId);

      return res.status(200).json({
        success: true,
        data: batches
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to list batches'
      });
    }
  }
);

// GET imported records for a dataset (sales, inventory, customers, finance)
router.get(
  '/imported/:datasetType',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const datasetType = req.params.datasetType as DatasetType;
      const organizationId = req.user!.organizationId || 'default-org-id';
      const records = await onboardingStore.getImportedRecords(organizationId, datasetType);

      return res.status(200).json({
        success: true,
        data: records
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch imported records'
      });
    }
  }
);

// ⚡ Direct Database Upload & Train Pipeline (Uploads directly to businessmind_db & trains Ollama)
router.post(
  '/direct-upload',
  upload.single('file'),
  async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file attached. Please select a CSV, Excel, or JSON dataset.'
        });
      }

      const fileName = req.file.originalname;
      const datasetType = (req.body.datasetType || 'sales') as string;
      const userId = req.user?.id || 'admin';
      const orgId = req.user?.organizationId || 'default-org-id';

      // Parse raw rows based on file extension
      let rawRows: any[] = [];
      const lowerName = fileName.toLowerCase();

      if (lowerName.endsWith('.csv')) {
        const { parse: parseCsv } = await import('csv-parse/sync');
        rawRows = parseCsv(req.file.buffer.toString('utf-8'), {
          columns: true,
          skip_empty_lines: true,
          trim: true
        });
      } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        const xlsx = await import('xlsx');
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
      } else if (lowerName.endsWith('.json')) {
        rawRows = JSON.parse(req.file.buffer.toString('utf-8'));
        if (!Array.isArray(rawRows)) {
          rawRows = [rawRows];
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported format. Please upload .csv, .xlsx, .xls, or .json'
        });
      }

      if (!rawRows || rawRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'The uploaded file contains no data rows.'
        });
      }

      // Normalize generic rows for businessmind_db
      const { mysqlPipelineService } = await import('../services/mysql.service');
      const normalizedRecords = rawRows.map(row => 
        mysqlPipelineService.normalizeGenericRow(row, datasetType)
      );

      // Save directly into businessmind_db and trigger Ollama RAG training
      const result = await mysqlPipelineService.saveSalesDataset(
        fileName,
        normalizedRecords,
        userId,
        orgId
      );

      return res.status(200).json({
        success: true,
        message: `Dataset '${fileName}' successfully ingested into businessmind_db! ${result.insertedCount} records saved and Ollama AI knowledge trained.`,
        data: {
          datasetId: result.datasetId,
          fileName,
          totalRows: result.insertedCount,
          ragTrained: result.ragTrained,
          trainingInfo: result.trainingInfo
        }
      });
    } catch (error: any) {
      console.error('Direct upload error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Direct upload to database failed'
      });
    }
  }
);

// 🔄 Sync Database & Train Ollama Pipeline
router.post(
  '/sync-database',
  async (_req: any, res: Response) => {
    try {
      const { mysqlPipelineService } = await import('../services/mysql.service');
      const trainResult = await mysqlPipelineService.triggerOllamaTraining();

      return res.status(200).json({
        success: trainResult?.success !== false,
        message: trainResult?.message || 'Database synchronized and Ollama AI trained successfully',
        data: trainResult
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Database synchronization failed'
      });
    }
  }
);

// 📂 Ingested Datasets in MySQL (Direct Catalog)
router.get(
  '/datasets',
  async (_req: any, res: Response) => {
    try {
      const { mysqlPipelineService } = await import('../services/mysql.service');
      const stats = await mysqlPipelineService.getMonitoringStats();

      return res.status(200).json({
        success: true,
        data: stats.database?.uploaded_datasets || [],
        summary: stats.database?.summary || {},
        total: stats.database?.total_datasets || 0
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to list datasets'
      });
    }
  }
);

// 📊 Live Data & AI Resource Monitoring Endpoint
router.get(
  '/monitoring',
  async (_req: any, res: Response) => {
    try {
      const { mysqlPipelineService } = await import('../services/mysql.service');
      const stats = await mysqlPipelineService.getMonitoringStats();

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch monitoring metrics'
      });
    }
  }
);

// 🗑️ Delete Uploaded Dataset Record
router.delete(
  ['/dataset/:id', '/datasets/:id'],
  async (req: any, res: Response) => {
    try {
      const { mysqlPipelineService } = await import('../services/mysql.service');
      const result = await mysqlPipelineService.deleteDataset(req.params.id);

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete dataset'
      });
    }
  }
);

export default router;

