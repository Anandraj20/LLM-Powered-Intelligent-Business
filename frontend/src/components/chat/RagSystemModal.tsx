'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Search,
  Database,
  Sparkles,
  RefreshCw,
  X,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Cpu
} from 'lucide-react';

interface RagSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoc?: (title: string) => void;
}

export function RagSystemModal({ isOpen, onClose }: RagSystemModalProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'search' | 'upload'>('catalog');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Ingest form
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Executive Directive');
  const [docContent, setDocContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Sync DB
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
    }
  }, [isOpen]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/ai/rag/documents');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.warn('Failed to fetch RAG documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch('/api/v1/ai/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim(), top_k: 4 })
      });
      const data = await res.json();
      if (data.success && data.results) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }
    } catch (err: any) {
      console.warn('RAG search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim() || isUploading) return;

    setIsUploading(true);
    setUploadSuccess('');
    setUploadError('');

    try {
      const res = await fetch('/api/v1/ai/rag/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle.trim(),
          category: docCategory.trim(),
          content: docContent.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setUploadSuccess(`Document indexed into FAISS vector store! (${data.chunks_indexed || 1} chunks created)`);
        setDocTitle('');
        setDocContent('');
        fetchDocuments();
      } else {
        setUploadError(data.message || 'Failed to index document.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Network error uploading document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    setSyncStatus('');
    try {
      const res = await fetch('/api/v1/ai/rag/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncStatus(`Database synchronized with FAISS RAG! Vector embeddings updated.`);
        fetchDocuments();
      } else {
        setSyncStatus(data.message || 'Sync completed with notices.');
      }
    } catch (err: any) {
      setSyncStatus(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
        setDocContent(text);
        setActiveTab('upload');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-slate-900 to-slate-950 border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-500/10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Glow */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-md">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">FAISS Vector RAG Knowledge Hub</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-700/60">
                  {documents.length} Vector Chunks
                </span>
              </div>
              <p className="text-xs text-slate-400">Semantic vector retrieval & multi-tenant enterprise memory</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncDatabase}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              title="Synchronize live MySQL sales database into RAG embeddings"
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing…' : 'Sync DB to RAG'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Sync notification */}
        {syncStatus && (
          <div className="px-6 py-2.5 bg-purple-950/40 border-b border-purple-500/30 text-xs text-purple-300 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-purple-400 shrink-0" />
            <span>{syncStatus}</span>
          </div>
        )}

        {/* Tab switcher */}
        <div className="px-6 py-2.5 bg-slate-950/30 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'catalog' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BookOpen size={13} />
            <span>Document Library ({documents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'search' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Search size={13} />
            <span>Vector Search Playground</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'upload' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Upload size={13} />
            <span>Ingest Document / Policy</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* TAB 1: CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white">Indexed Enterprise Documents</h3>
                  <p className="text-xs text-slate-400">FAISS index stores chunked dense vector representations for fast cosine retrieval.</p>
                </div>
                <button
                  onClick={fetchDocuments}
                  disabled={loading}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg text-xs flex items-center gap-1 transition"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">Reading FAISS vector index…</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
                  <Layers size={28} className="mx-auto text-slate-600" />
                  <p className="text-sm font-bold text-slate-300">No documents indexed in RAG yet</p>
                  <p className="text-xs text-slate-500">Switch to the "Ingest Document" tab or click "Sync DB to RAG" above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 rounded-2xl space-y-2 transition shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/60 uppercase tracking-wider">
                          {doc.category || 'General'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Chunk #{doc.id || idx + 1}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight">{doc.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">{doc.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VECTOR SEARCH PLAYGROUND */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-white">Semantic Similarity Search Test</h3>
                <p className="text-xs text-slate-400">Type any natural language query to test FAISS cosine vector match against indexed documents.</p>
              </div>

              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. What is our refund policy? Or Why did July revenue dip?"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!searchQuery.trim() || isSearching}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                >
                  <Search size={14} />
                  <span>{isSearching ? 'Searching…' : 'Search Vectors'}</span>
                </button>
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Semantic Matches</h4>
                  {searchResults.map((res, i) => (
                    <div
                      key={i}
                      className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{res.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-900/60 text-purple-200 border border-purple-700/50">
                            {res.category || 'RAG Document'}
                          </span>
                        </div>
                        {res.score !== undefined && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                            Score: {typeof res.score === 'number' ? res.score.toFixed(3) : res.score}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed italic">"{res.snippet}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INGEST DOCUMENT */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-white">Add New Document to Knowledge Base</h3>
                <p className="text-xs text-slate-400">Content will be automatically chunked into overlapping passages and embedded into FAISS vectors.</p>
              </div>

              {uploadSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle size={14} className="text-rose-400 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <form onSubmit={handleUpload} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Document Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Q4 Sales Compensation Policy"
                      value={docTitle}
                      onChange={e => setDocTitle(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Category / Domain</label>
                    <input
                      type="text"
                      placeholder="e.g. Policy, Sales, Operations, Finance"
                      value={docCategory}
                      onChange={e => setDocCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Document Content</label>
                  <textarea
                    rows={6}
                    placeholder="Paste corporate policy text, strategic directive, SLA guarantees, or operational procedure here…"
                    value={docContent}
                    onChange={e => setDocContent(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="cursor-pointer px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition">
                    <Upload size={13} />
                    <span>Upload Text/MD File</span>
                    <input
                      type="file"
                      accept=".txt,.md,.csv,.json"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={!docTitle.trim() || !docContent.trim() || isUploading}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
                  >
                    <Sparkles size={14} />
                    <span>{isUploading ? 'Indexing Vector…' : 'Index into RAG'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
