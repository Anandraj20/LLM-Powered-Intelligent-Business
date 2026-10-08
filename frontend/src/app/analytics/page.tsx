'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { Sidebar } from '../../components/layout/Sidebar';
import { Navbar } from '../../components/layout/Navbar';
import { hasPermission } from '../../config/permissions';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Upload,
  Database,
  RefreshCw,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Activity,
  DollarSign,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Zap,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  PieChart,
  Filter
} from 'lucide-react';

interface WeekData {
  week: number;
  year: number;
  label: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  dealCount: number;
  trend: 'up' | 'down' | 'flat';
}

interface CategoryData {
  category: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  dealCount: number;
  avgDealValue: number;
  profitMargin: number;
}

interface AnalyticsReport {
  summary: {
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    profitMargin: number;
    totalDeals: number;
    avgDealValue: number;
    isProfit: boolean;
    reportType: string;
    generatedAt: string;
    dataSource: string;
  };
  weeklyTrends: WeekData[];
  categoryBreakdown: CategoryData[];
  topPerformers: Array<{ product: string; revenue: number; deals: number; margin: number }>;
  aiDiagnosis?: {
    overallHealth: string;
    keyInsights: string[];
    recommendations: string[];
    riskFactors: string[];
    opportunities: string[];
    executiveSummary: string;
  };
}

