'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  RefreshCw, 
  Copy, 
  Check, 
  Bot, 
  AlertCircle, 
  FileText, 
  Download,
  Zap,
  Globe,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import axios from 'axios';

interface AiScenarioAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  domainName: string;
  initialPrompt?: string;
}

const STRATEGIC_FOCUS_OPTIONS = [
  'Current Macro Scenario & Strategic Roadmap',
  'Monetization Models & Unit Economics Expansion',
  'Competitive Threat Matrix & Defensible Moats',
  'Regulatory Vulnerabilities, Compliance & Privacy',
  '90-Day Tactical Execution & Risk Playbook'
];

export default function AiScenarioAnalysisModal({
  isOpen,
  onClose,
  domainName,
  initialPrompt = ''
}: AiScenarioAnalysisModalProps) {
  const [selectedFocus, setSelectedFocus] = useState(STRATEGIC_FOCUS_OPTIONS[0]);
  const [userQuery, setUserQuery] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [responseMarkdown, setResponseMarkdown] = useState<string | null>(null);
  const [responseMeta, setResponseMeta] = useState<{ source?: string; timestamp?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setUserQuery(initialPrompt);
    }
  }, [initialPrompt]);

  if (!isOpen) return null;

  const handleRunAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setResponseMarkdown(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

    try {
      const res = await axios.post(`${API_BASE}/ai/roadmap-analysis`, {
        domain: domainName,
        focus: selectedFocus,
        query: userQuery
      }, {
        timeout: 60000
      });

      if (res.data && res.data.success) {
        setResponseMarkdown(res.data.analysis);
        setResponseMeta({
          source: res.data.source || 'OpenAI Intelligence Engine',
          timestamp: res.data.timestamp || new Date().toISOString()
        });
      } else {
        throw new Error(res.data?.message || 'Failed to retrieve AI analysis');
      }
    } catch (err: any) {
      console.error('Roadmap Analysis Error:', err);
      // If network fails, provide instant high-grade fallback so user experience is always fluid
      setError(err.response?.data?.message || err.message || 'Connecting to AI Engine failed. Generating executive backup summary.');
      setResponseMarkdown(`### Executive Scenario Analysis: ${domainName}\n\n**Focus**: ${selectedFocus}\n\n* **Macro Climate**: Rapid acceleration toward agentic workflows and AI-driven telemetry. Enterprises demand visible ROI within 90 days and tight capital efficiency.\n* **Growth Directives**: Target >70% gross margins, automate customer data onboarding, and secure 5-10 enterprise beachhead design partners before aggressive paid outbound.\n* **Risk Shield**: Enforce zero-trust role-based access control (RBAC), multi-tenant database row-level security, and automated audit logging from day one.`);
      setResponseMeta({
        source: 'BusinessMind Strategic Intelligence (Offline Mode)',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!responseMarkdown) return;
    navigator.clipboard.writeText(responseMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!responseMarkdown) return;
    const blob = new Blob([responseMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${domainName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_scenario_analysis.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Glow accent */}
        <div className="absolute top-0 right-1/4 w-80 h-32 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/90 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  OpenAI Scenario Intelligence Engine
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Enterprise AI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Target Domain: <span className="text-indigo-300 font-semibold">{domainName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-sm">
          {/* Analysis Configuration Form */}
          <form onSubmit={handleRunAnalysis} className="space-y-4 bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Select Strategic Lens / Analysis Focus:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {STRATEGIC_FOCUS_OPTIONS.map((focus) => (
                  <button
                    key={focus}
                    type="button"
                    onClick={() => setSelectedFocus(focus)}
                    className={`px-3 py-2 text-xs font-medium rounded-xl border text-left transition ${
                      selectedFocus === focus
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    {focus}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Specific Scenario Query or Custom Question (Optional):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder={`e.g. "What happens if customer acquisition cost spikes 30% in ${domainName}?"`}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Sparkles size={13} className="text-indigo-400" />
                <span>Powered by OpenAI gpt-4o-mini & BusinessMind Executive Knowledge</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Analyzing Macro Scenarios...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Generate AI Strategic Analysis</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Notice */}
          {error && (
            <div className="p-3.5 bg-amber-950/40 border border-amber-800/50 rounded-xl text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Result View */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 relative">
                <RefreshCw size={28} className="animate-spin text-indigo-400" />
                <div className="absolute inset-0 rounded-2xl border-2 border-indigo-400/30 animate-ping" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Synthesizing Macro Dynamics & 4-Phase Roadmap</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Querying live intelligence models for <span className="text-indigo-300">{domainName}</span>...
                </p>
              </div>
            </div>
          )}

          {responseMarkdown && !loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Engine: {responseMeta?.source || 'OpenAI Model'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition flex items-center gap-1.5"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition flex items-center gap-1.5"
                  >
                    <Download size={13} />
                    <span>Export MD</span>
                  </button>
                </div>
              </div>

              {/* Formatted Markdown Content Container */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3 font-normal whitespace-pre-line">
                {responseMarkdown}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div>BusinessMind AI • Autonomous Strategic Intelligence Suite</div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition font-medium"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
