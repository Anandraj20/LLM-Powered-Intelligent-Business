'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Play,
  Square,
  Pause,
  RefreshCw,
  X,
  Cpu,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Send,
  Sliders,
  Key
} from 'lucide-react';

interface VoiceAssignment {
  id: string;
  title: string;
  category: string;
  question: string;
  iconColor: string;
}

const VOICE_ASSIGNMENTS: VoiceAssignment[] = [
  {
    id: 'financial-briefing',
    title: 'Financial Health Briefing',
    category: 'Executive Finance',
    question: 'Provide an executive summary of our total revenue, net profit margin, and current financial trajectory.',
    iconColor: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'policy-compliance',
    title: 'Refund & SLA Policy',
    category: 'Corporate Governance',
    question: 'What is our corporate policy regarding annual subscription refunds, contract cancellations, and SLA uptime credits?',
    iconColor: 'from-purple-500 to-indigo-600'
  },
  {
    id: 'seasonal-dip',
    title: 'July Seasonal Sales Dip',
    category: 'Sales Strategy',
    question: 'Why did sales decrease in July, and what actionable directives should management immediately execute?',
    iconColor: 'from-amber-500 to-orange-600'
  },
  {
    id: 'margin-defense',
    title: 'Margin Optimization Directive',
    category: 'Cost Optimization',
    question: 'How can we increase our overall profit margin by 5% over the next two quarters through category shifting and cost control?',
    iconColor: 'from-rose-500 to-pink-600'
  }
];

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProvider?: 'auto' | 'ollama' | 'openai';
}

