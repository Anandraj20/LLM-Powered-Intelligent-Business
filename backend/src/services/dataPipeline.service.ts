import { v4 as uuidv4 } from 'uuid';
import * as xlsx from 'xlsx';
import { parse as parseCsv } from 'csv-parse/sync';
import {
  onboardingStore,
  OnboardingBatch,
  DatasetType,
  ValidationErrorDetail,
  NormalizedRecord
} from '../models/dataOnboarding.model';

export interface FileIngestionInput {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  datasetType: DatasetType;
  organizationId: string;
  userId: string;
}

export interface ErpSyncInput {
  erpProvider: 'QuickBooks' | 'Square' | 'Shopify' | 'SAP' | 'CustomPOS';
  datasetType: DatasetType;
  organizationId: string;
  userId: string;
  apiKey?: string;
}

export class DataPipelineService {
  /**
   * Main entry point for manual CSV / Excel file uploads (FR2.2a)
   */
  async processFileUpload(input: FileIngestionInput): Promise<OnboardingBatch> {
    const rawRows = this.extractRawRows(input.fileBuffer, input.fileName);
    return this.runPipeline({
      rawRows,
      fileName: input.fileName,
      datasetType: input.datasetType,
      sourceType: 'file_upload',
      organizationId: input.organizationId,
      userId: input.userId
    });
  }

  /**
   * Entry point for external ERP / POS API connections (FR2.2b)
   */
  async processErpSync(input: ErpSyncInput): Promise<OnboardingBatch> {
    const mockErpData = this.generateMockErpData(input.erpProvider, input.datasetType);
    return this.runPipeline({
      rawRows: mockErpData,
      fileName: `${input.erpProvider}_API_Sync_${new Date().toISOString().slice(0, 10)}.json`,
      datasetType: input.datasetType,
      sourceType: 'erp_api',
      organizationId: input.organizationId,
      userId: input.userId
    });
  }

  /**
   * Confirm batch import into production database (FR2.5)
   */
  async confirmImport(batchId: string, organizationId: string): Promise<{ importedCount: number }> {
    const batch = await onboardingStore.findBatchById(batchId);
    if (!batch) {
      throw new Error('Onboarding batch not found');
    }

    if (batch.organizationId !== organizationId) {
      throw new Error('Forbidden: Batch does not belong to your organization');
    }

    if (batch.status === 'imported') {
      throw new Error('Batch has already been imported');
    }

    const recordsToImport = batch.allNormalizedData || batch.previewData;

    await onboardingStore.saveImportedRecords(
      organizationId,
      batch.datasetType,
      recordsToImport
    );

    // Synchronize uploaded dataset with MySQL Database and FAISS Vector RAG index
    try {
      const formattedRecords = recordsToImport.map(r => ({
        product_name: r.productName || r.customerName || r.itemCode || 'Standard Item',
        quantity: Number(r.quantity || 1),
        unit_price: Number(r.unitPrice || r.amount || 0),
        revenue: Number(r.amount || r.total || (Number(r.quantity || 1) * Number(r.unitPrice || 0))),
        cost: Number(r.cost || 0),
        category: r.category || batch.datasetType,
        customer_region: r.region || 'Domestic'
      }));

      const { mysqlPipelineService } = await import('./mysql.service');
      await mysqlPipelineService.saveSalesDataset(batch.fileName, formattedRecords);
    } catch (pipelineErr: any) {
      console.warn('MySQL/RAG pipeline sync warning:', pipelineErr.message);
    }

    batch.status = 'imported';
    batch.importedAt = new Date();
    await onboardingStore.saveBatch(batch);

    return { importedCount: recordsToImport.length };

  }

