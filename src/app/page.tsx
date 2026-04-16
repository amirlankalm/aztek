'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import MultiAgentGraph from '@/components/MultiAgentGraph';
import SystemConsole from '@/components/SystemConsole';
import RealityExtraction from '../components/RealityExtraction';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [simId, setSimId] = useState<string | null>(null);
  const [status, setStatus] = useState(t('status_standby'));
  const [agents, setAgents] = useState<any[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [opinions, setOpinions] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [localHistory, setLocalHistory] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [showReality, setShowReality] = useState(false);

  // 1. Persistence Engine: Sync to localStorage
  React.useEffect(() => {
    if (simId && agents.length > 0) {
      const state = {
        id: simId,
        user_prompt: prompt,
        language: i18n.language,
        agents,
        round,
        opinions,
        interactions,
        market: { current: (window as any).__lastStockData || 10000, history: [] }
      };
      
      // Save active session
      localStorage.setItem('aztek_active_sim', JSON.stringify(state));
      
      // Update Local History (limit to 10 total, but full state for top 3)
      const existing = JSON.parse(localStorage.getItem('aztek_local_history') || '[]');
      const filtered = existing.filter((s: any) => s.id !== simId);
      
      const newHistory = [state, ...filtered].slice(0, 10).map((s, idx) => {
        if (idx < 3) return s; // Keep full state for top 3
        const { agents, interactions, ...meta } = s; // Prune heavy data for older ones
        return meta;
      });

      localStorage.setItem('aztek_local_history', JSON.stringify(newHistory));
      setLocalHistory(newHistory);
    }
  }, [simId, agents, round, opinions, interactions, prompt]);

  // 2. Hydration: Recover from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('aztek_local_history');
    if (saved) setLocalHistory(JSON.parse(saved));

    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/state');
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.simulations) setHistory(data.simulations);
        }
      } catch (err) {
        console.error('Fetch History Error:', err);
      }
    };
    fetchHistory();
  }, []);

  const processOpinions = (agentsList: any[]) => {
    const ops = agentsList.map((a: any) => {
      let str = 'unknown';
      if (typeof a.current_opinion === 'object' && a.current_opinion !== null) {
        str = a.current_opinion.stance || a.current_opinion.label || a.current_opinion.stance_type || JSON.stringify(a.current_opinion);
      } else {
        str = String(a.current_opinion || 'unknown');
      }
      return str.split('|')[0].trim();
    });
    setOpinions(Array.from(new Set(ops)) as string[]);
  };

  const syncMarket = (stock_market: any) => {
    if (stock_market) {
      const current = stock_market.current;
      const history = stock_market.history;
      const previous = history.length > 1 ? history[history.length - 2] : 10000;
      (window as any).__lastStockData = current;
      (window as any).__lastStockDir = current - previous;
    }
  };

  const fetchGraphData = async (targetId?: string) => {
    const idToFetch = targetId || simId;
    if (!idToFetch) return;
    try {
      const res = await fetch(`/api/state?simId=${idToFetch}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Fetch Error' }));
        throw new Error(err.error || 'Server Error');
      }
      const data = await res.json();
      
      setAgents(data.agents || []);
      setInteractions(data.interactions || []);
      processOpinions(data.agents || []);
      syncMarket(data.simulation?.stock_market);
    } catch (e: any) {
      console.error(e);
      setStatus(`${t('status_error')} ${e.message}`);
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
      
      const contentType = res.headers.get('content-type');
      if (res.ok) {
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          return data;
        }
        return { message: 'success' };
      } else {
        // Handle error responses (JSON or HTML/Cloudflare)
        if (contentType && contentType.includes('application/json')) {
          const errData = await res.json();
          throw new Error(errData.error || `HTTP ${res.status}`);
        } else {
          const text = await res.text();
          if (res.status === 522 || res.status === 504) {
             throw new Error("Connection Timeout: The server is busy processing high-volume requests. Please wait a moment.");
          }
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}...`);
        }
      }
    } catch (e: any) {
      console.error(e);
      const errorMsg = `[ERROR] ${e.message}`;
      setLogs(prev => [...prev, errorMsg].slice(-50));
      setStatus(`${t('status_error')} ${e.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg].slice(-50));
  };

  const handleInit = async () => {
    addLog(`INITIATING REALITY PROBE: ${prompt}`);
    const data = await executeAction('/api/simulate/init', { prompt, language: i18n.language }, t('status_compiling'));
    if (data?.simulationId) {
       setSimId(data.simulationId);
       setRound(0);
       if (data.stances) setOpinions(data.stances);
       if (data.knowledgeGraph) setInteractions(data.knowledgeGraph);
       if (data.entities) setEntities(data.entities);
       
       addLog(`SUCCESS: Ontology Extracted (${data.stances?.length || 0} stances, ${data.entities?.length || 0} entities)`);
       setShowReality(true); // Trigger Miro-style anchoring screen
       setAgents([]); // Clear old agents
       setStatus(t('status_compiled'));
    }
  };

  const handleSpawn = async () => {
    addLog(`DEPLOYING SWARM: 1,000 agents mapping to ontological seeds...`);
    const data = await executeAction('/api/simulate/spawn', { 
      simulationId: simId,
      user_prompt: prompt,
      language: i18n.language,
      entities: entities
    }, t('status_deploying'));
    
    if (data?.agents) {
      setAgents(data.agents);
      processOpinions(data.agents);
      setShowReality(false);
      addLog(`SUCCESS: 1,000 agents deployed with role grounding.`);
      
      const initialRecord = {
        id: simId, 
        user_prompt: prompt,
        agents: data.agents,
        opinions: Array.from(new Set(data.agents.map((a: any) => a.current_opinion))),
        interactions: [],
        round: 0,
        entities,
        created_at: new Date().toISOString()
      };
      const existing = JSON.parse(localStorage.getItem('aztek_local_history') || '[]');
      localStorage.setItem('aztek_local_history', JSON.stringify([initialRecord, ...existing.filter((s: any) => s.id !== simId)].slice(0, 10)));
    }
  };

  const handleCycle = async () => {
    if (!simId) return;
    const nextRound = round + 1;
    
    const marketState = (window as any).__lastStockData 
      ? { current: (window as any).__lastStockData, history: [] } 
      : null;

    addLog(`COMPUTING EPOCH ${nextRound}: Processing 1,000 agent transitions...`);
    const data = await executeAction('/api/simulate/run-cycle', { 
      simulationId: simId, 
      roundNumber: nextRound,
      agents,
      stock_market: marketState,
      user_prompt: prompt,
      language: i18n.language
    }, t('status_computing', { epoch: nextRound }));
    
    if (data?.agents) {
      setAgents(data.agents);
      setInteractions(data.interactions || []);
      processOpinions(data.agents);
      syncMarket(data.stock_market);
      setRound(nextRound);
      addLog(`SUCCESS: Epoch ${nextRound} verified. Swarm state synchronized.`);
      setStatus(t('status_verified', { epoch: nextRound }));
    }
  };

  const handleReport = async () => {
     window.location.href = `/report?simId=${simId}`;
  };

  return (
    <div className="flex h-screen w-full bg-[#0f0f0f] text-[#ffffff] overflow-hidden font-mono tracking-wide text-xs">
      
      {/* Main Workbench Area */}
      <main className="flex-1 flex flex-col relative bg-transparent">
         {/* Top Section: Interaction Visualization */}
         <div className="flex-1 relative">
            {agents.length > 0 ? (
              <MultiAgentGraph 
                agents={agents} 
                interactions={interactions} 
                opinions={opinions} 
                onNodeClick={setSelectedAgent}
                isFullscreen={isFullscreen} 
                toggleFullscreen={() => setIsFullscreen(prev => !prev)} 
              />
            ) : showReality ? (
              <RealityExtraction entities={entities} onComplete={() => handleSpawn()} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <span className="text-[#a1a1aa] tracking-[0.3em] lowercase">{t('waiting_command')}</span>
              </div>
            )}
         </div>

         {/* Bottom Section: Swarm Heartbeat Console */}
         {!isFullscreen && <SystemConsole logs={logs} />}
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
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     if (isLoading) return;
                     if (!simId && prompt) handleInit();
                     else if (simId && agents.length === 0) handleSpawn();
                     else if (agents.length > 0) handleCycle();
                   }
                 }}
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

            {/* Scientific Benchmark Link */}
            <Link href="/benchmark" className="w-full py-3 text-[10px] text-[#71717a] border border-[#27272a] rounded-[2px] tracking-[0.4em] uppercase flex items-center justify-center hover:text-[#ffffff] hover:border-[#ffffff] transition-all bg-[#18181b]/50 mt-4 group">
               benchmark: fidelity audit <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity font-bold">→</span>
            </Link>
          </div>

          {/* History Block */}
          {(history.length > 0 || localHistory.length > 0) && !simId && (
            <div className="flex flex-col gap-2 mt-6 border-t border-[#27272a] pt-6 flex-1">
              <label className="text-[#a1a1aa] tracking-widest lowercase">{t('saved_runs')}</label>
              <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                                   {/* Local History First (Reliable) */}
                  {localHistory.map((sim, i) => (
                     <button 
                        key={`local-${i}`} 
                        onClick={() => {
                           setSimId(sim.id || '');
                           setPrompt(sim.user_prompt || '');
                           if (sim.agents) setAgents(sim.agents);
                           if (sim.opinions) setOpinions(sim.opinions);
                           if (sim.interactions) setInteractions(sim.interactions);
                           if (sim.round !== undefined) setRound(sim.round);
                           
                           // Restore market state
                           if (sim.market?.current) {
                             (window as any).__lastStockData = sim.market.current;
                           }
                           
                           setStatus(t('status_live'));
                        }}
                        className="text-left p-3 border border-[#3f3f46] rounded-sm bg-[#111111] hover:bg-[#18181b] transition-colors group cursor-pointer"
                     >
                        <div className="flex justify-between items-start">
                          <span className="block text-[#ffffff] text-[10px] uppercase tracking-widest truncate max-w-[120px]">{sim.user_prompt}</span>
                          <span className="text-[9px] text-[#a1a1aa] bg-[#27272a] px-1 rounded-sm uppercase tracking-tighter">Local</span>
                        </div>
                        <span className="block text-[#52525b] text-[9px] mt-1 group-hover:text-[#a1a1aa] transition-colors">
                           {new Date(sim.created_at || Date.now()).toLocaleString(i18n.language)}
                        </span>
                     </button>
                  ))}
                  {localHistory.length > 0 && history.length > 0 && <div className="border-t border-[#27272a] my-2"></div>}
                  {/* Cloud History Fallback */}
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

                 {/* Alignment / Opinion - High Fidelity Narrative */}
                 <div>
                   <span className="block text-[#a1a1aa] mb-1.5 text-[10px] tracking-widest uppercase">{t('alignment')}</span>
                   <div className="bg-[#111111] border border-[#27272a] p-3 rounded-sm">
                     <p className="text-[#ffffff] text-[11px] leading-relaxed mb-2 font-bold uppercase tracking-tight">
                       {selectedAgent.current_opinion || 'Standard Protocol'}
                     </p>
                     <div className="flex gap-2 flex-wrap">
                        <span className="text-[9px] bg-[#222222] px-1.5 py-0.5 rounded-sm text-[#a1a1aa] uppercase tracking-tighter">
                          Role: {selectedAgent.role || 'Citizen'}
                        </span>
                        <span className="text-[9px] bg-[#222222] px-1.5 py-0.5 rounded-sm text-[#a1a1aa] uppercase tracking-tighter">
                          Power: {Math.round((selectedAgent.power || 0.1) * 100)}%
                        </span>
                     </div>
                   </div>
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
