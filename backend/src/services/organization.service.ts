import { v4 as uuidv4 } from 'uuid';
import { orgStore, Organization, IndustryType, BusinessSize } from '../models/organization.model';
import { userStore } from '../models/user.model';

export class OrganizationService {
  async createOrganization(
    ownerId: string,
    data: {
      name: string;
      industryType: IndustryType;
      businessSize: BusinessSize;
    }
  ): Promise<Organization> {
    if (!data.name || !data.name.trim()) {
      throw new Error('Organization name is required');
    }

    const validIndustries: IndustryType[] = [
      'retail',
      'education',
      'healthcare',
      'agriculture',
      'technology',
      'manufacturing',
      'finance',
      'other'
    ];

    if (!validIndustries.includes(data.industryType)) {
      throw new Error(`Invalid industry type. Must be one of: ${validIndustries.join(', ')}`);
    }

    const validSizes: BusinessSize[] = ['1-10', '11-50', '51-200', '201-500', '500+'];
    if (!validSizes.includes(data.businessSize)) {
      throw new Error(`Invalid business size. Must be one of: ${validSizes.join(', ')}`);
    }

    const newOrg: Organization = {
      id: uuidv4(),
      name: data.name.trim(),
      industryType: data.industryType,
      businessSize: data.businessSize,
      ownerId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await orgStore.save(newOrg);

    // Set newly created organization as active on the user
    const user = await userStore.findById(ownerId);
    if (user) {
      user.organizationId = newOrg.id;
      await userStore.save(user);
    }

    return newOrg;
  }

  async getOrganization(id: string): Promise<Organization | null> {
    return orgStore.findById(id);
  }

  async getOrganizationByOwner(ownerId: string): Promise<Organization | null> {
    return orgStore.findByOwnerId(ownerId);
  }

  async getOrganizationsByOwner(ownerId: string): Promise<Organization[]> {
    return orgStore.findAllByOwnerId(ownerId);
  }

  async switchActiveOrganization(
    userId: string,
    orgId: string
  ): Promise<{ organization: Organization; activeOrganizationId: string }> {
    const org = await orgStore.findById(orgId);
    if (!org) {
      throw new Error('Target organization not found');
    }

    const user = await userStore.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify user owns the org or is Owner/Admin
    if (org.ownerId !== userId && user.role !== 'Admin' && user.role !== 'Owner') {
      throw new Error('Permission denied: You do not have access to manage this organization');
    }

    user.organizationId = org.id;
    await userStore.save(user);

    return {
      organization: org,
      activeOrganizationId: org.id
    };
  }

  async updateOrganization(
    id: string,
    data: Partial<{
      name: string;
      industryType: IndustryType;
      businessSize: BusinessSize;
    }>
  ): Promise<Organization> {
    const org = await orgStore.findById(id);
    if (!org) {
      throw new Error('Organization not found');
    }

    if (data.name !== undefined) org.name = data.name.trim();
    if (data.industryType !== undefined) org.industryType = data.industryType;
    if (data.businessSize !== undefined) org.businessSize = data.businessSize;

    return orgStore.save(org);
  }

  async deleteOrganization(
    ownerId: string,
    orgId: string
  ): Promise<{ success: boolean; activeOrganizationId: string | null }> {
    const org = await orgStore.findById(orgId);
    if (!org) {
      throw new Error('Organization not found');
    }

    const user = await userStore.findById(ownerId);
    if (!user) {
      throw new Error('User not found');
    }

    if (org.ownerId !== ownerId && user.role !== 'Admin' && user.role !== 'Owner') {
      throw new Error('Permission denied: Only the organization owner or system administrator can delete this organization');
    }

    await orgStore.delete(orgId);

    // If user's active org was deleted, switch to another available org
    let newActiveOrgId: string | null = user.organizationId;
    if (user.organizationId === orgId) {
      const remaining = await orgStore.findAllByOwnerId(ownerId);
      newActiveOrgId = remaining.length > 0 ? remaining[0].id : null;
      user.organizationId = newActiveOrgId;
      await userStore.save(user);
    }

    return {
      success: true,
      activeOrganizationId: newActiveOrgId
    };
  }
}

export const orgService = new OrganizationService();