  /**
   * Helper to parse CSV or Excel files into array of JSON row objects
   */
  private extractRawRows(buffer: Buffer, fileName: string): any[] {
    const lowerName = fileName.toLowerCase();
    
    if (lowerName.endsWith('.csv')) {
      const csvString = buffer.toString('utf-8');
      return parseCsv(csvString, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      return xlsx.utils.sheet_to_json(worksheet, { defval: '' });
    }

    throw new Error('Unsupported file format. Please upload a .csv, .xlsx, or .xls file.');
  }

  /**
   * Core Validation, Cleaning & Normalization Pipeline (FR2.3 & FR2.4)
   */
  private async runPipeline(opts: {
    rawRows: any[];
    fileName: string;
    datasetType: DatasetType;
    sourceType: 'file_upload' | 'erp_api';
    organizationId: string;
    userId: string;
  }): Promise<OnboardingBatch> {
    const { rawRows, fileName, datasetType, sourceType, organizationId, userId } = opts;

    const errors: ValidationErrorDetail[] = [];
    const normalizedRows: NormalizedRecord[] = [];
    const seenPrimaryKeys = new Set<string>();

    let validRowsCount = 0;
    let invalidRowsCount = 0;
    let duplicateRowsCount = 0;

    if (!rawRows || rawRows.length === 0) {
      errors.push({
        row: 0,
        column: 'N/A',
        value: null,
        message: 'File or payload contains no data rows',
        severity: 'error'
      });
    }

    for (let i = 0; i < rawRows.length; i++) {
      const rowNum = i + 1; // 1-indexed row number
      const rawRow = rawRows[i];
      const rowErrors: ValidationErrorDetail[] = [];
      const normalizedRow: NormalizedRecord = {};

      switch (datasetType) {
        case 'sales':
          this.validateAndNormalizeSalesRow(rawRow, rowNum, rowErrors, normalizedRow, seenPrimaryKeys);
          break;
        case 'inventory':
          this.validateAndNormalizeInventoryRow(rawRow, rowNum, rowErrors, normalizedRow, seenPrimaryKeys);
          break;
        case 'customers':
          this.validateAndNormalizeCustomerRow(rawRow, rowNum, rowErrors, normalizedRow, seenPrimaryKeys);
          break;
        case 'finance':
          this.validateAndNormalizeFinanceRow(rawRow, rowNum, rowErrors, normalizedRow, seenPrimaryKeys);
          break;
        default:
          this.validateGenericRow(rawRow, rowNum, rowErrors, normalizedRow);
      }

      // Check if duplicate primary key error was flagged
      const isDuplicate = rowErrors.some(e => e.message.includes('Duplicate'));
      if (isDuplicate) duplicateRowsCount++;

      const hasError = rowErrors.some(e => e.severity === 'error');
      if (hasError) {
        invalidRowsCount++;
      } else {
        validRowsCount++;
        normalizedRows.push(normalizedRow);
      }

      errors.push(...rowErrors);
    }

    const batch: OnboardingBatch = {
      id: uuidv4(),
      organizationId,
      uploadedBy: userId,
      sourceType,
      fileName,
      datasetType,
      status: 'pending_preview',
      totalRows: rawRows.length,
      validRows: validRowsCount,
      invalidRows: invalidRowsCount,
      duplicateRows: duplicateRowsCount,
      errors,
      previewData: normalizedRows.slice(0, 10), // FR2.5: Preview sample of normalized data
      allNormalizedData: normalizedRows,
      createdAt: new Date()
    };

    await onboardingStore.saveBatch(batch);
    return batch;
  }

  // --- Dataset Validation Rules ---

  private validateAndNormalizeSalesRow(
    row: any,
    rowNum: number,
    errors: ValidationErrorDetail[],
    norm: NormalizedRecord,
    seenKeys: Set<string>
  ) {
    const rawTxId = this.getFieldValue(row, ['transactionId', 'Transaction ID', 'tx_id', 'id']);
    const rawDate = this.getFieldValue(row, ['date', 'Date', 'transaction_date']);
    const rawCustomer = this.getFieldValue(row, ['customerName', 'Customer Name', 'customer']);
    const rawAmount = this.getFieldValue(row, ['amount', 'Amount', 'total', 'price']);
    const rawStatus = this.getFieldValue(row, ['status', 'Status']);

    // Transaction ID
    if (!rawTxId) {
      errors.push({ row: rowNum, column: 'transactionId', value: rawTxId, message: 'Missing required field transactionId', severity: 'error' });
    } else {
      const txIdStr = String(rawTxId).trim();
      if (seenKeys.has(txIdStr)) {
        errors.push({ row: rowNum, column: 'transactionId', value: txIdStr, message: `Duplicate transactionId '${txIdStr}' detected`, severity: 'warning' });
      } else {
        seenKeys.add(txIdStr);
      }
      norm.transactionId = txIdStr;
    }

    // Amount
    if (rawAmount === undefined || rawAmount === null || rawAmount === '') {
      errors.push({ row: rowNum, column: 'amount', value: rawAmount, message: 'Missing required field amount', severity: 'error' });
    } else {
      const parsedAmount = Number(String(rawAmount).replace(/[^0-9.-]+/g, ''));
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        errors.push({ row: rowNum, column: 'amount', value: rawAmount, message: 'Amount must be a valid positive number', severity: 'error' });
      } else {
        norm.amount = Number(parsedAmount.toFixed(2));
      }
    }

    // Date
    if (!rawDate) {
      errors.push({ row: rowNum, column: 'date', value: rawDate, message: 'Missing required field date', severity: 'error' });
    } else {
      const parsedDate = new Date(rawDate);
      if (isNaN(parsedDate.getTime())) {
        errors.push({ row: rowNum, column: 'date', value: rawDate, message: `Invalid date format '${rawDate}'. Expected YYYY-MM-DD or valid date string`, severity: 'error' });
      } else {
        norm.date = parsedDate.toISOString().slice(0, 10);
      }
    }

    norm.customerName = rawCustomer ? String(rawCustomer).trim() : 'Guest';
    norm.status = rawStatus ? String(rawStatus).trim().toLowerCase() : 'completed';
  }

