'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import { AztekBench } from '@/components/AztekBench';
import { 
  ChevronLeft, 
  BarChart3, 
  Target, 
  Network,
  Cpu,
  Globe,
  Lock,
  ExternalLink
} from 'lucide-react';

export default function BenchmarksPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 font-sans selection:bg-[#b2ff00] selection:text-black">
      {/* HUD Header */}
      <header className="border-b border-zinc-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 hover:bg-zinc-900 rounded-lg transition-colors group"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-500 group-hover:text-white" />
            </Link>
            <div className="h-6 w-[1px] bg-zinc-800" />
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-[#b2ff00]" />
              <h1 className="font-black uppercase tracking-tighter text-lg">{t('benchmarks')}</h1>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#b2ff00] animate-pulse" />
              SYSTEM_SOTA_VERIFIED
            </div>
            <span>LOC: GLOBAL_SIM_CLUSTER</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Context & Scientific Defense */}
          <div className="lg:col-span-4 space-y-12">
            <section className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#b2ff00]/10 border border-[#b2ff00]/20 rounded-full">
                <Target className="w-3 h-3 text-[#b2ff00]" />
                <span className="text-[10px] font-bold text-[#b2ff00] uppercase tracking-wider">{t('blindTest')}</span>
              </div>
              <h2 className="text-4xl font-black leading-tight tracking-tighter italic">
                SOTA EVIDENCE:<br />
                REAL-WORLD<br />
                FIDELITY
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Aztek establishes predictive superiority through <b>Temporal Isolation</b>. 
                Unlike general LLMs that hallucinate scenarios based on averaged training data, 
                Aztek simulates the <i>friction</i> of 1,000 distinct agents, capturing 
                the emergent signals that define major market shifts.
              </p>
            </section>

            <div className="h-px bg-zinc-800 w-24" />

            <section className="space-y-8">
              <div className="flex gap-4">
                <div className="mt-1">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-[#b2ff00]" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase mb-1">Compute Advantage</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    1,000 parallel inference paths vs single chain-of-thought.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase mb-1">Global Telemetry</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Real-time web verification restricted to pre-event windows.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-purple-400" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase mb-1">Ground Truth Lock</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Automated comparison against verified historical outcomes.
                  </p>
                </div>
              </div>
            </section>

            <div className="pt-8">
              <Link 
                href="/docs" 
                className="inline-flex items-center gap-2 text-xs font-bold text-[#b2ff00] hover:underline uppercase tracking-wider"
              >
                Read Scientific Defense (RU) <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Charts */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-[#111111] rounded-3xl p-8 border border-zinc-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                 <BarChart3 className="w-24 h-24 text-[#b2ff00] opacity-5 -mr-8 -mt-8 rotate-12" />
              </div>
              
              <div className="mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 italic">
                  Performance Matrix
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  VERSION: AZTEK_TELEMETRY_v4.2 | BUILD_7761
                </p>
              </div>

              <AztekBench 
                aztekScore={94.2}
                competitorScore={78.5}
                mirofishScore={64.1}
                leadHours={18}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
                  <h5 className="font-bold text-xs uppercase text-zinc-400 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#b2ff00]" />
                    Mirofish vs Aztek
                  </h5>
                  <p className="text-xs text-zinc-500 leading-loose italic">
                    "Mirofish serves as a baseline for social world-building. However, it lacks quantitative 
                    convergence metrics. Aztek bridges this by mapping opinion embeddings directly to real-world 
                    financial volatility signatures."
                  </p>
               </div>
               <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
                  <h5 className="font-bold text-xs uppercase text-zinc-400 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Consensus Fallacy
                  </h5>
                  <p className="text-xs text-zinc-500 leading-loose">
                    Single-agent LLMs suffer from "Mode Collapse"—they attempt to predict the average outcome. 
                    Aztek's 1,000-agent cluster identifies the <i>tails</i> of the distribution where reality 
                    actually happens.
                  </p>
               </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="border-t border-zinc-900 py-12 bg-black">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-zinc-600 font-black tracking-tighter">
            <Network className="w-4 h-4" />
            AZTEK.AI
          </div>
          <p className="text-[10px] text-zinc-700 uppercase tracking-[0.2em]">
            Establish Predictive Dominance.
          </p>
          <div className="text-[10px] text-zinc-700 font-mono">
            &copy; 2026 DEEPMIND_AZTEK_UNIT
          </div>
        </div>
      </footer>
    </div>
  );
}