export function VoiceAssistantModal({ isOpen, onClose, defaultProvider = 'auto' }: VoiceAssistantModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [provider, setProvider] = useState<'auto' | 'ollama' | 'openai'>(defaultProvider);
  const [customApiKey, setCustomApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [volumeMuted, setVolumeMuted] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);
  const [activeTab, setActiveTab] = useState<'conversation' | 'assignments'>('conversation');
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string; source?: string }>>([]);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Speech Recognition & Synthesis on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          if (final) {
            setTranscript(prev => (prev ? `${prev} ${final}` : final).trim());
            setInterimTranscript('');
          } else {
            setInterimTranscript(currentInterim);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition notice:', event.error);
          if (event.error === 'not-allowed') {
            alert('Microphone permission is required for voice conversation. Please allow microphone access in your browser.');
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }

      if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (synthRef.current) {
        try { synthRef.current.cancel(); } catch {}
      }
    };
  }, []);

  // Stop speech synthesis when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (recognitionRef.current && isListening) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      setIsSpeaking(false);
    }
  }, [isOpen, isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported on this browser. You can type in the prompt box instead.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    } else {
      // If speaking, stop playback first
      stopSpeaking();
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Recognition start warning:', err);
        setIsListening(false);
      }
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  const speakText = (textToSpeak: string) => {
    if (!synthRef.current || volumeMuted || !textToSpeak) return;

    synthRef.current.cancel();

    // Clean markdown before vocalization
    const cleaned = textToSpeak
      .replace(/[#*`_~]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate = voiceSpeed;
    utterance.pitch = 1.0;

    // Pick an executive natural English voice if available
    const voices = synthRef.current.getVoices();
    const naturalVoice = voices.find(v => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en')) || voices.find(v => v.lang.startsWith('en'));
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const handleAsk = async (questionText?: string) => {
    const query = questionText || transcript;
    if (!query || !query.trim() || isLoading) return;

    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    }

    setIsLoading(true);
    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setHistory(prev => [
      ...prev,
      { role: 'user', text: query.trim(), time: userTimestamp }
    ]);

    try {
      const response = await fetch('/api/v1/ai/voice/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-openai-key': customApiKey } : {})
        },
        body: JSON.stringify({
          question: query.trim(),
          provider,
          apiKey: customApiKey || undefined
        })
      });

      const json = await response.json();
      if (!json.success) {
        throw new Error(json.message || 'Failed to generate voice response');
      }

      setAiResponse(json);
      const spokenText = json.voice_text || json.data?.voice_text || json.data?.direct_answer || 'Analysis complete.';

      setHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          text: spokenText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: json.source
        }
      ]);

      // Speak aloud immediately
      speakText(spokenText);
      setTranscript('');
      setInterimTranscript('');

    } catch (err: any) {
      const errorFallback = `I encountered an issue connecting to the AI voice pipeline: ${err.message}. Please check your network connection or verify that local Ollama is active.`;
      setHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          text: errorFallback,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'System Diagnostic Error'
        }
      ]);
      speakText(errorFallback);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignmentSelect = (assignment: VoiceAssignment) => {
    setTranscript(assignment.question);
    setActiveTab('conversation');
    handleAsk(assignment.question);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl shadow-2xl shadow-indigo-500/10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Glow effects */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Bar */}
        <div className="relative z-10 px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">BusinessMind AI Voice Copilot</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/60 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-violet-400 animate-ping' : isListening ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
                  {isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Ready'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Real-time voice assignment & decision intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Engine Selector */}
            <div className="hidden sm:flex items-center bg-slate-800/80 border border-slate-700 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setProvider('auto')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${provider === 'auto' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Auto Dual
              </button>
              <button
                onClick={() => setProvider('openai')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${provider === 'openai' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <Cloud size={12} /> OpenAI
              </button>
              <button
                onClick={() => setProvider('ollama')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${provider === 'ollama' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <Cpu size={12} /> Ollama Qwen3
              </button>
            </div>

            {/* Custom Key Toggle */}
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              title="Configure Custom OpenAI Key"
              className={`p-2 rounded-xl border text-xs transition ${showKeyInput || customApiKey ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'}`}
            >
              <Key size={16} />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Custom API Key Collapsible Bar */}
        {showKeyInput && (
          <div className="px-6 py-3 bg-indigo-950/40 border-b border-indigo-500/20 flex flex-col sm:flex-row items-center gap-3 text-xs">
            <span className="text-indigo-300 font-semibold whitespace-nowrap flex items-center gap-1.5">
              <Key size={14} /> Optional OpenAI API Key:
            </span>
            <input
              type="password"
              placeholder="sk-proj-..."
              value={customApiKey}
              onChange={e => setCustomApiKey(e.target.value)}
              className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[11px] text-slate-400">Stored in browser session for cloud voice reasoning</span>
          </div>
        )}

        {/* Tab Bar: Active Conversation vs Voice Assignments */}
        <div className="px-6 py-2 bg-slate-950/30 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('conversation')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'conversation' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Voice Conversation
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'assignments' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Voice Assignments ({VOICE_ASSIGNMENTS.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {activeTab === 'assignments' ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-white">Select a Business Voice Assignment</h3>
                <p className="text-xs text-slate-400">Click any executive scenario to conduct an interactive verbal assessment with AI.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {VOICE_ASSIGNMENTS.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleAssignmentSelect(item)}
                    className="p-5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] shadow-lg flex flex-col justify-between group space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-indigo-300 border border-slate-700 uppercase tracking-wider">
                        {item.category}
                      </span>
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${item.iconColor} flex items-center justify-center text-white shadow-md`}>
                        <Play size={14} className="ml-0.5 group-hover:scale-110 transition" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed italic">"{item.question}"</p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-semibold group-hover:text-indigo-300">
                      <span>Begin Voice Assignment</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Soundwave Interactive Visualizer & Mic Central Pod */}
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="flex items-center gap-1.5 h-16 mb-4">
                  {[...Array(24)].map((_, i) => {
                    const isAnim = isListening || isSpeaking;
                    const height = isAnim
                      ? Math.max(15, Math.sin((i + Date.now() / 100) * 0.5) * 80 + 20)
                      : 8;
                    return (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-150 ${
                          isListening
                            ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                            : isSpeaking
                            ? 'bg-gradient-to-t from-violet-600 to-indigo-400 shadow-sm shadow-indigo-500/50'
                            : 'bg-slate-700'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>

                {/* Central Action Button */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleListening}
                    disabled={isLoading}
                    className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-white transition-all shadow-2xl ${
                      isListening
                        ? 'bg-rose-600 shadow-rose-600/40 animate-pulse ring-4 ring-rose-500/30'
                        : 'bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-600/40 hover:scale-105'
                    }`}
                  >
                    {isListening ? <MicOff size={28} /> : <Mic size={28} />}
                  </button>

                  {isSpeaking && (
                    <button
                      onClick={stopSpeaking}
                      title="Stop Speaking"
                      className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 flex items-center justify-center transition shadow-lg"
                    >
                      <Square size={18} />
                    </button>
                  )}
                </div>

                <p className="text-xs font-semibold text-slate-300 mt-4">
                  {isListening
                    ? 'Listening… Speak your question now'
                    : isSpeaking
                    ? 'AI Copilot is speaking aloud…'
                    : isLoading
                    ? 'Synthesizing executive intelligence…'
                    : 'Click microphone to speak or type below'}
                </p>

                {/* Live Transcript Preview */}
                {(transcript || interimTranscript) && (
                  <div className="mt-4 max-w-lg w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 text-center shadow-inner">
                    <span className="font-semibold text-indigo-400">Heard: </span>
                    <span>{transcript}</span>
                    <span className="text-slate-500 italic"> {interimTranscript}</span>
                  </div>
                )}
              </div>

              {/* Conversation Log */}
              {history.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversation Log</h4>
                  {history.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-2xl border ${
                        msg.role === 'user'
                          ? 'bg-slate-900/70 border-slate-800 ml-8'
                          : 'bg-indigo-950/20 border-indigo-500/30 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${msg.role === 'user' ? 'text-slate-300' : 'text-indigo-300'}`}>
                            {msg.role === 'user' ? 'You' : 'BusinessMind AI Copilot'}
                          </span>
                          {msg.source && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                              {msg.source}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">{msg.time}</span>
                          {msg.role === 'assistant' && (
                            <button
                              onClick={() => speakText(msg.text)}
                              title="Listen Again"
                              className="text-slate-400 hover:text-indigo-300 transition"
                            >
                              <Volume2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Bottom Input & Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder={isListening ? 'Listening…' : 'Type or speak your business query…'}
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAsk();
              }}
              disabled={isLoading}
              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-4 pr-12 py-3 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              onClick={() => handleAsk()}
              disabled={!transcript.trim() || isLoading}
              className="absolute right-2 top-2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition shadow-md"
            >
              <Send size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Mute/Unmute TTS */}
            <button
              onClick={() => {
                setVolumeMuted(!volumeMuted);
                if (!volumeMuted) stopSpeaking();
              }}
              className={`p-2.5 rounded-xl border text-xs transition ${
                volumeMuted
                  ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
              title={volumeMuted ? 'Unmute Audio Speech' : 'Mute Audio Speech'}
            >
              {volumeMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Speed Selector */}
            <select
              value={voiceSpeed}
              onChange={e => setVoiceSpeed(parseFloat(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none"
              title="Voice Speed"
            >
              <option value="0.85">0.85x</option>
              <option value="1.0">1.0x (Normal)</option>
              <option value="1.15">1.15x (Fast)</option>
              <option value="1.3">1.3x</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  );
}
