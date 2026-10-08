export interface RoadmapPhase {
  phase: number;
  title: string;
  timeframe: string;
  goal: string;
  milestones: string[];
  deliverables: string[];
  risks: string;
}

export interface BusinessDomain {
  id: string;
  name: string;
  category: string;
  badge: string;
  iconName: string;
  tagline: string;
  description: string;
  tam: string;
  cagr: string;
  maturity: 'Hyper Growth' | 'High Growth' | 'Maturing' | 'Disruptive';
  tags: string[];
  roadmap: RoadmapPhase[];
  keyFeatures: { title: string; description: string; priority: 'Critical' | 'High' | 'Strategic' }[];
  techStack: {
    frontend: string[];
    backend: string[];
    aiModels: string[];
    database: string[];
    infrastructure: string[];
    compliance: string[];
  };
  growthMetrics: {
    targetMargin: string;
    ltvCac: string;
    paybackPeriod: string;
    netRetention: string;
    primaryKpis: string[];
  };
  worldScenario: {
    marketContext2025: string;
    tailwinds: string[];
    headwinds: string[];
    strategicRecommendations: string[];
  };
  stepByStepGuide: {
    step: number;
    title: string;
    timeline: string;
    instructions: string[];
    keyPitfall: string;
  }[];
  aiPromptPresets: string[];
}

