'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { benchmarkData as data } from '@/lib/benchmarkData';
import { useTranslation } from 'react-i18next';
import { ScientificChart } from '@/components/ScientificChart';
import '@/lib/i18n';

/**
 * AZTEK RESEARCH JOURNAL v4.1: /benchmark
 * Optimized for Vercel Deployment (Monochromatic SVG Visuals)
 */

export default function BenchmarkPage() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('abstract');
  const sectionRefs = useRef<{[key: string]: HTMLElement | null}>({});

  // IntersectionObserver for TOC highlight
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0% -60% 0%', threshold: 0 }
    );

    const sections = ['abstract', ...data.sections.map(s => s.id)];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-[#f4f4f5] font-mono selection:bg-[#ffffff] selection:text-[#000000]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 lg:py-24">
        
        {/* Navigation / Header */}
        <nav className="mb-24 flex justify-between items-end border-b border-[#27272a] pb-8">
          <div className="flex flex-col">
            <span className="text-[#a1a1aa] text-[10px] uppercase tracking-[0.4em] mb-2">{data.date} / {data.readTime}</span>
            <Link href="/" className="text-xl font-bold text-[#ffffff] uppercase tracking-tighter hover:opacity-70 transition-opacity">
               Aztek: Scientific Benchmarking
            </Link>
          </div>
          <Link href="/" className="terminal-btn-secondary">
            return to console
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-24 relative">
          
          {/* Main Content Area */}
          <article className="space-y-32">
            
            {/* Header / Intro */}
            <section id="abstract" className="scroll-mt-32">
              <div className="flex gap-2 mb-8">
                {data.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight uppercase tracking-tighter mb-12">
                 {data.title}
              </h1>
              <p className="text-[#f4f4f5] text-lg lg:text-xl leading-relaxed opacity-90">
                 {data.abstract}
              </p>
            </section>

            {/* Dynamic Sections */}
            {data.sections.map((section: any) => (
              <section key={section.id} id={section.id} className="scroll-mt-32">
                <h2 className="text-sm text-[#a1a1aa] mb-12 border-b border-[#27272a] pb-4">
                   #{section.title}
                </h2>
                
                <div className="space-y-12">
                  <p className="text-base leading-relaxed text-[#f4f4f5] opacity-80">
                    {section.content}
                  </p>

                  {/* Optional Chart for Results section */}
                  {section.chartData && (
                    <div className="border border-[#27272a] p-8 space-y-8">
                       <label className="terminal-label">Fig_01: Code Hallucination Accuracy</label>
                       <ScientificChart type="bar" data={section.chartData} />
                       <p className="text-[10px] text-[#71717a] italic">
                          lower percentages indicate higher reality-grounding success. aztek swarm demonstrates a 89.4% correlation with reality probes.
                       </p>
                    </div>
                  )}

                  {/* Code Comparison for Example section */}
                  {section.task && (
                    <div className="space-y-8">
                       <div className="terminal-input-block text-xs">
                          <span className="text-[#ffffff] opacity-40 font-bold">{">"}</span>
                          <span>TASK: {section.task}</span>
                       </div>
                       
                       {/* Context-Drift Visuals */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
                         <div className="space-y-4">
                            <label className="terminal-label">Fig_02: Historical shadow sync</label>
                            <ScientificChart type="delta" data={null} />
                         </div>
                         <div className="space-y-4">
                            <label className="terminal-label">Fig_03: Sentiment Cluster Audit</label>
                            <ScientificChart type="scatter" data={null} />
                         </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="border border-[#27272a] p-6 space-y-4">
                             <div className="flex justify-between items-center text-[10px] uppercase tracking-widest">
                                <span className="text-[#a1a1aa]">{section.baseline.label}</span>
                                <span className="text-[#ff0055]">{section.baseline.status}</span>
                             </div>
                             <pre className="bg-[#18181b] p-4 text-[11px] leading-relaxed text-[#71717a] overflow-x-auto border border-[#27272a]">
                                <code>{section.baseline.content}</code>
                             </pre>
                          </div>
                          <div className="border border-[#ffffff]/20 bg-[#ffffff]/[0.02] p-6 space-y-4">
                             <div className="flex justify-between items-center text-[10px] uppercase tracking-widest">
                                <span className="text-[#ffffff]">{section.aztek.label}</span>
                                <span className="text-[#ffffff] font-bold">{section.aztek.status}</span>
                             </div>
                             <pre className="bg-[#18181b] p-4 text-[11px] leading-relaxed text-[#ffffff] overflow-x-auto border border-[#27272a]">
                                <code>{section.aztek.content}</code>
                             </pre>
                             <button className="w-full py-2 terminal-btn-secondary border-dashed">
                                COPY CANONICAL IMPLEMENTATION
                             </button>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </section>
            ))}

            {/* Footer */}
            <footer className="pt-24 border-t border-[#27272a] flex flex-col md:flex-row justify-between items-center gap-8 text-[10px]">
               <div className="text-[#3f3f46] uppercase tracking-[0.5em]">© 2026 Aztek Intelligence</div>
               <div className="flex gap-8 text-[#71717a] uppercase tracking-widest">
                  <Link href="/" className="hover:text-[#ffffff]">Terms</Link>
                  <Link href="/" className="hover:text-[#ffffff]">Privacy</Link>
                  <button className="hover:text-[#ffffff]">Copy Link</button>
               </div>
            </footer>
          </article>

          {/* Sticky Table of Contents (TOC) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 pl-8 border-l border-[#27272a]">
              <label className="terminal-label block mb-8">On this page</label>
              <ul className="space-y-6 text-[11px] relative">
                {/* Active Indicator Line */}
                <div 
                  className="absolute left-[-33px] w-[1px] bg-[#ffffff] transition-all duration-300" 
                  style={{ 
                    height: '14px', 
                    top: (() => {
                      const sections = ['abstract', ...data.sections.map(s => s.id)];
                      const index = sections.indexOf(activeSection);
                      return `${index * 30 + 4}px`; // Adjusting for list spacing
                    })() 
                  }}
                />
                
                <li 
                  onClick={() => scrollToSection('abstract')}
                  className={`cursor-pointer transition-colors ${activeSection === 'abstract' ? 'text-[#ffffff]' : 'text-[#a1a1aa] hover:text-[#ffffff]'}`}
                >
                  Abstract
                </li>
                {data.sections.map(s => (
                  <li 
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    className={`cursor-pointer transition-colors ${activeSection === s.id ? 'text-[#ffffff]' : 'text-[#a1a1aa] hover:text-[#ffffff]'}`}
                  >
                    {s.title.split(': ')[1] || s.title.split(' ')[1] || s.title}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
