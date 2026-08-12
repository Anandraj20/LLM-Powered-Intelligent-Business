export type IngestionSourceType = 'file_upload' | 'erp_api';
export type DatasetType = 'sales' | 'inventory' | 'customers' | 'finance';
export type BatchStatus = 'pending_preview' | 'imported' | 'failed' | 'rejected';

export interface ValidationErrorDetail {
  row: number;
  column: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface NormalizedRecord {
  [key: string]: any;
}

export interface OnboardingBatch {
  id: string;
  organizationId: string;
  uploadedBy: string;
  sourceType: IngestionSourceType;
  fileName: string;
  datasetType: DatasetType;
  status: BatchStatus;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  errors: ValidationErrorDetail[];
  previewData: NormalizedRecord[];
  allNormalizedData?: NormalizedRecord[];
  createdAt: Date;
  importedAt?: Date;
}

class OnboardingRepository {
  private batches: Map<string, OnboardingBatch> = new Map();
  private importedDataStore: Map<string, NormalizedRecord[]> = new Map();

  async findBatchById(id: string): Promise<OnboardingBatch | null> {
    const batch = this.batches.get(id);
    return batch ? { ...batch } : null;
  }

  async saveBatch(batch: OnboardingBatch): Promise<OnboardingBatch> {
    this.batches.set(batch.id, { ...batch });
    return { ...batch };
  }

  async listBatchesByOrg(organizationId: string): Promise<OnboardingBatch[]> {
    return Array.from(this.batches.values())
      .filter(b => b.organizationId === organizationId)
      .map(b => ({ ...b }));
  }

  async saveImportedRecords(organizationId: string, datasetType: DatasetType, records: NormalizedRecord[]): Promise<void> {
    const key = `${organizationId}:${datasetType}`;
    const existing = this.importedDataStore.get(key) || [];
    this.importedDataStore.set(key, [...existing, ...records]);
  }

  async getImportedRecords(organizationId: string, datasetType: DatasetType): Promise<NormalizedRecord[]> {
    const key = `${organizationId}:${datasetType}`;
    return this.importedDataStore.get(key) || [];
  }
}

export const onboardingStore = new OnboardingRepository();
