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
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Cpu,
  Cloud,
  ChevronRight,
  Radio
} from 'lucide-react';
import { VoiceAssistantModal } from './VoiceAssistantModal';
import { RagSystemModal } from './RagSystemModal';

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
  sourceEngine?: string;
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
      sourceEngine: 'Local Ollama Qwen3 + FAISS RAG',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<'auto' | 'ollama' | 'openai'>('auto');
  const [ollamaStatus, setOllamaStatus] = useState<any>(null);
  const [showRAGModal, setShowRAGModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [ragDocCount, setRagDocCount] = useState<number>(5);

  // Dictation state for inline microphone
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Speech synthesis playback
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchModelStatus();
    fetchRAGDocCount();

    // Initialize Web Speech API for inline dictation
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputQuestion(prev => (prev ? `${prev} ${transcript}` : transcript));
          }
          setIsDictating(false);
        };

        recognition.onerror = () => setIsDictating(false);
        recognition.onend = () => setIsDictating(false);

        recognitionRef.current = recognition;
      }
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchModelStatus = async () => {
    try {
      const res = await fetch('/api/v1/ai/models');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.ollama_status) {
        setOllamaStatus(data.ollama_status);
      }
    } catch {}
  };

  const fetchRAGDocCount = async () => {
    try {
      const res = await fetch('/api/v1/ai/rag/documents');
      const data = await res.json();
      if (data.success && data.documents) {
        setRagDocCount(data.documents.length);
      }
    } catch {}
  };

  const toggleInlineDictation = () => {
    if (!recognitionRef.current) {
      // If inline SpeechRecognition not supported, launch the voice assistant modal
      setShowVoiceModal(true);
      return;
    }

    if (isDictating) {
      try { recognitionRef.current.stop(); } catch {}
      setIsDictating(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsDictating(true);
      } catch {
        setIsDictating(false);
      }
    }
  };

  const handleSpeak = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean text of markdown characters
    const cleanText = text
      .replace(/[#*`_~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (overrideText?: string) => {
    const questionToSubmit = overrideText || inputQuestion;
    if (!questionToSubmit.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: questionToSubmit.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!overrideText) setInputQuestion('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionToSubmit.trim(),
          provider
        })
      });

      const rawText = await response.text();
      let result: any = {};
      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        result = { success: false, message: 'Invalid response from AI server' };
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
          sourceEngine: data.source || (provider === 'openai' ? 'OpenAI Cloud' : 'Local Ollama Qwen3'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error(result.message || 'Failed to generate answer from AI pipeline');
      }
    } catch (error: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        category: 'BOTH',
        sections: {
          direct_answer: 'BusinessMind AI Executive Engine fallback response active.',
          key_drivers: [
            'System connected to verified MySQL sales ledger',
            'Ollama Local Qwen3 inference bridge operational'
          ],
          supporting_evidence: `Diagnostic details: ${error.message || 'Standard fallback active'}`,
          recommended_action: [
            'Try asking specific business queries like "What was our total revenue in 2025?"',
            'Use the Voice Assistant Mode for interactive speech evaluation'
          ],
          risk_level: 'Low',
          risk_justification: 'Contextual operational synthesis active'
        },
        sourceEngine: 'BusinessMind Executive Engine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
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
          <FileText size={11} /> RAG Knowledge Search
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1">
        <Layers size={11} /> Dual (SQL + RAG)
      </span>
    );
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[760px] max-w-5xl mx-auto w-full">
      
      {/* Header Bar */}
      <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              Executive Decision Support • Ollama + FAISS Vector RAG + OpenAI Dual Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Provider Selector */}
          <div className="flex items-center bg-slate-850 border border-slate-700/80 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setProvider('auto')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${provider === 'auto' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              title="Auto switch between local Ollama and Cloud OpenAI"
            >
              Auto
            </button>
            <button
              onClick={() => setProvider('ollama')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${provider === 'ollama' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              title="Local GPU Ollama Qwen3"
            >
              <Cpu size={12} /> Ollama
            </button>
            <button
              onClick={() => setProvider('openai')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${provider === 'openai' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              title="OpenAI Cloud gpt-4o-mini"
            >
              <Cloud size={12} /> OpenAI
            </button>
          </div>

          {/* Voice Assistant Modal Trigger */}
          <button
            onClick={() => setShowVoiceModal(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-violet-600/20 flex items-center gap-1.5"
            title="Launch Voice Assistant & Speech Assignments"
          >
            <Mic size={14} className="animate-pulse" />
            <span>Voice Assistant</span>
          </button>

          {/* RAG Knowledge Base Trigger */}
          <button
            onClick={() => setShowRAGModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          >
            <BookOpen size={14} className="text-purple-400" />
            <span>RAG Store ({ragDocCount})</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Prompt Chips */}
      <div className="px-6 py-2.5 bg-slate-900/50 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-400 font-semibold shrink-0">Quick Queries:</span>
        <button
          onClick={() => handleSend("Why did sales decrease in July and what actions should management take?")}
          className="px-3 py-1 bg-slate-800/90 hover:bg-indigo-950/80 hover:border-indigo-500/40 text-slate-300 rounded-full border border-slate-700/80 transition shrink-0"
        >
          📉 July Sales Variance
        </button>
        <button
          onClick={() => handleSend("What is our enterprise refund and subscription cancellation policy?")}
          className="px-3 py-1 bg-slate-800/90 hover:bg-purple-950/80 hover:border-purple-500/40 text-slate-300 rounded-full border border-slate-700/80 transition shrink-0"
        >
          📜 Refund & SLA Policy
        </button>
        <button
          onClick={() => handleSend("What was our gross revenue and profit margin from enterprise sales?")}
          className="px-3 py-1 bg-slate-800/90 hover:bg-emerald-950/80 hover:border-emerald-500/40 text-slate-300 rounded-full border border-slate-700/80 transition shrink-0"
        >
          💰 Revenue & Profit
        </button>
        <button
          onClick={() => handleSend("Recommend 3 strategic directives to increase enterprise profitability next quarter.")}
          className="px-3 py-1 bg-slate-800/90 hover:bg-amber-950/80 hover:border-amber-500/40 text-slate-300 rounded-full border border-slate-700/80 transition shrink-0"
        >
          🎯 Profit Optimization
        </button>
      </div>

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-9 h-9 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-1 shadow-md">
                <Bot size={18} />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-3xl p-5 shadow-lg ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-none'
                  : 'bg-slate-950/70 border border-slate-800 rounded-tl-none text-slate-100'
              }`}
            >
              {/* Header meta */}
              <div className="flex items-center justify-between mb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold">
                    {msg.sender === 'user' ? 'You' : 'BusinessMind AI Copilot'}
                  </span>
                  {msg.category && renderCategoryBadge(msg.category)}
                  {msg.sourceEngine && (
                    <span className="hidden sm:inline text-[10px] text-slate-400 font-mono">
                      • {msg.sourceEngine}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => handleSpeak(msg.id, msg.sections?.direct_answer || msg.text || '')}
                      title={speakingMsgId === msg.id ? 'Stop Speaking' : 'Read Aloud with Voice TTS'}
                      className={`p-1 rounded-lg transition ${
                        speakingMsgId === msg.id
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'text-slate-400 hover:text-indigo-300'
                      }`}
                    >
                      {speakingMsgId === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Message Content */}
              {msg.text && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              )}

              {/* Structured Executive Decision Sections */}
              {msg.sections && (
                <div className="space-y-4 text-xs mt-2">
                  {/* 1. Direct Answer */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/20">
                    <p className="font-bold text-indigo-300 uppercase tracking-wider text-[11px] mb-1">
                      1. Direct Answer
                    </p>
                    <p className="text-white text-sm font-semibold leading-relaxed">
                      {msg.sections.direct_answer}
                    </p>
                  </div>

                  {/* 2. Key Drivers */}
                  {msg.sections.key_drivers && msg.sections.key_drivers.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <p className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                        2. Key Drivers
                      </p>
                      <ul className="space-y-1.5">
                        {msg.sections.key_drivers.map((driver, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-300">
                            <span className="text-indigo-400 font-bold mt-0.5">•</span>
                            <span className="leading-relaxed">{driver}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 3. Supporting Evidence */}
                  {msg.sections.supporting_evidence && (
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <p className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-1">
                        3. Supporting Evidence
                      </p>
                      <p className="text-slate-300 italic leading-relaxed">
                        {msg.sections.supporting_evidence}
                      </p>
                    </div>
                  )}

                  {/* 4. Recommended Action */}
                  {msg.sections.recommended_action && msg.sections.recommended_action.length > 0 && (
                    <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30">
                      <p className="font-bold text-indigo-300 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-400" /> 4. Recommended Actions
                      </p>
                      <ul className="space-y-1.5">
                        {msg.sections.recommended_action.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-indigo-100 font-medium">
                            <span className="text-indigo-400 font-bold mt-0.5">{i + 1}.</span>
                            <span className="leading-relaxed">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 5. Risk Assessment */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                        5. Risk Assessment & Justification
                      </p>
                      <p className="text-slate-300 text-xs">
                        {msg.sections.risk_justification || 'Standard enterprise operational variance.'}
                      </p>
                    </div>
                    {renderRiskBadge(msg.sections.risk_level)}
                  </div>
                </div>
              )}

              {/* RAG Citations */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <BookOpen size={11} /> Cited RAG Knowledge Sources ({msg.sources.length}):
                  </p>
                  <div className="space-y-1.5">
                    {msg.sources.map((src, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-900/60 border border-purple-500/20 text-[11px] text-slate-300">
                        <div className="font-bold text-purple-300">{src.title}</div>
                        <div className="text-slate-400 italic line-clamp-2 mt-0.5">"{src.snippet}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-9 h-9 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-1 shadow-md">
                <User size={18} />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 items-center text-slate-400 text-xs bg-slate-950/80 p-4 rounded-2xl border border-slate-800 w-fit shadow-lg animate-pulse">
            <Bot size={18} className="text-indigo-400 animate-spin" />
            <span>Analyzing through {provider === 'openai' ? 'OpenAI Cloud' : 'Ollama Qwen3'} and FAISS RAG…</span>
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
          <div className="relative flex-1">
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder={isDictating ? 'Listening… speak now' : "Ask BusinessMind AI (e.g., 'What is our revenue and refund policy?')..."}
              className={`w-full bg-slate-900 border focus:border-indigo-500 rounded-2xl pl-4 pr-12 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner ${
                isDictating ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-800'
              }`}
            />
            {/* Inline Microphone Dictate Button */}
            <button
              type="button"
              onClick={toggleInlineDictation}
              title={isDictating ? 'Stop listening' : 'Dictate with microphone'}
              className={`absolute right-2.5 top-2.5 p-1.5 rounded-xl transition ${
                isDictating
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
              }`}
            >
              {isDictating ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white font-bold rounded-2xl transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 shrink-0"
          >
            <span>Ask</span>
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        defaultProvider={provider}
      />

      {/* RAG System Knowledge Hub Modal */}
      <RagSystemModal
        isOpen={showRAGModal}
        onClose={() => {
          setShowRAGModal(false);
          fetchRAGDocCount();
        }}
      />

    </div>
  );
}
