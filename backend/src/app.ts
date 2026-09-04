import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import organizationRoutes from './routes/organization.routes';
import onboardingRoutes from './routes/onboarding.routes';
import aiRoutes from './routes/ai.routes';
import { dbConfig } from './config/database';
import { authService } from './services/auth.service';
import { orgService } from './services/organization.service';
import { UserRole } from './config/permissions';

const app: Application = express();



// Trust proxy for correct IP identification behind reverse proxies/load balancers
app.set('trust proxy', 1);

// Configure Secure Security Headers using Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:3000", "http://localhost:8000"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  xContentTypeOptions: true,
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'no-referrer' }
}));

// Configure CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true, // Allow cookie-based authentication
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Custom Cookie Parser Middleware to avoid external dependency issues
app.use((req: any, res: Response, next: NextFunction) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach((c: string) => {
      const parts = c.split('=');
      if (parts.length >= 2) {
        req.cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
      }
    });
  }
  next();
});

// Custom Double-Submit Cookie CSRF Middleware
const csrfProtection = (req: any, res: Response, next: NextFunction) => {
  // Safe methods do not require CSRF validation
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Bypass CSRF checks for public API/Auth endpoints
  const publicPaths = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/google',
    '/api/v1/auth/refresh',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/v1/auth/verify-email',
    '/api/v1/auth/captcha',
    '/api/health',
    '/api/v1',
    '/api/v1/ai',
    '/api/v1/rag',
    '/api/v1/onboarding'
  ];

  if (publicPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  const csrfCookie = req.cookies?.csrfToken;
  const csrfHeader = req.headers['x-csrf-token'];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token mismatch or missing'
    });
  }

  next();
};

app.use(csrfProtection);

// Configure IP Rate Limiting for Authentication Endpoints (Max 20 requests per 15 minutes)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/v1/auth', authRateLimiter);

// Register REST API Route Handlers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/organization', organizationRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/rag', aiRoutes);


app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'backend-api',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/db', async (req: Request, res: Response) => {
  const isDbConnected = await dbConfig.testConnection();
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'connected' : 'disconnected',
    database: process.env.MYSQL_DATABASE || 'businessmind_db',
    host: process.env.MYSQL_HOST || 'localhost',
    timestamp: new Date().toISOString()
  });
});


app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to BusinessMind AI REST API — FR1 Authentication & FR2 Data Onboarding Ready'
  });
});

// Seed default organization and demo role accounts for seamless testing
async function seedDemoData() {
  try {
    const demoOwner = await authService.register({
      email: 'owner@businessmind.ai',
      password: 'Password123!',
      name: 'Elena Rostova (Owner)',
      role: 'Owner'
    }).catch(() => null);

    let orgId = demoOwner?.user.organizationId;
    if (demoOwner && demoOwner.user.id) {
      const org = await orgService.createOrganization(demoOwner.user.id, {
        name: 'Apex Global Enterprises',
        industryType: 'retail',
        businessSize: '51-200'
      }).catch(() => null);
      if (org) orgId = org.id;
    }

    const demoRoles: { email: string; name: string; role: UserRole }[] = [
      { email: 'admin@businessmind.ai', name: 'Marcus Vance (Admin)', role: 'Admin' },
      { email: 'manager@businessmind.ai', name: 'Sarah Jenkins (Manager)', role: 'Manager' },
      { email: 'sales@businessmind.ai', name: 'David Miller (Sales)', role: 'Sales Person' },
      { email: 'accountant@businessmind.ai', name: 'Priya Sharma (Accountant)', role: 'Accountant' },
      { email: 'employee@businessmind.ai', name: 'Alex Rivera (Employee)', role: 'Employee' }
    ];

    for (const item of demoRoles) {
      await authService.register({
        email: item.email,
        password: 'Password123!',
        name: item.name,
        role: item.role,
        organizationId: orgId || undefined
      }).catch(() => null);
    }
  } catch (err) {
    // Seed error ignored
  }
}

seedDemoData();

export default app;
