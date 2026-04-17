'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { 
  BarChart3, 
  Target, 
  Wind, 
  Zap, 
  ShieldCheck, 
  Layers,
  Activity,
  ArrowUpRight
} from 'lucide-react';

interface AztekBenchProps {
  aztekScore: number;
  competitorScore: number;
  mirofishScore: number;
  leadHours: number;
}

export const AztekBench: React.FC<AztekBenchProps> = ({ 
  aztekScore, 
  competitorScore, 
  mirofishScore,
  leadHours
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Hero Metric: Fidelity Accuracy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/40 border border-[#b2ff00]/20 p-5 rounded-xl flex flex-col items-center justify-center text-center">
          <Target className="w-8 h-8 text-[#b2ff00] mb-3 opacity-80" />
          <span className="text-xs uppercase tracking-widest text-zinc-500 mb-1">{t('accuracy')}</span>
          <span className="text-4xl font-black text-[#b2ff00] font-mono">{aztekScore}%</span>
          <div className="mt-3 w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#b2ff00] h-full" style={{ width: `${aztekScore}%` }} />
          </div>
        </div>

        <div className="bg-black/40 border border-blue-500/20 p-5 rounded-xl flex flex-col items-center justify-center text-center">
          <Layers className="w-8 h-8 text-blue-400 mb-3 opacity-80" />
          <span className="text-xs uppercase tracking-widest text-zinc-500 mb-1">{t('diversity')}</span>
          <span className="text-4xl font-black text-blue-400 font-mono">0.98</span>
          <span className="text-[10px] text-zinc-600 mt-1 italic">Identity Entropy Index</span>
        </div>

        <div className="bg-black/40 border border-purple-500/20 p-5 rounded-xl flex flex-col items-center justify-center text-center">
          <Zap className="w-8 h-8 text-purple-400 mb-3 opacity-80" />
          <span className="text-xs uppercase tracking-widest text-zinc-500 mb-1">{t('predictionLead')}</span>
          <span className="text-4xl font-black text-purple-400 font-mono">+{leadHours}h</span>
          <span className="text-[10px] text-zinc-600 mt-1 italic">vs Ground Truth Event</span>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="bg-black/40 border border-zinc-800 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-[#b2ff00]" />
            <h3 className="font-bold text-lg uppercase tracking-wider">{t('convergence')}</h3>
          </div>
          <div className="bg-[#b2ff00]/10 text-[#b2ff00] text-[10px] px-2 py-0.5 rounded border border-[#b2ff00]/20 font-mono">
            LIVE_TELEMETRY
          </div>
        </div>

        <div className="space-y-8">
          {/* Aztek Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#b2ff00] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> AZTEK SOTA (Multi-Agent)
              </span>
              <span className="font-mono text-[#b2ff00]">{aztekScore}%</span>
            </div>
            <div className="relative w-full bg-zinc-900/50 h-6 rounded-lg border border-zinc-800 overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#b2ff00]/40 to-[#b2ff00] transition-all duration-1000 ease-out"
                style={{ width: `${aztekScore}%` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:20px_20px] animate-[pulse_2s_infinite]" />
              </div>
            </div>
          </div>

          {/* Competitor Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">GPT-5.4 / Claude 4.6 (Sovereign LLMs)</span>
              <span className="font-mono text-zinc-400">{competitorScore}%</span>
            </div>
            <div className="w-full bg-zinc-900/50 h-4 rounded-md border border-zinc-800 overflow-hidden">
              <div 
                className="h-full bg-zinc-700 transition-all duration-1000 ease-out"
                style={{ width: `${competitorScore}%` }}
              />
            </div>
          </div>

          {/* Mirofish Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-500 italic">Mirofish (Qualitative Narrative)</span>
              <span className="font-mono text-zinc-500">{mirofishScore}%</span>
            </div>
            <div className="w-full bg-zinc-900/50 h-3 rounded-md border border-zinc-800 overflow-hidden">
              <div 
                className="h-full bg-zinc-800 transition-all duration-1000 ease-out"
                style={{ width: `${mirofishScore}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-800 text-[10px] text-zinc-500 flex justify-between">
          <p>* Testing Protocol: Temporal Isolation (24h Blind Window)</p>
          <p>Source: Aztek Labs | 2026.04.17</p>
        </div>
      </div>

      {/* Event Study Note */}
      <div className="p-4 bg-gradient-to-br from-[#b2ff00]/5 to-transparent border border-[#b2ff00]/10 rounded-xl relative overflow-hidden group">
        <ArrowUpRight className="absolute top-2 right-2 w-4 h-4 text-[#b2ff00] opacity-30 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        <h4 className="text-xs font-bold text-[#b2ff00] mb-2 flex items-center gap-2">
          <Activity className="w-3 h-3" /> {t('brentOilCase')}
        </h4>
        <p className="text-[11px] text-zinc-400 leading-relaxed italic">
          Aztek agents identified a 5.2% War Risk premium divergence 18 hours before market open. 
          Consensus LLM predictions failed to account for route blockages, lagging by 11.4%.
        </p>
      </div>
    </div>
  );
};
