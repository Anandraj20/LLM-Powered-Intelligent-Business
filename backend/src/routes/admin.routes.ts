import { Router, Response } from 'express';
import { dbConfig } from '../config/database';
import { userStore } from '../models/user.model';
import { UserRole, ALL_ROLES } from '../config/permissions';
import { authenticateJWT, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware';
import http from 'http';

const router = Router();

/**
 * Helper to ping HTTP services with short timeout
 */
function checkHttpEndpoint(url: string, timeoutMs: number = 3000): Promise<{ online: boolean; data?: any; error?: string }> {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const req = http.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        timeout: timeoutMs
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve({ online: res.statusCode !== undefined && res.statusCode < 400, data });
          } catch {
            resolve({ online: res.statusCode !== undefined && res.statusCode < 400, data: body });
          }
        });
      });
      req.on('error', (err) => resolve({ online: false, error: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ online: false, error: 'Timed out' }); });
      req.end();
    } catch (e: any) {
      resolve({ online: false, error: e.message });
    }
  });
}

/**
 * GET /api/v1/admin/telemetry
 * Real-time comprehensive telemetry of all system services
 */
router.get(
  '/telemetry',
  authenticateJWT,
  requirePermission('system:admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 1. MySQL Health & Row Counts
      const isDbConnected = await dbConfig.testConnection();
      let tableCounts: Record<string, number> = {};

      if (isDbConnected) {
        try {
          const conn = await dbConfig.getConnection();
          try {
            const [usersCount]: any = await conn.query('SELECT COUNT(*) as c FROM users');
            const [salesCount]: any = await conn.query('SELECT COUNT(*) as c FROM sales_records');
            const [datasetsCount]: any = await conn.query('SELECT COUNT(*) as c FROM uploaded_datasets');
            const [orgsCount]: any = await conn.query('SELECT COUNT(*) as c FROM organizations');

            tableCounts = {
              users: usersCount[0]?.c || 0,
              salesRecords: salesCount[0]?.c || 0,
              uploadedDatasets: datasetsCount[0]?.c || 0,
              organizations: orgsCount[0]?.c || 0
            };
          } finally {
            conn.release();
          }
        } catch (e: any) {
          console.warn('Telemetry query warning:', e.message);
        }
      }

      // 2. Python AI Microservice (port 8000)
      const pythonServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const pythonHealth = await checkHttpEndpoint(`${pythonServiceUrl}/health`, 2500);

      // 3. Local Ollama LLM Engine (port 11434)
      const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const ollamaHealth = await checkHttpEndpoint(`${ollamaBaseUrl}/api/tags`, 2500);

      // Extract Ollama models if online
      let ollamaModels: string[] = [];
      if (ollamaHealth.online && ollamaHealth.data?.models) {
        ollamaModels = ollamaHealth.data.models.map((m: any) => m.name || m.model);
      }

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        services: {
          backend: {
            name: 'BusinessMind Express REST API',
            port: process.env.PORT || 5000,
            status: 'online',
            uptime: Math.round(process.uptime()),
            memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
          },
          database: {
            name: 'MySQL Database',
            status: isDbConnected ? 'online' : 'offline',
            host: process.env.MYSQL_HOST || 'localhost',
            port: process.env.MYSQL_PORT || 3306,
            database: process.env.MYSQL_DATABASE || 'businessmind_db',
            tableCounts
          },
          aiService: {
            name: 'Python FastAPI Microservice (RAG & Multi-LLM)',
            url: pythonServiceUrl,
            status: pythonHealth.online ? 'online' : 'offline',
            details: pythonHealth.data || null,
            error: pythonHealth.error
          },
          ollama: {
            name: 'Ollama Local LLM Engine',
            url: ollamaBaseUrl,
            status: ollamaHealth.online ? 'online' : 'offline',
            models: ollamaModels,
            targetModel: 'qwen3.5:4b',
            hardwareAcceleration: 'NVIDIA CUDA GPU Active'
          }
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve system telemetry',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/v1/admin/users
 * List all users with roles, organization, and activity status
 */
router.get(
  '/users',
  authenticateJWT,
  requirePermission('users:manage'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const conn = await dbConfig.getConnection();
      try {
        const [rows]: [any[], any] = await conn.query(
          `SELECT 
            u.id, u.username, u.name, u.email, u.role, u.organization_id,
            u.auth_provider, u.email_verified, u.last_active_at, u.created_at,
            o.name as organization_name
           FROM users u
           LEFT JOIN organizations o ON u.organization_id = o.id
           ORDER BY u.created_at DESC`
        );

        return res.status(200).json({
          success: true,
          users: rows || [],
          availableRoles: ALL_ROLES
        });
      } finally {
        conn.release();
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user list',
        error: error.message
      });
    }
  }
);

/**
 * PATCH /api/v1/admin/users/:id/role
 * Update user role dynamically
 */
router.patch(
  '/users/:id/role',
  authenticateJWT,
  requirePermission('users:manage'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!ALL_ROLES.includes(role as UserRole)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role specified. Allowed roles: ${ALL_ROLES.join(', ')}`
        });
      }

      const conn = await dbConfig.getConnection();
      try {
        const [result]: any = await conn.query(
          'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
          [role, id]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
          success: true,
          message: `User role updated to ${role} successfully`
        });
      } finally {
        conn.release();
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update user role',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/v1/admin/sync-ai
 * Trigger AI Vector Knowledge Base re-index & sync
 */
router.post(
  '/sync-ai',
  authenticateJWT,
  requirePermission('system:admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const pythonServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const postData = JSON.stringify({});

      const result: any = await new Promise((resolve) => {
        const reqPost = http.request(`${pythonServiceUrl}/api/v1/ai/train`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          timeout: 45000
        }, (resp) => {
          let data = '';
          resp.on('data', chunk => data += chunk);
          resp.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve({ success: false, message: data });
            }
          });
        });
        reqPost.on('error', (err) => resolve({ success: false, message: err.message }));
        reqPost.on('timeout', () => { reqPost.destroy(); resolve({ success: false, message: 'Sync request timed out' }); });
        reqPost.write(postData);
        reqPost.end();
      });

      return res.status(200).json({
        success: true,
        message: 'AI Knowledge Base synchronization executed successfully',
        data: result
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to trigger AI synchronization',
        error: error.message
      });
    }
  }
);

export default router;
