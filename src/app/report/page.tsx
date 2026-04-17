'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

export default function ReportPage() {
  const { t, i18n } = useTranslation();
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [simId, setSimId] = useState<string | null>(null);
  const [simStats, setSimStats] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Read simId from URL explicitly if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('simId');
    if (id) setSimId(id);
  }, []);

  // Fetch simulation stats to render infographics
  useEffect(() => {
    async function fetchStats() {
      try {
        const query = simId ? `?simId=${simId}` : '';
        const res = await fetch(`/api/state${query}`);
        const data = await res.json();
        
        if (data.agents && data.agents.length > 0) {
           const stanceCounts: Record<string, number> = {};
           data.agents.forEach((a: any) => {
              const extractBaseStance = (opinion: any) => {
                 let str = t('unknown_alignment');
                 if (typeof opinion === 'string') {
                    str = opinion.split('|')[0].trim();
                 } else if (typeof opinion === 'object' && opinion !== null) {
                    str = opinion.title || opinion.stance || opinion.label || opinion.name || opinion.category || t('unknown_alignment');
                 }
                 
                 // Fallback for legacy DB entries containing stringified JSON
                 if (str.startsWith('{')) {
                    try {
                       const parsed = JSON.parse(str);
                       str = parsed.title || parsed.stance || parsed.label || parsed.name || parsed.category || t('unknown_alignment');
                    } catch(e) {}
                 }
                 return str;
              };
              
              const baseStance = extractBaseStance(a.current_opinion);
              stanceCounts[baseStance] = (stanceCounts[baseStance] || 0) + 1;
           });

           const sortedStances = Object.entries(stanceCounts).sort((a, b) => b[1] - a[1]);
           const totalAgents = data.agents.length;
           
           setSimStats({
              totalAgents,
              interactions: data.interactions?.length || 0,
              topStances: sortedStances.slice(0, 5),
              userTopic: data.simulation?.user_prompt || 'unknown topic'
           });
        }
      } catch (e) {
        // fail silently
      }
    }
    fetchStats();
  }, [simId, t]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!chatMessage.trim() || isLoading) return;
    
    setIsLoading(true);
    const text = chatMessage.trim();
    setChatMessage('');
    
    // Optimistic UI
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);

    try {
       const res = await fetch('/api/simulate/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             simId: simId, 
             message: text,
             history: messages
          })
       });
       
       const data = await res.json();
       if (data.reply) {
          setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
       } else if (data.error) {
          const errMsg = data.error.includes('not found') 
            ? 'Active simulation data not found. This usually happens if the database was wiped or the session expired. Please start a new simulation.'
            : `Connection issue: ${data.error}`;
          setMessages([...newMessages, { role: 'assistant', content: errMsg }]);
       } else {
          setMessages([...newMessages, { role: 'assistant', content: t('connection_degraded') }]);
       }
    } catch (e: any) {
       setMessages([...newMessages, { role: 'assistant', content: `${t('system_offline')}: ${e.message}` }]);
    } finally {
       setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#ffffff] font-mono flex flex-col relative tracking-wide">
      
      {/* Absolute minimal branding header */}
      <header className="absolute top-0 left-0 w-full px-6 py-4 z-10 flex justify-between items-center bg-gradient-to-b from-[#000000] to-transparent">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => window.location.href = '/'}
            className="text-[10px] uppercase tracking-widest text-[#a1a1aa] hover:text-[#ffffff] transition-colors border border-[#27272a] px-3 py-1.5 rounded-sm"
          >
            &lt; {t('return')}
          </button>
          <div className="text-xs tracking-[0.3em] font-bold text-[#a1a1aa] lowercase">{t('aztek')} [report]</div>
        </div>
        {isLoading && <div className="text-[10px] tracking-widest text-[#a1a1aa] animate-pulse lowercase">rx/tx</div>}
      </header>

      {/* Main Chat Content Feed */}
      <main ref={scrollRef} className="flex-1 w-full overflow-y-auto pt-20 pb-40 px-6 scroll-smooth">
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
           {messages.length === 0 ? (
             <div className="flex flex-col gap-8 mt-12 w-full">
               <div className="flex flex-col gap-2">
                 <h1 className="text-base text-[#ffffff]">{t('simulation_reporter_active')}</h1>
                 <p className="text-xs text-[#52525b] leading-relaxed">
                   {t('reporter_ingested')}
                 </p>
               </div>

               {/* UI Artifact / Infographic */}
               {simStats && (
                 <div className="w-full border border-[#27272a] rounded-sm bg-[#0a0a0a] p-6 shadow-2xl">
                    <div className="flex justify-between items-end border-b border-[#27272a] pb-4 mb-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-[#52525b] uppercase tracking-widest">{t('global_telemetry')}</span>
                        <span className="text-[#ffffff] text-sm truncate max-w-[250px]">{simStats.userTopic}</span>
                      </div>
                      <div className="flex gap-4 text-right">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-[#52525b] uppercase tracking-widest">{t('nodes')}</span>
                          <span className="text-[#a1a1aa] text-xs">{simStats.totalAgents}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-[#52525b] uppercase tracking-widest">{t('edges')}</span>
                          <span className="text-[#a1a1aa] text-xs">{simStats.interactions}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      {simStats.topStances.map((stance: any, idx: number) => {
                        const percentage = ((stance[1] / simStats.totalAgents) * 100).toFixed(1);
                        return (
                          <div key={idx} className="flex flex-col gap-1.5 w-full">
                            <div className="flex justify-between text-xs text-[#a1a1aa]">
                              <span className="truncate max-w-[75%]">{stance[0]}</span>
                              <span>{percentage}%</span>
                            </div>
                            <div className="w-full h-1 bg-[#18181b] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#f4f4f5] transition-all duration-1000 ease-out" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                 </div>
               )}

               <p className="text-xs text-[#52525b] mt-4">
                 {t('ask_question')}
               </p>
             </div>
           ) : (
             messages.map((msg, i) => (
                <div key={i} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                   <span className="text-[10px] text-[#52525b] uppercase tracking-widest">{msg.role === 'user' ? t('operator') : t('aztek')}</span>
                   <div className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'text-[#a1a1aa] max-w-[80%]' : 'text-[#ffffff] border-l-2 border-[#27272a] pl-4 max-w-[95%]'}`}>
                     {msg.content}
                   </div>
                </div>
             ))
           )}
        </div>
      </main>

      {/* Fixed Bottom Terminal Input */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#000000] via-[#000000] to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="border border-[#27272a] bg-[#0a0a0a] rounded-sm p-4 relative flex flex-col focus-within:border-[#52525b] transition-colors shadow-2xl">
            <div className="flex items-start gap-4 w-full">
              <span className="text-[#a1a1aa] mt-1 text-sm">&gt;</span>
              <textarea
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('input_query')}
                className="w-full bg-transparent text-[#ffffff] placeholder-[#52525b] focus:outline-none text-sm tracking-wide resize-none h-16"
                spellCheck={false}
              />
            </div>
            
            <div className="flex items-center justify-between mt-2 w-full">
               <div className="text-[10px] text-[#52525b] lowercase">enter to send, shift+enter / cmd+enter for newline</div>
               <button onClick={handleSend} disabled={isLoading || !chatMessage.trim()} className="flex items-center justify-center p-2 border border-[#27272a] text-[#a1a1aa] rounded-sm hover:text-[#ffffff] hover:border-[#a1a1aa] transition-colors disabled:opacity-50 cursor-pointer">
                 <ArrowUp size={16} />
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