export const BUSINESS_DOMAINS: BusinessDomain[] = [
  {
    id: 'ecommerce',
    name: 'E-Commerce & Omnichannel Retail',
    category: 'Retail & Consumer Goods',
    badge: 'High Revenue Volume',
    iconName: 'ShoppingBag',
    tagline: 'Hyper-personalized customer journeys, autonomous inventory routing, and predictive demand fulfillment.',
    description: 'Modern digital and hybrid retail operating across global marketplaces, direct-to-consumer storefronts, real-time inventory synchronizations, and AI-driven conversion intelligence.',
    tam: '$6.3 Trillion (Global)',
    cagr: '11.8% (2025-2030)',
    maturity: 'High Growth',
    tags: ['E-Commerce', 'Retail', 'D2C', 'Inventory', 'Omnichannel', 'Logistics', 'POS'],
    roadmap: [
      {
        phase: 1,
        title: 'Core Storefront & Inventory Architecture',
        timeframe: 'Weeks 1 – 8',
        goal: 'Establish high-converting product catalog, frictionless checkout, and integrated stock tracking.',
        milestones: [
          'Design headless storefront with Next.js and sub-1s load times',
          'Deploy multi-warehouse inventory tracking and SKU catalog',
          'Implement Stripe / Adyen payments with Apple Pay and Google Pay'
        ],
        deliverables: ['Headless web store', 'Unified catalog service', 'Automated tax & shipping calculator'],
        risks: 'Cart abandonment due to checkout latency or hidden shipping fees'
      },
      {
        phase: 2,
        title: 'Customer Data Platform & Personalization',
        timeframe: 'Weeks 9 – 20',
        goal: 'Capture cross-channel customer events and implement real-time recommendation engines.',
        milestones: [
          'Integrate Customer Data Platform (CDP) capturing browse & purchase telemetry',
          'Deploy collaborative filtering & LLM-based product bundles',
          'Automate abandoned cart omnichannel recovery (Email + SMS + WhatsApp)'
        ],
        deliverables: ['Predictive recommendation carousels', 'Dynamic cross-sell engine', 'Automated CRM flows'],
        risks: 'Over-messaging users causing unsubscribes and brand fatigue'
      },
      {
        phase: 3,
        title: 'Omnichannel & POS Synchronization',
        timeframe: 'Months 6 – 12',
        goal: 'Unify offline POS retail stores with online inventory and digital loyalty programs.',
        milestones: [
          'Bidirectional ERP/POS sync with webhook event pipelines',
          'BOPIS (Buy Online, Pick Up In Store) localized fulfillment routing',
          'Tiered VIP membership and unified wallet rewards'
        ],
        deliverables: ['Real-time POS bridge', 'Store fulfillment tablet app', 'Unified customer loyalty wallet'],
        risks: 'Inventory sync race conditions during flash sales'
      },
      {
        phase: 4,
        title: 'Autonomous Supply Chain & Global Expansion',
        timeframe: 'Year 2+',
        goal: 'AI-predicted demand forecasting, localized multi-currency checkouts, and international 3PL routing.',
        milestones: [
          'ML time-series demand forecasting by regional zip code',
          'Automated supplier reorder purchase order generation',
          'Multi-currency and cross-border customs tax compliance engine'
        ],
        deliverables: ['Predictive replenishment service', 'Global localized storefronts', 'Autonomous pricing engine'],
        risks: 'Currency volatility and cross-border customs regulations'
      }
    ],
    keyFeatures: [
      { title: 'Sub-Second Headless Catalog', description: 'Instant page transitions with server-side caching and dynamic pricing', priority: 'Critical' },
      { title: 'AI Dynamic Pricing & Markdown', description: 'Algorithmic discount optimization balancing margin retention and inventory turns', priority: 'Strategic' },
      { title: 'Unified Omnichannel Cart', description: 'Persistent shopper carts across mobile app, web, and physical POS terminal', priority: 'High' },
      { title: 'Predictive Stock Replenishment', description: 'Automated supplier triggers calculated from lead times, seasonal peaks, and sales run rates', priority: 'Critical' }
    ],
    techStack: {
      frontend: ['Next.js 14', 'React', 'Tailwind CSS', 'Radix UI'],
      backend: ['Node.js Express', 'Go Microservices', 'Redis Caching'],
      aiModels: ['OpenAI GPT-4o', 'Vector Search / Pinecone', 'Scikit-learn TimeSeries'],
      database: ['PostgreSQL', 'MySQL (OLTP)', 'ClickHouse (Analytics)'],
      infrastructure: ['Docker', 'Kubernetes', 'Cloudflare CDN', 'AWS S3'],
      compliance: ['PCI-DSS Level 1', 'GDPR', 'CCPA', 'SOC-2 Type II']
    },
    growthMetrics: {
      targetMargin: '55% – 68% (Gross)',
      ltvCac: '4.2x (Blended)',
      paybackPeriod: '4 – 7 Months',
      netRetention: '118% (Annual Cohort)',
      primaryKpis: ['Average Order Value (AOV)', 'Conversion Rate (CR)', 'Cart Abandonment Rate', 'Return on Ad Spend (ROAS)']
    },
    worldScenario: {
      marketContext2025: 'E-commerce in 2025/2026 faces rising paid customer acquisition costs (Meta/Google ad inflation). Brands that thrive rely on proprietary first-party data, agentic personal shoppers, and rapid 2-day micro-fulfillment hubs.',
      tailwinds: [
        'Social commerce integration (TikTok Shop, Instagram checkout)',
        'Agentic AI assistants personalizing sizing, styling, and bundle recommendations',
        'Growth in cross-border e-commerce and local payment rails (PIX, UPI, Klarna)'
      ],
      headwinds: [
        'Customer acquisition costs (CAC) elevated by 28% YoY across digital channels',
        'Higher return rates in apparel and luxury goods eroding bottom-line margins',
        'Supply chain volatility and maritime shipping tariff adjustments'
      ],
      strategicRecommendations: [
        'Shift budget from top-of-funnel paid ads to high-LTV VIP retention and referral programs',
        'Deploy AI-assisted return prevention via sizing diagnostics and augmented 3D preview',
        'Implement automated dynamic pricing models that protect gross margins against shipping inflation'
      ]
    },
    stepByStepGuide: [
      {
        step: 1,
        title: 'Establish High-Velocity Product Foundation',
        timeline: 'Days 1 – 30',
        instructions: [
          'Audit SKU margins and identify top 20% Pareto revenue-generating items',
          'Set up Next.js headless storefront integrated with Stripe payments',
          'Deploy transactional email/SMS automation for order confirmations'
        ],
        keyPitfall: 'Prematurely over-engineering multi-warehouse routing before initial order velocity is proven.'
      },
      {
        step: 2,
        title: 'Optimize Unit Economics & Retention Funnels',
        timeline: 'Days 31 – 90',
        instructions: [
          'Implement post-purchase one-click upsells and cross-category bundles',
          'Set up Klaviyo / Braze triggered flows for abandoned carts, browses, and replenishment',
          'Establish strict return policy guidelines and return-for-credit incentives'
        ],
        keyPitfall: 'Offering steep site-wide discounts that train customers never to buy at full retail price.'
      },
      {
        step: 3,
        title: 'Scale Omnichannel Logistics & Predictive Reordering',
        timeline: 'Months 3 – 12',
        instructions: [
          'Integrate 3PL warehouse management system (WMS) with real-time API webhooks',
          'Train ML demand forecasting algorithms on trailing 12-month order volumes',
          'Launch automated B2B wholesale portal to diversify revenue streams'
        ],
        keyPitfall: 'Stocking excess inventory based on one-off holiday spikes, tying up working capital.'
      }
    ],
    aiPromptPresets: [
      'How can an e-commerce brand cut customer acquisition costs by 35% in 2026?',
      'What are the best strategies to reduce e-commerce returns from 22% down to 8%?',
      'Design a modern headless tech stack for 50,000 orders/day with zero downtime.'
    ]
  },
  {
    id: 'saas',
    name: 'B2B Enterprise SaaS & Cloud Software',
    category: 'Enterprise Software',
    badge: 'High Gross Margin',
    iconName: 'Cloud',
    tagline: 'Multi-tenant architecture, usage-based metering, enterprise RBAC security, and automated product-led growth.',
    description: 'Cloud-native enterprise platforms delivering software solutions with seat and consumption billing, automated client onboarding, team collaboration, and compliance-ready data controls.',
    tam: '$390 Billion (Global B2B SaaS)',
    cagr: '18.4% (2025-2030)',
    maturity: 'Hyper Growth',
    tags: ['SaaS', 'B2B', 'Cloud', 'Product-Led Growth', 'Multi-Tenant', 'Enterprise', 'RBAC', 'APIs'],
    roadmap: [
      {
        phase: 1,
        title: 'Multi-Tenant Core & Role-Based Access Control',
        timeframe: 'Weeks 1 – 10',
        goal: 'Build secure tenant data isolation, granular RBAC permissions, and SSO authentication.',
        milestones: [
          'Implement multi-tenant DB schema with row-level security (RLS)',
          'Deploy SAML 2.0 / Okta / Azure AD Single Sign-On and MFA',
          'Set up audit log trail recording all user events and privilege changes'
        ],
        deliverables: ['Multi-tenant core engine', 'RBAC policy matrix', 'SAML SSO integration'],
        risks: 'Tenant data leakage or permission bypass due to weak schema segregation'
      },
      {
        phase: 2,
        title: 'Product-Led Growth (PLG) & Self-Serve Onboarding',
        timeframe: 'Weeks 11 – 24',
        goal: 'Create zero-friction time-to-value with interactive product tours and self-serve billing.',
        milestones: [
          'Deploy interactive checklist onboarding and sample demo workspaces',
          'Implement Stripe Billing with hybrid seat + usage-based metering',
          'Set up real-time in-app analytics to track Product Qualified Leads (PQLs)'
        ],
        deliverables: ['Self-serve workspace creator', 'Tiered subscription billing', 'PQL scoring engine'],
        risks: 'High onboarding friction leading to trial abandonment before first aha moment'
      },
      {
        phase: 3,
        title: 'Enterprise Readiness & Integration Ecosystem',
        timeframe: 'Months 6 – 14',
        goal: 'Attain enterprise procurement standards (SOC-2, HIPAA) and launch developer API platform.',
        milestones: [
          'Achieve SOC-2 Type II certification and automated security posture monitoring',
          'Publish public REST & GraphQL APIs with developer portal and webhooks',
          'Build native integrations for Salesforce, Slack, HubSpot, and Jira'
        ],
        deliverables: ['Public API gateway', 'Enterprise security portal', 'Integration directory'],
        risks: 'Long enterprise procurement cycles stalling quarterly revenue targets'
      },
      {
        phase: 4,
        title: 'AI Copilot & Workflow Automation Moat',
        timeframe: 'Year 2+',
        goal: 'Embed domain-specific AI agents that automate customer business workflows autonomously.',
        milestones: [
          'Deploy embedded generative AI assistant fine-tuned on customer tenant data',
          'Launch autonomous scheduled workflows and anomaly detection webhooks',
          'Develop industry-specific vertical enterprise bundles'
        ],
        deliverables: ['Autonomous workflow engine', 'Custom LLM fine-tuning suite', 'Predictive churn dashboard'],
        risks: 'LLM hallucinations generating incorrect enterprise business data'
      }
    ],
    keyFeatures: [
      { title: 'Fine-Grained RBAC & Tenant Isolation', description: 'Enterprise permissions matrix with customizable roles, tenant silos, and audit trails', priority: 'Critical' },
      { title: 'Hybrid Seat & Usage Metering', description: 'Real-time billing engine tracking API calls, storage, seats, and custom consumption units', priority: 'High' },
      { title: 'Interactive Guided Workspaces', description: 'Frictionless onboarding flows accelerating time-to-first-value under 5 minutes', priority: 'High' },
      { title: 'Autonomous Embedded AI Assistant', description: 'Domain-tuned LLM executing complex platform actions on natural language commands', priority: 'Strategic' }
    ],
    techStack: {
      frontend: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Zustand', 'React Hook Form'],
      backend: ['Node.js TypeScript', 'Express / Fastify', 'BullMQ Queue'],
      aiModels: ['OpenAI GPT-4o-mini', 'LangChain', 'Ollama Local LLMs'],
      database: ['PostgreSQL (Row-Level Security)', 'Redis', 'TimescaleDB'],
      infrastructure: ['AWS ECS / EKS', 'Terraform', 'Datadog APM', 'Cloudflare'],
      compliance: ['SOC-2 Type II', 'ISO 27001', 'HIPAA', 'GDPR']
    },
    growthMetrics: {
      targetMargin: '78% – 86% (Gross)',
      ltvCac: '5.5x',
      paybackPeriod: '8 – 12 Months',
      netRetention: '124% (Annual Cohort)',
      primaryKpis: ['Annual Recurring Revenue (ARR)', 'Net Revenue Retention (NRR)', 'PQL to Paid Conversion', 'Burn Multiple']
    },
    worldScenario: {
      marketContext2025: 'B2B SaaS in 2025 has moved beyond simple "point solutions" toward integrated platforms with embedded AI copilots. Buyers demand rapid ROI justification within 60 days, driving consolidation of single-purpose tools.',
      tailwinds: [
        'Enterprises actively seeking AI automation to offset labor costs',
        'Consolidation around platforms with open APIs and deep ecosystem integrations',
        'Increasing willingness to pay premium for verifiable SOC-2 and HIPAA compliance'
      ],
      headwinds: [
        'CFO scrutiny requiring business case signoff on any software contract over $20k',
        'High competition from incumbents copying niche feature sets into core bundles',
        'Pressure to transition from pure seat-based pricing to hybrid value/usage models'
      ],
      strategicRecommendations: [
        'Adopt hybrid pricing (base platform fee + usage consumption) to align with actual customer value',
        'Deliver measurable ROI metrics directly in the product executive dashboard',
        'Build deep native integrations rather than shallow webhooks to increase product stickiness'
      ]
    },
    stepByStepGuide: [
      {
        step: 1,
        title: 'Define ICP & Nail Problem-Solution Fit',
        timeline: 'Days 1 – 30',
        instructions: [
          'Conduct 30 in-depth qualitative interviews with target decision-makers (VP/Director level)',
          'Create high-fidelity clickable prototype to validate willingness to pay before writing full backend',
          'Secure 5 letters of intent (LOIs) or paid beta pilot agreements'
        ],
        keyPitfall: 'Building features requested by casual non-paying users instead of target enterprise buyers.'
      },
      {
        step: 2,
        title: 'Launch Self-Serve Beta with RBAC & Analytics',
        timeline: 'Days 31 – 90',
        instructions: [
          'Ship MVP with core workflow, role-based auth, and automated onboarding checklists',
          'Instrument PostHog / Mixpanel to monitor user drop-off points in onboarding',
          'Personally onboard every initial pilot account to observe behavioral bottlenecks'
        ],
        keyPitfall: 'Ignoring initial user onboarding drop-off and jumping straight to marketing campaigns.'
      },
      {
        step: 3,
        title: 'Accelerate Inbound Funnel & Outbound Sales Engine',
        timeline: 'Months 3 – 12',
        instructions: [
          'Launch SEO-driven high-intent comparison and alternative landing pages',
          'Deploy automated cold outbound email sequences targeting verified decision-makers',
          'Implement product-qualified lead triggers alerting sales when usage exceeds threshold'
        ],
        keyPitfall: 'Hiring enterprise sales reps before having a repeatable, documented sales playbook.'
      }
    ],
    aiPromptPresets: [
      'What pricing model maximizes Net Revenue Retention for an enterprise B2B SaaS in 2026?',
      'How to structure SOC-2 Type II compliance audit preparation in under 90 days?',
      'Create a repeatable Product-Led Growth (PLG) onboarding sequence for non-technical users.'
    ]
  },
  {
    id: 'fintech',
    name: 'FinTech & Autonomous Digital Banking',
    category: 'Financial Services',
    badge: 'High Enterprise Value',
    iconName: 'CreditCard',
    tagline: 'Algorithmic underwriting, real-time fraud deterrence, embedded banking, and regulatory compliance rails.',
    description: 'Financial technology infrastructure powering automated credit scoring, corporate card issuing, cross-border remittance, anti-money laundering (AML), and smart treasury management.',
    tam: '$1.5 Trillion (Global FinTech)',
    cagr: '19.8% (2025-2030)',
    maturity: 'Hyper Growth',
    tags: ['FinTech', 'Banking', 'Payments', 'Fraud Detection', 'AML/KYC', 'Treasury', 'Credit'],
    roadmap: [
      {
        phase: 1,
        title: 'Banking Rails & Core KYC / AML Foundation',
        timeframe: 'Weeks 1 – 12',
        goal: 'Integrate banking-as-a-service (BaaS) partner, identity verification, and ledger architecture.',
        milestones: [
          'Partner with chartered sponsor bank or BaaS provider (Stripe Treasury / Unit)',
          'Integrate automated KYC / KYB identity verification with Persona or Plaid',
          'Implement double-entry accounting ledger with immutable transaction logs'
        ],
        deliverables: ['Immutable double-entry ledger', 'Automated KYC/KYB flow', 'Virtual account generator'],
        risks: 'Regulatory sponsor bank onboarding delays and compliance rejections'
      },
      {
        phase: 2,
        title: 'Payment Orchestration & Card Issuance',
        timeframe: 'Weeks 13 – 26',
        goal: 'Enable ACH, FedNow real-time transfers, physical/virtual cards, and merchant clearing.',
        milestones: [
          'Deploy ACH, Wire, and FedNow / RTP real-time rail orchestrator',
          'Launch virtual card issuing with dynamic spend limit controls',
          'Integrate webhooks for real-time transaction authorization decisions (< 300ms)'
        ],
        deliverables: ['Real-time payment gateway', 'Card issuance management portal', 'Instant push payouts'],
        risks: 'High chargeback rates or fraudulent merchant disputes'
      },
      {
        phase: 3,
        title: 'AI Fraud Prevention & Credit Risk Engine',
        timeframe: 'Months 6 – 15',
        goal: 'Deploy machine learning anomaly detection to stop account takeovers and calculate risk scores.',
        milestones: [
          'Train gradient boosted decision trees on transaction velocity and geolocation data',
          'Implement automated SAR (Suspicious Activity Report) filing workflows',
          'Launch working capital credit scoring based on real-time cash flow telemetry'
        ],
        deliverables: ['Autonomous fraud score pipeline', 'Automated AML compliance dashboard', 'Instant credit underwriting'],
        risks: 'False positive fraud blocks causing legitimate customer churn'
      },
      {
        phase: 4,
        title: 'Cross-Border Treasury & Yield Optimization',
        timeframe: 'Year 2+',
        goal: 'Multi-currency corporate treasury management, automated sweeps, and cross-border settlement.',
        milestones: [
          'Deploy automated treasury yield sweep accounts into risk-free government bills',
          'Implement FX spot trading and cross-border currency corridor settlement',
          'Integrate open banking APIs for automated ERP reconciliation (NetSuite, QuickBooks)'
        ],
        deliverables: ['Multi-currency treasury portal', 'Automated cash sweep engine', 'One-click ERP reconciliation'],
        risks: 'International foreign exchange exposure and capital control limits'
      }
    ],
    keyFeatures: [
      { title: 'Immutable Double-Entry Ledger', description: 'Zero-tolerance financial ledger ensuring every debit has a matching credit with audit trail', priority: 'Critical' },
      { title: 'Sub-300ms Fraud Scoring', description: 'Real-time ML decisioning blocking stolen card usage and synthetic identity attacks', priority: 'Critical' },
      { title: 'Instant FedNow & RTP Transfers', description: '24/7/365 immediate funds clearance bypassing traditional 3-day ACH delays', priority: 'High' },
      { title: 'Automated Cash Flow Underwriting', description: 'Continuous revenue and bank balance evaluation replacing static annual tax returns', priority: 'Strategic' }
    ],
    techStack: {
      frontend: ['Next.js 14', 'Tailwind CSS', 'Chart.js / Recharts', 'Lucide Icons'],
      backend: ['Go (High Concurrency Ledger)', 'Node.js Express', 'Apache Kafka'],
      aiModels: ['XGBoost Risk Models', 'OpenAI Fraud Pattern Analysis', 'Isolation Forests'],
      database: ['PostgreSQL (ACID Compliant)', 'Redis', 'CockroachDB'],
      infrastructure: ['AWS GovCloud / Dedicated VPC', 'KMS Hardware Security Modules', 'Cloudflare Magic Transit'],
      compliance: ['PCI-DSS Level 1', 'SOC-1 / SOC-2', 'GLBA', 'BSA/AML Regulations']
    },
    growthMetrics: {
      targetMargin: '62% – 74% (Net Take Rate)',
      ltvCac: '6.0x',
      paybackPeriod: '6 – 9 Months',
      netRetention: '132% (Payment Volume Based)',
      primaryKpis: ['Total Payment Volume (TPV)', 'Net Take Rate (bps)', 'Fraud Loss Rate (< 0.05%)', 'Daily Active Accounts']
    },
    worldScenario: {
      marketContext2025: 'FinTech in 2025 is dominated by the adoption of instant payment rails (FedNow, PIX, UPI) and AI-driven anti-fraud defenses. Pure payment wrappers without software workflows face margin compression from interchange caps.',
      tailwinds: [
        'Universal demand for instant settlement rather than 3-day clearing windows',
        'B2B vertical software companies embedding banking and lending into core workflows',
        'High interest rate environment boosting earnings on customer cash deposits (float)'
      ],
      headwinds: [
        'Strict regulatory scrutiny from FDIC, SEC, and CFPB on sponsor bank partnerships',
        'Sophisticated generative AI voice and deepfake attacks targeting biometric KYC checks',
        'Interchange fee compression from legislative proposals and merchant fee caps'
      ],
      strategicRecommendations: [
        'Bundle software productivity tools with payments rather than competing solely on interchange fees',
        'Deploy multi-modal fraud detection combining behavioral biometrics, IP reputation, and device fingerprints',
        'Maintain direct relationships with at least two distinct sponsor banks to prevent single-point-of-failure risk'
      ]
    },
    stepByStepGuide: [
      {
        step: 1,
        title: 'Secure Sponsor Bank & Licensing Framework',
        timeline: 'Days 1 – 60',
        instructions: [
          'Submit compliance RFP to top BaaS providers (Unit, Stripe Treasury, Column)',
          'Draft formal Bank Secrecy Act / Anti-Money Laundering (BSA/AML) compliance manual',
          'Formulate strict customer onboarding eligibility rules and prohibited merchant categories'
        ],
        keyPitfall: 'Building UI code before verifying that your business model is legally acceptable to bank compliance officers.'
      },
      {
        step: 2,
        title: 'Construct Immutable Financial Ledger Architecture',
        timeline: 'Days 61 – 120',
        instructions: [
          'Design ACID-compliant SQL double-entry ledger ensuring zero rounding or floating-point errors',
          'Implement idempotency keys for all payment initiation APIs to prevent accidental double charges',
          'Deploy automated end-of-day bank balance reconciliation scripts'
        ],
        keyPitfall: 'Using floating point variables instead of integer cents/basis points for financial math.'
      },
      {
        step: 3,
        title: 'Deploy Real-Time Fraud & Anomaly Shields',
        timeline: 'Months 4 – 12',
        instructions: [
          'Set up velocity limits on new account deposits and card spending',
          'Train ML classifiers to detect abnormal spike in card testing or micro-transactions',
          'Launch instant push notification alerts asking customers to approve suspicious charges'
        ],
        keyPitfall: 'Relaxing KYC/AML verification friction to boost signup numbers, inviting organized fraud rings.'
      }
    ],
    aiPromptPresets: [
      'What are the critical compliance requirements for launching an embedded corporate card program in 2026?',
      'How to design an immutable double-entry ledger database schema in PostgreSQL?',
      'What are the most effective strategies to defeat generative AI deepfakes during digital KYC?'
    ]
  },
  {
    id: 'healthtech',
    name: 'HealthTech & Clinical AI Systems',
    category: 'Healthcare & Life Sciences',
    badge: 'High Societal Impact',
    iconName: 'Activity',
    tagline: 'HIPAA-compliant patient portals, AI ambient clinical scribe, remote diagnostics, and EHR interoperability.',
    description: 'Next-generation medical technology platforms unifying electronic health records (EHR/FHIR), automated clinical documentation, remote patient monitoring (RPM), and regulatory data protection.',
    tam: '$850 Billion (Global HealthTech)',
    cagr: '21.5% (2025-2030)',
    maturity: 'Hyper Growth',
    tags: ['HealthTech', 'HIPAA', 'Clinical AI', 'Telemedicine', 'FHIR', 'EHR', 'RPM', 'Diagnostics'],
    roadmap: [
      {
        phase: 1,
        title: 'HIPAA Compliant Infrastructure & FHIR Gateway',
        timeframe: 'Weeks 1 – 12',
        goal: 'Establish end-to-end encrypted medical data pipelines and EHR interoperability protocols.',
        milestones: [
          'Execute Business Associate Agreements (BAAs) across all cloud vendors',
          'Deploy FHIR R4 standard API connectors for Epic and Cerner EHR synchronization',
          'Implement field-level encryption for Protected Health Information (PHI)'
        ],
        deliverables: ['HIPAA certified database silo', 'FHIR interoperability gateway', 'PHI access audit log'],
        risks: 'Failing third-party HIPAA security audits or mishandling PHI unencrypted in logs'
      },
      {
        phase: 2,
        title: 'Ambient AI Clinical Documentation Scribe',
        timeframe: 'Weeks 13 – 26',
        goal: 'Transcribe doctor-patient conversations and automatically generate SOAP medical notes.',
        milestones: [
          'Integrate real-time medical speech-to-text with medical terminology dictionary',
          'Fine-tune clinical LLM to structure dialogues into standardized SOAP notes',
          'Build physician one-click review and EHR sync interface'
        ],
        deliverables: ['Ambient audio recorder app', 'Automated SOAP note generator', 'Doctor approval dashboard'],
        risks: 'Clinical hallucinations creating inaccurate dosage or allergy documentation'
      },
      {
        phase: 3,
        title: 'Telehealth & Remote Patient Monitoring (RPM)',
        timeframe: 'Months 6 – 14',
        goal: 'Connect IoT medical sensors (blood pressure, glucose, pulse ox) with automated provider alerts.',
        milestones: [
          'Deploy WebRTC encrypted peer-to-peer video consultation rooms',
          'Integrate cellular/Bluetooth medical sensor telemetry ingestion',
          'Automate CPT billing code generation for RPM Medicare reimbursements'
        ],
        deliverables: ['Telehealth video consultation suite', 'RPM vital signs alert dashboard', 'CPT reimbursement engine'],
        risks: 'Device connectivity dropouts causing missed critical patient vital alerts'
      },
      {
        phase: 4,
        title: 'Predictive Diagnostic Triage & Value-Based Care',
        timeframe: 'Year 2+',
        goal: 'Deploy predictive models identifying high-risk chronic patients before emergency readmissions.',
        milestones: [
          'Train ML classifiers on longitudinal patient charts to predict 30-day hospital readmission',
          'Deploy automated medication adherence reminders and patient follow-up conversational agents',
          'Integrate with insurance payer clearinghouses for real-time prior authorization'
        ],
        deliverables: ['Hospital readmission predictor', 'Autonomous prior authorization assistant', 'Population health dashboard'],
        risks: 'Algorithmic bias in health triage recommendations'
      }
    ],
    keyFeatures: [
      { title: 'Zero-Knowledge PHI Encryption', description: 'End-to-end envelope encryption ensuring database administrators cannot view raw patient medical charts', priority: 'Critical' },
      { title: 'Ambient Clinical Voice Scribe', description: 'Background listening agent generating structured SOAP notes in under 45 seconds', priority: 'Strategic' },
      { title: 'Bi-directional EHR FHIR Sync', description: 'Seamless real-time synchronization with Epic, Oracle Cerner, and Athenahealth records', priority: 'Critical' },
      { title: 'Automated Prior Authorization', description: 'LLM extracting medical necessity documentation to streamline insurance approvals', priority: 'High' }
    ],
    techStack: {
      frontend: ['Next.js 14', 'React', 'Tailwind CSS', 'WebRTC'],
      backend: ['Python FastAPI', 'Node.js', 'Redis'],
      aiModels: ['Fine-tuned Med-PaLM / Whisper Med', 'ClinicalBERT', 'GPT-4o Medical'],
      database: ['PostgreSQL (Encrypted)', 'HAPI FHIR Server', 'TimescaleDB (Vitals)'],
      infrastructure: ['AWS HealthLake / HIPAA VPC', 'Cloudflare Zero Trust', 'HashiCorp Vault'],
      compliance: ['HIPAA', 'HITECH Act', 'FDA SaMD (if diagnostic)', 'SOC-2 Type II']
    },
    growthMetrics: {
      targetMargin: '72% – 82%',
      ltvCac: '5.2x',
      paybackPeriod: '9 – 14 Months',
      netRetention: '121%',
      primaryKpis: ['Clinician Hours Saved / Week', 'Patient Encounter Volume', 'Prior Auth Approval Rate', 'CPT Reimbursement Yield']
    },
    worldScenario: {
      marketContext2025: 'Physician burnout has reached critical levels, driving rapid health system procurement of ambient clinical AI scribes. At the same time, CMS and private payers are expanding coverage for Remote Patient Monitoring (RPM) and value-based care.',
      tailwinds: [
        'Doctors spend over 2 hours on administrative EHR paperwork for every 1 hour of patient care',
        'Substantial Medicare reimbursement codes created for remote patient monitoring (CPT 99453, 99454, 99457)',
        'Widespread consumer comfort with telehealth and digital pharmacy deliveries'
      ],
      headwinds: [
        'Extremely long hospital enterprise sales cycles (9 to 18 months per hospital system)',
        'Strict FDA medical device software (SaMD) regulations for any diagnostic output',
        'High liability insurance costs and risk of malpractice claims'
      ],
      strategicRecommendations: [
        'Target independent clinic physician groups (5 to 50 doctors) first to bypass glacial hospital health system committees',
        'Position the product strictly as a "clinical workflow efficiency tool" rather than an autonomous diagnostic device to reduce FDA regulatory hurdles',
        'Automate the insurance CPT reimbursement paperwork so clinics make more revenue using your software than it costs'
      ]
    },
    stepByStepGuide: [
      {
        step: 1,
        title: 'Complete HIPAA Compliance Setup & Architecture',
        timeline: 'Days 1 – 45',
        instructions: [
          'Sign BAAs with AWS, MongoDB/PostgreSQL host, and communication APIs (Twilio/SendGrid)',
          'Establish audit logging for every read, write, and export operation on patient tables',
          'Enforce multi-factor authentication (MFA) and auto-logout on all clinical portals'
        ],
        keyPitfall: 'Sending unencrypted patient names or identifiers in plain text email or Slack alerts.'
      },
      {
        step: 2,
        title: 'Run Pilot with 5 Partner Clinics',
        timeline: 'Days 46 – 100',
        instructions: [
          'Deploy ambient audio scribe in 5 doctor examination rooms with signed patient consent',
          'Measure clinician documentation time saved per patient encounter (aim for > 10 minutes saved)',
          'Collect verbatim clinician feedback on note accuracy and formatting preferences'
        ],
        keyPitfall: 'Neglecting to accommodate heavy clinical accents or specialty-specific medical jargon in speech models.'
      },
      {
        step: 3,
        title: 'Expand EHR Interoperability & Medical Billing',
        timeline: 'Months 4 – 12',
        instructions: [
          'Connect with Epic App Orchard and Athenahealth marketplace for 1-click install',
          'Add automated billing code suggestion (ICD-10 and CPT codes) derived from encounter notes',
          'Publish clinical outcome case studies demonstrating reduced provider burnout and higher billing accuracy'
        ],
        keyPitfall: 'Failing to test EHR API rate limits during peak morning clinic operating hours.'
      }
    ],
    aiPromptPresets: [
      'How to obtain HIPAA certification and execute BAAs for a cloud-hosted HealthTech application?',
      'What are the highest-margin CPT reimbursement codes for Remote Patient Monitoring (RPM) in 2026?',
      'Design an ambient AI medical transcription pipeline that eliminates clinical hallucinations.'
    ]
  },
  {
    id: 'ai_agents',
    name: 'AI Platforms & Autonomous Agent Swarms',
    category: 'Artificial Intelligence & Automation',
    badge: 'Disruptive Technology',
    iconName: 'Bot',
    tagline: 'Multi-agent orchestration, function calling workflows, RAG vector retrieval, and enterprise guardrail governance.',
    description: 'Next-generation intelligent automation engines coordinating autonomous AI agents to execute multi-step research, code generation, customer operations, and automated decision loops.',
    tam: '$1.3 Trillion (AI Software & Services by 2030)',
    cagr: '37.3% (2025-2030)',
    maturity: 'Disruptive',
    tags: ['AI Agents', 'LLM', 'Autonomous', 'RAG', 'Vector Search', 'Swarm', 'Automation', 'Enterprise AI'],
    roadmap: [
      {
        phase: 1,
        title: 'Agent Orchestration Core & Function Tool Registry',
        timeframe: 'Weeks 1 – 10',
        goal: 'Build asynchronous agent executor with deterministic tool calling and memory scratchpads.',
        milestones: [
          'Implement ReAct loop (Reason, Action, Observation) agent runtime',
          'Build secure sandbox executing Python/JavaScript code and HTTP API requests',
          'Deploy tool calling registry with strict JSON schema validation'
        ],
        deliverables: ['Agent runtime engine', 'Tool calling sandbox', 'Short-term context memory'],
        risks: 'Infinite execution loops consuming unlimited API token budgets'
      },
      {
        phase: 2,
        title: 'RAG Knowledge Graph & Hybrid Vector Retrieval',
        timeframe: 'Weeks 11 – 22',
        goal: 'Ingest enterprise PDFs, spreadsheets, databases, and Notion docs into hybrid search index.',
        milestones: [
          'Build multi-format ingestion pipeline (PDF, CSV, SQL, Markdown)',
          'Implement hybrid search combining BM25 keyword matching and dense vector embeddings',
          'Deploy cross-encoder re-ranking step ensuring top 0.1% context relevance'
        ],
        deliverables: ['Enterprise knowledge ingestion pipeline', 'Hybrid vector search index', 'Context re-ranking service'],
        risks: 'Semantic drift where agents retrieve outdated or irrelevant documentation chunks'
      },
      {
        phase: 3,
        title: 'Multi-Agent Swarm Collaboration & Task Delegation',
        timeframe: 'Months 6 – 12',
        goal: 'Coordinate specialized sub-agents (Researcher, Coder, Critic, Reviewer) to complete complex goals.',
        milestones: [
          'Implement supervisor agent routing complex enterprise tasks to domain specialist agents',
          'Deploy agent-to-agent peer review and automated reflection feedback loops',
          'Add persistent long-term episodic memory storing past user interactions and preferences'
        ],
        deliverables: ['Multi-agent swarm coordinator', 'Peer review reflection system', 'Episodic memory store'],
        risks: 'Cascading agent errors where one hallucination corrupts downstream sub-agent actions'
      },
      {
        phase: 4,
        title: 'Enterprise Guardrails, Evaluation & SLA Governance',
        timeframe: 'Year 2+',
        goal: 'Enforce hallucination detection, PII redactors, cost budgeting, and enterprise compliance SLAs.',
        milestones: [
          'Deploy real-time safety guardrail layer detecting prompt injection and jailbreaks',
          'Implement automated LLM unit test benchmarks measuring precision, recall, and toxicity',
          'Build enterprise cost governance dashboard tracking token expenditure per department'
        ],
        deliverables: ['Safety guardrail firewall', 'LLM benchmark suite', 'Token cost allocation dashboard'],
        risks: 'Prompt injection attacks causing unauthorized data exfiltration or actions'
      }
    ],
    keyFeatures: [
      { title: 'Deterministic Tool Calling Sandbox', description: 'Isolated execution environment allowing agents to safely call internal APIs and run code', priority: 'Critical' },
      { title: 'Hybrid Dense & Sparse RAG', description: 'Dual search engine pairing vector similarity with lexical BM25 search for 99.4% retrieval accuracy', priority: 'Critical' },
      { title: 'Autonomous Reflection & Self-Correction', description: 'Critic agents validating output before surfacing results to human operators', priority: 'Strategic' },
      { title: 'Zero-Trust Safety & PII Redactor', description: 'Inline firewall blocking prompt injections and automatically redacting confidential credentials', priority: 'Critical' }
    ],
    techStack: {
      frontend: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Vercel AI SDK'],
      backend: ['Python FastAPI', 'Node.js Express', 'Temporal.io (Workflows)'],
      aiModels: ['OpenAI GPT-4o / GPT-4o-mini', 'Anthropic Claude 3.5 Sonnet', 'Ollama Qwen / Llama 3'],
      database: ['PostgreSQL with pgvector', 'Qdrant / Milvus', 'Redis (Context Memory)'],
      infrastructure: ['Docker Isolated Sandboxes', 'AWS Lambda', 'Fly.io GPU clusters'],
      compliance: ['EU AI Act Compliance', 'SOC-2 Type II', 'NIST AI Risk Management Framework']
    },
    growthMetrics: {
      targetMargin: '70% – 80% (Net of Compute)',
      ltvCac: '6.2x',
      paybackPeriod: '5 – 8 Months',
      netRetention: '138% (Usage & Compute Expansion)',
      primaryKpis: ['Autonomous Task Completion Rate (%)', 'Token Efficiency Ratio', 'Human-in-the-Loop Intervention Rate', 'Compute Cost per Task ($)']
    },
    worldScenario: {
      marketContext2025: 'The market has transitioned from simple chatbots to autonomous agents that take real-world actions. Enterprise buyers now require deterministic safety guardrails, audit logging, and measurable human labor hours saved.',
      tailwinds: [
        'Dramatic reduction in LLM inference costs (token prices fell over 80% in 18 months)',
        'Enterprise demand to automate back-office operations (accounting, IT tickets, support)',
        'Advancements in tool-calling protocols and structured JSON output reliability'
      ],
      headwinds: [
        'Hallucination liability when agents take actions without human supervision',
        'Enterprise security teams blocking external LLM API calls due to proprietary data concerns',
        'Rapid model obsolescence requiring model-agnostic architecture'
      ],
      strategicRecommendations: [
        'Design model-agnostic abstraction layers so you can hot-swap between OpenAI, Anthropic, and local open-weight models',
        'Implement "Human-in-the-Loop" approval gates for high-stakes actions (financial transactions, data deletion)',
        'Offer hybrid deployment options allowing sensitive enterprises to run models in their own private cloud/VPC'
      ]
    },
    stepByStepGuide: [
      {
        step: 1,
        title: 'Build Resilient Agent Sandbox & Tool Registry',
        timeline: 'Days 1 – 30',
        instructions: [
          'Create secure containerized execution sandbox preventing network escape or infinite loops',
          'Define structured schema for all agent tools (parameters, descriptions, return types)',
          'Implement hard token limits and timeout ceilings on every single agent loop execution'
        ],
        keyPitfall: 'Allowing agents unconstrained bash access or open web scraping without domain whitelists.'
      },
      {
        step: 2,
        title: 'Ship Narrow Domain Agent with 95%+ Accuracy',
        timeline: 'Days 31 – 90',
        instructions: [
          'Pick ONE specific high-value vertical task (e.g. automated reconciliation, invoice extraction)',
          'Create a ground-truth evaluation dataset of 200 realistic test inputs and expected outputs',
          'Iterate on system prompts, RAG chunking, and few-shot examples until test accuracy exceeds 95%'
        ],
        keyPitfall: 'Trying to build a general "can do everything" agent that performs poorly on every actual task.'
      },
      {
        step: 3,
        title: 'Deploy Enterprise Guardrails & Roll Out Swarm Architecture',
        timeline: 'Months 3 – 12',
        instructions: [
          'Implement multi-agent supervisor pattern dividing tasks into research, drafting, and reviewing',
          'Deploy inline PII redactor preventing secrets or customer passwords from entering LLM prompts',
          'Provide customer enterprise admins with full replay logs of agent reasoning steps'
        ],
        keyPitfall: 'Hiding agent thought logs, preventing enterprise customers from debugging unexpected decisions.'
      }
    ],
    aiPromptPresets: [
      'How to build an enterprise multi-agent workflow with human-in-the-loop approval gates?',
      'What are the most effective techniques to prevent prompt injection in autonomous agents?',
      'How to optimize RAG vector retrieval precision using hybrid search and re-ranking?'
    ]
  },
  {
    id: 'supply_chain',
    name: 'Supply Chain & Smart Logistics',
    category: 'Logistics & Operations',
    badge: 'Mission Critical',
    iconName: 'Truck',
    tagline: 'Predictive freight routing, cold chain IoT telemetry, warehouse automation, and customs clearance.',
    description: 'Intelligent logistics operating system integrating real-time GPS fleet tracking, port congestion forecasting, temperature-sensitive cold chain monitoring, and automated freight invoice reconciliation.',
    tam: '$1.8 Trillion (Global Logistics Software & Telematics)',
    cagr: '13.2% (2025-2030)',
    maturity: 'High Growth',
    tags: ['Supply Chain', 'Logistics', 'Freight', 'Fleet', 'IoT', 'Cold Chain', 'Tracking', 'Customs'],
    roadmap: [
      {
        phase: 1,
        title: 'Real-Time Telematics & Fleet Visibility',
        timeframe: 'Weeks 1 – 10',
        goal: 'Ingest real-time GPS and ELD (Electronic Logging Device) data across vehicle fleets.',
        milestones: [
          'Integrate with Samsara / Motive telematics APIs for real-time location streaming',
          'Deploy live interactive fleet map with geofencing arrival/departure triggers',
          'Implement driver mobile app for digital Bill of Lading (e-BOL) signatures'
        ],
        deliverables: ['Live fleet dispatch map', 'Automated geofence alerts', 'Driver e-BOL digital signoff'],
        risks: 'Intermittent cellular dead zones in rural transit corridors'
      },
      {
        phase: 2,
        title: 'Dynamic Route Optimization & Fuel Efficiency',
        timeframe: 'Weeks 11 – 24',
        goal: 'Deploy algorithmic multi-stop route planner minimizing deadhead miles and fuel consumption.',
        milestones: [
          'Implement TSP (Traveling Salesperson) route optimization factoring live traffic and weather',
          'Calculate real-time ETA updates sent automatically to receiving warehouse docks',
          'Deploy driver fuel-saving coaching and idle-time analytics'
        ],
        deliverables: ['Dynamic routing engine', 'Customer ETA tracker portal', 'Fleet fuel efficiency dashboard'],
        risks: 'Driver resistance to algorithmic dispatch or perceived surveillance'
      },
      {
        phase: 3,
        title: 'Warehouse Automation & Dock Appointment Scheduling',
        timeframe: 'Months 6 – 14',
        goal: 'Eliminate detention fees through automated dock scheduling and cross-dock inventory sorting.',
        milestones: [
          'Build self-serve carrier dock scheduling portal preventing warehouse congestion',
          'Deploy barcode and RFID handheld scanning for instant pallet load verification',
          'Automate freight invoice auditing matching BOL, rate cons, and proof of delivery'
        ],
        deliverables: ['Dock scheduling engine', 'RFID pallet verification module', 'Automated freight audit service'],
        risks: 'Carrier no-shows causing unutilized warehouse labor shifts'
      },
      {
        phase: 4,
        title: 'Predictive Resilience & Port Disruption Forecasting',
        timeframe: 'Year 2+',
        goal: 'Predict global container shipping delays and autonomously reroute critical inventory buffers.',
        milestones: [
          'Integrate global maritime AIS vessel tracking and port congestion indices',
          'Deploy AI predictive model forecasting supply chain bottlenecks 14 days in advance',
          'Automate multi-modal freight bidding (rail vs. air vs. truckload) based on cost vs. urgency'
        ],
        deliverables: ['Port disruption warning system', 'Multi-modal freight bidding portal', 'Autonomous inventory buffer optimizer'],
        risks: 'Unforeseen geopolitical canal closures or extreme weather disruptions'
      }
    ],
    keyFeatures: [
      { title: 'Sub-Minute Fleet GPS Telematics', description: 'Real-time telemetry ingestion tracking truck location, speed, engine health, and driver hours of service', priority: 'Critical' },
      { title: 'AI Dynamic Multi-Stop Dispatch', description: 'Route optimization cutting empty deadhead miles by up to 24% while respecting delivery windows', priority: 'Critical' },
      { title: 'Paperless Digital e-BOL Flow', description: 'Instant photographic proof of delivery and touchless driver signoff eliminating paper loss', priority: 'High' },
      { title: 'Autonomous Freight Invoice Audit', description: 'Three-way matching between rate confirmation, bill of lading, and invoice preventing overbilling', priority: 'Strategic' }
    ],
    techStack: {
      frontend: ['Next.js 14', 'Mapbox GL / Leaflet', 'Tailwind CSS', 'PWA for Mobile'],
      backend: ['Go (High Throughput Telemetry)', 'Node.js', 'Apache Kafka / RabbitMQ'],
      aiModels: ['OR-Tools Route Optimization', 'Scikit-learn ETA Predictors', 'Computer Vision BOL OCR'],
      database: ['PostgreSQL with PostGIS', 'TimescaleDB (Sensor Streams)', 'Redis'],
      infrastructure: ['AWS IoT Core', 'Kubernetes', 'Cloudflare', 'MQTT Brokers'],
      compliance: ['FMCSA ELD Mandate', 'DOT Regulations', 'ISO 28000', 'C-TPAT Security']
    },
    growthMetrics: {
      targetMargin: '58% – 70%',
      ltvCac: '4.8x',
      paybackPeriod: '7 – 11 Months',
      netRetention: '119%',
      primaryKpis: ['On-Time In-Full (OTIF %)', 'Deadhead Miles Ratio (%)', 'Average Dock Dwell Time', 'Freight Invoice Discrepancy Rate']
    },
    worldScenario: {
      marketContext2025: 'Supply chain resilience has become a boardroom priority following global shipping disruptions and nearshoring trends. Logistics operators are shifting from "just-in-time" to "just-in-case" inventory models powered by real-time visibility.',
      tailwinds: [
        'Nearshoring expansion in North America (Mexico) and Southeast Asia boosting cross-border freight',
        'Regulatory enforcement of strict carbon emission tracking and driver safety telemetry',
        'High demand for automated freight invoice auditing to eliminate carrier overbilling'
      ],
      headwinds: [
        'Geopolitical tensions affecting global maritime trade routes (Red Sea, Panama Canal drought)',
        'Persistent shortage of qualified long-haul truck drivers and warehouse technicians',
        'Fragmented legacy carrier systems relying on faxes and manual phone calls'
      ],
      strategicRecommendations: [
        'Build mobile-first, offline-capable PWA apps for drivers that function even with zero cellular signal',
        'Incentivize carriers with fast payment terms (QuickPay within 2 days) in exchange for adopting your telematics tracking',
        'Provide shippers with verified CO2 emissions calculations on every load to satisfy corporate sustainability mandates'
      ]
    },
    stepByStepGuide: [
      {
        step: 1,
        title: 'Standardize Real-Time Telemetry & Geofences',
        timeline: 'Days 1 – 30',
        instructions: [
          'Integrate telematics webhook ingestion supporting Samsara, Geotab, and Motive ELD devices',
          'Create polygon geofences around top 50 customer warehouse and distribution hubs',
          'Configure automated SMS arrival alerts triggered when trucks enter 5-mile boundary'
        ],
        keyPitfall: 'Polling device APIs too aggressively, causing vendor rate-limiting bans.'
      },
      {
        step: 2,
        title: 'Automate Dock Scheduling & Detention Prevention',
        timeline: 'Days 31 – 90',
        instructions: [
          'Publish calendar appointment portal where carriers book 30-minute dock unload slots',
          'Track driver dwell time down to the minute to eliminate disputed detention penalty invoices',
          'Enable digital bill of lading (e-BOL) capture with photographic cargo damage verification'
        ],
        keyPitfall: 'Allowing uncoordinated walk-in trucks to block warehouse yard traffic lanes.'
      },
      {
        step: 3,
        title: 'Deploy AI Predictive Route & Freight Audit Optimization',
        timeline: 'Months 3 – 12',
        instructions: [
          'Train ETA prediction model using historical weather, traffic, and border inspection wait times',
          'Deploy OCR pipeline automatically cross-checking freight invoices against rate agreements',
          'Integrate multi-carrier bidding platform to secure spot freight capacity at optimal rates'
        ],
        keyPitfall: 'Relying solely on static Google Maps driving estimates without accounting for commercial truck weight limits.'
      }
    ],
    aiPromptPresets: [
      'How to eliminate warehouse dock detention penalties using automated scheduling software?',
      'What are the best architectures for processing 50,000 IoT GPS telematics pings per second?',
      'How to build an automated three-way freight invoice matching engine in Node.js and Python?'
    ]
  },
  {
    id: 'cleantech',
    name: 'CleanTech & Renewable Energy Grid',
    category: 'Energy & Sustainability',
    badge: 'ESG & High Growth',
    iconName: 'Leaf',
    tagline: 'Virtual power plant management, EV fleet charging optimization, carbon auditing, and smart grid trading.',
    description: 'Energy intelligence platform orchestrating distributed energy resources (DERs), commercial solar and battery storage systems, dynamic carbon accounting, and spot market energy arbitrage.',
    tam: '$680 Billion (Renewable Software & Clean Energy)',
    cagr: '24.1% (2025-2030)',
    maturity: 'Hyper Growth',
    tags: ['CleanTech', 'Energy', 'Solar', 'Battery', 'VPP', 'Carbon Accounting', 'EV Charging', 'Smart Grid'],
    roadmap: [
      {
        phase: 1,
        title: 'IoT Energy Telemetry & Asset Monitoring',
        timeframe: 'Weeks 1 – 12',
        goal: 'Connect solar inverters, commercial battery storage, and smart meters to cloud telemetry hub.',
        milestones: [
          'Deploy Modbus / SunSpec protocol bridges for Tesla, Enphase, and SolarEdge inverters',
          'Build real-time kilowatt (kW) generation and consumption time-series stream',
          'Implement automated fault detection alerts for degraded solar strings or battery cells'
        ],
        deliverables: ['Real-time energy telemetry hub', 'Inverter protocol translator', 'Asset health alert system'],
        risks: 'Hardware field gateway firmware incompatibilities and on-site Wi-Fi failures'
      },
      {
        phase: 2,
        title: 'Virtual Power Plant (VPP) & Peak Shaving',
        timeframe: 'Weeks 13 – 26',
        goal: 'Coordinate decentralized batteries to discharge during high-cost peak grid demand windows.',
        milestones: [
          'Deploy automated peak-shaving algorithm reducing commercial demand charges',
          'Integrate wholesale electricity spot price feeds (CAISO, ERCOT, PJM)',
          'Implement automated battery charging during negative pricing periods and discharge during peaks'
        ],
        deliverables: ['Virtual power plant coordinator', 'Wholesale price arbitrage engine', 'Demand charge reducer'],
        risks: 'Excessive battery degradation cycles reducing overall equipment lifespan'
      },
      {
        phase: 3,
        title: 'EV Fleet Smart Charging & Microgrid Balancing',
        timeframe: 'Months 6 – 15',
        goal: 'Manage depot electric vehicle charging without exceeding facility transformer capacity.',
        milestones: [
          'Deploy OCPP 2.0.1 compliant EV charger management software',
          'Implement dynamic load balancing across 50+ simultaneous EV charging stalls',
          'Optimize fleet charging schedules based on next-day route energy requirements'
        ],
        deliverables: ['OCPP EV charging controller', 'Dynamic electrical load balancer', 'Fleet departure readiness portal'],
        risks: 'Vehicles failing to reach required state-of-charge before morning delivery shifts'
      },
      {
        phase: 4,
        title: 'Automated Scope 1-3 Carbon Accounting & RECs',
        timeframe: 'Year 2+',
        goal: 'Deliver verifiable Greenhouse Gas (GHG) protocol carbon auditing and Renewable Energy Certificate trading.',
        milestones: [
          'Deploy automated Scope 1, 2, and 3 carbon emissions calculation from utility bills and fuel receipts',
          'Generate audit-ready CSRD and SEC climate disclosure reporting packs',
          'Build automated marketplace for minting and retiring Renewable Energy Certificates (RECs)'
        ],
        deliverables: ['GHG carbon accounting suite', 'CSRD audit-ready compliance export', 'REC trading integration'],
        risks: 'Regulatory changes to carbon offset verification methodologies'
      }
    ],
    keyFeatures: [
      { title: 'Sub-Second Inverter & Battery Telemetry', description: 'High-frequency telemetry ingestion monitoring voltage, frequency, state of charge, and temperature', priority: 'Critical' },
      { title: 'Autonomous Wholesale Grid Arbitrage', description: 'Algorithms executing battery charge/discharge cycles based on real-time locational marginal pricing', priority: 'Strategic' },
      { title: 'Dynamic Transformer Load Balancing', description: 'Ensures EV chargers dynamically throttle current to prevent blowing main facility switchgear', priority: 'Critical' },
      { title: 'Scope 1-3 GHG Carbon Audit Engine', description: 'Automated conversion factors translating utility billing data into certified carbon disclosure reports', priority: 'High' }
    ],
    techStack: {
      frontend: ['Next.js 14', 'React', 'Tailwind CSS', 'Highcharts / D3.js'],
      backend: ['Rust (High-speed Grid Control)', 'Python FastAPI', 'MQTT Brokers'],
      aiModels: ['Reinforcement Learning Energy Arbitrage', 'LSTM Solar Production Predictors'],
      database: ['TimescaleDB / InfluxDB (Sensor Data)', 'PostgreSQL', 'Redis'],
      infrastructure: ['AWS IoT Greengrass', 'Edge Docker Gateways', 'Cloudflare Zero Trust'],
      compliance: ['IEEE 1547 Grid Standards', 'OCPP 2.0.1', 'GHG Protocol', 'CSRD Framework']
    },
    growthMetrics: {
      targetMargin: '65% – 76%',
      ltvCac: '5.1x',
      paybackPeriod: '8 – 13 Months',
      netRetention: '128%',
      primaryKpis: ['Peak Demand Charge Reduction ($)', 'Battery Arbitrage Spread (ROI)', 'EV Charger Uptime (99.5%)', 'Metric Tons CO2 Offset']
    },
    worldScenario: {
      marketContext2025: 'Electrification of commercial vehicle fleets and artificial intelligence data center power consumption are straining regional electrical grids. Software that can shift loads and orchestrate on-site batteries commands premium enterprise pricing.',
      tailwinds: [
        'Massive corporate adoption of electric delivery vans requiring depot smart charging management',
        'Surging electricity demand charges penalizing facilities that spike power during peak afternoon hours',
        'European CSRD and global corporate ESG mandates requiring certified carbon disclosure reports'
      ],
      headwinds: [
        'Protracted utility interconnection queue delays to get new solar/battery sites energized',
        'Complex, fragmented electricity tariff structures across thousands of municipal utilities',
        'Supply chain lead times on heavy commercial electrical transformers exceeding 50 weeks'
      ],
      strategicRecommendations: [
        'Target commercial industrial real estate owners who have installed solar but lack software to monetize it',
        'Standardize on open protocols like OCPP and SunSpec rather than proprietary vendor hardware locks',
        'Guarantee a measurable dollar savings on facility electricity bills as your primary sales pitch'
      ]
    },
    stepByStepGuide: [
      {
        step: 1,
        title: 'Connect Facility Inverters & Smart Meters',
        timeline: 'Days 1 – 45',
        instructions: [
          'Install cellular edge gateways connecting facility Modbus RS-485 meter ports to MQTT broker',
          'Verify time-series sensor ingestion at 1-minute intervals with timestamp synchronization',
          'Create live facility energy dashboard displaying baseline solar generation vs. building load'
        ],
        keyPitfall: 'Relying on on-site guest Wi-Fi networks that frequently drop connection or change credentials.'
      },
      {
        step: 2,
        title: 'Activate Automated Peak-Shaving & Demand Management',
        timeline: 'Days 46 – 100',
        instructions: [
          'Ingest facility historical utility tariff rate structure including 15-minute demand ratchet intervals',
          'Program battery discharge triggers when total building load crosses 85% of peak threshold',
          'Calculate verified monthly dollar savings achieved on the subsequent electricity bill'
        ],
        keyPitfall: 'Discharging battery reserves prematurely before the true daily peak demand spike occurs.'
      },
      {
        step: 3,
        title: 'Scale VPP Grid Participation & Carbon Auditing',
        timeline: 'Months 4 – 12',
        instructions: [
          'Enroll aggregated battery capacity into regional grid operator demand response programs',
          'Deploy automated Scope 2 electricity carbon emissions reporting for tenant sustainability officers',
          'Expand into multi-facility portfolio management for enterprise logistics REITs'
        ],
        keyPitfall: 'Failing to maintain sufficient reserve battery capacity for on-site emergency backup needs.'
      }
    ],
    aiPromptPresets: [
      'How to structure a Virtual Power Plant (VPP) software platform connecting commercial battery systems?',
      'What are the most effective peak-shaving algorithms for commercial microgrids?',
      'How to automate Scope 1, 2, and 3 carbon accounting compliance for enterprise audits?'
    ]
  },
  {
    id: 'cybersecurity',
    name: 'CyberSecurity & Threat Intelligence',
    category: 'Information Security',
    badge: 'Enterprise Essential',
    iconName: 'ShieldAlert',
    tagline: 'Autonomous SOC investigation, zero-trust identity verification, attack surface management, and SIEM correlation.',
    description: 'Enterprise cybersecurity platform delivering automated vulnerability detection, SIEM log analysis, credential compromise defense, and AI-driven automated incident response playbooks.',
    tam: '$290 Billion (Global Cyber Security)',
    cagr: '14.5% (2025-2030)',
    maturity: 'High Growth',
    tags: ['CyberSecurity', 'Zero Trust', 'SOC', 'SIEM', 'Threat Intelligence', 'Penetration Testing', 'IAM'],
    roadmap: [
      {
        phase: 1,
        title: 'External Attack Surface & Vulnerability Scanner',
        timeframe: 'Weeks 1 – 10',
        goal: 'Discover exposed company subdomains, open ports, expired certificates, and leaked credentials.',
        milestones: [
          'Build asset discovery crawler mapping company IP blocks and DNS records',
          'Implement automated vulnerability scanning for CVEs and outdated SSL ciphers',
          'Integrate dark web breached credential feeds matching corporate email domains'
        ],
        deliverables: ['External attack surface map', 'Automated CVE scanner', 'Breached credential alert system'],
        risks: 'Accidentally triggering defensive web application firewalls during scans'
      },
      {
        phase: 2,
        title: 'SIEM Log Ingestion & Behavioral Anomaly Detection',
        timeframe: 'Weeks 11 – 24',
        goal: 'Ingest AWS CloudTrail, Okta logins, and endpoint telemetry into high-speed search index.',
        milestones: [
          'Deploy high-throughput log ingestion pipeline supporting Syslog and JSON streaming',
          'Implement UEBA (User and Entity Behavior Analytics) detecting impossible travel logins',
          'Create alert deduplication and severity scoring matrix reducing alert fatigue by 80%'
        ],
        deliverables: ['Cloud SIEM ingestion cluster', 'UEBA anomaly detection engine', 'Deduplicated alert queue'],
        risks: 'High log storage costs overwhelming cloud compute budgets'
      },
      {
        phase: 3,
        title: 'Autonomous SOC Incident Response Playbooks',
        timeframe: 'Months 6 – 14',
        goal: 'Automate containment actions: isolate infected endpoints, revoke compromised tokens, block malicious IPs.',
        milestones: [
          'Build SOAR (Security Orchestration, Automation, and Response) workflow builder',
          'Deploy 1-click or automated containment integrations with CrowdStrike, Okta, and AWS Security Groups',
          'Fine-tune AI security analyst summarizing alerts and drafting incident post-mortems'
        ],
        deliverables: ['SOAR playbook orchestrator', 'Automated containment connectors', 'AI incident summary generator'],
        risks: 'Automated containment accidentally isolating critical production database nodes'
      },
      {
        phase: 4,
        title: 'Zero Trust Continuous Posture & Compliance Automation',
        timeframe: 'Year 2+',
        goal: 'Continuous device posture verification, automated SOC-2 / ISO 27001 evidence collection.',
        milestones: [
          'Implement zero-trust continuous authentication evaluating device health and location',
          'Deploy automated cloud security posture management (CSPM) auditing AWS/Azure configurations',
          'Automate SOC-2 Type II and ISO 27001 evidence gathering and compliance auditor exports'
        ],
        deliverables: ['Zero trust policy engine', 'CSPM cloud posture auditor', 'Automated compliance export suite'],
        risks: 'User frustration with frequent re-authentication prompts'
      }
    ],
    keyFeatures: [
      { title: '80% Alert Noise Reduction', description: 'Intelligent ML clustering grouping related security alerts into a single actionable incident', priority: 'Critical' },
      { title: 'Sub-60s Automated Breach Containment', description: 'Automatic revocation of compromised session tokens and instant host network isolation', priority: 'Critical' },
      { title: 'Continuous Attack Surface Discovery', description: 'Daily reconnaissance identifying shadow IT assets, forgotton staging servers, and open S3 buckets', priority: 'High' },
      { title: 'AI SOC Analyst Assistant', description: 'Generative AI triaging raw logs, synthesizing threat actor TTPs, and drafting remediation steps', priority: 'Strategic' }
    ],
    techStack: {
      frontend: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Vis.js / Cytoscape (Graph Vis)'],
      backend: ['Go (High-Performance Ingestion)', 'Python FastAPI', 'Apache Kafka'],
      aiModels: ['Cyber Threat LLM', 'Isolation Forests', 'Graph Neural Networks'],
      database: ['ClickHouse (Billions of Logs)', 'PostgreSQL', 'Neo4j (Identity Graphs)'],
      infrastructure: ['AWS Multi-Region Dedicated VPC', 'Cloudflare Magic WAN', 'KMS Vault'],
      compliance: ['SOC-2 Type II', 'ISO 27001', 'NIST Cybersecurity Framework', 'FedRAMP Ready']
    },
    growthMetrics: {
      targetMargin: '76% – 85%',
      ltvCac: '6.4x',
      paybackPeriod: '6 – 10 Months',
      netRetention: '135%',
      primaryKpis: ['Mean Time to Detect (MTTD < 5 mins)', 'Mean Time to Remediate (MTTR < 15 mins)', 'Alert Noise Reduction Ratio', 'Monitored Endpoints']
    },
    worldScenario: {
      marketContext2025: 'With attackers utilizing generative AI to create tailored spear-phishing and polymorphic malware, traditional signature-based antiviruses are obsolete. Security teams are understaffed and urgently require automated AI SOC investigation.',
      tailwinds: [
        'Severe shortage of qualified cybersecurity analysts globally (over 3.5 million unfilled positions)',
        'Mandatory SEC 4-day cyber incident disclosure rules forcing companies to invest in instant breach detection',
        'Cyber insurance carriers requiring strict zero-trust MFA and automated EDR deployment to issue policies'
      ],
      headwinds: [
        'Crowded security vendor landscape leading to buyer fatigue and vendor consolidation pressures',
        'High compute and storage costs associated with ingesting gigabytes of raw telemetry per day',
        'Enterprise risk aversion when granting automated software permission to modify firewall rules'
      ],
      strategicRecommendations: [
        'Focus on reducing alert noise rather than generating more notifications—security analysts want fewer, higher-fidelity alerts',
        'Provide a "dry run / simulation mode" where the platform recommends actions before granting full autonomous remediation rights',
        'Integrate natively with existing tools (Slack, CrowdStrike, Okta) rather than asking clients to replace their stack'
      ]
    },
    stepByStepGuide: [
      {
        step: 1,
        title: 'Launch Non-Intrusive Attack Surface Reconnaissance',
        timeline: 'Days 1 – 30',
        instructions: [
          'Run automated DNS, certificate transparency log, and ASN searches to map target domain assets',
          'Flag critical vulnerabilities (e.g. exposed databases, default admin logins, unpatched SSL bugs)',
          'Deliver an executive-level Risk Scorecard demonstrating immediate value in under 15 minutes'
        ],
        keyPitfall: 'Performing invasive port exploitation without explicit written customer authorization.'
      },
      {
        step: 2,
        title: 'Ingest Identity & Cloud Audit Logs',
        timeline: 'Days 31 – 90',
        instructions: [
          'Connect Okta / Google Workspace / Azure AD audit logs via webhook streams',
          'Implement detection rules for impossible travel logins, credential stuffing, and session hijacking',
          'Send real-time alerts to dedicated Slack security channel with 1-click user session revocation'
        ],
        keyPitfall: 'Flooding the security team Slack channel with hundreds of low-priority informational alerts.'
      },
      {
        step: 3,
        title: 'Deploy Automated Containment Playbooks & Compliance',
        timeline: 'Months 3 – 12',
        instructions: [
          'Build automated playbooks that quarantine compromised endpoints and reset user credentials',
          'Deploy continuous cloud security posture checks to catch unencrypted S3 buckets or public databases',
          'Generate one-click audit evidence reports for SOC-2 Type II and ISO 27001 certification'
        ],
        keyPitfall: 'Hardcoding containment actions that accidentally lock out the company CEO or core production systems.'
      }
    ],
    aiPromptPresets: [
      'What are the most critical SIEM detection rules to catch compromised enterprise sessions in 2026?',
      'How to build an automated SOAR playbook that neutralizes ransomware within 60 seconds?',
      'How to reduce SOC alert fatigue by 80% using modern machine learning clustering?'
    ]
  }
];