  private validateAndNormalizeInventoryRow(
    row: any,
    rowNum: number,
    errors: ValidationErrorDetail[],
    norm: NormalizedRecord,
    seenKeys: Set<string>
  ) {
    const rawCode = this.getFieldValue(row, ['itemCode', 'SKU', 'Item Code', 'code']);
    const rawName = this.getFieldValue(row, ['itemName', 'Item Name', 'name']);
    const rawCategory = this.getFieldValue(row, ['category', 'Category']);
    const rawQty = this.getFieldValue(row, ['quantity', 'Quantity', 'stock', 'qty']);
    const rawPrice = this.getFieldValue(row, ['unitPrice', 'Unit Price', 'price']);

    if (!rawCode) {
      errors.push({ row: rowNum, column: 'itemCode', value: rawCode, message: 'Missing required field itemCode (SKU)', severity: 'error' });
    } else {
      const codeStr = String(rawCode).trim().toUpperCase();
      if (seenKeys.has(codeStr)) {
        errors.push({ row: rowNum, column: 'itemCode', value: codeStr, message: `Duplicate itemCode '${codeStr}' detected`, severity: 'warning' });
      } else {
        seenKeys.add(codeStr);
      }
      norm.itemCode = codeStr;
    }

    if (!rawName) {
      errors.push({ row: rowNum, column: 'itemName', value: rawName, message: 'Missing required field itemName', severity: 'error' });
    } else {
      norm.itemName = String(rawName).trim();
    }

    const parsedQty = parseInt(String(rawQty), 10);
    if (isNaN(parsedQty) || parsedQty < 0) {
      errors.push({ row: rowNum, column: 'quantity', value: rawQty, message: 'Quantity must be a non-negative integer', severity: 'error' });
    } else {
      norm.quantity = parsedQty;
    }

    const parsedPrice = Number(String(rawPrice).replace(/[^0-9.-]+/g, ''));
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      errors.push({ row: rowNum, column: 'unitPrice', value: rawPrice, message: 'Unit price must be a valid positive number', severity: 'error' });
    } else {
      norm.unitPrice = Number(parsedPrice.toFixed(2));
    }

