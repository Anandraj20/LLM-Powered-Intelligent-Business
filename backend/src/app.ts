import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import organizationRoutes from './routes/organization.routes';
import onboardingRoutes from './routes/onboarding.routes';
import { authService } from './services/auth.service';
import { orgService } from './services/organization.service';
import { UserRole } from './config/permissions';

const app: Application = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Register REST API Route Handlers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/organization', organizationRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'backend-api',
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
