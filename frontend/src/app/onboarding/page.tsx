'use client';

import React, { useState } from 'react';
import { useAuth, api } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { Sidebar } from '../../components/layout/Sidebar';
import { Navbar } from '../../components/layout/Navbar';
import { DatasetType, OnboardingBatch } from '../../types/auth';
import {
  UploadCloud,
  FileSpreadsheet,
  Cpu,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  Eye,
  Database,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Sliders
} from 'lucide-react';

export default function OnboardingPage() {
  const { organization } = useAuth();
  const [activePathway, setActivePathway] = useState<'upload' | 'erp'>('upload');
  const [datasetType, setDatasetType] = useState<DatasetType>('sales');

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // ERP Sync State
  const [erpProvider, setErpProvider] = useState<'QuickBooks' | 'Square' | 'Shopify' | 'SAP'>('QuickBooks');
  const [apiKey, setApiKey] = useState('erp_live_api_key_8849204');

  // Processing & Pipeline Result State
  const [processing, setProcessing] = useState(false);
  const [batchResult, setBatchResult] = useState<OnboardingBatch | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // Trigger Pathway (a): File Upload Validation & Preview (FR2.2a, FR2.3, FR2.4, FR2.5)
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setProcessing(true);
    setErrorMessage(null);
    setImportSuccessMessage(null);
    setBatchResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('datasetType', datasetType);

    try {
      const res = await api.post('/onboarding/upload-preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setBatchResult(res.data.data);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'File processing failed.');
    } finally {
      setProcessing(false);
    }
  };

  // Trigger Pathway (b): ERP/POS API Sync Integration (FR2.2b, FR2.3, FR2.4, FR2.5)
  const handleErpSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrorMessage(null);
    setImportSuccessMessage(null);
    setBatchResult(null);

    try {
      const res = await api.post('/onboarding/erp-sync', {
        erpProvider,
        datasetType,
        apiKey
      });
      if (res.data.success) {
        setBatchResult(res.data.data);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'ERP Sync connection failed.');
    } finally {
      setProcessing(false);
    }
  };

  // Trigger Final Confirmation Import into Database (FR2.5)
  const handleConfirmImport = async () => {
    if (!batchResult) return;
    setConfirming(true);
    setErrorMessage(null);

    try {
      const res = await api.post('/onboarding/confirm-import', {
        batchId: batchResult.id
      });
      if (res.data.success) {
        setImportSuccessMessage(res.data.message);
        setBatchResult({ ...batchResult, status: 'imported' });
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Import confirmation failed.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <ProtectedRoute requiredPermission="onboarding:upload">
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="p-8 max-w-6xl mx-auto w-full space-y-8">
            {/* Title Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-md p-6 border border-slate-800 rounded-3xl shadow-xl">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                  <Sparkles size={14} />
                  <span>FR2 Business Data Onboarding Workspace</span>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Data Ingestion & Cleaning Pipeline</h1>
                <p className="text-slate-400 text-xs mt-1">
                  Onboard business data via manual CSV/Excel files or live external ERP/POS API integration.
                </p>
              </div>

              {/* Pathway Selector Tabs */}
              <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
                <button
                  onClick={() => setActivePathway('upload')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    activePathway === 'upload'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileSpreadsheet size={16} /> (a) Manual Upload
                </button>
                <button
                  onClick={() => setActivePathway('erp')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    activePathway === 'erp'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cpu size={16} /> (b) ERP/POS API
                </button>
              </div>
            </div>

            {/* Target Dataset Type Selector */}
            <div className="bg-slate-900/80 backdrop-blur-md p-4 border border-slate-800 rounded-2xl flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Sliders size={16} className="text-indigo-400" />
                <span>Target Dataset Schema:</span>
              </div>
              <div className="flex gap-2">
                {[
                  { id: 'sales', label: 'Sales Records' },
                  { id: 'inventory', label: 'Inventory Stock' },
                  { id: 'customers', label: 'Customer Directory' },
                  { id: 'finance', label: 'Financial Ledger' }
                ].map(ds => (
                  <button
                    key={ds.id}
                    onClick={() => setDatasetType(ds.id as DatasetType)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition ${
                      datasetType === ds.id
                        ? 'bg-indigo-950 text-indigo-300 border-indigo-500/50 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {ds.label}
                  </button>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 bg-rose-950/60 border border-rose-800/60 rounded-2xl text-rose-300 text-sm flex items-center gap-3">
                <AlertTriangle size={20} />
                <span>{errorMessage}</span>
              </div>
            )}

            {importSuccessMessage && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-800/60 rounded-2xl text-emerald-300 text-sm flex items-center gap-3">
                <CheckCircle size={20} />
                <span>{importSuccessMessage}</span>
              </div>
            )}

            {/* Pathway (a): File Upload Interface */}
            {activePathway === 'upload' && (
              <form onSubmit={handleUploadSubmit} className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-10 text-center transition ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-950/20'
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-4">
                    <UploadCloud size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {file ? file.name : 'Upload CSV or Excel Spreadsheet'}
                  </h3>
                  <p className="text-slate-400 text-xs mb-4">
                    Drag and drop your file here or click browse. Supports <code className="text-amber-300">.csv</code>, <code className="text-emerald-300">.xlsx</code>, <code className="text-indigo-300">.xls</code>.
                  </p>

                  <input
                    type="file"
                    id="file-upload"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold inline-flex items-center gap-2 border border-slate-700 transition"
                  >
                    Select File
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!file || processing}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
                  >
                    {processing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> Running Pipeline...
                      </>
                    ) : (
                      <>
                        <FileCheck size={16} /> Run Pipeline & Preview Normalization
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Pathway (b): ERP/POS API Interface */}
            {activePathway === 'erp' && (
              <form onSubmit={handleErpSyncSubmit} className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Select ERP / POS Provider
                    </label>
                    <select
                      value={erpProvider}
                      onChange={e => setErpProvider(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition"
                    >
                      <option value="QuickBooks">QuickBooks Online ERP</option>
                      <option value="Square">Square POS System</option>
                      <option value="Shopify">Shopify Store API</option>
                      <option value="SAP">SAP Business One</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      API Access Key / Bearer Token
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 font-mono focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-purple-600/30 flex items-center gap-2"
                  >
                    {processing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> Fetching & Normalizing...
                      </>
                    ) : (
                      <>
                        <Cpu size={16} /> Connect API & Ingest Data
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Pipeline Validation Summary & Preview Section (FR2.3, FR2.4, FR2.5) */}
            {batchResult && (
              <div className="space-y-6">
                {/* Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Rows</p>
                    <p className="text-2xl font-extrabold text-white mt-1">{batchResult.totalRows}</p>
                  </div>
                  <div className="bg-emerald-950/30 border border-emerald-800/40 p-4 rounded-2xl">
                    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Valid Normalized Rows</p>
                    <p className="text-2xl font-extrabold text-emerald-300 mt-1">{batchResult.validRows}</p>
                  </div>
                  <div className="bg-rose-950/30 border border-rose-800/40 p-4 rounded-2xl">
                    <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Invalid Rows</p>
                    <p className="text-2xl font-extrabold text-rose-300 mt-1">{batchResult.invalidRows}</p>
                  </div>
                  <div className="bg-amber-950/30 border border-amber-800/40 p-4 rounded-2xl">
                    <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Duplicates Detected</p>
                    <p className="text-2xl font-extrabold text-amber-300 mt-1">{batchResult.duplicateRows}</p>
                  </div>
                </div>

                {/* FR2.4: Actionable Error Feedback Table */}
                {batchResult.errors && batchResult.errors.length > 0 && (
                  <div className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                      <AlertTriangle size={18} />
                      <span>FR2.4 Actionable Error Feedback Log ({batchResult.errors.length} issues)</span>
                    </div>

                    <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px]">
                          <tr>
                            <th className="p-3">Row #</th>
                            <th className="p-3">Column Field</th>
                            <th className="p-3">Raw Value</th>
                            <th className="p-3">Validation Message</th>
                            <th className="p-3">Severity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {batchResult.errors.map((err, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/50">
                              <td className="p-3 font-mono font-bold text-amber-400">Row {err.row}</td>
                              <td className="p-3 font-semibold text-slate-200">{err.column}</td>
                              <td className="p-3 font-mono text-slate-400">{String(err.value)}</td>
                              <td className="p-3 text-slate-300">{err.message}</td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    err.severity === 'error'
                                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                                  }`}
                                >
                                  {err.severity.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* FR2.5: Preview Sample Normalized Data Table */}
                {batchResult.previewData && batchResult.previewData.length > 0 && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                        <Eye size={18} />
                        <span>FR2.5 Normalized Data Sample Preview (First {batchResult.previewData.length} Rows)</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        Status: <strong className="text-emerald-400 uppercase">{batchResult.status}</strong>
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px]">
                          <tr>
                            {Object.keys(batchResult.previewData[0]).map(col => (
                              <th key={col} className="p-3">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {batchResult.previewData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/50">
                              {Object.keys(row).map(col => (
                                <td key={col} className="p-3 font-mono">
                                  {String(row[col])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Final Confirm Import Button */}
                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleConfirmImport}
                        disabled={confirming || batchResult.status === 'imported'}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
                      >
                        {confirming ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" /> Confirming...
                          </>
                        ) : batchResult.status === 'imported' ? (
                          <>
                            <CheckCircle size={16} /> Data Imported Successfully
                          </>
                        ) : (
                          <>
                            <Database size={16} /> Confirm & Import {batchResult.validRows} Records into System <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    </div>
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
