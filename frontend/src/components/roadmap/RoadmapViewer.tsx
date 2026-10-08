'use client';

import React, { useState } from 'react';
import { BusinessDomain } from '../../data/businessDomains';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  TrendingUp, 
  Globe2, 
  ListChecks, 
  Sparkles, 
  Clock, 
  Target, 
  Zap, 
  ShieldAlert, 
  Cpu, 
  Database, 
  DollarSign, 
  ArrowUpRight,
  ChevronRight,
  BarChart3,
  Boxes
} from 'lucide-react';

interface RoadmapViewerProps {
  domain: BusinessDomain;
  onOpenAiAnalysis: (presetPrompt?: string) => void;
}

export default function RoadmapViewer({ domain, onOpenAiAnalysis }: RoadmapViewerProps) {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'features' | 'growth' | 'scenario' | 'guide'>('roadmap');

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 relative overflow-hidden transition-all duration-300">
      {/* Ambient background glow inside card */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Domain Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {domain.category}
            </span>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              {domain.badge}
            </span>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {domain.maturity}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            {domain.name}
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            {domain.description}
          </p>
        </div>

        {/* Live CTA for OpenAI Analysis */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            onClick={() => onOpenAiAnalysis()}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 group"
          >
            <Sparkles size={16} className="text-indigo-200 group-hover:rotate-12 transition-transform" />
            <span>Run Live OpenAI Scenario Analysis</span>
            <ArrowUpRight size={16} className="text-indigo-200" />
          </button>
        </div>
      </div>

      {/* Market Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium">Total Addressable Market (TAM)</div>
          <div className="text-lg sm:text-xl font-bold text-white mt-1">{domain.tam}</div>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium">Projected Growth (CAGR)</div>
          <div className="text-lg sm:text-xl font-bold text-emerald-400 mt-1">{domain.cagr}</div>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium">Target Gross Margin</div>
          <div className="text-lg sm:text-xl font-bold text-indigo-400 mt-1">{domain.growthMetrics.targetMargin}</div>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium">Target LTV : CAC</div>
          <div className="text-lg sm:text-xl font-bold text-purple-400 mt-1">{domain.growthMetrics.ltvCac}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 no-scrollbar">
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'roadmap'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers size={16} /> Full 4-Phase Roadmap
        </button>

        <button
          onClick={() => setActiveTab('features')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'features'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Cpu size={16} /> Key Features & Tech Stack
        </button>

        <button
          onClick={() => setActiveTab('growth')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'growth'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <TrendingUp size={16} /> Business Growth & Financial KPIs
        </button>

        <button
          onClick={() => setActiveTab('scenario')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'scenario'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Globe2 size={16} /> Current World Scenario (2025/2026)
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'guide'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ListChecks size={16} /> Step-by-Step Strategic Instructions
        </button>
      </div>

      {/* TAB 1: 4-PHASE ROADMAP */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-indigo-400" />
              Chronological 4-Phase Execution Blueprint
            </h3>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              End-to-End Inception to Global Market Leadership
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {domain.roadmap.map((item) => (
              <div
                key={item.phase}
                className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-6 space-y-4 hover:border-indigo-500/40 transition-all shadow-md group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 text-sm">
                      {item.phase}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-indigo-400/90 font-medium">
                        <Clock size={12} /> {item.timeframe}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                  <span className="font-semibold text-slate-200">Objective:</span> {item.goal}
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400" /> Key Milestones:
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-400">
                    {item.milestones.map((m, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-400 text-base leading-none">•</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Boxes size={13} className="text-purple-400" /> Primary Deliverables:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.deliverables.map((deliv, idx) => (
                      <span key={idx} className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                        {deliv}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-400">
                    <AlertTriangle size={12} className="shrink-0" />
                    <span className="font-semibold">Primary Risk:</span>
                    <span className="text-slate-400">{item.risks}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: KEY FEATURES & TECH STACK */}
      {activeTab === 'features' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Cpu size={18} className="text-indigo-400" />
              Essential Competitive Capabilities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {domain.keyFeatures.map((feat, idx) => (
                <div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm">{feat.title}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      feat.priority === 'Critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : feat.priority === 'Strategic'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {feat.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Database size={18} className="text-purple-400" />
              Recommended Production Enterprise Tech Stack
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Frontend Layer</div>
                <div className="flex flex-wrap gap-1.5">
                  {domain.techStack.frontend.map((tech, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-indigo-950/40 text-indigo-200 border border-indigo-800/40">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">Backend & Microservices</div>
                <div className="flex flex-wrap gap-1.5">
                  {domain.techStack.backend.map((tech, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-purple-950/40 text-purple-200 border border-purple-800/40">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="text-xs font-bold text-pink-400 uppercase tracking-wider">AI & Machine Learning</div>
                <div className="flex flex-wrap gap-1.5">
                  {domain.techStack.aiModels.map((tech, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-pink-950/40 text-pink-200 border border-pink-800/40">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Database & Storage</div>
                <div className="flex flex-wrap gap-1.5">
                  {domain.techStack.database.map((tech, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-emerald-950/40 text-emerald-200 border border-emerald-800/40">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Cloud & Orchestration</div>
                <div className="flex flex-wrap gap-1.5">
                  {domain.techStack.infrastructure.map((tech, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-cyan-950/40 text-cyan-200 border border-cyan-800/40">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Security & Compliance</div>
                <div className="flex flex-wrap gap-1.5">
                  {domain.techStack.compliance.map((tech, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-amber-950/40 text-amber-200 border border-amber-800/40">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BUSINESS GROWTH & FINANCIALS */}
      {activeTab === 'growth' && (
        <div className="space-y-6">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" />
            Financial Targets & Sustainable Unit Economics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="text-xs text-slate-400 font-medium">Target Gross Margin</div>
              <div className="text-2xl font-extrabold text-emerald-400">{domain.growthMetrics.targetMargin}</div>
              <p className="text-[11px] text-slate-400">Protects cash flow to reinvest in R&D and enterprise customer acquisition.</p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="text-xs text-slate-400 font-medium">Customer Lifetime Value : CAC</div>
              <div className="text-2xl font-extrabold text-indigo-400">{domain.growthMetrics.ltvCac}</div>
              <p className="text-[11px] text-slate-400">Ratio above 4.0x guarantees healthy payback and capital efficiency.</p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="text-xs text-slate-400 font-medium">CAC Payback Period</div>
              <div className="text-2xl font-extrabold text-purple-400">{domain.growthMetrics.paybackPeriod}</div>
              <p className="text-[11px] text-slate-400">Time required to fully recoup sales & marketing customer acquisition cost.</p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="text-xs text-slate-400 font-medium">Net Revenue Retention (NRR)</div>
              <div className="text-2xl font-extrabold text-pink-400">{domain.growthMetrics.netRetention}</div>
              <p className="text-[11px] text-slate-400">Compound annual revenue expansion from existing account upsells.</p>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <BarChart3 size={16} className="text-indigo-400" />
              Core North Star Performance Indicators (KPIs)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {domain.growthMetrics.primaryKpis.map((kpi, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <span className="font-medium">{kpi}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CURRENT WORLD SCENARIO (2025/2026) */}
      {activeTab === 'scenario' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-950/50 via-slate-900 to-purple-950/50 border border-indigo-500/30 rounded-2xl p-6 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Globe2 size={14} /> 2025/2026 Macro Environment Executive Brief
            </div>
            <p className="text-white text-sm sm:text-base leading-relaxed">
              {domain.worldScenario.marketContext2025}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950/70 border border-emerald-900/40 rounded-2xl p-6 space-y-3">
              <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                <TrendingUp size={16} /> Market Tailwinds & Growth Accelerators
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-300">
                {domain.worldScenario.tailwinds.map((tw, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{tw}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-950/70 border border-rose-900/40 rounded-2xl p-6 space-y-3">
              <h4 className="font-bold text-rose-400 text-sm flex items-center gap-2">
                <AlertTriangle size={16} /> Industry Headwinds & Structural Risks
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-300">
                {domain.worldScenario.headwinds.map((hw, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">!</span>
                    <span>{hw}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h4 className="font-bold text-indigo-300 text-sm flex items-center gap-2">
              <Zap size={16} className="text-indigo-400" />
              Strategic Recommendations for Market Leadership
            </h4>
            <div className="space-y-2.5">
              {domain.worldScenario.strategicRecommendations.map((rec, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: STEP-BY-STEP STRATEGIC INSTRUCTIONS */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ListChecks size={18} className="text-indigo-400" />
              Actionable Tactical Execution Playbook
            </h3>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Step-by-Step Directives from Inception to Scale
            </span>
          </div>

          <div className="space-y-4">
            {domain.stepByStepGuide.map((stepItem) => (
              <div
                key={stepItem.step}
                className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center">
                      {stepItem.step}
                    </span>
                    <h4 className="font-bold text-white text-sm sm:text-base">
                      {stepItem.title}
                    </h4>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 text-indigo-400 border border-slate-800 w-fit">
                    {stepItem.timeline}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">Action Items:</div>
                  <ul className="space-y-1.5 text-xs text-slate-400">
                    {stepItem.instructions.map((inst, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-indigo-400 mt-0.5 shrink-0" />
                        <span>{inst}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-start gap-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <span className="font-semibold text-rose-200">Critical Pitfall to Avoid: </span>
                    <span className="text-rose-300/90">{stepItem.keyPitfall}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested AI Scenario Prompts for Selected Domain */}
      <div className="pt-4 border-t border-slate-800">
        <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
          <Sparkles size={14} className="text-indigo-400" />
          <span>Quick AI Scenario Inquiries for {domain.name}:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {domain.aiPromptPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => onOpenAiAnalysis(preset)}
              className="text-xs text-slate-300 hover:text-white bg-slate-950/80 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 px-3.5 py-2 rounded-xl transition text-left flex items-center gap-2 group"
            >
              <span>{preset}</span>
              <ChevronRight size={12} className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
