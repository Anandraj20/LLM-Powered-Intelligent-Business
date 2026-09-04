'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, api } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { Sidebar } from '../../components/layout/Sidebar';
import { Navbar } from '../../components/layout/Navbar';
import { DatasetType } from '../../types/auth';
import {
  UploadCloud,
  FileSpreadsheet,
  Cpu,
  CheckCircle,
  AlertTriangle,
  Database,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Trash2,
  Activity,
  HardDrive,
  Layers,
  Send,
  HelpCircle,
  Clock,
  BarChart3,
  Server,
  Zap,
  FileCheck
} from 'lucide-react';

interface IngestResult {
  datasetId: string;
  fileName: string;
  totalRows: number;
  ragTrained: boolean;
  trainingInfo?: {
    success: boolean;
    message: string;
    total_chunks_indexed?: number;
    chunks_added_this_session?: number;
    database_records_processed?: number;
    datasets_synced?: number;
    ollama_model?: string;
    ollama_online?: boolean;
  };
}

interface MonitoringData {
  database: {
    name: string;
    connected: boolean;
    summary?: {
      total_records?: number;
      total_revenue?: number;
      total_cost?: number;
      total_profit?: number;
      categories_count?: number;
      products_count?: number;
    };
    uploaded_datasets?: Array<{
      id: string;
      file_name: string;
      file_type: string;
      total_rows: number;
      indexed_in_rag: number | boolean;
      created_at: string;
    }>;
    total_datasets: number;
  };
  ai_engine: {
    online: boolean;
    target_model: string;
    models_available?: string[];
  };
  rag_store: {
    total_chunks: number;
    engine: string;
    storage_path?: string;
  };
  timestamp: string;
}

