import { Router, Response } from 'express';
import { orgService } from '../services/organization.service';
import { authenticateJWT, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// FR2.1: Create Organization Profile (Supports Multiple Organizations)
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

      const allOrgs = await orgService.getOrganizationsByOwner(ownerId);

      return res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: org,
        organizations: allOrgs
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to create organization'
      });
    }
  }
);

// FR2.1: List All Organizations for Current Admin / User
router.get(
  '/',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allOrgs = await orgService.getOrganizationsByOwner(req.user!.id);
      return res.status(200).json({
        success: true,
        data: allOrgs,
        activeOrganizationId: req.user!.organizationId || (allOrgs[0]?.id ?? null)
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch organizations'
      });
    }
  }
);

router.get(
  '/list',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allOrgs = await orgService.getOrganizationsByOwner(req.user!.id);
      return res.status(200).json({
        success: true,
        data: allOrgs,
        activeOrganizationId: req.user!.organizationId || (allOrgs[0]?.id ?? null)
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch organizations'
      });
    }
  }
);

// FR2.1: Get User's Active Organization Profile & List of All Managed Orgs
router.get(
  '/mine',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allOrgs = await orgService.getOrganizationsByOwner(req.user!.id);
      let org = null;

      if (req.user!.organizationId) {
        org = await orgService.getOrganization(req.user!.organizationId);
      }
      
      if (!org && allOrgs.length > 0) {
        org = allOrgs[0];
      }

      return res.status(200).json({
        success: true,
        data: org,
        organizations: allOrgs
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch organization'
      });
    }
  }
);

// Switch Active Organization
router.post(
  '/switch/:id',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await orgService.switchActiveOrganization(req.user!.id, id);
      const allOrgs = await orgService.getOrganizationsByOwner(req.user!.id);

      return res.status(200).json({
        success: true,
        message: `Switched active organization to ${result.organization.name}`,
        data: result.organization,
        activeOrganizationId: result.activeOrganizationId,
        organizations: allOrgs
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to switch active organization'
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

      const allOrgs = await orgService.getOrganizationsByOwner(req.user!.id);

      return res.status(200).json({
        success: true,
        message: 'Organization updated successfully',
        data: org,
        organizations: allOrgs
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to update organization'
      });
    }
  }
);

// Delete Organization
router.delete(
  '/:id',
  authenticateJWT,
  requirePermission('org:manage'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await orgService.deleteOrganization(req.user!.id, id);
      const allOrgs = await orgService.getOrganizationsByOwner(req.user!.id);

      return res.status(200).json({
        success: true,
        message: 'Organization deleted successfully',
        activeOrganizationId: result.activeOrganizationId,
        organizations: allOrgs
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete organization'
      });
    }
  }
);

export default router;
