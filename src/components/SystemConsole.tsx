'use client';

import React, { useEffect, useRef } from 'react';

interface SystemConsoleProps {
  logs: string[];
}

export default function SystemConsole({ logs }: SystemConsoleProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-48 border-t border-[#27272a] bg-[#0a0a0a] flex flex-col p-4 font-mono text-[10px] text-[#a1a1aa] overflow-hidden">
      <div className="flex justify-between items-center mb-2 border-b border-[#18181b] pb-1 uppercase tracking-[0.2em] text-[8px]">
        <span>System Log // Aztek Swarm Intelligence</span>
        <span className="text-[#3f3f46]">Active_Protocol: Miro-Swarm-V1</span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {logs.map((log, i) => (
          <div key={i} className="mb-1 flex gap-2">
            <span className="text-[#3f3f46] min-w-16">[{new Date().toLocaleTimeString()}]</span>
            <span className={log.includes('ERROR') ? 'text-[#ef4444]' : log.includes('SUCCESS') ? 'text-[#ffffff]' : ''}>
              {log}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="opacity-30 italic">Waiting for swarm heartbeat...</div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
