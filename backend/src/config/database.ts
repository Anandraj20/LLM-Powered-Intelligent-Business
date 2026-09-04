import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3306');
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || 'Anand@2005';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'businessmind_db';

class DatabaseConfig {
  private pool: mysql.Pool | null = null;
  public isConnected: boolean = false;

  constructor() {
    this.initPool();
  }

  private initPool() {
    try {
      this.pool = mysql.createPool({
        host: MYSQL_HOST,
        port: MYSQL_PORT,
        user: MYSQL_USER,
        password: MYSQL_PASSWORD,
        database: MYSQL_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      this.testConnection();
    } catch (error) {
      console.warn('MySQL initialization notice: Connecting via pool...');
    }
  }

  public async testConnection(): Promise<boolean> {
    if (!this.pool) this.initPool();
    if (!this.pool) return false;
    try {
      const connection = await this.pool.getConnection();
      console.log(`[MySQL] Successfully connected to database: ${MYSQL_DATABASE} at ${MYSQL_HOST}:${MYSQL_PORT}`);
      connection.release();
      this.isConnected = true;
      return true;
    } catch (error: any) {
      console.warn(`[MySQL] Connection warning (${error.message}). App is using local memory fallback.`);
      this.isConnected = false;
      return false;
    }
  }

  public getPool(): mysql.Pool | null {
    return this.pool;
  }

  public async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.pool) {
      this.initPool();
    }
    if (!this.isConnected && this.pool) {
      await this.testConnection();
    }
    if (this.pool) {
      try {
        const [results] = await this.pool.execute(sql, params);
        return results;
      } catch (err: any) {
        console.error('[MySQL Error]:', err.message);
        throw err;
      }
    }
    return null;
  }
}

export const dbConfig = new DatabaseConfig();
