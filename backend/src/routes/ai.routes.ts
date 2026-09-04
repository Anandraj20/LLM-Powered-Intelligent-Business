import { Router, Request, Response } from 'express';
import http from 'http';
import https from 'https';

const router = Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

function proxyRequest(targetUrl: string, method: string, body?: any, timeoutMs: number = 90000): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(targetUrl);
    const postData = body ? JSON.stringify(body) : '';

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      timeout: timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const lib = urlObj.protocol === 'https:' ? https : http;
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode && res.statusCode >= 400) {
            resolve({
              success: false,
              status: res.statusCode,
              message: parsed.detail || parsed.message || 'AI microservice error',
              data: parsed
            });
          } else {
            resolve(parsed);
          }
        } catch (err) {
          resolve({
            success: false,
            status: res.statusCode || 502,
            message: data.trim() || 'Invalid response from AI microservice',
            raw: data
          });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        status: 504,
        message: `AI service request timed out after ${timeoutMs / 1000}s`
      });
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        status: 503,
        message: `Unable to reach AI microservice at ${AI_SERVICE_URL}: ${err.message}`
      });
    });

    if (postData && method !== 'GET') {
      req.write(postData);
    }
    req.end();
  });
}

// POST /api/v1/ai/chat & /api/v1/ai/query
const handleChat = async (req: Request, res: Response) => {
  try {
    const question = req.body.question || req.body.prompt || req.body.message;
    if (!question || !String(question).trim()) {
      return res.status(400).json({ success: false, message: 'Question prompt is required' });
    }

    const aiResponse = await proxyRequest(`${AI_SERVICE_URL}/api/v1/ai/chat`, 'POST', { question: String(question).trim() }, 90000);
    const statusCode = aiResponse.status && typeof aiResponse.status === 'number' ? aiResponse.status : 200;
    return res.status(statusCode).json(aiResponse);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to communicate with AI Service microservice',
      error: error.message
    });
  }
};

router.post('/chat', handleChat);
router.post('/query', handleChat);

// POST /api/v1/ai/classify
router.post('/classify', async (req: Request, res: Response) => {
  try {
    const question = req.body.question || req.body.prompt || req.body.message;
    if (!question || !String(question).trim()) {
      return res.status(400).json({ success: false, message: 'Question prompt is required' });
    }
    const aiResponse = await proxyRequest(`${AI_SERVICE_URL}/api/v1/ai/classify`, 'POST', { question: String(question).trim() }, 30000);
    const statusCode = aiResponse.status && typeof aiResponse.status === 'number' ? aiResponse.status : 200;
    return res.status(statusCode).json(aiResponse);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to classify question', error: error.message });
  }
});

// GET /api/v1/ai/models
router.get('/models', async (req: Request, res: Response) => {
  try {
    const aiResponse = await proxyRequest(`${AI_SERVICE_URL}/api/v1/ai/models`, 'GET', undefined, 15000);
    const statusCode = aiResponse.status && typeof aiResponse.status === 'number' ? aiResponse.status : 200;
    return res.status(statusCode).json(aiResponse);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'AI microservice unreachable', error: error.message });
  }
});

// POST /api/v1/ai/rag/upload & /api/v1/rag/upload
router.post('/rag/upload', async (req: Request, res: Response) => {
  try {
    const aiResponse = await proxyRequest(`${AI_SERVICE_URL}/api/v1/rag/upload`, 'POST', req.body, 60000);
    const statusCode = aiResponse.status && typeof aiResponse.status === 'number' ? aiResponse.status : 200;
    return res.status(statusCode).json(aiResponse);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to upload document to RAG store', error: error.message });
  }
});

// POST /api/v1/ai/rag/search & /api/v1/rag/search
router.post('/rag/search', async (req: Request, res: Response) => {
  try {
    const aiResponse = await proxyRequest(`${AI_SERVICE_URL}/api/v1/rag/search`, 'POST', req.body, 30000);
    const statusCode = aiResponse.status && typeof aiResponse.status === 'number' ? aiResponse.status : 200;
    return res.status(statusCode).json(aiResponse);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to perform vector search', error: error.message });
  }
});

// GET /api/v1/ai/rag/documents & /api/v1/rag/documents
router.get('/rag/documents', async (req: Request, res: Response) => {
  try {
    const aiResponse = await proxyRequest(`${AI_SERVICE_URL}/api/v1/rag/documents`, 'GET', undefined, 15000);
    const statusCode = aiResponse.status && typeof aiResponse.status === 'number' ? aiResponse.status : 200;
    return res.status(statusCode).json(aiResponse);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch RAG documents', error: error.message });
  }
});

export default router;
