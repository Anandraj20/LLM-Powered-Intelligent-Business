import { dbConfig } from '../config/database';
import * as xlsx from 'xlsx';
import { parse as parseCsv } from 'csv-parse/sync';
import http from 'http';

export interface WeekReportItem {
  weekIndex: number;
  weekKey: string;
  startDate: string;
  endDate: string;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  deals: number;
  quantity: number;
  status: 'PROFIT' | 'LOSS';
  wowGrowthPct: number | null;
  wowProfitGrowthPct: number | null;
  topProduct?: string;
}

export interface CategoryReportItem {
  category: string;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  deals: number;
  shareOfRevenue: number;
}

export interface ProductPerformanceItem {
  productName: string;
  category: string;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  quantity: number;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  status: 'PROFIT' | 'LOSS';
  totalDeals: number;
  totalUnits: number;
  avgDealValue: number;
  avgDealProfit: number;
  bestWeek: { weekKey: string; profit: number; margin: number } | null;
  worstWeek: { weekKey: string; profit: number; margin: number } | null;
}

export interface FullAnalysisReport {
  datasetName: string;
  generatedAt: string;
  summary: FinancialSummary;
  weekWiseReport: WeekReportItem[];
  categoryReport: CategoryReportItem[];
  topProducts: ProductPerformanceItem[];
  lossProducts: ProductPerformanceItem[];
  regionalBreakdown: Array<{ region: string; revenue: number; profit: number; deals: number }>;
  chartSeries: {
    weeklyProfitBars: Array<{ label: string; profit: number; revenue: number; cost: number; status: 'PROFIT' | 'LOSS' }>;
    revenueCostTrend: Array<{ label: string; revenue: number; cost: number }>;
    marginTrajectory: Array<{ label: string; margin: number }>;
    categoryShares: Array<{ category: string; profit: number; revenue: number; share: number }>;
  };
  keyFindings: string[];
}

export class AnalyticsService {
  /**
   * Run full financial analysis on the live MySQL sales_records database
   */
  async getLiveDatabaseAnalytics(organizationId?: string): Promise<FullAnalysisReport> {
    try {
      const conn = await dbConfig.getConnection();
      try {
        let whereClause = '';
        const params: any[] = [];
        if (organizationId && organizationId !== 'all') {
          const [check]: any = await conn.query('SELECT COUNT(*) as c FROM sales_records WHERE organization_id = ?', [organizationId]);
          if (check && check[0]?.c > 0) {
            whereClause = 'WHERE organization_id = ?';
            params.push(organizationId);
          }
        }

        // 1. Fetch all raw transaction records to compute precise week-wise and category metrics
        const [rows]: [any[], any] = await conn.query(
          `SELECT 
            id, transaction_date, product_name, category, 
            quantity, unit_price, revenue, cost, profit, customer_region 
           FROM sales_records 
           ${whereClause} 
           ORDER BY transaction_date ASC`,
          params
        );

        if (!rows || rows.length === 0) {
          return this.getEmptyAnalysisReport('MySQL Live Sales Database (No records found)');
        }

        return this.processNormalizedRows(rows, 'MySQL Live Sales Intelligence Records');
      } finally {
        conn.release();
      }
    } catch (error: any) {
      console.error('Error computing live database analytics:', error.message);
      throw error;
    }
  }

  /**
   * Process an uploaded file buffer (CSV, XLSX, XLS, or JSON)
   */
  async processUploadedDataset(fileBuffer: Buffer, fileName: string): Promise<FullAnalysisReport> {
    const rawRows = this.extractRowsFromFile(fileBuffer, fileName);
    if (!rawRows || rawRows.length === 0) {
      throw new Error('The uploaded dataset is empty or could not be parsed.');
    }

    const normalizedRows = this.normalizeRawRows(rawRows);
    return this.processNormalizedRows(normalizedRows, fileName);
  }

  /**
   * Parse rows from CSV, Excel, or JSON buffer
   */
  private extractRowsFromFile(buffer: Buffer, fileName: string): any[] {
    const lower = fileName.toLowerCase();

    if (lower.endsWith('.csv')) {
      const csvStr = buffer.toString('utf-8');
      return parseCsv(csvStr, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true
      });
    }

