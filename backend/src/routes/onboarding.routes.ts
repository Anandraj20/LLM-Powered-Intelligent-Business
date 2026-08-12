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

export default router;
