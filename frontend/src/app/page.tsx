'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Database, 
  LayoutDashboard, 
  Search, 
  Bot, 
  Zap, 
  BarChart3, 
  Layers, 
  Globe2, 
  TrendingUp, 
  CheckCircle2, 
  Crown, 
  Shield, 
  Briefcase, 
  Calculator, 
  UserCircle2, 
  ArrowUpRight, 
  Filter, 
  X, 
  ChevronRight,
  Cpu,
  Lock,
  Boxes,
  FileSpreadsheet,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { BUSINESS_DOMAINS, BusinessDomain } from '../data/businessDomains';
import RoadmapViewer from '../components/roadmap/RoadmapViewer';
import AiScenarioAnalysisModal from '../components/roadmap/AiScenarioAnalysisModal';
import DomainAIInsight from '../components/domain/DomainAIInsight';

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-indigo-500/40 text-indigo-200 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

const CATEGORY_FILTERS = [
  'All Fields',
  'Retail & Consumer',
  'Enterprise Software',
  'Financial Services',
  'Healthcare & Life Sciences',
  'Artificial Intelligence & Automation',
  'Logistics & Operations',
  'Energy & Sustainability',
  'Information Security'
];

export default function Home() {
  const { login, loginWithGoogleMock, user } = useAuth();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Fields');
  const [selectedDomainId, setSelectedDomainId] = useState<string>(BUSINESS_DOMAINS[0].id);

  // OpenAI Scenario Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [modalInitialPrompt, setModalInitialPrompt] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<string | null>(null);

  // Filtered Domains List
  const filteredDomains = useMemo(() => {
    return BUSINESS_DOMAINS.filter((d) => {
      const matchesCategory =
        selectedCategory === 'All Fields' || d.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesSearch =
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        d.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  // Currently Selected Domain Object
  const currentDomain: BusinessDomain = useMemo(() => {
    return (
      BUSINESS_DOMAINS.find((d) => d.id === selectedDomainId) ||
      BUSINESS_DOMAINS[0]
    );
  }, [selectedDomainId]);

  // Handler to open OpenAI Modal with optional custom prompt
  const handleOpenAiAnalysis = (prompt?: string) => {
    setModalInitialPrompt(prompt || '');
    setIsAiModalOpen(true);
  };

  // Quick 1-Click Role Login handler
  const handleQuickRoleLogin = async (
    roleEmail: string,
    roleName: string,
    role: UserRole
  ) => {
    setLoginLoading(role);
    try {
      await login(roleEmail, 'Password123!');
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      // Fallback mock session
      await loginWithGoogleMock(roleEmail, roleName, role);
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    } finally {
      setLoginLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[1600px] left-0 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP STICKY NAVBAR */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Platform Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  BusinessMind
                </span>
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent font-extrabold text-lg sm:text-xl">
                  AI
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                  Enterprise 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Intelligent Business Architecture & Strategy Suite
              </p>
            </div>
          </Link>

          {/* Quick Jump Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#roadmap-explorer" className="hover:text-indigo-400 transition">
              Domain Explorer
            </a>
            <a href="#roadmap-explorer" className="hover:text-indigo-400 transition">
              Roadmap Engine
            </a>
            <button
              onClick={() => handleOpenAiAnalysis()}
              className="hover:text-indigo-400 transition flex items-center gap-1 text-xs"
            >
              <Bot size={13} className="text-indigo-400" />
              <span>OpenAI Analysis</span>
            </button>
            <a href="#role-presets" className="hover:text-indigo-400 transition">
              Role Presets
            </a>
            <a href="#platform-features" className="hover:text-indigo-400 transition">
              Capabilities
            </a>
          </nav>

          {/* Action CTAs: Login & Dashboard */}
          <div className="flex items-center gap-3">
            {/* Live System Status Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>OpenAI & BI Live</span>
            </div>

            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
            >
              Sign In
            </Link>

            <Link
              href="/dashboard"
              className="px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 transition flex items-center gap-1.5"
            >
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
              <ArrowRight size={14} className="hidden sm:inline" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        {/* Release / Status Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-indigo-300 shadow-xl">
          <Sparkles size={14} className="text-indigo-400" />
          <span>Autonomous Business Architecture & Strategic Intelligence</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span className="text-slate-400">2025/2026 Macro Alignment</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-snug max-w-5xl mx-auto">
          Explore Any Business Domain & Build Your{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Autonomous Roadmap
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-300 text-sm sm:text-base lg:text-lg max-w-3xl mx-auto leading-relaxed">
          Search across 10+ industry domains to uncover chronological 4-phase execution blueprints, modern tech stack architectures, sustainable unit economics, and connect directly to OpenAI for real-time macro scenario analysis.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <a
            href="#roadmap-explorer"
            className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl text-sm transition shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <Search size={16} />
            <span>Explore Business Roadmaps</span>
            <ArrowRight size={16} />
          </a>

          <button
            onClick={() => handleOpenAiAnalysis()}
            className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 hover:border-slate-700 font-bold rounded-2xl text-sm transition flex items-center justify-center gap-2"
          >
            <Bot size={17} className="text-indigo-400" />
            <span>Launch OpenAI Scenario Analyzer</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-7 py-3.5 bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 font-semibold rounded-2xl text-sm transition flex items-center justify-center gap-2"
          >
            <LayoutDashboard size={16} />
            <span>Live Dashboard</span>
          </Link>
        </div>

        {/* Live Metric Stats Bar */}
        <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4">
            <div className="text-2xl font-black text-white">10+ Verticals</div>
            <div className="text-xs text-slate-400 mt-0.5">Curated Industry Blueprints</div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4">
            <div className="text-2xl font-black text-emerald-400">4 Phases</div>
            <div className="text-xs text-slate-400 mt-0.5">Inception to Global Scale</div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4">
            <div className="text-2xl font-black text-indigo-400">gpt-4o-mini</div>
            <div className="text-xs text-slate-400 mt-0.5">Live Scenario Intelligence</div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4">
            <div className="text-2xl font-black text-purple-400">6 Roles</div>
            <div className="text-xs text-slate-400 mt-0.5">Instant RBAC Preset Access</div>
          </div>
        </div>
      </section>

      {/* CORE SECTION: INTERACTIVE DOMAIN & ROADMAP EXPLORER */}
      <section id="roadmap-explorer" className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <CompassIcon size={14} />
            <span>Interactive Business Intelligence Navigator</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Search Business Field & Reveal Full Strategic Roadmap
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto">
            Select an industry below or search by keywords to explore 4-phase execution milestones, tech stacks, growth KPIs, real-world headwinds, and step-by-step instructions.
          </p>
        </div>

        {/* SEARCH AND FILTER BAR */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Search Input Box */}
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search business domain, category, or field (e.g. FinTech, SaaS, CleanTech, E-Commerce, Supply Chain)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-10 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Quick Result Counter */}
            <div className="text-xs text-slate-400 font-medium whitespace-nowrap hidden sm:block">
              Showing <span className="text-indigo-400 font-bold">{filteredDomains.length}</span> of {BUSINESS_DOMAINS.length} Domains
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0 mr-1">
              <Filter size={12} /> Filter:
            </span>
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quick Domain Selector Grid / Pills */}
          <div className="pt-3 border-t border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 mb-2">Available Domains & Fields:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {filteredDomains.map((domain) => {
                const isSelected = domain.id === currentDomain.id;
                return (
                  <button
                    key={domain.id}
                    onClick={() => setSelectedDomainId(domain.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2 group ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/20'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-400 transition-colors truncate">
                          {highlightMatch(domain.category, searchQuery)}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                        )}
                      </div>
                      <h4 className={`text-xs font-bold leading-snug ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                        {highlightMatch(domain.name, searchQuery)}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/50">
                      <span>{domain.growthMetrics.targetMargin}</span>
                      <span className="text-emerald-400 font-semibold">{domain.cagr}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredDomains.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-xs">
                No matching business domains found for "{searchQuery}". Try searching for SaaS, FinTech, Retail, or Health.
              </div>
            )}
          </div>
        </div>

        {/* OPENAI-POWERED REAL-TIME DOMAIN FUTURE SCOPE & INSIGHTS */}
        <DomainAIInsight domain={currentDomain.name} />

        {/* DYNAMIC ROADMAP VIEWER COMPONENT */}
        <RoadmapViewer
          domain={currentDomain}
          onOpenAiAnalysis={handleOpenAiAnalysis}
        />
      </section>

      {/* QUICK ROLE ACCESS PRESETS (1-CLICK LOGIN DIRECTLY TO DASHBOARD) */}
      <section id="role-presets" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Lock size={14} />
            <span>Instant Role-Based Access Engine</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            One-Click Enterprise Role Presets
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto">
            Experience role-based data permissions, analytical dashboards, and onboarding workflows instantly with pre-seeded demo accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Owner Preset */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 hover:border-purple-500/40 transition shadow-xl flex flex-col justify-between gap-4 group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Crown size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Full Authority
                </span>
              </div>
              <div>
                <h3 className="font-bold text-white text-base group-hover:text-purple-300 transition">Owner Role</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Executive analytics, full tenant administrative control, multi-dataset management, and AI financial queries.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">owner@businessmind.ai</div>
            </div>
            <button
              onClick={() => handleQuickRoleLogin('owner@businessmind.ai', 'Elena Rostova (Owner)', 'Owner')}
              disabled={loginLoading !== null}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loginLoading === 'Owner' ? 'Authenticating...' : 'Launch as Owner'}
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Admin Preset */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/40 transition shadow-xl flex flex-col justify-between gap-4 group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Shield size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  System Guard
                </span>
              </div>
              <div>
                <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition">Admin Role</h3>
                <p className="text-slate-400 text-xs mt-1">
                  User lifecycle management, system telemetry, audit trail logging, and enterprise security configuration.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">admin@businessmind.ai</div>
            </div>
            <button
              onClick={() => handleQuickRoleLogin('admin@businessmind.ai', 'Marcus Vance (Admin)', 'Admin')}
              disabled={loginLoading !== null}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loginLoading === 'Admin' ? 'Authenticating...' : 'Launch as Admin'}
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Manager Preset */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 hover:border-blue-500/40 transition shadow-xl flex flex-col justify-between gap-4 group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <BarChart3 size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Operations
                </span>
              </div>
              <div>
                <h3 className="font-bold text-white text-base group-hover:text-blue-300 transition">Manager Role</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Team sales pipeline oversight, operational reports, CSV/Excel onboarding validation, and metric tracking.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">manager@businessmind.ai</div>
            </div>
            <button
              onClick={() => handleQuickRoleLogin('manager@businessmind.ai', 'Sarah Jenkins (Manager)', 'Manager')}
              disabled={loginLoading !== null}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loginLoading === 'Manager' ? 'Authenticating...' : 'Launch as Manager'}
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Sales Person Preset */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 hover:border-amber-500/40 transition shadow-xl flex flex-col justify-between gap-4 group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Briefcase size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Revenue
                </span>
              </div>
              <div>
                <h3 className="font-bold text-white text-base group-hover:text-amber-300 transition">Sales Role</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Lead tracking, deal velocity forecasting, customer interaction logs, and pipeline revenue projections.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">sales@businessmind.ai</div>
            </div>
            <button
              onClick={() => handleQuickRoleLogin('sales@businessmind.ai', 'David Miller (Sales)', 'Sales Person')}
              disabled={loginLoading !== null}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loginLoading === 'Sales Person' ? 'Authenticating...' : 'Launch as Sales'}
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Accountant Preset */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/40 transition shadow-xl flex flex-col justify-between gap-4 group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Calculator size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Fiscal
                </span>
              </div>
              <div>
                <h3 className="font-bold text-white text-base group-hover:text-emerald-300 transition">Accountant Role</h3>
                <p className="text-slate-400 text-xs mt-1">
                  General ledger verification, accounts payable/receivable reconciliation, tax export packs, and margin analysis.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">accountant@businessmind.ai</div>
            </div>
            <button
              onClick={() => handleQuickRoleLogin('accountant@businessmind.ai', 'Priya Sharma (Accountant)', 'Accountant')}
              disabled={loginLoading !== null}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loginLoading === 'Accountant' ? 'Authenticating...' : 'Launch as Accountant'}
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Employee Preset */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 hover:border-cyan-500/40 transition shadow-xl flex flex-col justify-between gap-4 group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <UserCircle2 size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Contributor
                </span>
              </div>
              <div>
                <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition">Employee Role</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Standard workspace operations, assigned tasks, personal profile settings, and sanitized general reports.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">employee@businessmind.ai</div>
            </div>
            <button
              onClick={() => handleQuickRoleLogin('employee@businessmind.ai', 'Alex Rivera (Employee)', 'Employee')}
              disabled={loginLoading !== null}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loginLoading === 'Employee' ? 'Authenticating...' : 'Launch as Employee'}
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
          >
            <span>Prefer to sign in with personal credentials or Google OAuth?</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* CORE PLATFORM CAPABILITIES & ARCHITECTURE */}
      <section id="platform-features" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Zap size={14} />
            <span>Architecture & Functional Requirements</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Enterprise Engine Capabilities
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto">
            Built on production-grade microservices with zero-trust token auth, multi-format schema parsers, and vector AI search.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-white text-base">FR1 RBAC & Session Security</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              6 distinct roles with JWT silent token renewal, double-submit CSRF cookie mitigation, rate limiting, and all-device logout invalidation.
            </p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Database size={20} />
            </div>
            <h3 className="font-bold text-white text-base">FR2 Dual Data Onboarding</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Multi-file upload parsing (CSV & Excel spreadsheets) or direct ERP/POS REST API synchronization with automated row-level error reporting.
            </p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles size={20} />
            </div>
            <h3 className="font-bold text-white text-base">OpenAI & Vector Intelligence</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Integrated OpenAI completions and FAISS dense vector search delivering natural language answers across enterprise data silos.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
            BM
          </div>
          <span className="text-slate-300 font-semibold">BusinessMind AI Platform</span>
          <span>© 2026 Enterprise Intelligence Suite. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login" className="hover:text-slate-300 transition">
            Sign In
          </Link>
          <Link href="/dashboard" className="hover:text-slate-300 transition">
            Dashboard
          </Link>
          <a href="#roadmap-explorer" className="hover:text-slate-300 transition">
            Roadmap Explorer
          </a>
          <button
            onClick={() => handleOpenAiAnalysis()}
            className="hover:text-slate-300 transition"
          >
            AI Scenarios
          </button>
        </div>
      </footer>

      {/* OPENAI SCENARIO ANALYSIS MODAL */}
      <AiScenarioAnalysisModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        domainName={currentDomain.name}
        initialPrompt={modalInitialPrompt}
      />
    </main>
  );
}

// Compass Icon Component Helper
function CompassIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
