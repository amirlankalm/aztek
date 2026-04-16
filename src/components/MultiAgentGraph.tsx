'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

const ForceGraph2D: any = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface MultiAgentGraphProps {
  agents: any[];
  interactions: any[];
  opinions: string[];
  onNodeClick: (node: any) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const getNodeColor = (opinionIndex: number) => {
  const palette = ['#e4e4e7', '#a1a1aa', '#71717a', '#d4d4d8', '#52525b', '#f5f5f5', '#3f3f46'];
  return palette[opinionIndex % palette.length] || '#a1a1aa';
};

const opinionToKey = (op: any): string => {
  let str = 'unknown';
  if (typeof op === 'string') str = op;
  else if (typeof op === 'object' && op !== null) {
    str = op.stance || op.label || op.name || op.stance_type || op.title || JSON.stringify(op);
  }
  return str.split('|')[0].trim();
};

export default function MultiAgentGraph({ agents, interactions, opinions, onNodeClick, isFullscreen, toggleFullscreen }: MultiAgentGraphProps) {
  const { t } = useTranslation();
  const fgRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });

  useEffect(() => {
    if (!agents.length) return;

    const baseNodes: any[] = [];
    const baseLinks: any[] = [];
    const nodeIdSet = new Set<string>();

    agents.forEach(agent => {
      const agentOpKey = opinionToKey(agent.current_opinion);
      const opIndex = opinions.indexOf(agentOpKey);

      nodeIdSet.add(agent.id);
      baseNodes.push({
        id: agent.id,
        data: agent,
        baseOp: agentOpKey,
        color: getNodeColor(opIndex >= 0 ? opIndex : 0),
        val: 1.5,
        x: (Math.random() - 0.5) * 50,
        y: (Math.random() - 0.5) * 50
      });
    });

    const agentsByOp: Record<string, string[]> = {};
    baseNodes.forEach(n => {
      if (!agentsByOp[n.baseOp]) agentsByOp[n.baseOp] = [];
      agentsByOp[n.baseOp].push(n.id);
    });

    Object.values(agentsByOp).forEach(group => {
      group.forEach(agentId => {
        for (let k = 0; k < 2; k++) {
          const target = group[Math.floor(Math.random() * group.length)];
          if (target !== agentId) {
            baseLinks.push({ source: agentId, target, isAffinity: true });
          }
        }
      });
    });

    const maxEdges = Math.min(interactions.length, 2500);
    const sampledEdges = interactions.slice(-maxEdges);
    sampledEdges.forEach(inter => {
      if (nodeIdSet.has(inter.source_agent_id) && nodeIdSet.has(inter.target_agent_id)) {
        baseLinks.push({
          source: inter.source_agent_id,
          target: inter.target_agent_id,
          isExplicit: true
        });
      }
    });

    const agentList = agents.map(a => a.id);
    const peerLinkCount = 800;
    for (let i = 0; i < peerLinkCount; i++) {
      const a = agentList[Math.floor(Math.random() * agentList.length)];
      const b = agentList[Math.floor(Math.random() * agentList.length)];
      if (a !== b) baseLinks.push({ source: a, target: b, isPeer: true });
    }

    setGraphData({ nodes: baseNodes, links: baseLinks });
  }, [agents, interactions, opinions]);

  useEffect(() => {
    const fg = fgRef.current;
    if (fg && fg.d3Force) {
      fg.zoom(2.5, 0);
      fg.d3Force('charge').strength(-25);
      fg.d3Force('link').distance((link: any) => {
        if (link.isAffinity) return 8;
        if (link.isExplicit) return 20;
        if (link.isPeer) return 60;
        return 20;
      });
      fg.d3Force('center').strength(0.04);
      fg.d3ReheatSimulation();
      setTimeout(() => { fg.zoomToFit(2000, 60); }, 500);
    }
  }, [graphData]);

  const handleNodeClick = (node: any) => {
    if (fgRef.current && typeof node.x === 'number' && typeof node.y === 'number') {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(5.5, 1000);
    }
    onNodeClick(node.data);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [isFullscreen]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full bg-transparent relative transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0f0f0f]' : ''}`}
    >
      {/* Fullscreen Toggle — sits in its own stacking layer ABOVE the canvas */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFullscreen();
        }}
        style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 9999, pointerEvents: 'all' }}
        className="bg-transparent border border-[#27272a] text-[#ffffff] px-4 py-2 rounded-sm text-xs lowercase tracking-widest hover:bg-[#27272a] transition-colors cursor-pointer"
      >
        {isFullscreen ? t('exit_fullscreen') : t('fullscreen')}
      </button>

      {/* Canvas — fills container but must NOT intercept button clicks */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        {typeof window !== 'undefined' && (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeCanvasObject={(node: any, ctx: any, globalScale: any) => {
              const size = 3.5;
              ctx.fillStyle = node.color || '#ffffff';
              ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size);
              if (globalScale > 3) {
                const label = node.data?.name || node.id.slice(0, 6);
                ctx.font = `${Math.max(2, 3 / globalScale * 2)}px monospace`;
                ctx.fillStyle = 'rgba(161,161,170,0.8)';
                ctx.textAlign = 'center';
                ctx.fillText(label, node.x, node.y + 4);
              }
            }}
            nodePointerAreaPaint={(node: any, color: string, ctx: any) => {
              ctx.fillStyle = color;
              ctx.fillRect(node.x - 8, node.y - 8, 16, 16);
            }}
            linkColor={(link: any) => {
              if (link.isExplicit) return 'rgba(220,220,230,0.75)'; // interaction traces — bright
              if (link.isAffinity) return 'rgba(180,180,190,0.35)'; // cluster bonds — visible
              if (link.isPeer) return 'rgba(120,120,130,0.18)';    // global web — subtle
              return 'rgba(160,160,170,0.30)';
            }}
            linkWidth={(link: any) => {
              if (link.isExplicit) return 0.8;
              if (link.isAffinity) return 0.4;
              return 0.2;
            }}
            onNodeClick={handleNodeClick}
            backgroundColor="transparent"
            warmupTicks={0}
            cooldownTicks={120}
          />
        )}
      </div>
    </div>
  );
}