interface Dataset {
  id: string;
  file_name: string;
  file_type: string;
  total_rows: number;
  created_at: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtNum = (n: number) => new Intl.NumberFormat('en-IN').format(n);

function MiniBarChart({ data, valueKey, labelKey, colorClass = 'bg-indigo-500', maxBars = 12 }: {
  data: any[]; valueKey: string; labelKey: string; colorClass?: string; maxBars?: number;
}) {
  const sliced = data.slice(-maxBars);
  const max = Math.max(...sliced.map((d: any) => d[valueKey]), 1);
  return (
    <div className="flex items-end gap-1 h-24 w-full">
      {sliced.map((d: any, i: number) => {
        const h = Math.max((d[valueKey] / max) * 100, 3);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className={`w-full rounded-t-sm transition-all duration-300 ${colorClass} opacity-80 hover:opacity-100`}
              style={{ height: `${h}%` }}
            />
            <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-800 border border-slate-700 text-[10px] text-white px-2 py-1 rounded z-10 whitespace-nowrap shadow-xl">
              {d[labelKey]}: {fmt(d[valueKey])}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProfitLossChart({ weeks }: { weeks: WeekData[] }) {
  const allVals = weeks.map(w => w.grossProfit);
  const max = Math.max(...allVals.map(Math.abs), 1);
  return (
    <div className="flex items-center gap-0.5 h-28 w-full relative">
      <div className="absolute inset-y-0 left-0 right-0 flex items-center pointer-events-none">
        <div className="w-full border-t border-dashed border-slate-600/60" />
      </div>
      {weeks.map((w, i) => {
        const isProfit = w.grossProfit >= 0;
        const h = Math.max((Math.abs(w.grossProfit) / max) * 46, 2);
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-center group relative h-full">
            <div className="flex flex-col justify-center h-full w-full">
              {isProfit ? (
                <div
                  className="w-full bg-emerald-500/80 hover:bg-emerald-400 rounded-t-sm transition-all mt-auto"
                  style={{ height: `${h}%` }}
                />
              ) : (
                <div
                  className="w-full bg-rose-500/80 hover:bg-rose-400 rounded-b-sm transition-all mb-auto"
                  style={{ height: `${h}%` }}
                />
              )}
            </div>
            <div className="absolute top-0 hidden group-hover:block bg-slate-800 border border-slate-700 text-[10px] text-white px-2 py-1 rounded z-10 whitespace-nowrap shadow-xl">
              {w.label}: {fmt(w.grossProfit)} ({w.profitMargin.toFixed(1)}%)
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CategoryBar({ cat, maxRev }: { cat: CategoryData; maxRev: number }) {
  const w = Math.max((cat.totalRevenue / maxRev) * 100, 2);
  const isProfit = cat.grossProfit >= 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-300 font-medium truncate max-w-[140px]">{cat.category}</span>
        <div className="flex items-center gap-3 text-right shrink-0">
          <span className="text-slate-400">{fmtNum(cat.dealCount)} deals</span>
          <span className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(cat.grossProfit)}</span>
        </div>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isProfit ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'}`}
          style={{ width: `${w}%` }}
        />
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon, trend, borderClass }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; trend?: 'up' | 'down' | 'neutral'; borderClass: string;
}) {
  const trendColors = { up: 'text-emerald-400', down: 'text-rose-400', neutral: 'text-slate-400' };
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Activity;
  const iconBgClass = borderClass.replace('border-', 'bg-').replace('/30', '/10');
  const iconTextClass = borderClass.replace('border-', 'text-').replace('/30', '');
  return (
    <div className={`bg-slate-900/90 backdrop-blur-md border ${borderClass} rounded-2xl p-5 shadow-xl relative overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgClass}`}>
          <Icon size={18} className={iconTextClass} />
        </div>
        {trend && <TrendIcon size={16} className={trendColors[trend]} />}
      </div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-extrabold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { user, activeRole, organization, tokens } = useAuth();
  const currentRole = activeRole || user?.role || 'Guest';
  const canViewAnalytics = hasPermission(currentRole, 'analytics:view');
  const canManageAnalytics = hasPermission(currentRole, 'analytics:manage');

  const [liveReport, setLiveReport] = useState<AnalyticsReport | null>(null);
  const [uploadReport, setUploadReport] = useState<AnalyticsReport | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [liveDbMeta, setLiveDbMeta] = useState<{ name: string; totalRows: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'upload'>('live');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState(false);
  const [chartMode, setChartMode] = useState<'profit' | 'revenue' | 'deals'>('profit');
  const [weekFilter, setWeekFilter] = useState<number>(12);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token =
      tokens?.accessToken ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('bm_access_token') || localStorage.getItem('accessToken')
        : null);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [tokens]);

  const fetchLiveAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const orgParam = organization?.id ? `?orgId=${organization.id}` : '';
      const res = await fetch(`/api/v1/analytics/overview${orgParam}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Server returned ${res.status}`);
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load');
      setLiveReport(json.data);
    } catch (e: any) {
      setError(e.message || 'Analytics load failed');
    } finally { setLoading(false); }
  }, [organization?.id, getAuthHeaders]);

  const fetchDatasets = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/analytics/datasets', {
        headers: getAuthHeaders()
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) {
        setDatasets(json.datasets || []);
        if (json.liveDatabase) setLiveDbMeta(json.liveDatabase);
      }
    } catch {}
  }, [getAuthHeaders]);

  useEffect(() => {
    if (canViewAnalytics) { fetchLiveAnalytics(); fetchDatasets(); }
  }, [canViewAnalytics, fetchLiveAnalytics, fetchDatasets]);

  const handleFileUpload = async (file: File) => {
    setUploading(true); setUploadError(''); setUploadReport(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/v1/analytics/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Upload failed');
      setUploadReport(json.data);
      setActiveTab('upload');
      fetchDatasets();
    } catch (e: any) { setUploadError(e.message || 'File upload error'); }
    finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const runAIDiagnosis = async (report: AnalyticsReport) => {
    setDiagnosing(true);
    try {
      const res = await fetch('/api/v1/analytics/ai-diagnosis', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ report })
      });
      const json = await res.json();
      if (json.success && json.data) {
        if (activeTab === 'live') setLiveReport(prev => prev ? { ...prev, aiDiagnosis: json.data } : prev);
        else setUploadReport(prev => prev ? { ...prev, aiDiagnosis: json.data } : prev);
      }
    } catch {}
    finally { setDiagnosing(false); }
  };

  const exportCSV = (report: AnalyticsReport) => {
    const rows = [
      ['Week', 'Year', 'Revenue (INR)', 'Cost (INR)', 'Gross Profit (INR)', 'Margin %', 'Deals'],
      ...report.weeklyTrends.map(w => [w.label, w.year, w.totalRevenue, w.totalCost, w.grossProfit, w.profitMargin.toFixed(2), w.dealCount])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `businessmind_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const activeReport = activeTab === 'live' ? liveReport : uploadReport;
  const displayWeeks = activeReport?.weeklyTrends.slice(-weekFilter) || [];
  const maxCatRev = Math.max(...(activeReport?.categoryBreakdown.map(c => c.totalRevenue) || [1]));

  return (
    <ProtectedRoute requiredPermission="analytics:view">
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="p-8 max-w-7xl mx-auto w-full space-y-8">

            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-violet-950/30 to-slate-900 border border-slate-800 p-7 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(139,92,246,0.12),_transparent_60%)] pointer-events-none" />
              <div className="z-10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-wider">
                  <BarChart3 size={14} />
                  <span>BusinessMind AI — Data Analysis Session</span>
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Financial Analytics Center</h1>
                <p className="text-slate-400 text-sm">
                  Upload datasets · Analyze P&L · Week-wise reports · AI executive diagnosis
                  {organization && <span className="ml-2 text-violet-300 font-semibold">• {organization.name}</span>}
                </p>
              </div>
              <div className="flex items-center gap-3 z-10 flex-wrap">
                {activeReport && (
                  <>
                    <button onClick={() => exportCSV(activeReport)} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-2">
                      <Download size={14} /> Export CSV
                    </button>
                    <button onClick={() => runAIDiagnosis(activeReport)} disabled={diagnosing} className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-violet-600/30 flex items-center gap-2">
                      {diagnosing ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing…</> : <><Sparkles size={14} /> AI Diagnosis</>}
                    </button>
                  </>
                )}
                <button onClick={fetchLiveAnalytics} disabled={loading} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-2">
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
            </div>

            {/* Role Banner */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/70 border border-slate-800 rounded-2xl text-xs">
              <div className={`w-2 h-2 rounded-full animate-pulse ${canManageAnalytics ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-slate-400">
                Role <strong className="text-slate-200">{currentRole}</strong>:
                {canManageAnalytics ? ' Full access — upload datasets, run AI diagnosis, export reports' : ' View-only — read dashboard reports and charts'}
              </span>
              {liveDbMeta && (
                <span className="ml-auto text-slate-500 flex items-center gap-1">
                  <Database size={12} className="text-indigo-400" /> {fmtNum(liveDbMeta.totalRows)} records in live DB
                </span>
              )}
            </div>

            {/* Tab Switcher + Week Filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 gap-1">
                {(['live', 'upload'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === tab ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}>
                    {tab === 'live' ? <Database size={13} /> : <Upload size={13} />}
                    {tab === 'live' ? 'Live Database' : 'Upload Dataset'}
                    {tab === 'upload' && uploadReport && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                  </button>
                ))}
              </div>
              {activeReport && (
                <div className="ml-auto flex items-center gap-2">
                  <Filter size={13} className="text-slate-500" />
                  <span className="text-xs text-slate-500">Show:</span>
                  {[8, 12, 24, 52].map(n => (
                    <button key={n} onClick={() => setWeekFilter(n)} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      weekFilter === n ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}>{n}W</button>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                {canManageAnalytics ? (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all ${
                      dragOver ? 'border-violet-500 bg-violet-500/10' : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                    }`}
                  >
                    <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-semibold text-violet-300">Analyzing dataset…</p>
                        <p className="text-xs text-slate-500">Parsing rows, computing P&L, generating week-wise report…</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                          <Upload size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Drop your dataset here</h3>
                        <p className="text-slate-400 text-sm mb-4">Supports <strong className="text-slate-200">CSV</strong>, <strong className="text-slate-200">Excel (.xlsx, .xls)</strong> — max 30 MB</p>
                        <p className="text-xs text-slate-500 mb-5">Required columns: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">sale_price</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">cost_price</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">date</code></p>
                        <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-violet-600/30">Browse File</button>
                      </>
                    )}
                    {uploadError && (
                      <div className="mt-4 flex items-center gap-2 text-rose-400 text-xs bg-rose-950/40 border border-rose-500/30 rounded-xl px-4 py-2">
                        <AlertCircle size={13} /> {uploadError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-5 py-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl text-amber-300 text-sm">
                    <AlertCircle size={16} /> Dataset upload requires <strong>analytics:manage</strong> permission.
                  </div>
                )}

                {datasets.length > 0 && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2"><Layers size={15} className="text-violet-400" /> Previously Uploaded Datasets</h3>
                    <div className="space-y-2">
                      {datasets.map(ds => (
                        <div key={ds.id} className="flex items-center justify-between px-4 py-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                          <div className="flex items-center gap-3">
                            <FileText size={14} className="text-indigo-400" />
                            <div>
                              <p className="text-sm text-white font-medium">{ds.file_name}</p>
                              <p className="text-[11px] text-slate-500">{fmtNum(ds.total_rows)} rows · {ds.file_type} · {new Date(ds.created_at).toLocaleDateString('en-IN')}</p>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">Indexed</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!uploadReport && !uploading && (
                  <div className="text-center text-slate-500 py-6 text-sm">Upload a dataset to see analytics, P&L charts, and week-wise reports.</div>
                )}
              </div>
            )}

            {/* Error */}
            {error && activeTab === 'live' && (
              <div className="flex items-center gap-3 px-5 py-4 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-rose-300 text-sm">
                <AlertCircle size={16} /> {error}
                <button onClick={fetchLiveAnalytics} className="ml-auto text-rose-400 hover:text-white transition"><RefreshCw size={14} /></button>
              </div>
            )}

            {/* Loading */}
            {loading && activeTab === 'live' && (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Loading live financial analytics…</p>
              </div>
            )}

            {/* Analytics Dashboard */}
            {activeReport && (
              <div className="space-y-8">

                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard label="Total Revenue" value={fmt(activeReport.summary.totalRevenue)} sub={`${fmtNum(activeReport.summary.totalDeals)} total deals`} icon={DollarSign} trend="up" borderClass="border-emerald-500/30" />
                  <KpiCard label={activeReport.summary.isProfit ? 'Gross Profit' : 'Gross Loss'} value={fmt(activeReport.summary.grossProfit)} sub={`${activeReport.summary.profitMargin.toFixed(1)}% margin`} icon={activeReport.summary.isProfit ? TrendingUp : TrendingDown} trend={activeReport.summary.isProfit ? 'up' : 'down'} borderClass={activeReport.summary.isProfit ? 'border-emerald-500/30' : 'border-rose-500/30'} />
                  <KpiCard label="Total Cost" value={fmt(activeReport.summary.totalCost)} sub="All operational costs" icon={Target} trend="neutral" borderClass="border-amber-500/30" />
                  <KpiCard label="Avg Deal Value" value={fmt(activeReport.summary.avgDealValue)} sub={`${activeReport.weeklyTrends.length} weeks tracked`} icon={BarChart3} trend="up" borderClass="border-indigo-500/30" />
                </div>

                {/* P&L Banner */}
                <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border ${
                  activeReport.summary.isProfit ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-rose-950/30 border-rose-500/30'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activeReport.summary.isProfit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {activeReport.summary.isProfit ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${activeReport.summary.isProfit ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {activeReport.summary.isProfit ? '✓ Business in Profit' : '⚠ Business in Loss'}
                    </p>
                    <p className="text-xs text-slate-400">
                      Net {activeReport.summary.isProfit ? 'profit' : 'loss'} of <strong>{fmt(Math.abs(activeReport.summary.grossProfit))}</strong> ({Math.abs(activeReport.summary.profitMargin).toFixed(1)}% margin) · {activeReport.summary.dataSource}
                    </p>
                  </div>
                  <div className="ml-auto text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={11} /> {new Date(activeReport.summary.generatedAt).toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* P&L Trend */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-white text-sm">Weekly Profit / Loss</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Green = profit, Red = loss · Last {weekFilter} weeks</p>
                      </div>
                      <div className="flex gap-1">
                        {(['profit', 'revenue', 'deals'] as const).map(m => (
                          <button key={m} onClick={() => setChartMode(m)} className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                            chartMode === m ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}>{m.charAt(0).toUpperCase() + m.slice(1)}</button>
                        ))}
                      </div>
                    </div>
                    {chartMode === 'profit' && <ProfitLossChart weeks={displayWeeks} />}
                    {chartMode === 'revenue' && <MiniBarChart data={displayWeeks} valueKey="totalRevenue" labelKey="label" colorClass="bg-indigo-500" />}
                    {chartMode === 'deals' && <MiniBarChart data={displayWeeks} valueKey="dealCount" labelKey="label" colorClass="bg-amber-500" />}
                    <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Profit</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Loss</span>
                      <span className="ml-auto">{displayWeeks.length} data points</span>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-white text-sm">Category Breakdown</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Revenue & P&L by product category</p>
                      </div>
                      <PieChart size={16} className="text-slate-600" />
                    </div>
                    <div className="space-y-3">
                      {activeReport.categoryBreakdown.slice(0, 8).map(cat => (
                        <CategoryBar key={cat.category} cat={cat} maxRev={maxCatRev} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Week-wise Report Table */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-sm flex items-center gap-2"><Calendar size={14} className="text-violet-400" /> Week-wise Financial Report</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Showing {displayWeeks.length} of {activeReport.weeklyTrends.length} weeks</p>
                    </div>
                    <button onClick={() => setExpandedWeeks(!expandedWeeks)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition">
                      {expandedWeeks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {expandedWeeks ? 'Collapse' : 'Show All'}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Week</th>
                          <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">Revenue</th>
                          <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">Cost</th>
                          <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">Gross P&L</th>
                          <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">Margin</th>
                          <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">Deals</th>
                          <th className="px-4 py-3 text-center font-semibold uppercase tracking-wider">Trend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(expandedWeeks ? activeReport.weeklyTrends : displayWeeks).map((w, i) => {
                          const isProfit = w.grossProfit >= 0;
                          return (
                            <tr key={i} className="hover:bg-slate-800/30 transition">
                              <td className="px-6 py-3 text-slate-300 font-medium">{w.label}</td>
                              <td className="px-4 py-3 text-right text-slate-200">{fmt(w.totalRevenue)}</td>
                              <td className="px-4 py-3 text-right text-slate-400">{fmt(w.totalCost)}</td>
                              <td className={`px-4 py-3 text-right font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>{isProfit ? '+' : ''}{fmt(w.grossProfit)}</td>
                              <td className={`px-4 py-3 text-right font-semibold ${isProfit ? 'text-emerald-300' : 'text-rose-300'}`}>{w.profitMargin.toFixed(1)}%</td>
                              <td className="px-4 py-3 text-right text-slate-400">{fmtNum(w.dealCount)}</td>
                              <td className="px-4 py-3 text-center">
                                {w.trend === 'up' ? <ArrowUpRight size={14} className="inline text-emerald-400" />
                                  : w.trend === 'down' ? <ArrowDownRight size={14} className="inline text-rose-400" />
                                  : <Activity size={14} className="inline text-slate-500" />}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Performers */}
                {activeReport.topPerformers?.length > 0 && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
                    <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2"><Zap size={14} className="text-amber-400" /> Top Performing Products</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeReport.topPerformers.slice(0, 6).map((p, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold ${
                            i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-orange-700/20 text-orange-400' : 'bg-slate-700/60 text-slate-400'
                          }`}>#{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-semibold truncate">{p.product}</p>
                            <p className="text-[11px] text-slate-500">{fmtNum(p.deals)} deals · {p.margin.toFixed(1)}% margin</p>
                          </div>
                          <p className="text-xs font-bold text-emerald-400 shrink-0">{fmt(p.revenue)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Diagnosis */}
                {activeReport.aiDiagnosis ? (
                  <div className="bg-gradient-to-br from-violet-950/40 via-slate-900 to-indigo-950/30 border border-violet-500/30 rounded-3xl p-7 shadow-2xl space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-white text-base">AI Executive Diagnosis</h3>
                        <p className="text-[11px] text-violet-400">BusinessMind AI · multi-tier engine</p>
                      </div>
                      <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold border ${
                        activeReport.aiDiagnosis.overallHealth === 'excellent' ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
                        : activeReport.aiDiagnosis.overallHealth === 'good' ? 'bg-blue-950/50 text-blue-300 border-blue-500/40'
                        : activeReport.aiDiagnosis.overallHealth === 'fair' ? 'bg-amber-950/50 text-amber-300 border-amber-500/40'
                        : 'bg-rose-950/50 text-rose-300 border-rose-500/40'
                      }`}>{(activeReport.aiDiagnosis.overallHealth || 'unknown').toUpperCase()}</span>
                    </div>
                    {activeReport.aiDiagnosis.executiveSummary && (
                      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300 leading-relaxed">{activeReport.aiDiagnosis.executiveSummary}</div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeReport.aiDiagnosis.keyInsights?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5"><Info size={12} /> Key Insights</p>
                          <ul className="space-y-1.5">{activeReport.aiDiagnosis.keyInsights.map((ins, i) => <li key={i} className="flex items-start gap-2 text-xs text-slate-300"><CheckCircle2 size={11} className="text-blue-400 mt-0.5 shrink-0" />{ins}</li>)}</ul>
                        </div>
                      )}
                      {activeReport.aiDiagnosis.recommendations?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5"><Zap size={12} /> Recommendations</p>
                          <ul className="space-y-1.5">{activeReport.aiDiagnosis.recommendations.map((rec, i) => <li key={i} className="flex items-start gap-2 text-xs text-slate-300"><ArrowUpRight size={11} className="text-emerald-400 mt-0.5 shrink-0" />{rec}</li>)}</ul>
                        </div>
                      )}
                      {activeReport.aiDiagnosis.riskFactors?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5"><AlertCircle size={12} /> Risk Factors</p>
                          <ul className="space-y-1.5">{activeReport.aiDiagnosis.riskFactors.map((r, i) => <li key={i} className="flex items-start gap-2 text-xs text-slate-300"><X size={11} className="text-rose-400 mt-0.5 shrink-0" />{r}</li>)}</ul>
                        </div>
                      )}
                      {activeReport.aiDiagnosis.opportunities?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5"><Target size={12} /> Opportunities</p>
                          <ul className="space-y-1.5">{activeReport.aiDiagnosis.opportunities.map((o, i) => <li key={i} className="flex items-start gap-2 text-xs text-slate-300"><TrendingUp size={11} className="text-amber-400 mt-0.5 shrink-0" />{o}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-violet-950/20 border border-violet-500/20 rounded-2xl px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Sparkles size={16} className="text-violet-400" />
                      <div>
                        <p className="text-sm font-semibold text-white">Run AI Executive Diagnosis</p>
                        <p className="text-xs text-slate-400">Get strategic insights, risks, and recommendations from BusinessMind AI</p>
                      </div>
                    </div>
                    <button onClick={() => runAIDiagnosis(activeReport)} disabled={diagnosing} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-violet-600/30 flex items-center gap-2">
                      {diagnosing ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={13} />}
                      {diagnosing ? 'Analyzing…' : 'Diagnose Now'}
                    </button>
                  </div>
                )}

              </div>
            )}

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

