'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

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
  // Distinct but muted colors so clusters are visually separable
  const palette = ['#e4e4e7', '#a1a1aa', '#71717a', '#d4d4d8', '#52525b', '#f5f5f5', '#3f3f46'];
  return palette[opinionIndex % palette.length] || '#a1a1aa';
};

const opinionToKey = (op: any): string => {
  if (typeof op === 'string') return op;
  if (typeof op === 'object' && op !== null) {
    return op.stance || op.label || op.name || op.stance_type || op.title || JSON.stringify(op);
  }
  return 'unknown';
};

export default function MultiAgentGraph({ agents, interactions, opinions, onNodeClick, isFullscreen, toggleFullscreen }: MultiAgentGraphProps) {
  const fgRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });

  useEffect(() => {
    if (!agents.length) return;

    const baseNodes: any[] = [];
    const baseLinks: any[] = [];
    const nodeIdSet = new Set<string>();

    // 1. Process all agents — start scattered organically
    agents.forEach(agent => {
      const agentOpKey = opinionToKey(agent.current_opinion);
      const opIndex = opinions.indexOf(agentOpKey);

      nodeIdSet.add(agent.id);
      baseNodes.push({
        id: agent.id,
        data: agent,
        baseOp: agentOpKey, // Use base opinion for clustering
        color: getNodeColor(opIndex >= 0 ? opIndex : 0),
        val: 1.5,
        x: (Math.random() - 0.5) * 50,
        y: (Math.random() - 0.5) * 50
      });
    });

    // 2. Add organic affinity links (agents pull toward others with the exact SAME opinion)
    // We connect each agent to ~2 other random agents in their same group
    const agentsByOp: Record<string, string[]> = {};
    baseNodes.forEach(n => {
       if (!agentsByOp[n.baseOp]) agentsByOp[n.baseOp] = [];
       agentsByOp[n.baseOp].push(n.id);
    });

    Object.values(agentsByOp).forEach(group => {
       group.forEach(agentId => {
          // Add 2 random bonds to the same cluster
          for(let k=0; k<2; k++) {
             const target = group[Math.floor(Math.random() * group.length)];
             if (target !== agentId) {
                baseLinks.push({ source: agentId, target, isAffinity: true });
             }
          }
       });
    });

    // 3. Add explicit simulation interaction traces
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

    // 4. Add light global web-links so the disjoint clusters pull into one unified mass
    const agentList = agents.map(a => a.id);
    const peerLinkCount = 800; // Small number to prevent lag, just enough to tie clusters
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
      fg.zoom(2.5, 0); // Modest initial zoom

      // SINGLE FLUID PHYSICS MODEL (Replaces clunky phases)
      // Strong repulsion so nodes don't overlap into a donut
      fg.d3Force('charge').strength(-25);
      
      // Link distances dictate cluster tightness
      fg.d3Force('link').distance((link: any) => {
        if (link.isAffinity) return 8;  // Super tight ideological clusters
        if (link.isExplicit) return 20; // Interactions span clusters
        if (link.isPeer) return 60;     // Loose global gravity web
        return 20;
      });
      
      // Gentle center gravity
      fg.d3Force('center').strength(0.04);
      fg.d3ReheatSimulation();

      // Pan camera smoothly to fit
      setTimeout(() => {
         fg.zoomToFit(2000, 60);
      }, 500);
    }
  }, [graphData]);

  // Cinematic Node Focus Click
  const handleNodeClick = (node: any) => {
    if (fgRef.current && typeof node.x === 'number' && typeof node.y === 'number') {
      // Smooth animation zooming to the node, but not excessively close
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(5.5, 1000);
    }
    onNodeClick(node.data);
  };

  // Handle graph wrapper resizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
           setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [isFullscreen]);

  return (
    <div ref={containerRef} className={`w-full h-full bg-transparent relative transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0f0f0f]' : ''}`}>
      {/* Fullscreen Toggle */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          toggleFullscreen();
        }}
        className="absolute top-6 left-6 z-[100] bg-transparent border border-[#27272a] text-[#ffffff] px-4 py-2 rounded-sm text-xs lowercase tracking-widest hover:bg-[#27272a] transition-colors cursor-pointer"
      >
        {isFullscreen ? 'exit fullscreen' : 'fullscreen'}
      </button>

      {typeof window !== 'undefined' && (
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeCanvasObject={(node: any, ctx: any, globalScale: any) => {
            // Agent = visible rectangle
            const size = 3.5;
            ctx.fillStyle = node.color || '#ffffff';
            ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size);

            // Show label when zoomed in
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
            if (link.isExplicit) return 'rgba(161,161,170,0.30)'; // Interaction traces
            if (link.isAffinity) return 'rgba(161,161,170,0.08)'; // Organic cluster bonds
            if (link.isPeer) return 'rgba(63,63,70,0.05)';        // Light global webbing
            return 'rgba(39,39,42,0.12)';
          }}
          linkWidth={(link: any) => {
            if (link.isExplicit) return 0.5;
            return 0.15; // Extremely thin to prevent webgl draw lag
          }}
          onNodeClick={handleNodeClick}
          backgroundColor="transparent"
          warmupTicks={0}
          cooldownTicks={120} // Fixes the lag! Stops running physics after 2 seconds
        />
      )}
    </div>
  );
}
