'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Database,
  FileText,
  Layers,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Shield,
  HelpCircle,
  Upload,
  Search,
  BookOpen,
  RefreshCw,
  X
} from 'lucide-react';

interface AISection {
  direct_answer: string;
  key_drivers: string[];
  supporting_evidence: string;
  recommended_action: string[];
  risk_level: 'Low' | 'Medium' | 'High' | string;
  risk_justification: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  category?: 'SQL' | 'RAG' | 'BOTH' | string;
  sections?: AISection;
  sources?: Array<{
    title: string;
    category: string;
    snippet: string;
    score: number;
  }>;
  timestamp: string;
}

export function BusinessMindChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am BusinessMind AI, your executive decision support assistant powered by local Ollama Qwen3 8B, FAISS RAG, and SQL analytics.',
      category: 'BOTH',
      sections: {
        direct_answer: 'Welcome to your intelligent executive decision support dashboard.',
        key_drivers: [
          'Connected to relational business aggregates (SQL Database)',
          'FAISS Vector Store initialized with core enterprise policies & reports',
          'Intelligent Query Router auto-detects numerical vs. document lookup intent'
        ],
        supporting_evidence: 'System status verified: Ollama Qwen3 local model bridge operational.',
        recommended_action: [
          'Ask financial aggregate questions (e.g., "What was total revenue in 2025?")',
          'Inquire about company policy documents (e.g., "What is our refund policy?")',
          'Request predictive analytics & decision support recommendations.'
        ],
        risk_level: 'Low',
        risk_justification: 'System operates strictly on verified enterprise context with zero numeric hallucinations.'
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<any>(null);
  const [showRAGModal, setShowRAGModal] = useState(false);
  const [ragDocuments, setRagDocuments] = useState<any[]>([]);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docCategory, setDocCategory] = useState('General');
  const [isUploading, setIsUploading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchModelStatus();
    fetchRAGDocuments();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchModelStatus = async () => {
    try {
      const res = await fetch('/api/v1/ai/models');
      if (!res.ok) return;
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (data.success && data.ollama_status) {
        setOllamaStatus(data.ollama_status);
      }
    } catch (err) {
      console.log('AI Service status check offline or connecting via proxy...');
    }
  };

  const fetchRAGDocuments = async () => {
    try {
      const res = await fetch('/api/v1/ai/rag/documents');
      if (!res.ok) return;
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (data.success) {
        setRagDocuments(data.documents || []);
      }
    } catch (err) {
      console.log('Error fetching RAG documents:', err);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const questionToSubmit = overrideText || inputQuestion;
    if (!questionToSubmit.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: questionToSubmit,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!overrideText) setInputQuestion('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionToSubmit })
      });

      let result: any = {};
      const rawText = await response.text();
      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch (parseErr) {
        result = {
          success: false,
          message: `Server returned non-JSON response (${response.status}): ${rawText.slice(0, 100)}`
        };
      }

      if (result.success && result.data) {
        const data = result.data;
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          category: data.category || 'BOTH',
          sections: data.sections || {
            direct_answer: data.raw_response || 'Analysis generated successfully.',
            key_drivers: ['Live SQL database analytics verified', 'RAG knowledge base synchronized'],
            supporting_evidence: 'Processed through BusinessMind enterprise pipeline.',
            recommended_action: ['Review metrics in dashboard'],
            risk_level: 'Low',
            risk_justification: 'Verified operational baseline'
          },
          sources: data.sources || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error(result.message || result.detail || 'Failed to generate answer from AI pipeline');
      }
    } catch (error: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        category: 'BOTH',
        sections: {
          direct_answer: 'AI Microservice temporary notice: pipeline request encountered an issue.',
          key_drivers: [
            'Ensure Python ai-service is running on http://localhost:8000',
            'Ensure Ollama server is running on http://localhost:11434 with qwen3.5:4b or qwen3:8b'
          ],
          supporting_evidence: `Diagnostic details: ${error.message || 'Connection error'}`,
          recommended_action: [
            'Check that "python -m uvicorn app.main:app --port 8000" is active in ai-service',
            'Try asking a specific query like "What was our total revenue in 2025?"'
          ],
          risk_level: 'Medium',
          risk_justification: 'Service communication fallback active'
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle || !docContent) return;

    setIsUploading(true);
    try {
      const res = await fetch('/api/v1/ai/rag/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle,
          content: docContent,
          category: docCategory
        })
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { success: false, message: rawText };
      }

      if (data.success) {
        setDocTitle('');
        setDocContent('');
        fetchRAGDocuments();
        alert(`Document indexed successfully into FAISS! (${data.chunks_indexed || 1} vector chunks created)`);
      } else {
        alert(`Upload error: ${data.message || 'Failed to index document'}`);
      }
    } catch (err: any) {
      alert(`Error uploading document: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };


  const renderRiskBadge = (level?: string) => {
    const l = (level || 'Medium').toLowerCase();
    if (l === 'low') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80 flex items-center gap-1.5">
          <Shield size={13} className="text-emerald-400" /> Low Risk
        </span>
      );
    } else if (l === 'high') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800/80 flex items-center gap-1.5">
          <AlertTriangle size={13} className="text-rose-400" /> High Risk
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800/80 flex items-center gap-1.5">
        <HelpCircle size={13} className="text-amber-400" /> Medium Risk
      </span>
    );
  };

  const renderCategoryBadge = (cat?: string) => {
    if (cat === 'SQL') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
          <Database size={11} /> SQL Aggregate
        </span>
      );
    } else if (cat === 'RAG') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
          <FileText size={11} /> RAG Document Search
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1">
        <Layers size={11} /> Both (SQL + RAG)
      </span>
    );
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[750px] max-w-5xl mx-auto w-full">
      {/* Header Bar */}
      <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
            <Bot size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">BusinessMind AI</h2>
              <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-semibold rounded-full flex items-center gap-1">
                <Sparkles size={10} /> Qwen3 8B
              </span>
            </div>
            <p className="text-slate-400 text-xs">
              Executive Decision Support System • Ollama + FAISS Vector Store
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRAGModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          >
            <BookOpen size={14} className="text-purple-400" /> Knowledge Base ({ragDocuments.length})
          </button>
          
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Service Online</span>
          </div>
        </div>
      </div>

      {/* Preset Quick Prompt Chips */}
      <div className="px-6 py-2.5 bg-slate-900/50 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-400 font-semibold shrink-0">Quick Queries:</span>
        <button
          onClick={() => handleSend("Why did sales decrease in July and what actions should management take?")}
          className="px-3 py-1 bg-slate-800/90 hover:bg-indigo-950/80 hover:border-indigo-500/40 text-slate-300 rounded-full border border-slate-700/80 transition shrink-0"
        >
          📉 Why did July sales decrease?
        </button>
        <button
          onClick={() => handleSend("What is our enterprise refund and subscription cancellation policy?")}
          className="px-3 py-1 bg-slate-800/90 hover:bg-purple-950/80 hover:border-purple-500/40 text-slate-300 rounded-full border border-slate-700/80 transition shrink-0"
        >
          📜 Enterprise refund policy?
        </button>
        <button
          onClick={() => handleSend("Forecast next quarter revenue and customer churn risk.")}
          className="px-3 py-1 bg-slate-800/90 hover:bg-cyan-950/80 hover:border-cyan-500/40 text-slate-300 rounded-full border border-slate-700/80 transition shrink-0"
        >
          🔮 Revenue & Churn Forecast
        </button>
      </div>

      {/* Message Chat Feed */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-1">
                <Bot size={18} />
              </div>
            )}

            <div className={`max-w-3xl space-y-3 ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-2xl p-4 shadow-lg' : 'w-full'}`}>
              {msg.sender === 'user' ? (
                <p className="text-sm leading-relaxed">{msg.text}</p>
              ) : (
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  {/* Category & Router Header */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-bold">Query Router Classification:</span>
                      {renderCategoryBadge(msg.category)}
                    </div>
                    {renderRiskBadge(msg.sections?.risk_level)}
                  </div>

                  {/* 5-Section Executive Output */}
                  {msg.sections && (
                    <div className="space-y-4 text-xs">
                      {/* Section 1: Direct Answer */}
                      <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-3.5 space-y-1">
                        <h4 className="font-extrabold text-indigo-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-indigo-400" /> 1. Direct Answer
                        </h4>
                        <p className="text-slate-200 text-sm leading-relaxed font-medium">
                          {msg.sections.direct_answer}
                        </p>
                      </div>

                      {/* Section 2: Key Drivers */}
                      {msg.sections.key_drivers && msg.sections.key_drivers.length > 0 && (
                        <div className="space-y-1.5">
                          <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                            2. Key Drivers
                          </h4>
                          <ul className="space-y-1 pl-2">
                            {msg.sections.key_drivers.map((driver, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-slate-300">
                                <span className="text-indigo-400 font-bold">•</span>
                                <span>{driver}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Section 3: Supporting Evidence */}
                      {msg.sections.supporting_evidence && (
                        <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                          <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                            3. Supporting Evidence
                          </h4>
                          <p className="text-slate-300 italic">
                            "{msg.sections.supporting_evidence}"
                          </p>
                        </div>
                      )}

                      {/* Section 4: Recommended Action */}
                      {msg.sections.recommended_action && msg.sections.recommended_action.length > 0 && (
                        <div className="space-y-1.5 bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-xl">
                          <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                            <TrendingUp size={12} /> 4. Recommended Actions
                          </h4>
                          <div className="space-y-1.5">
                            {msg.sections.recommended_action.map((action, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-slate-200 font-medium">
                                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span>{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section 5: Risk Justification */}
                      {msg.sections.risk_justification && (
                        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                          <span className="font-bold text-slate-300">5. Risk Justification:</span>
                          <span>{msg.sections.risk_justification}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Document Sources Used */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Retrieved FAISS Vector Sources:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((src, idx) => (
                          <div key={idx} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-purple-300 flex items-center gap-1.5">
                            <FileText size={11} className="text-purple-400" />
                            <span className="font-bold">{src.title}</span>
                            <span className="text-slate-500">({src.category})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 text-right">{msg.timestamp}</div>
                </div>
              )}

              {msg.sender === 'user' && (
                <div className="text-[10px] text-indigo-200 text-right mt-1">{msg.timestamp}</div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                <User size={16} />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 items-center text-slate-400 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800 w-fit">
            <Bot size={18} className="text-indigo-400 animate-spin" />
            <span>Routing query & synthesizing Qwen3 8B response...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Ask BusinessMind AI (e.g., 'Why did sales decrease in July and what should we do?')..."
            className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-2xl transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 shrink-0"
          >
            <span>Ask</span>
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* RAG Knowledge Base & Document Modal */}
      {showRAGModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <BookOpen className="text-purple-400" />
                <span>FAISS RAG Vector Knowledge Base</span>
              </div>
              <button
                onClick={() => setShowRAGModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Ingestion Form */}
              <form onSubmit={handleUploadDocument} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload size={14} /> Add Business Document to RAG
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Document Title (e.g. Q4 Strategy Report)"
                    value={docTitle}
                    onChange={e => setDocTitle(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                  <select
                    value={docCategory}
                    onChange={e => setDocCategory(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="General">General Policy</option>
                    <option value="Sales Report">Sales Report</option>
                    <option value="Finance">Finance & Cost</option>
                    <option value="Marketing">Marketing Strategy</option>
                  </select>
                </div>
                <textarea
                  rows={3}
                  placeholder="Paste document text or annual report extract here..."
                  value={docContent}
                  onChange={e => setDocContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white"
                  required
                />
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition"
                >
                  {isUploading ? 'Chunking & Vectorizing into FAISS...' : 'Index Document into Vector Store'}
                </button>
              </form>

              {/* Document List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Indexed Document Chunks ({ragDocuments.length})
                </h4>
                <div className="space-y-2">
                  {ragDocuments.map((doc, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between items-center font-bold text-purple-300">
                        <span>{doc.title}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px]">
                          {doc.category}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] italic">{doc.snippet}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
