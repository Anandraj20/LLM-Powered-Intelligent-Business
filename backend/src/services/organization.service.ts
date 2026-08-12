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

    // Update user's organizationId
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
}

export const orgService = new OrganizationService();
