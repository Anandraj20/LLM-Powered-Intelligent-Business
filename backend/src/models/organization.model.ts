import { dbConfig } from '../config/database';

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

function rowToOrg(row: any): Organization {
  return {
    id: row.id,
    name: row.name,
    industryType: (row.industry_type || 'other') as IndustryType,
    businessSize: (row.business_size || '1-10') as BusinessSize,
    ownerId: row.owner_id || '',
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : (row.created_at ? new Date(row.created_at) : new Date())
  };
}

class OrganizationRepository {
  private memoryStore: Map<string, Organization> = new Map();

  private async canUseDB(): Promise<boolean> {
    if (!dbConfig.isConnected) {
      await dbConfig.testConnection();
    }
    return dbConfig.isConnected;
  }

  async findById(id: string): Promise<Organization | null> {
    if (await this.canUseDB()) {
      try {
        const rows: any = await dbConfig.query('SELECT * FROM organizations WHERE id = ? LIMIT 1', [id]);
        const arr = Array.isArray(rows) ? rows : rows ? [rows] : [];
        if (arr.length) return rowToOrg(arr[0]);
      } catch (e: any) {
        console.error('[OrgRepo findById]', e.message);
      }
    }
    const org = this.memoryStore.get(id);
    return org ? { ...org } : null;
  }

  async findByOwnerId(ownerId: string): Promise<Organization | null> {
    if (await this.canUseDB()) {
      try {
        const rows: any = await dbConfig.query('SELECT * FROM organizations WHERE owner_id = ? ORDER BY created_at DESC LIMIT 1', [ownerId]);
        const arr = Array.isArray(rows) ? rows : rows ? [rows] : [];
        if (arr.length) return rowToOrg(arr[0]);
      } catch (e: any) {
        console.error('[OrgRepo findByOwnerId]', e.message);
      }
    }
    for (const org of this.memoryStore.values()) {
      if (org.ownerId === ownerId) {
        return { ...org };
      }
    }
    return null;
  }

  async findAllByOwnerId(ownerId: string): Promise<Organization[]> {
    if (await this.canUseDB()) {
      try {
        const rows: any = await dbConfig.query('SELECT * FROM organizations WHERE owner_id = ? ORDER BY created_at DESC', [ownerId]);
        const arr = Array.isArray(rows) ? rows : rows ? [rows] : [];
        if (arr.length) {
          // Also sync into memoryStore
          for (const r of arr) {
            const parsed = rowToOrg(r);
            this.memoryStore.set(parsed.id, parsed);
          }
          return arr.map(rowToOrg);
        }
      } catch (e: any) {
        console.error('[OrgRepo findAllByOwnerId]', e.message);
      }
    }
    const result: Organization[] = [];
    for (const org of this.memoryStore.values()) {
      if (org.ownerId === ownerId) {
        result.push({ ...org });
      }
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async save(org: Organization): Promise<Organization> {
    org.updatedAt = new Date();

    if (await this.canUseDB()) {
      try {
        await dbConfig.query(
          `INSERT INTO organizations (id, name, industry_type, business_size, owner_id)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             industry_type = VALUES(industry_type),
             business_size = VALUES(business_size),
             owner_id = VALUES(owner_id)`,
          [org.id, org.name, org.industryType, org.businessSize, org.ownerId]
        );
        this.memoryStore.set(org.id, { ...org });
        return { ...org };
      } catch (e: any) {
        console.error('[OrgRepo save MySQL error]', e.message);
      }
    }

    this.memoryStore.set(org.id, { ...org });
    return { ...org };
  }

  async delete(id: string): Promise<boolean> {
    if (await this.canUseDB()) {
      try {
        await dbConfig.query('DELETE FROM organizations WHERE id = ?', [id]);
      } catch (e: any) {
        console.error('[OrgRepo delete MySQL error]', e.message);
      }
    }
    return this.memoryStore.delete(id);
  }

  async listAll(): Promise<Organization[]> {
    if (await this.canUseDB()) {
      try {
        const rows: any = await dbConfig.query('SELECT * FROM organizations ORDER BY created_at DESC');
        const arr = Array.isArray(rows) ? rows : rows ? [rows] : [];
        return arr.map(rowToOrg);
      } catch (e: any) {
        console.error('[OrgRepo listAll]', e.message);
      }
    }
    return Array.from(this.memoryStore.values()).map(o => ({ ...o }));
  }
}

export const orgStore = new OrganizationRepository();
