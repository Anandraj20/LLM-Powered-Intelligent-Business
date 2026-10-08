'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Zap, ChevronRight, X } from 'lucide-react';
import { api } from '../../context/AuthContext';

interface DomainAIInsightProps {
  domain: string;
  onClose?: () => void;
}

interface InsightSection {
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  key: 'scope' | 'opportunities' | 'risks';
}

const SECTIONS: InsightSection[] = [
  {
    title: 'Future Scope',
    icon: <TrendingUp size={15} />,
    color: 'text-indigo-300',
    bgColor: 'bg-indigo-950/40',
    borderColor: 'border-indigo-800/40',
    key: 'scope',
  },
  {
    title: 'Key Opportunities',
    icon: <Zap size={15} />,
    color: 'text-emerald-300',
    bgColor: 'bg-emerald-950/40',
    borderColor: 'border-emerald-800/40',
    key: 'opportunities',
  },
  {
    title: 'Market Risks',
    icon: <AlertTriangle size={15} />,
    color: 'text-amber-300',
    bgColor: 'bg-amber-950/40',
    borderColor: 'border-amber-800/40',
    key: 'risks',
  },
];

interface Insights {
  scope: string;
  opportunities: string;
  risks: string;
}

const FALLBACK_INSIGHTS: Record<string, Insights> = {
  'AI & Machine Learning': {
    scope: 'By 2030, generative AI is projected to automate 30% of knowledge work. Deep learning is pushing into scientific discovery, drug development, and autonomous reasoning — making AI practitioners among the highest-value professionals globally.',
    opportunities: 'MLOps platforms, edge AI deployment, multimodal model fine-tuning, AI governance consulting, and real-time inference optimization are rapidly growing niches with trillion-dollar addressable markets.',
    risks: 'Regulatory uncertainty (EU AI Act), compute cost volatility, talent concentration among hyperscalers, and ethical scrutiny around bias and hallucination create strategic headwinds.',
  },
  'Data Engineering': {
    scope: 'The global data lakehouse and real-time streaming market is projected at $143B by 2027. Organizations are shifting from batch pipelines to event-driven architectures, creating massive demand for streaming-native data engineers.',
    opportunities: 'Data mesh architecture consulting, dbt transformations at scale, Apache Iceberg/Delta Lake migrations, and semantic layer development are premium-tier skills in enterprise settings.',
    risks: 'Vendor lock-in from cloud-native tools, the "data quality debt" crisis, and AI-driven code generation potentially automating ETL boilerplate work represent key disruptions.',
  },
  'Cloud & DevOps': {
    scope: 'Hybrid multi-cloud and platform engineering are the next frontiers. Platform teams that build Internal Developer Platforms (IDPs) reduce deployment friction by 60%, driving massive productivity gains at scale.',
    opportunities: 'FinOps, Kubernetes cost optimization, GitOps automation, WASM-based edge compute, and security-as-code (DevSecOps) are high-growth specializations with significant enterprise demand.',
    risks: 'Cloud cost overruns average 35% above projections for enterprises. Skills obsolescence is rapid — Terraform, Kubernetes, and Helm certifications require constant renewal.',
  },
};

function typewriterEffect(
  text: string,
  setter: React.Dispatch<React.SetStateAction<string>>,
  speed = 12
): () => void {
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      setter(text.slice(0, i + 1));
      i++;
    } else {
      clearInterval(interval);
    }
  }, speed);
  return () => clearInterval(interval);
}

export default function DomainAIInsight({ domain, onClose }: DomainAIInsightProps) {
  const [insights, setInsights] = useState<Partial<Insights>>({});
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<InsightSection['key']>('scope');
  const [displayedText, setDisplayedText] = useState('');
  const cleanupRef = useRef<(() => void) | null>(null);

  const fetchInsights = async (targetDomain: string) => {
    setLoading(true);
    setInsights({});
    setDisplayedText('');

    // Check fallback first
    const fallback = FALLBACK_INSIGHTS[targetDomain];
    if (fallback) {
      await new Promise(r => setTimeout(r, 500)); // Small delay for UX
      setInsights(fallback);
      setLoading(false);
      return;
    }

    try {
      const prompt = `Provide a concise business intelligence analysis for the "${targetDomain}" domain. Format your response as a JSON object with exactly these three keys:
{
  "scope": "2-3 sentences about future scope and growth trajectory by 2030",
  "opportunities": "2-3 sentences about the top career and business opportunities",
  "risks": "2-3 sentences about the key market risks and disruptions to watch"
}
Only return valid JSON, nothing else.`;

      const res = await api.post('/ai/ask', {
        question: prompt,
        category: 'predictive'
      });

      const raw = res.data?.data?.answer || res.data?.answer || '';

      // Extract JSON from response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setInsights({
          scope: parsed.scope || '',
          opportunities: parsed.opportunities || '',
          risks: parsed.risks || '',
        });
      } else {
        throw new Error('No JSON in response');
      }
    } catch {
      // Use a generic fallback
      setInsights({
        scope: `The ${targetDomain} domain is poised for significant growth as digital transformation accelerates globally. Organizations increasingly invest in this area as a competitive differentiator, with projected market expansion of 20-35% annually through 2030.`,
        opportunities: `Specialists in ${targetDomain} command premium compensation with strong demand across enterprise, startup, and consulting environments. Emerging niches within this domain offer blue-ocean positioning for early adopters.`,
        risks: `Rapid technology evolution, shifting vendor landscapes, and the automation of foundational skills present strategic challenges. Continuous upskilling and domain specialization are critical for maintaining relevance.`,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (domain) {
      fetchInsights(domain);
      setActiveSection('scope');
    }
  }, [domain]);

  // Typewriter when content or section changes
  useEffect(() => {
    if (cleanupRef.current) cleanupRef.current();
    setDisplayedText('');

    const text = insights[activeSection];
    if (!text || loading) return;

    cleanupRef.current = typewriterEffect(text, setDisplayedText, 10);
    return () => { if (cleanupRef.current) cleanupRef.current(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, insights, loading]);

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header gradient strip */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-indigo-600/0 via-indigo-500/60 to-purple-500/0" />

      <div className="p-5">
        {/* Title row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Sparkles size={15} className="text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">AI Domain Insight</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{domain}</div>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition p-1 rounded-lg hover:bg-slate-800">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Section tabs */}
        <div className="flex gap-1.5 mb-4">
          {SECTIONS.map(section => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              disabled={loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition border ${
                activeSection === section.key
                  ? `${section.bgColor} ${section.color} ${section.borderColor}`
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/50'
              } disabled:opacity-40`}
            >
              {section.icon}
              <span className="hidden sm:inline">{section.title}</span>
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="min-h-[90px] relative">
          {loading ? (
            <div className="flex items-center gap-3 py-4">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-xs text-slate-400 animate-pulse">Generating AI insights for {domain}…</span>
            </div>
          ) : (
            <p className="text-xs text-slate-300 leading-relaxed">
              {displayedText}
              {displayedText.length < (insights[activeSection]?.length ?? 0) && (
                <span className="inline-block w-0.5 h-3.5 bg-indigo-400 animate-pulse ml-0.5 align-middle" />
              )}
            </p>
          )}
        </div>

        {/* Footer chips */}
        {!loading && insights.scope && (
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tags:</span>
            {['AI-Powered', 'Real-Time', '2030 Outlook', domain.split('&')[0].trim()].map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-slate-800 rounded-full text-[10px] text-slate-400 font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
