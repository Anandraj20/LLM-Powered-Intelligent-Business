export type IndustryType =
  | 'retail'
  | 'education'
  | 'healthcare'
  | 'agriculture'
  | 'technology'
  | 'manufacturing'
  | 'finance'
  | 'other';

export type BusinessSize = '1-10' | '11-50' | '51-200' | '201-500' | '500+';

export interface Organization {
  id: string;
  name: string;
  industryType: IndustryType;
  businessSize: BusinessSize;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

class OrganizationRepository {
  private orgs: Map<string, Organization> = new Map();

  async findById(id: string): Promise<Organization | null> {
    const org = this.orgs.get(id);
    return org ? { ...org } : null;
  }

  async findByOwnerId(ownerId: string): Promise<Organization | null> {
    for (const org of this.orgs.values()) {
      if (org.ownerId === ownerId) {
        return { ...org };
      }
    }
    return null;
  }

  async save(org: Organization): Promise<Organization> {
    org.updatedAt = new Date();
    this.orgs.set(org.id, { ...org });
    return { ...org };
  }

  async delete(id: string): Promise<boolean> {
    return this.orgs.delete(id);
  }

  async listAll(): Promise<Organization[]> {
    return Array.from(this.orgs.values()).map(o => ({ ...o }));
  }
}

export const orgStore = new OrganizationRepository();
