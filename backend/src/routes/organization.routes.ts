import { Router, Response } from 'express';
import { orgService } from '../services/organization.service';
import { authenticateJWT, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// FR2.1: Create Organization Profile
router.post(
  '/',
  authenticateJWT,
  requirePermission('org:manage'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, industryType, businessSize } = req.body;
      const ownerId = req.user!.id;

      const org = await orgService.createOrganization(ownerId, {
        name,
        industryType,
        businessSize
      });

      return res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: org
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to create organization'
      });
    }
  }
);

// FR2.1: Get User's Active Organization Profile
router.get(
  '/mine',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      let org = null;
      if (req.user!.organizationId) {
        org = await orgService.getOrganization(req.user!.organizationId);
      }
      
      if (!org) {
        org = await orgService.getOrganizationByOwner(req.user!.id);
      }

      return res.status(200).json({
        success: true,
        data: org
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch organization'
      });
    }
  }
);

// FR2.1: Update Organization Profile
router.put(
  '/:id',
  authenticateJWT,
  requirePermission('org:manage'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, industryType, businessSize } = req.body;

      const org = await orgService.updateOrganization(id, {
        name,
        industryType,
        businessSize
      });

      return res.status(200).json({
        success: true,
        message: 'Organization updated successfully',
        data: org
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to update organization'
      });
    }
  }
);

export default router;