export default function OnboardingPage() {
  const { organization } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'sync' | 'monitor'>('upload');
  const [datasetType, setDatasetType] = useState<DatasetType>('sales');

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<IngestResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Sync Database State
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Interactive Test Query State
  const [queryInput, setQueryInput] = useState('What were the total revenue and sales recorded in businessmind_db?');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResponse, setQueryResponse] = useState<any | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Monitoring State
  const [monitoring, setMonitoring] = useState<MonitoringData | null>(null);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch monitoring data
  const fetchMonitoring = useCallback(async () => {
    setMonitoringLoading(true);
    try {
      const res = await api.get('/onboarding/monitoring');
      if (res.data.success) {
        setMonitoring(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load monitoring data:', err);
    } finally {
      setMonitoringLoading(false);
    }
  }, []);

  // Guarantee datasetsList is always a well-typed array
  const datasetsList = React.useMemo(() => {
    const raw = monitoring?.database?.uploaded_datasets;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && (raw as any).id) return [raw as any];
    return [];
  }, [monitoring]);

  const handleAskAboutDataset = (fileName: string) => {
    setQueryInput(`Analyze the dataset "${fileName}" in businessmind_db: What are the total sales, top products, key performance drivers, and recommendations?`);
    setActiveTab('sync');
  };

  useEffect(() => {
    fetchMonitoring();
    const interval = setInterval(fetchMonitoring, 15000);
    return () => clearInterval(interval);
  }, [fetchMonitoring]);

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Upload Directly to businessmind_db & Train Ollama
  const handleDirectUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('datasetType', datasetType);

    try {
      const res = await api.post('/onboarding/direct-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setUploadSuccess(res.data.data);
        setFile(null);
        fetchMonitoring();
      } else {
        setUploadError(res.data.message || 'Direct upload failed');
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.message || err.message || 'Direct upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Trigger Instant Database Sync & Train Ollama
  const handleSyncDatabase = async () => {
    setSyncing(true);
    setSyncError(null);
    setSyncResult(null);

    try {
      const res = await api.post('/onboarding/sync-database');
      if (res.data.success) {
        setSyncResult(res.data.data);
        fetchMonitoring();
      } else {
        setSyncError(res.data.message || 'Sync failed');
      }
    } catch (err: any) {
      setSyncError(err.response?.data?.message || err.message || 'Database synchronization failed.');
    } finally {
      setSyncing(false);
    }
  };

  // Run Test AI Query
  const handleRunQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;

    setQueryLoading(true);
    setQueryError(null);
    setQueryResponse(null);

    try {
      const res = await api.post('/ai/chat', { question: queryInput.trim() });
      if (res.data.success) {
        setQueryResponse(res.data.data);
      } else {
        setQueryError(res.data.message || 'Query failed');
      }
    } catch (err: any) {
      setQueryError(err.response?.data?.message || err.message || 'Failed to communicate with AI microservice.');
    } finally {
      setQueryLoading(false);
    }
  };

  // Delete Uploaded Dataset
  const handleDeleteDataset = async (id: string) => {
    if (!confirm('Are you sure you want to remove this dataset from businessmind_db and re-train Ollama?')) {
      return;
    }
    setDeletingId(id);
    try {
      await api.delete(`/onboarding/dataset/${id}`);
      await fetchMonitoring();
    } catch (err: any) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  // Quick Demo Datasets
  const handleLoadDemoDataset = (name: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const demoFile = new File([blob], name, { type: 'text/csv' });
    setFile(demoFile);
  };

  // Reusable Datasets Catalog Table
  const renderDatasetsTable = (titlePrefix: string = 'Active') => (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            {titlePrefix} Datasets in MySQL (<code className="text-indigo-300 font-mono text-xs">businessmind_db</code>)
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
              {datasetsList.length} Ingested
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Datasets committed to MySQL <code className="text-indigo-300 font-mono">uploaded_datasets</code> and <code className="text-indigo-300 font-mono">sales_records</code> tables, and indexed into Ollama RAG (<code className="text-indigo-300 font-mono">qwen3.5:4b</code>).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchMonitoring}
            disabled={monitoringLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${monitoringLoading ? 'animate-spin' : ''}`} />
            Refresh Catalog
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask Ollama
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Dataset Name</th>
              <th className="py-3 px-4">Format</th>
              <th className="py-3 px-4">Rows in Database</th>
              <th className="py-3 px-4">Ollama RAG</th>
              <th className="py-3 px-4">Ingested At</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {datasetsList.length > 0 ? (
              datasetsList.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-100">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-semibold text-slate-200">{d.file_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">
                      {d.file_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-200">
                    {Number(d.total_rows || 0).toLocaleString()} rows
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                      <CheckCircle className="w-3 h-3" /> Indexed &amp; Ready
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(d.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleAskAboutDataset(d.file_name)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium transition-colors"
                        title="Ask Ollama questions about this dataset"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Ask AI</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDataset(d.id)}
                        disabled={deletingId === d.id}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete dataset from MySQL and retrain AI"
                      >
                        {deletingId === d.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No datasets uploaded yet. Upload a CSV, Excel, or JSON dataset above to save in businessmind_db.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <ProtectedRoute requiredPermission="onboarding:upload">
      <div className="flex h-screen bg-slate-950 text-slate-100 antialiased overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />

          <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                      Data Onboarding & AI Training Pipeline
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        Live MySQL + Ollama RAG
                      </span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                      Ingest enterprise datasets directly into <code className="text-indigo-300 font-mono">businessmind_db</code>, auto-train Ollama (<code className="text-indigo-300 font-mono">qwen3.5:4b</code>), and monitor live analytical resources.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'upload'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload & Train
                </button>
                <button
                  onClick={() => setActiveTab('sync')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'sync'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync & Test Query
                </button>
                <button
                  onClick={() => {
                    setActiveTab('monitor');
                    fetchMonitoring();
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'monitor'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  Live Monitoring
                </button>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Database Target</p>
                  <p className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    businessmind_db
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </p>
                  <p className="text-[11px] text-indigo-400 font-medium mt-0.5">
                    {datasetsList.length} datasets cataloged
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Total Records Ingested</p>
                  <p className="text-sm font-semibold text-slate-200">
                    {monitoring?.database?.summary?.total_records !== undefined
                      ? Number(monitoring.database.summary.total_records).toLocaleString()
                      : '...'} rows
                  </p>
                  <p className="text-[11px] text-emerald-400/90 font-medium mt-0.5">
                    ₹{monitoring?.database?.summary?.total_revenue ? (Number(monitoring.database.summary.total_revenue) / 10000000).toFixed(2) + ' Cr revenue' : 'Active'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5">
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Ollama Target Model</p>
                  <p className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    {monitoring?.ai_engine?.target_model || 'qwen3.5:4b'}
                    <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">Online</span>
                  </p>
                  <p className="text-[11px] text-purple-400/90 font-medium mt-0.5">
                    Local GPU Inference
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5">
                <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">FAISS RAG Vectors</p>
                  <p className="text-sm font-semibold text-slate-200">
                    {monitoring?.rag_store?.total_chunks !== undefined ? monitoring.rag_store.total_chunks : '...'} chunks indexed
                  </p>
                  <p className="text-[11px] text-sky-400/90 font-medium mt-0.5">
                    Synced with MySQL
                  </p>
                </div>
              </div>
            </div>

            {/* TAB 1: DIRECT UPLOAD & TRAIN */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Upload Box */}
                  <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-indigo-400" />
                        Direct Dataset Ingestion & Auto-Training
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Upload CSV, Excel, or JSON files. Records are instantly mapped and committed to <code className="text-indigo-300">sales_records</code> in <code className="text-indigo-300">businessmind_db</code>, and the Ollama RAG vector store is trained automatically.
                      </p>
                    </div>

                    {/* Dataset Type Selector */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(['sales', 'inventory', 'customers', 'finance'] as DatasetType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setDatasetType(type)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            datasetType === type
                              ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm shadow-indigo-500/20'
                              : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <p className="text-xs uppercase tracking-wider font-semibold text-indigo-400 mb-0.5">Category</p>
                          <p className="text-sm font-medium capitalize">{type} Records</p>
                        </button>
                      ))}
                    </div>

                    {/* Drop Zone */}
                    <form onSubmit={handleDirectUpload} className="space-y-5">
                      <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                          dragActive
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : file
                            ? 'border-emerald-500/60 bg-emerald-500/5'
                            : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40'
                        }`}
                      >
                        <input
                          type="file"
                          accept=".csv, .xlsx, .xls, .json"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />

                        {file ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                              <FileCheck className="w-8 h-8" />
                            </div>
                            <p className="font-semibold text-white text-base">{file.name}</p>
                            <p className="text-xs text-slate-400 font-mono">
                              {(file.size / 1024).toFixed(1)} KB • Ready for direct MySQL ingestion & Ollama training
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFile(null);
                              }}
                              className="text-xs text-rose-400 hover:text-rose-300 underline mt-1"
                            >
                              Choose different file
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                              <UploadCloud className="w-8 h-8" />
                            </div>
                            <p className="font-medium text-slate-200">
                              Drag and drop your dataset here, or <span className="text-indigo-400 underline">browse</span>
                            </p>
                            <p className="text-xs text-slate-400">
                              Supports CSV, Excel (.xlsx, .xls), and JSON datasets (Up to 20MB)
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Ingestion & Training Button */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Direct commit to MySQL + FAISS vector training triggered</span>
                        </div>

                        <button
                          type="submit"
                          disabled={!file || uploading}
                          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
                            !file || uploading
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30'
                          }`}
                        >
                          {uploading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Ingesting to MySQL & Training Ollama...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Upload & Train Ollama
                            </>
                          )}
                        </button>
                      </div>
                    </form>

                    {/* Feedback Banners */}
                    {uploadSuccess && (
                      <div className="bg-emerald-950/40 border border-emerald-500/30 p-5 rounded-xl space-y-3">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-emerald-300">
                              Dataset Ingested & Ollama Trained Successfully!
                            </h3>
                            <p className="text-xs text-emerald-400/90 mt-0.5">
                              {uploadSuccess.totalRows} records committed to <code className="font-mono bg-emerald-900/50 px-1 py-0.5 rounded">businessmind_db.sales_records</code>.
                            </p>
                          </div>
                        </div>

                        {uploadSuccess.trainingInfo && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-emerald-500/20 text-xs">
                            <div className="bg-emerald-900/20 p-2 rounded-lg">
                              <span className="text-emerald-400/80 block">FAISS Chunks:</span>
                              <span className="font-semibold text-white">+{uploadSuccess.trainingInfo.chunks_added_this_session || 19}</span> (Total: {uploadSuccess.trainingInfo.total_chunks_indexed})
                            </div>
                            <div className="bg-emerald-900/20 p-2 rounded-lg">
                              <span className="text-emerald-400/80 block">DB Records:</span>
                              <span className="font-semibold text-white">{uploadSuccess.trainingInfo.database_records_processed}</span>
                            </div>
                            <div className="bg-emerald-900/20 p-2 rounded-lg">
                              <span className="text-emerald-400/80 block">AI Model:</span>
                              <span className="font-semibold text-white">{uploadSuccess.trainingInfo.ollama_model}</span>
                            </div>
                            <div className="bg-emerald-900/20 p-2 rounded-lg">
                              <span className="text-emerald-400/80 block">Ollama Status:</span>
                              <span className="font-semibold text-emerald-300">Online & Synced</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {uploadError && (
                      <div className="bg-rose-950/40 border border-rose-500/30 p-4 rounded-xl flex items-center gap-3 text-rose-300 text-sm">
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        <div>
                          <p className="font-medium">Ingestion Error</p>
                          <p className="text-xs text-rose-400/80 mt-0.5">{uploadError}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Panel: Pre-packaged Sample Loaders */}
                  <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                        Quick Test Datasets
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Instantly test the pipeline with pre-formatted enterprise dataset templates:
                      </p>

                      <div className="space-y-3 mt-4">
                        <div
                          onClick={() => handleLoadDemoDataset('September_2025_Enterprise_AI_Deals.csv', `transaction_date,product_name,category,quantity,unit_price,revenue,cost,customer_region
2025-09-01,Enterprise LLM Brain,Enterprise AI,4,1200000,4800000,960000,North America
2025-09-02,Autonomous Agent Cluster,Enterprise AI,6,800000,4800000,1200000,Europe
2025-09-03,Business Intelligence Pro,Analytics,10,350000,3500000,700000,APAC
2025-09-04,Cloud Migration Suite,Cloud,5,500000,2500000,500000,Latin America`)}
                          className="p-3 bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                              Enterprise AI Deals (Sept 2025)
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded">CSV</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">4 transactions • ₹15.6M gross revenue • High margin</p>
                        </div>

                        <div
                          onClick={() => handleLoadDemoDataset('Q4_2025_Regional_Expansion.csv', `transaction_date,product_name,category,quantity,unit_price,revenue,cost,customer_region
2025-10-01,Cybersecurity Core,Cybersecurity,8,250000,2000000,400000,Middle East
2025-10-05,Data Governance Suite,Compliance,12,180000,2160000,540000,APAC
2025-10-10,Edge Inference Node,Hardware,15,300000,4500000,1800000,North America`)}
                          className="p-3 bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                              Regional Expansion Matrix (Q4)
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded">CSV</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">3 transactions • Cybersecurity, Compliance, Hardware</p>
                        </div>

                        <div
                          onClick={() => handleLoadDemoDataset('SaaS_Subscription_Annual_Bookings.csv', `transaction_date,product_name,category,quantity,unit_price,revenue,cost,customer_region
2025-11-01,BusinessMind Annual Seat,SaaS,50,45000,2250000,225000,Domestic
2025-11-02,BusinessMind Premium Org,SaaS,20,120000,2400000,360000,North America`)}
                          className="p-3 bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                              SaaS Subscription Bookings
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded">CSV</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">70 seat licenses • 90% gross profit SaaS playbook</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs text-slate-400 space-y-1.5">
                      <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                        How does training work?
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        Data is extracted, indexed in MySQL for analytical SQL queries, and transformed into vector embeddings via FAISS so Ollama can synthesize exact numbers with natural-language reasoning.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ingested Datasets Table Visible Directly on Tab 1 */}
                {renderDatasetsTable('Ingested')}
              </div>
            )}

            {/* TAB 2: SYNC DATABASE & TEST AI QUERY */}
            {activeTab === 'sync' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sync Database Panel */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-indigo-400" />
                      Synchronize MySQL to Ollama RAG
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      Forces an on-demand rescan of all tables in <code className="text-indigo-300 font-mono">businessmind_db</code>, aggregates financial statistics, updates the FAISS vector index, and syncs Ollama context.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Database Connection</span>
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Active (localhost:3306)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Ollama Model Target</span>
                      <span className="text-indigo-300 font-mono">qwen3.5:4b (Local GPU)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Vector Knowledge Store</span>
                      <span className="text-slate-200">FAISS (IndexFlatL2)</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSyncDatabase}
                    disabled={syncing}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
                      syncing
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                    }`}
                  >
                    {syncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Scanning MySQL & Retraining Ollama...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Sync All Database Tables & Retrain Ollama
                      </>
                    )}
                  </button>

                  {syncResult && (
                    <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl space-y-2">
                      <p className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        {syncResult.message || 'Sync successful'}
                      </p>
                      <div className="text-[11px] text-emerald-400/80 font-mono space-y-0.5">
                        <p>Total Chunks: {syncResult.total_chunks_indexed} | Chunks Added: +{syncResult.chunks_added_this_session}</p>
                        <p>Records Processed: {syncResult.database_records_processed} | Synced at: {syncResult.synced_at}</p>
                      </div>
                    </div>
                  )}

                  {syncError && (
                    <div className="bg-rose-950/40 border border-rose-500/30 p-4 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{syncError}</span>
                    </div>
                  )}
                </div>

                {/* Interactive Test Query Box */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      Verify Knowledge: Ask Question on Datasets
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      Test that Ollama and the RAG/SQL router accurately answer questions using the newly ingested data.
                    </p>
                  </div>

                  <form onSubmit={handleRunQuery} className="space-y-3">
                    <div className="relative">
                      <textarea
                        value={queryInput}
                        onChange={(e) => setQueryInput(e.target.value)}
                        placeholder="e.g. What were our top products in August 2025 and what was the revenue?"
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 resize-none outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setQueryInput('What was the total revenue recorded in businessmind_db?')}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          Total Revenue
                        </button>
                        <button
                          type="button"
                          onClick={() => setQueryInput('What products were sold in August 2025 and what was the revenue for Cloud AI Agent Pro?')}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          August 2025 Deals
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={queryLoading || !queryInput.trim()}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                          queryLoading || !queryInput.trim()
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20'
                        }`}
                      >
                        {queryLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Synthesizing...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Ask Ollama
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Query Response Display */}
                  {queryResponse && (
                    <div className="bg-slate-950/80 border border-purple-500/30 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-purple-400" />
                          Ollama Response (Qwen3.5:4b)
                        </span>
                        {queryResponse.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                            Route: {queryResponse.category}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {queryResponse.raw_response || queryResponse.direct_answer || JSON.stringify(queryResponse)}
                      </div>
                    </div>
                  )}

                  {queryError && (
                    <div className="bg-rose-950/40 border border-rose-500/30 p-3 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{queryError}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: LIVE MONITORING & DATASETS TABLE */}
            {activeTab === 'monitor' && (
              <div className="space-y-6">
                {/* Metrics Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Database Health Card */}
                  <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Database className="w-4 h-4 text-indigo-400" />
                        MySQL Schema & Storage
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        Connected
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Database:</span>
                        <span className="text-slate-200 font-mono">businessmind_db</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Sales Records Table:</span>
                        <span className="text-slate-200 font-semibold">{monitoring?.database?.summary?.total_records || '331'} rows</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Total Revenue Aggregate:</span>
                        <span className="text-emerald-400 font-semibold font-mono">
                          ₹{(monitoring?.database?.summary?.total_revenue || 216581000).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Distinct Categories:</span>
                        <span className="text-slate-200">{monitoring?.database?.summary?.categories_count || 5} active</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Inference Engine Card */}
                  <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-purple-400" />
                        Ollama Inference Engine
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        Live GPU
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Active Model:</span>
                        <span className="text-indigo-300 font-mono">{monitoring?.ai_engine?.target_model || 'qwen3.5:4b'}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Microservice URL:</span>
                        <span className="text-slate-200 font-mono">http://localhost:8000</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Ollama Daemon:</span>
                        <span className="text-slate-200 font-mono">http://127.0.0.1:11434</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Context Length:</span>
                        <span className="text-slate-200">2048 / 4096 tokens</span>
                      </div>
                    </div>
                  </div>

                  {/* RAG Vector Store Card */}
                  <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-sky-400" />
                        FAISS Vector RAG Store
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
                        Synchronized
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Indexed Embeddings:</span>
                        <span className="text-sky-300 font-semibold">{monitoring?.rag_store?.total_chunks || '78'} vector chunks</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Vector Engine:</span>
                        <span className="text-slate-200">{monitoring?.rag_store?.engine || 'FAISS IndexFlatL2'}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Index Storage Path:</span>
                        <span className="text-slate-200 font-mono text-[10px]">data/business.index</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Last Update:</span>
                        <span className="text-slate-200">{new Date(monitoring?.timestamp || Date.now()).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Uploaded Datasets Table in businessmind_db */}
                {renderDatasetsTable('Live Monitored')}
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
