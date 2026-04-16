'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MultiAgentGraph from '@/components/MultiAgentGraph';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [simId, setSimId] = useState<string | null>(null);
  const [status, setStatus] = useState(t('status_standby'));
  const [agents, setAgents] = useState<any[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [opinions, setOpinions] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/state')
      .then(res => res.json())
      .then(data => {
         if (data.simulations) setHistory(data.simulations);
      })
      .catch(console.error);
  }, []);

  const fetchGraphData = async (targetId?: string) => {
    const idToFetch = targetId || simId;
    if (!idToFetch) return;
    try {
      const res = await fetch(`/api/state?simId=${idToFetch}`);
      if (!res.ok) throw new Error('API fetch error');
      const data = await res.json();
      
      setAgents(data.agents || []);
      setInteractions(data.interactions || []);
      const simulation = data.simulation;
      
      // Safely extract strictly the base string values for opinion categorization
      const ops = (data.agents || []).map((a: any) => {
        let str = 'unknown';
        if (typeof a.current_opinion === 'object' && a.current_opinion !== null) {
          str = a.current_opinion.stance || a.current_opinion.label || a.current_opinion.stance_type || JSON.stringify(a.current_opinion);
        } else {
          str = a.current_opinion || 'unknown';
        }
        return str.split('|')[0].trim();
      });
      setOpinions(Array.from(new Set(ops)) as string[]);
      if (simulation && simulation.stock_market) {
         const current = simulation.stock_market.current;
         const history = simulation.stock_market.history;
         const previous = history.length > 1 ? history[history.length - 2] : 10000;
         (window as any).__lastStockData = current;
         (window as any).__lastStockDir = current - previous;
      }
    } catch (e) {
      console.error(e);
    }
  };

  const executeAction = async (endpoint: string, payload: any, updatingStatus: string) => {
    setIsLoading(true); setStatus(updatingStatus);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'fetch error');
      return data;
    } catch (e: any) {
      console.error(e);
      setStatus(`${t('status_error')} ${e.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleInit = async () => {
    const data = await executeAction('/api/simulate/init', { prompt, language: i18n.language }, t('status_compiling'));
    if (data?.simulationId) {
       setSimId(data.simulationId);
       setRound(0);
       setStatus(t('status_compiled'));
    }
  };

  const handleSpawn = async () => {
    if (!simId) return;
    await executeAction('/api/simulate/spawn', { simulationId: simId }, t('status_deploying'));
    await fetchGraphData();
    setStatus(t('status_live'));
  };

  const handleCycle = async () => {
    if (!simId) return;
    const nextRound = round + 1;
    await executeAction('/api/simulate/run-cycle', { simulationId: simId, roundNumber: nextRound }, t('status_computing', { epoch: nextRound }));
    await fetchGraphData();
    setRound(nextRound);
    setStatus(t('status_verified', { epoch: nextRound }));
  };

  const handleReport = async () => {
     window.location.href = `/report?simId=${simId}`;
  };

  return (
    <div className="flex h-screen w-full bg-[#0f0f0f] text-[#ffffff] overflow-hidden font-mono tracking-wide text-xs">
      
      {/* Main Canvas Area */}
      <main className="flex-1 relative bg-transparent">
         {agents.length > 0 ? (
           <MultiAgentGraph 
             agents={agents} 
             interactions={interactions} 
             opinions={opinions} 
             onNodeClick={setSelectedAgent}
             isFullscreen={isFullscreen} 
             toggleFullscreen={() => setIsFullscreen(prev => !prev)} 
           />
         ) : (
           <div className="w-full h-full flex flex-col items-center justify-center">
             <span className="text-[#a1a1aa] tracking-[0.3em] lowercase">{t('waiting_command')}</span>
           </div>
         )}
      </main>

      {/* Sidebar - Right Side, Sharp, Transparent, Monochromatic */}
      {!isFullscreen && (
        <aside className="w-96 min-w-96 h-full border-l border-[#27272a] bg-[#0f0f0f] flex flex-col p-6 gap-6 z-20">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
            <h1 className="text-sm tracking-widest text-[#ffffff] lowercase">aztek</h1>
            <div className="flex gap-2">
              {['en', 'ru', 'kk'].map(lng => (
                <button key={lng} onClick={() => i18n.changeLanguage(lng)}
                  className={`transition-colors lowercase ${i18n.language === lng ? 'text-[#ffffff]' : 'text-[#a1a1aa] hover:text-[#ffffff]'}`}>
                  {lng}
                </button>
              ))}
            </div>
          </div>

          {/* Input Block */}
          <div className="flex flex-col gap-2">
            <label className="text-[#a1a1aa] tracking-widest lowercase">{t('input_directive')}</label>
            <div className="relative border border-[#27272a] bg-transparent rounded-sm p-3">
               <span className="absolute top-3 left-3 text-[#ffffff]">&gt;</span>
               <textarea 
                 className="w-full h-28 bg-transparent text-[#ffffff] focus:outline-none resize-none pl-4 lowercase"
                 value={prompt}
                 spellCheck={false}
                 placeholder={`${t('input_directive')}...`}
                 onChange={e => setPrompt(e.target.value.toLowerCase())}
               />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-2">
            {!simId ? (
              <button onClick={handleInit} disabled={isLoading || !prompt}
                className="w-full py-3 bg-[#ffffff] text-[#000000] border-none rounded-[2px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#a1a1aa] transition-colors disabled:opacity-50 cursor-pointer">
                {isLoading ? '...' : t('simulate')}
              </button>
            ) : agents.length === 0 ? (
               <button onClick={handleSpawn} disabled={isLoading}
                className="w-full py-3 bg-[#ffffff] text-[#000000] border-none rounded-[2px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#a1a1aa] transition-colors disabled:opacity-50 cursor-pointer">
                {isLoading ? '...' : t('spawn')}
              </button>
            ) : (
              <>
                <button onClick={handleCycle} disabled={isLoading}
                  className="w-full py-3 bg-transparent text-[#a1a1aa] border border-[#27272a] rounded-[2px] tracking-widest hover:text-[#ffffff] transition-colors disabled:opacity-50 cursor-pointer">
                  {isLoading ? '...' : `${t('epoch')} ${round + 1}`}
                </button>
                <button onClick={handleReport} disabled={isLoading}
                  className="w-full py-3 bg-transparent text-[#a1a1aa] border border-[#27272a] rounded-[2px] tracking-widest hover:text-[#ffffff] transition-colors disabled:opacity-50 mt-1 cursor-pointer">
                  {t('final_report')}
                </button>
              </>
            )}
          </div>

          {/* History Block */}
          {history.length > 0 && !simId && (
            <div className="flex flex-col gap-2 mt-6 border-t border-[#27272a] pt-6 flex-1">
              <label className="text-[#a1a1aa] tracking-widest lowercase">{t('saved_runs')}</label>
              <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                 {history.map((sim, i) => (
                    <button 
                       key={i} 
                       onClick={() => {
                          setSimId(sim.id);
                          setPrompt(sim.user_prompt);
                          setStatus(t('status_live'));
                          fetchGraphData(sim.id);
                       }}
                       className="text-left p-3 border border-[#27272a] rounded-sm bg-[#0a0a0a] hover:bg-[#18181b] transition-colors group cursor-pointer"
                    >
                       <span className="block text-[#ffffff] text-[10px] uppercase tracking-widest truncate">{sim.user_prompt}</span>
                       <span className="block text-[#52525b] text-[9px] mt-1 group-hover:text-[#a1a1aa] transition-colors">
                          {new Date(sim.created_at).toLocaleString(i18n.language)}
                       </span>
                    </button>
                 ))}
              </div>
            </div>
          )}

          {/* Status Line */}
          <div className="mt-auto border-t border-[#27272a] pt-4 flex justify-between items-center text-[10px]">
             <span className="text-[#a1a1aa]">system [dashboard]</span>
             <span className={`flex items-center gap-2 ${status.includes(t('status_error')) ? 'text-red-500' : 'text-[#ffffff]'}`}>
               <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-[#a1a1aa] animate-pulse' : 'bg-[#ffffff]'}`}></span>
               {status}
             </span>
          </div>

        </aside>
      )}

      {/* Global Node Overlay - Moved to Bottom Left */}
      {selectedAgent && (
         <div className="absolute bottom-6 left-6 w-96 bg-[#0a0a0a] border border-[#27272a] rounded-sm p-5 z-[60] shadow-2xl overflow-y-auto max-h-[85vh]">
            <div className="flex justify-between border-b border-[#27272a] pb-3 mb-4">
               <span className="text-[#a1a1aa] tracking-widest text-[10px] uppercase">{t('node_data')}</span>
               <button onClick={() => setSelectedAgent(null)} className="text-[#a1a1aa] hover:text-[#ffffff] cursor-pointer bg-transparent border-none">[x]</button>
            </div>
            <div className="flex flex-col gap-4">
               {/* Identity & Core Attributes */}
               <div>
                 <span className="block text-[#a1a1aa] text-[10px] uppercase tracking-widest mb-1">{t('identity')}</span>
                 <div className="flex items-center gap-2">
                   <span className="text-[#ffffff] text-sm font-bold">
                     {selectedAgent.name || 'agent'}
                   </span>
                   <span className="text-[#52525b] text-xs">#{selectedAgent.id?.slice(0,8)}</span>
                 </div>
                 {(selectedAgent.gender || selectedAgent.demographics || selectedAgent.backstory) && (
                   <span className="text-[#a1a1aa] text-[10px] lowercase block mt-1">
                     [{[selectedAgent.gender, selectedAgent.demographics, selectedAgent.occupation].filter(Boolean).join(' | ')}]
                   </span>
                 )}
               </div>

               {/* Alignment / Opinion - SAFE RENDERING */}
               <div>
                 <span className="block text-[#a1a1aa] mb-1.5 text-[10px] tracking-widest uppercase">{t('alignment')}</span>
                 {(() => {
                   let opStr = String(selectedAgent.current_opinion || 'unknown');
                   let parts = opStr.split('|');
                   let title = parts[0]?.trim();
                   let desc = parts.slice(1).join('|').trim();

                   // Safely recover if previous DB write contained stringified LLM JSON objects
                   if (title.startsWith('{')) {
                      try {
                        const parsed = JSON.parse(title);
                        title = parsed.title || parsed.stance || parsed.label || parsed.name || parsed.category || 'Unknown Profile';
                      } catch(e) {}
                   }

                   return (
                     <div className="border border-[#27272a] p-3 rounded-sm bg-[#0f0f0f]">
                       <span className="text-[#ffffff] text-xs font-bold block mb-1">
                         {title}
                       </span>
                       {desc && (
                         <span className="text-[#a1a1aa] text-[11px] leading-relaxed block italic border-l border-[#3f3f46] pl-2 mt-2">
                           {desc}
                         </span>
                       )}
                     </div>
                   );
                 })()}
               </div>

               {/* Metrics */}
               <div className="grid grid-cols-2 gap-2">
                 <div className="border border-[#27272a] p-2 rounded-sm text-center bg-[#0f0f0f]">
                   <span className="block text-[#a1a1aa] text-[9px] uppercase tracking-widest mb-1">{t('receptivity')}</span>
                   <span className="text-[#ffffff] text-sm">{((selectedAgent.trust_propensity || 0) * 100).toFixed(0)}%</span>
                 </div>
                 <div className="border border-[#27272a] p-2 rounded-sm text-center bg-[#0f0f0f]">
                   <span className="block text-[#a1a1aa] text-[9px] uppercase tracking-widest mb-1">{t('plasticity')}</span>
                   <span className="text-[#ffffff] text-sm">{((selectedAgent.adaptability || 0) * 100).toFixed(0)}%</span>
                 </div>
               </div>

               {/* Deep Memory / Traits Dump */}
               {(selectedAgent.memory || selectedAgent.traits || selectedAgent.history) && (
                  <div>
                    <span className="block text-[#a1a1aa] mb-1.5 text-[10px] tracking-widest uppercase">{t('deep_data')}</span>
                    <pre className="text-[#52525b] text-[9px] whitespace-pre-wrap leading-tight bg-[#0f0f0f] p-2 border border-[#27272a] rounded-sm max-h-32 overflow-y-auto">
                      {JSON.stringify({ 
                         memory: selectedAgent.memory, 
                         traits: selectedAgent.traits,
                         history: selectedAgent.history,
                         influence: selectedAgent.influence_score
                      }, null, 2)}
                    </pre>
                  </div>
               )}
            </div>
         </div>
      )}

    </div>
  );
}