    norm.category = rawCategory ? String(rawCategory).trim() : 'General';
  }

  private validateAndNormalizeCustomerRow(
    row: any,
    rowNum: number,
    errors: ValidationErrorDetail[],
    norm: NormalizedRecord,
    seenKeys: Set<string>
  ) {
    const rawId = this.getFieldValue(row, ['customerId', 'Customer ID', 'id']);
    const rawName = this.getFieldValue(row, ['name', 'Customer Name', 'fullName']);
    const rawEmail = this.getFieldValue(row, ['email', 'Email', 'emailAddress']);
    const rawPhone = this.getFieldValue(row, ['phone', 'Phone', 'phoneNumber']);

    if (!rawName) {
      errors.push({ row: rowNum, column: 'name', value: rawName, message: 'Missing required field customer name', severity: 'error' });
    } else {
      norm.name = String(rawName).trim();
    }

    if (!rawEmail) {
      errors.push({ row: rowNum, column: 'email', value: rawEmail, message: 'Missing required field email', severity: 'error' });
    } else {
      const emailStr = String(rawEmail).trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailStr)) {
        errors.push({ row: rowNum, column: 'email', value: rawEmail, message: `Invalid email format '${rawEmail}'`, severity: 'error' });
      } else {
        if (seenKeys.has(emailStr)) {
          errors.push({ row: rowNum, column: 'email', value: emailStr, message: `Duplicate customer email '${emailStr}'`, severity: 'warning' });
        } else {
          seenKeys.add(emailStr);
        }
        norm.email = emailStr;
      }
    }

    norm.customerId = rawId ? String(rawId).trim() : uuidv4().slice(0, 8);
    norm.phone = rawPhone ? String(rawPhone).trim() : '';
  }

  private validateAndNormalizeFinanceRow(
    row: any,
    rowNum: number,
    errors: ValidationErrorDetail[],
    norm: NormalizedRecord,
    seenKeys: Set<string>
  ) {
    const rawDate = this.getFieldValue(row, ['transactionDate', 'Date', 'date']);
    const rawCategory = this.getFieldValue(row, ['category', 'Category']);
    const rawAmount = this.getFieldValue(row, ['amount', 'Amount']);
    const rawType = this.getFieldValue(row, ['type', 'Type', 'entryType']);

    if (!rawAmount) {
      errors.push({ row: rowNum, column: 'amount', value: rawAmount, message: 'Missing required field amount', severity: 'error' });
    } else {
      const num = Number(String(rawAmount).replace(/[^0-9.-]+/g, ''));
      if (isNaN(num)) {
        errors.push({ row: rowNum, column: 'amount', value: rawAmount, message: 'Amount must be a numeric value', severity: 'error' });
      } else {
        norm.amount = Number(num.toFixed(2));
      }
    }

    const typeStr = String(rawType || 'income').trim().toLowerCase();
    if (!['income', 'expense'].includes(typeStr)) {
      errors.push({ row: rowNum, column: 'type', value: rawType, message: "Type must be either 'income' or 'expense'", severity: 'error' });
    } else {
      norm.type = typeStr;
    }

    norm.transactionDate = rawDate ? new Date(rawDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    norm.category = rawCategory ? String(rawCategory).trim() : 'General';
  }

  private validateGenericRow(row: any, rowNum: number, errors: ValidationErrorDetail[], norm: NormalizedRecord) {
    for (const key of Object.keys(row)) {
      const val = row[key];
      if (typeof val === 'string') {
        norm[key] = val.trim();
      } else {
        norm[key] = val;
      }
    }
  }

  private getFieldValue(row: any, keys: string[]): any {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
        return row[k];
      }
    }
    return undefined;
  }

  private generateMockErpData(provider: string, datasetType: DatasetType): any[] {
    if (datasetType === 'sales') {
      return [
        { transactionId: `${provider}-TX-101`, date: '2026-08-01', customerName: 'Acme Corp', amount: 1540.50, status: 'completed' },
        { transactionId: `${provider}-TX-102`, date: '2026-08-02', customerName: 'Globex Inc', amount: 890.00, status: 'completed' },
        { transactionId: `${provider}-TX-103`, date: '2026-08-03', customerName: 'Stark Industries', amount: 3450.75, status: 'pending' }
      ];
    } else if (datasetType === 'inventory') {
      return [
        { itemCode: 'ERP-SKU-01', itemName: 'Wireless Mouse', category: 'Electronics', quantity: 150, unitPrice: 29.99 },
        { itemCode: 'ERP-SKU-02', itemName: 'Mechanical Keyboard', category: 'Electronics', quantity: 85, unitPrice: 99.50 },
        { itemCode: 'ERP-SKU-03', itemName: 'HD Monitor 27-inch', category: 'Electronics', quantity: 40, unitPrice: 249.00 }
      ];
    }
    return [
      { id: '1', date: '2026-08-01', category: 'General', amount: 500.00 }
    ];
  }
}

export const dataPipelineService = new DataPipelineService();
