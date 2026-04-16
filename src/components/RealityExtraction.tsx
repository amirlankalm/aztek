'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface RealityExtractionProps {
  entities: any[];
  onComplete: () => void;
}

export default function RealityExtraction({ entities, onComplete }: RealityExtractionProps) {
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount < entities.length) {
      const timer = setTimeout(() => setVisibleCount(v => v + 1), 600);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => onComplete(), 2000);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, entities, onComplete]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-12 font-mono scroll-smooth">
      <div className="max-w-xl w-full">
        <div className="mb-12 border-b border-[#27272a] pb-4 flex justify-between items-end">
          <h2 className="text-xl tracking-[0.4em] uppercase text-[#ffffff]">Reality Anchoring</h2>
          <span className="text-[#3f3f46] text-[10px] animate-pulse">PROBE_IN_PROGRESS</span>
        </div>

        <div className="space-y-6">
          {entities.slice(0, visibleCount).map((entity, i) => (
            <div key={i} className="group border-l border-[#27272a] pl-6 py-2 hover:border-[#ffffff] transition-colors">
              <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest">
                <span className="text-[#3f3f46]">[ENTITY_{i+1}]</span>
                <span className="text-[#ffffff] font-bold">{entity.name}</span>
                <span className="text-[#a1a1aa] opacity-50">//</span>
                <span className="text-[#71717a]">{entity.type}</span>
              </div>
              <p className="mt-1 text-[#52525b] text-[10px] leading-relaxed lowercase">
                 {entity.description}
              </p>
            </div>
          ))}
          
          {visibleCount < entities.length && (
            <div className="text-[10px] text-[#3f3f46] italic animate-pulse lowercase">
               extracting next reality seed...
            </div>
          )}
        </div>

        <div className="mt-12 pt-4 border-t border-[#18181b] flex justify-between items-center text-[9px] text-[#3f3f46]">
          <span>Swarm Context: Synchronizing</span>
          <span>{Math.round((visibleCount / entities.length) * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