    if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      return xlsx.utils.sheet_to_json(sheet, { defval: '' });
    }

    if (lower.endsWith('.json')) {
      const parsed = JSON.parse(buffer.toString('utf-8'));
      if (Array.isArray(parsed)) return parsed;
      if (parsed.data && Array.isArray(parsed.data)) return parsed.data;
      if (parsed.records && Array.isArray(parsed.records)) return parsed.records;
      return [parsed];
    }

    throw new Error('Unsupported file format. Please upload a CSV, Excel (.xlsx, .xls), or JSON file.');
  }

  /**
   * Normalize flexible column headers into standard financial fields
   */
  private normalizeRawRows(rawRows: any[]): any[] {
    return rawRows.map((row, idx) => {
      // Find field values case-insensitively
      const getVal = (...keys: string[]): any => {
        for (const k of keys) {
          for (const rowKey of Object.keys(row)) {
            if (rowKey.trim().toLowerCase() === k.toLowerCase()) {
              return row[rowKey];
            }
          }
        }
        return undefined;
      };

      // Extract transaction date or generate fallback chronological sequence
      let dateVal = getVal('transaction_date', 'transactiondate', 'date', 'order_date', 'orderdate', 'created_at', 'timestamp');
      let transactionDate: Date;
      if (dateVal) {
        transactionDate = new Date(dateVal);
        if (isNaN(transactionDate.getTime())) {
          // Fallback to sequential fake date based on index if format invalid
          const baseDate = new Date(2025, 0, 1);
          baseDate.setDate(baseDate.getDate() + idx);
          transactionDate = baseDate;
        }
      } else {
        const baseDate = new Date(2025, 0, 1);
        baseDate.setDate(baseDate.getDate() + idx);
        transactionDate = baseDate;
      }

      const revenueRaw = getVal('revenue', 'sales', 'amount', 'total_price', 'total', 'selling_price', 'gross_revenue');
      const costRaw = getVal('cost', 'expenses', 'expense', 'cogs', 'purchase_cost', 'total_cost');
      const profitRaw = getVal('profit', 'net_profit', 'margin', 'gross_profit');
      const qtyRaw = getVal('quantity', 'qty', 'units', 'volume', 'count');
      const productRaw = getVal('product_name', 'product', 'item', 'item_name', 'sku', 'description');
      const categoryRaw = getVal('category', 'product_category', 'department', 'type', 'segment');
      const regionRaw = getVal('customer_region', 'region', 'location', 'country', 'city', 'territory');

      const quantity = Math.max(1, Math.round(Number(qtyRaw) || 1));
      let revenue = Number(revenueRaw);
      let cost = Number(costRaw);
      let profit = Number(profitRaw);

      if (isNaN(revenue)) {
        if (!isNaN(profit) && !isNaN(cost)) {
          revenue = profit + cost;
        } else {
          revenue = 1000;
        }
      }

      if (isNaN(cost)) {
        if (!isNaN(revenue) && !isNaN(profit)) {
          cost = revenue - profit;
        } else {
          // Assume standard 45% default cost if omitted
          cost = revenue * 0.45;
        }
      }

      if (isNaN(profit)) {
        profit = revenue - cost;
      }

      return {
        transaction_date: transactionDate,
        product_name: String(productRaw || `Item ${idx + 1}`).trim(),
        category: String(categoryRaw || 'General Business').trim(),
        quantity,
        revenue: Math.round(revenue * 100) / 100,
        cost: Math.round(cost * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        customer_region: String(regionRaw || 'Domestic').trim()
      };
    });
  }

  /**
   * Master financial calculation engine: Computes week-wise reports,
   * category breakdown, profit & loss, and interactive chart series.
   */
  private processNormalizedRows(rows: any[], datasetName: string): FullAnalysisReport {
    // Sort chronologically
    rows.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());

    let grandTotalRevenue = 0;
    let grandTotalCost = 0;
    let grandTotalProfit = 0;
    let grandTotalUnits = 0;

    const categoryMap: Record<string, { revenue: number; cost: number; profit: number; deals: number }> = {};
    const productMap: Record<string, { category: string; revenue: number; cost: number; profit: number; quantity: number }> = {};
    const regionMap: Record<string, { revenue: number; profit: number; deals: number }> = {};

    // Grouping into chronological weeks
    // Helper to get ISO week key (e.g. "2025-W03")
    const getWeekKey = (date: Date): { key: string; start: Date; end: Date } => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      
      // Calculate week start (Monday) and end (Sunday)
      const weekStart = new Date(date);
      const curDay = weekStart.getDay();
      const diffToMon = (curDay === 0 ? -6 : 1) - curDay;
      weekStart.setDate(weekStart.getDate() + diffToMon);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const yr = d.getUTCFullYear();
      const key = `${yr}-W${String(weekNo).padStart(2, '0')}`;
      return { key, start: weekStart, end: weekEnd };
    };

    const weekBuckets: Record<string, {
      startDate: Date;
      endDate: Date;
      revenue: number;
      cost: number;
      profit: number;
      deals: number;
      quantity: number;
      products: Record<string, number>;
    }> = {};

    // Process every single row
    for (const r of rows) {
      const rev = Number(r.revenue) || 0;
      const cst = Number(r.cost) || 0;
      const prf = Number(r.profit) || (rev - cst);
      const qty = Number(r.quantity) || 1;
      const cat = r.category || 'General';
      const prod = r.product_name || 'Standard Product';
      const reg = r.customer_region || 'Domestic';
      const d = new Date(r.transaction_date);

      grandTotalRevenue += rev;
      grandTotalCost += cst;
      grandTotalProfit += prf;
      grandTotalUnits += qty;

      // Category aggregation
      if (!categoryMap[cat]) {
        categoryMap[cat] = { revenue: 0, cost: 0, profit: 0, deals: 0 };
      }
      categoryMap[cat].revenue += rev;
      categoryMap[cat].cost += cst;
      categoryMap[cat].profit += prf;
      categoryMap[cat].deals += 1;

      // Product aggregation
      if (!productMap[prod]) {
        productMap[prod] = { category: cat, revenue: 0, cost: 0, profit: 0, quantity: 0 };
      }
      productMap[prod].revenue += rev;
      productMap[prod].cost += cst;
      productMap[prod].profit += prf;
      productMap[prod].quantity += qty;

      // Region aggregation
      if (!regionMap[reg]) {
        regionMap[reg] = { revenue: 0, profit: 0, deals: 0 };
      }
      regionMap[reg].revenue += rev;
      regionMap[reg].profit += prf;
      regionMap[reg].deals += 1;

      // Week aggregation
      const { key, start, end } = getWeekKey(d);
      if (!weekBuckets[key]) {
        weekBuckets[key] = {
          startDate: start,
          endDate: end,
          revenue: 0,
          cost: 0,
          profit: 0,
          deals: 0,
          quantity: 0,
          products: {}
        };
      }
      weekBuckets[key].revenue += rev;
      weekBuckets[key].cost += cst;
      weekBuckets[key].profit += prf;
      weekBuckets[key].deals += 1;
      weekBuckets[key].quantity += qty;
      weekBuckets[key].products[prod] = (weekBuckets[key].products[prod] || 0) + prf;
    }

    // Build chronological week-wise report
    const sortedWeekKeys = Object.keys(weekBuckets).sort();
    const weekWiseReport: WeekReportItem[] = [];

    let prevRev: number | null = null;
    let prevProfit: number | null = null;

    let bestWeek: { weekKey: string; profit: number; margin: number } | null = null;
    let worstWeek: { weekKey: string; profit: number; margin: number } | null = null;

    for (let idx = 0; idx < sortedWeekKeys.length; idx++) {
      const key = sortedWeekKeys[idx];
      const b = weekBuckets[key];
      const rev = Math.round(b.revenue * 100) / 100;
      const cst = Math.round(b.cost * 100) / 100;
      const prf = Math.round(b.profit * 100) / 100;
      const margin = rev > 0 ? Math.round((prf / rev) * 1000) / 10 : 0;

      let wowGrowth: number | null = null;
      if (prevRev !== null && prevRev > 0) {
        wowGrowth = Math.round(((rev - prevRev) / prevRev) * 1000) / 10;
      }

      let wowProfitGrowth: number | null = null;
      if (prevProfit !== null && prevProfit !== 0) {
        wowProfitGrowth = Math.round(((prf - prevProfit) / Math.abs(prevProfit)) * 1000) / 10;
      }

      prevRev = rev;
      prevProfit = prf;

      // Find top product this week
      let topProdName = '';
      let maxProdProfit = -Infinity;
      for (const [pName, pPrf] of Object.entries(b.products)) {
        if (pPrf > maxProdProfit) {
          maxProdProfit = pPrf;
          topProdName = pName;
        }
      }

      if (!bestWeek || prf > bestWeek.profit) {
        bestWeek = { weekKey: key, profit: prf, margin };
      }
      if (!worstWeek || prf < worstWeek.profit) {
        worstWeek = { weekKey: key, profit: prf, margin };
      }

      weekWiseReport.push({
        weekIndex: idx + 1,
        weekKey: key,
        startDate: b.startDate.toISOString().slice(0, 10),
        endDate: b.endDate.toISOString().slice(0, 10),
        revenue: rev,
        cost: cst,
        profit: prf,
        profitMargin: margin,
        deals: b.deals,
        quantity: b.quantity,
        status: prf >= 0 ? 'PROFIT' : 'LOSS',
        wowGrowthPct: wowGrowth,
        wowProfitGrowthPct: wowProfitGrowth,
        topProduct: topProdName || undefined
      });
    }

    // Build Category breakdown
    const categoryReport: CategoryReportItem[] = Object.entries(categoryMap).map(([cat, val]) => {
      const margin = val.revenue > 0 ? Math.round((val.profit / val.revenue) * 1000) / 10 : 0;
      const share = grandTotalRevenue > 0 ? Math.round((val.revenue / grandTotalRevenue) * 1000) / 10 : 0;
      return {
        category: cat,
        revenue: Math.round(val.revenue * 100) / 100,
        cost: Math.round(val.cost * 100) / 100,
        profit: Math.round(val.profit * 100) / 100,
        profitMargin: margin,
        deals: val.deals,
        shareOfRevenue: share
      };
    }).sort((a, b) => b.profit - a.profit);

    // Build Product Rankings
    const allProducts: ProductPerformanceItem[] = Object.entries(productMap).map(([prod, val]) => {
      const margin = val.revenue > 0 ? Math.round((val.profit / val.revenue) * 1000) / 10 : 0;
      return {
        productName: prod,
        category: val.category,
        revenue: Math.round(val.revenue * 100) / 100,
        cost: Math.round(val.cost * 100) / 100,
        profit: Math.round(val.profit * 100) / 100,
        profitMargin: margin,
        quantity: val.quantity
      };
    });

    const topProducts = [...allProducts].sort((a, b) => b.profit - a.profit).slice(0, 5);
    const lossProducts = [...allProducts].filter(p => p.profit < 0 || p.profitMargin < 15).sort((a, b) => a.profit - b.profit).slice(0, 5);

    // Regional breakdown
    const regionalBreakdown = Object.entries(regionMap).map(([reg, val]) => ({
      region: reg,
      revenue: Math.round(val.revenue * 100) / 100,
      profit: Math.round(val.profit * 100) / 100,
      deals: val.deals
    })).sort((a, b) => b.profit - a.profit);

    // Overall Financial Summary
    const totalRevRounded = Math.round(grandTotalRevenue * 100) / 100;
    const totalCostRounded = Math.round(grandTotalCost * 100) / 100;
    const totalProfitRounded = Math.round(grandTotalProfit * 100) / 100;
    const overallMargin = totalRevRounded > 0 ? Math.round((totalProfitRounded / totalRevRounded) * 1000) / 10 : 0;
    const totalDeals = rows.length;
    const avgDeal = totalDeals > 0 ? Math.round((totalRevRounded / totalDeals) * 100) / 100 : 0;
    const avgProfit = totalDeals > 0 ? Math.round((totalProfitRounded / totalDeals) * 100) / 100 : 0;

    const summary: FinancialSummary = {
      totalRevenue: totalRevRounded,
      totalCost: totalCostRounded,
      totalProfit: totalProfitRounded,
      profitMargin: overallMargin,
      status: totalProfitRounded >= 0 ? 'PROFIT' : 'LOSS',
      totalDeals,
      totalUnits: grandTotalUnits,
      avgDealValue: avgDeal,
      avgDealProfit: avgProfit,
      bestWeek,
      worstWeek
    };

    // Chart Series formatting
    // Limit to latest 20 weeks for high-density responsiveness if many weeks
    const chartWeeks = weekWiseReport.length > 24 ? weekWiseReport.slice(-24) : weekWiseReport;

    const chartSeries = {
      weeklyProfitBars: chartWeeks.map(w => ({
        label: w.weekKey.replace(/^[0-9]+-/, ''),
        profit: w.profit,
        revenue: w.revenue,
        cost: w.cost,
        status: w.status
      })),
      revenueCostTrend: chartWeeks.map(w => ({
        label: w.weekKey.replace(/^[0-9]+-/, ''),
        revenue: w.revenue,
        cost: w.cost
      })),
      marginTrajectory: chartWeeks.map(w => ({
        label: w.weekKey.replace(/^[0-9]+-/, ''),
        margin: w.profitMargin
      })),
      categoryShares: categoryReport.map(c => ({
        category: c.category,
        profit: c.profit,
        revenue: c.revenue,
        share: c.shareOfRevenue
      }))
    };

    // Key Strategic Findings
    const keyFindings: string[] = [];
    keyFindings.push(`Overall performance delivers ${totalProfitRounded >= 0 ? 'net profit' : 'net loss'} of ₹${Math.abs(totalProfitRounded).toLocaleString()} with a ${overallMargin}% margin.`);
    if (bestWeek) {
      keyFindings.push(`Peak profitability occurred in ${bestWeek.weekKey} generating ₹${bestWeek.profit.toLocaleString()} (${bestWeek.margin}% margin).`);
    }
    if (worstWeek && worstWeek.profit < 0) {
      keyFindings.push(`Critical margin compression in ${worstWeek.weekKey} resulted in a net loss of ₹${Math.abs(worstWeek.profit).toLocaleString()}.`);
    }
    if (categoryReport.length > 0) {
      keyFindings.push(`Top contributor "${categoryReport[0].category}" delivered ₹${categoryReport[0].profit.toLocaleString()} in profit (${categoryReport[0].shareOfRevenue}% of total revenue).`);
    }
    if (lossProducts.length > 0) {
      keyFindings.push(`${lossProducts.length} items flagged for sub-15% margin or negative unit profitability requiring immediate pricing review.`);
    }

    return {
      datasetName,
      generatedAt: new Date().toISOString(),
      summary,
      weekWiseReport,
      categoryReport,
      topProducts,
      lossProducts,
      regionalBreakdown,
      chartSeries,
      keyFindings
    };
  }

  private getEmptyAnalysisReport(datasetName: string): FullAnalysisReport {
    return {
      datasetName,
      generatedAt: new Date().toISOString(),
      summary: {
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        profitMargin: 0,
        status: 'PROFIT',
        totalDeals: 0,
        totalUnits: 0,
        avgDealValue: 0,
        avgDealProfit: 0,
        bestWeek: null,
        worstWeek: null
      },
      weekWiseReport: [],
      categoryReport: [],
      topProducts: [],
      lossProducts: [],
      regionalBreakdown: [],
      chartSeries: {
        weeklyProfitBars: [],
        revenueCostTrend: [],
        marginTrajectory: [],
        categoryShares: []
      },
      keyFindings: ['No transactional records found to analyze in this scope.']
    };
  }

  /**
   * Executive AI Strategic Diagnosis of Dataset
   */
  async generateAIDiagnosis(report: FullAnalysisReport): Promise<any> {
    const prompt = `You are BusinessMind AI Chief Financial Officer and Strategic Intelligence Engine.
Analyze the following empirical dataset report and provide a comprehensive 5-section executive diagnosis:

Dataset: ${report.datasetName}
Total Revenue: ₹${report.summary.totalRevenue.toLocaleString()}
Total Cost: ₹${report.summary.totalCost.toLocaleString()}
Net Profit/Loss: ₹${report.summary.totalProfit.toLocaleString()} (${report.summary.profitMargin}% margin, Status: ${report.summary.status})
Total Transactions: ${report.summary.totalDeals} deals across ${report.weekWiseReport.length} active weeks
Best Week: ${report.summary.bestWeek ? `${report.summary.bestWeek.weekKey} (₹${report.summary.bestWeek.profit.toLocaleString()})` : 'N/A'}
Worst Week: ${report.summary.worstWeek ? `${report.summary.worstWeek.weekKey} (₹${report.summary.worstWeek.profit.toLocaleString()})` : 'N/A'}
Top Categories: ${report.categoryReport.slice(0, 3).map(c => `${c.category} (₹${c.profit.toLocaleString()} profit, ${c.profitMargin}% margin)`).join(', ')}
Flagged Loss/Low Margin Items: ${report.lossProducts.map(p => `${p.productName} (₹${p.profit.toLocaleString()} profit)`).join(', ') || 'None'}

Format your answer strictly with:
1. Direct Answer — Crisp executive diagnosis of profitability and loss dynamics.
2. Key Drivers — 3-4 bullet points highlighting week-over-week trends, cost drivers, and revenue velocity.
3. Supporting Evidence — Concrete numbers and percentages from the dataset.
4. Recommended Action — 3 actionable 90-day operational directives to maximize profit and eliminate losses.
5. Risk Level — Low/Medium/High with financial justification.`;

    // Try calling local Python AI Microservice or direct Ollama
    try {
      const response = await this.queryAIService(prompt);
      if (response && response.success && response.data) {
        return response.data;
      }
    } catch (e: any) {
      console.warn('AI Service diagnosis call error, using local fallback:', e.message);
    }

    // Dynamic executive synthesis fallback
    return {
      question: `Financial Analysis of ${report.datasetName}`,
      category: 'SQL',
      raw_response: `1. Direct Answer — The enterprise achieved ₹${report.summary.totalRevenue.toLocaleString()} in revenue with a ${report.summary.status === 'PROFIT' ? 'healthy net profit' : 'net loss'} of ₹${Math.abs(report.summary.totalProfit).toLocaleString()} (${report.summary.profitMargin}% net margin).

2. Key Drivers —
   - Peak week ${report.summary.bestWeek?.weekKey || 'N/A'} delivered ₹${report.summary.bestWeek?.profit.toLocaleString() || '0'} driven by high deal conversion.
   - Lead category "${report.categoryReport[0]?.category || 'Primary'}" anchored earnings with ${report.categoryReport[0]?.shareOfRevenue || '0'}% revenue share.
   - Margin variance between best and worst weeks highlights operational cost volatility across fulfillment pipelines.

3. Supporting Evidence —
   - Total deals: ${report.summary.totalDeals} across ${report.weekWiseReport.length} weekly tracking periods.
   - Overall operational costs stood at ₹${report.summary.totalCost.toLocaleString()}.

4. Recommended Action —
   - Double down on high-margin categories (${report.categoryReport[0]?.category || 'Core'}) and institute approval gates on discounts.
   - Restructure procurement terms for underperforming product lines to eliminate unit losses.
   - Implement rolling weekly revenue buffers to stabilize seasonal dips.

5. Risk Level — ${report.summary.profitMargin > 30 ? 'Low' : report.summary.profitMargin > 10 ? 'Medium' : 'High'} with a net margin baseline of ${report.summary.profitMargin}%.`,
      sections: {
        direct_answer: `The enterprise generated ₹${report.summary.totalRevenue.toLocaleString()} in gross revenue with net profit of ₹${report.summary.totalProfit.toLocaleString()} (${report.summary.profitMargin}% profit margin across ${report.summary.totalDeals} transactions).`,
        key_drivers: [
          `Category leader "${report.categoryReport[0]?.category || 'Primary'}" generated ₹${report.categoryReport[0]?.profit.toLocaleString() || '0'} in profit.`,
          `Weekly performance peaked in ${report.summary.bestWeek?.weekKey || 'Week 1'} with ₹${report.summary.bestWeek?.profit.toLocaleString() || '0'} net realization.`,
          report.lossProducts.length > 0 ? `${report.lossProducts.length} items flagged for margin erosion requiring pricing review.` : 'All product lines maintained positive contribution margins.'
        ],
        supporting_evidence: `Dataset contains ${report.summary.totalDeals} transactions with ₹${report.summary.totalCost.toLocaleString()} total expenses and ₹${report.summary.avgDealValue.toLocaleString()} average order value.`,
        recommended_action: [
          'Prioritize inventory allocation toward top margin products yielding >50% profit.',
          'Enforce strict discounting policies to protect weekly margin baselines.',
          'Review supply chain and procurement costs during margin-compressed weeks.'
        ],
        risk_level: report.summary.profitMargin >= 30 ? 'Low' : report.summary.profitMargin >= 10 ? 'Medium' : 'High',
        risk_justification: `Current operating profit margin sits at ${report.summary.profitMargin}%.`
      }
    };
  }

  private queryAIService(prompt: string): Promise<any> {
    return new Promise((resolve) => {
      const postData = JSON.stringify({ question: prompt });
      const req = http.request({
        hostname: 'localhost',
        port: 8000,
        path: '/api/v1/ai/chat',
        method: 'POST',
        timeout: 45000,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.write(postData);
      req.end();
    });
  }
}

export const analyticsService = new AnalyticsService();
