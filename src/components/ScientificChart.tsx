'use client';

import React from 'react';

interface ChartProps {
  type: 'bar' | 'scatter' | 'delta';
  data: any;
  title?: string;
}

/**
 * Minimalist Monochromatic SVG Charting
 * Zero-dependency, lightweight, production-ready.
 */
export const ScientificChart: React.FC<ChartProps> = ({ type, data, title }) => {
  if (type === 'bar') {
    return (
      <div className="w-full space-y-4">
        {data.labels.map((label: string, i: number) => {
          const value = data.values[i];
          const isAztek = label.toLowerCase().includes('aztek');
          return (
            <div key={label} className="space-y-1">
              <div className="flex justify-between text-[10px] uppercase tracking-widest">
                <span className={isAztek ? 'text-[#ffffff] font-bold' : 'text-[#71717a]'}>{label}</span>
                <span className={isAztek ? 'text-[#ffffff]' : 'text-[#a1a1aa]'}>{value}%</span>
              </div>
              <div className="h-5 border border-[#27272a] bg-[#000000]/20 rounded-[1px] relative overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${isAztek ? 'bg-[#ffffff]' : 'bg-[#3f3f46]'}`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'scatter') {
    // Generates a deterministic cluster matching the Nia sentiment aesthetic
    return (
      <div className="w-full h-48 border border-[#27272a] bg-[#000000]/10 flex items-center justify-center relative overflow-hidden">
        <svg className="w-full h-full p-4" viewBox="0 0 400 200">
           {/* Grid Lines */}
           <line x1="0" y1="100" x2="400" y2="100" stroke="#27272a" strokeWidth="1" strokeDasharray="4" />
           <line x1="200" y1="0" x2="200" y2="200" stroke="#27272a" strokeWidth="1" strokeDasharray="4" />
           
           {/* Static Data Points (Deterministic) */}
           {[...Array(20)].map((_, i) => {
             const cx = 50 + (i * 17) % 300;
             const cy = 30 + (i * 23) % 140;
             const isAztek = i % 3 === 0;
             return (
               <circle 
                key={i} 
                cx={cx} 
                cy={cy} 
                r={isAztek ? 4 : 2} 
                fill={isAztek ? "#ffffff" : "#3f3f46"} 
                className="animate-pulse" 
                style={{ animationDelay: `${i * 100}ms`, animationDuration: '3s' }}
               />
             );
           })}
           
           {/* Legend */}
           <g transform="translate(10, 180)">
              <circle cx="5" cy="5" r="3" fill="#ffffff" />
              <text x="15" y="9" fontSize="8" fill="#ffffff" fontFamily="monospace" textAnchor="start" className="uppercase tracking-widest">Aztek Reality Anchor</text>
           </g>
        </svg>
      </div>
    );
  }

  if (type === 'delta') {
    return (
      <div className="w-full h-32 border border-[#27272a] p-4 flex items-end gap-1">
        {[20, 35, 45, 30, 55, 70, 85, 90, 88, 92, 95].map((h, i) => (
           <div 
            key={i} 
            className={`flex-1 transition-all duration-700 ${i > 7 ? 'bg-[#ffffff]' : 'bg-[#3f3f46]'}`} 
            style={{ height: `${h}%` }}
           />
        ))}
      </div>
    );
  }

  return null;
};
