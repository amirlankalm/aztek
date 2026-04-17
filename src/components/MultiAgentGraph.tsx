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

// MIRO-AESTHETIC V2 PALETTE: High-Fidelity Neons
const getNodeColor = (opinionIndex: number, role: string) => {
  if (role === 'Influencer') return '#00f2ff'; // Electric Blue
  if (role === 'Institution') return '#ff0055'; // Neon Pink (Authority)
  if (role === 'Media') return '#aaff00'; // Lime Green
  
  const palette = ['#ffffff', '#00f2ff', '#7000ff', '#ff0055', '#aaff00', '#ffaa00', '#00ff88'];
  return palette[opinionIndex % palette.length] || '#ffffff';
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
  
  const graphData = React.useMemo(() => {
    if (!agents.length) return { nodes: [], links: [] };

    const baseNodes: any[] = [];
    const baseLinks: any[] = [];
    
    // 1. Build Nodes with MIRO-PULSE Physics
    agents.forEach(agent => {
      const agentOpKey = opinionToKey(agent.current_opinion);
      const opIndex = opinions.indexOf(agentOpKey);

      let nodeVal = 8; // Boosted from 5
      if (agent.role === 'Influencer') nodeVal = 32; // Boosted from 20
      else if (agent.role === 'Media' || agent.role === 'Institution') nodeVal = 18; // Boosted from 12

      baseNodes.push({
        id: agent.id,
        name: agent.name,
        data: agent,
        baseOp: agentOpKey,
        color: getNodeColor(opIndex >= 0 ? opIndex : 0, agent.role),
        role: agent.role || 'Citizen',
        val: nodeVal
      });
    });

    // 2. Build Organic Flow Links
    // Connect a subset of peers to prevent visual noise
    const agentsByOp: Record<string, string[]> = {};
    baseNodes.forEach(n => {
      if (!agentsByOp[n.baseOp]) agentsByOp[n.baseOp] = [];
      agentsByOp[n.baseOp].push(n.id);
    });

    Object.values(agentsByOp).forEach(group => {
      // Connect to 2 random peers in the same cluster
      group.forEach(agentId => {
        for (let i = 0; i < 1; i++) {
          const target = group[Math.floor(Math.random() * group.length)];
          if (target !== agentId) {
            baseLinks.push({ source: agentId, target, isAffinity: true });
          }
        }
      });
    });

    // Add recent interaction links with 'Electric' intensity
    interactions.slice(-100).forEach(inter => {
      baseLinks.push({
        source: inter.source_agent_id,
        target: inter.target_agent_id,
        isInteraction: true,
        impact: inter.impact_score
      });
    });

    return { nodes: baseNodes, links: baseLinks };
  }, [agents, interactions, opinions]);

  useEffect(() => {
    const fg = fgRef.current;
    if (fg && fg.d3Force) {
      fg.d3Force('charge').strength(-200); // Stronger repulsion for clarity
      fg.d3Force('link').distance(80); // More space between nodes
      fg.d3Force('center').strength(0.05);
      fg.d3ReheatSimulation();
      
      const timer = setTimeout(() => { 
        fg.zoomToFit(1200, 100); 
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [graphData]);

  const handleNodeClick = (node: any) => {
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 800);
      fgRef.current.zoom(3.5, 800);
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
      className={`w-full h-full bg-transparent relative transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#070708]' : ''}`}
    >
      {/* UI Controls */}
      <div className="absolute top-6 left-6 z-[9999] flex gap-2">
        <button
          onClick={(e) => { e.preventDefault(); toggleFullscreen(); }}
          className="bg-transparent border border-[#27272a] text-[#ffffff] px-4 py-2 rounded-sm text-[10px] uppercase tracking-[0.2em] hover:bg-[#ffffff] hover:text-[#000000] transition-all cursor-pointer backdrop-blur-md"
        >
          {isFullscreen ? 'Exit Lab' : 'Enter Lab'}
        </button>
      </div>

      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        {typeof window !== 'undefined' && (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="name"
            d3VelocityDecay={0.3}
            onNodeClick={handleNodeClick}
            backgroundColor="transparent"
            
            // LINK RENDERING: Organic Splines (Brighter & Thicker)
            linkCurvature={0.3}
            linkColor={(l: any) => l.isInteraction ? 'rgba(0, 242, 255, 0.85)' : 'rgba(255, 255, 255, 0.15)'}
            linkWidth={(l: any) => l.isInteraction ? 2.5 : 1.0}
            linkDirectionalParticles={(l: any) => l.isInteraction ? 6 : 0}
            linkDirectionalParticleSpeed={0.03}
            linkDirectionalParticleWidth={3}
            linkDirectionalParticleColor={() => '#00f2ff'}

            // NODE RENDERING: Bioluminescent Glow
            nodeCanvasObject={(node: any, ctx: any, globalScale: any) => {
              const size = node.val;
              const isInfluencer = node.role === 'Influencer';
              const isInstitution = node.role === 'Institution';
              
              ctx.save();
              
              // 1. Shadow/Glow Effect
              if (isInfluencer || isInstitution) {
                ctx.shadowBlur = size * 1.5;
                ctx.shadowColor = node.color;
              }

              // 2. Shape Rendering
              ctx.fillStyle = node.color;
              if (isInstitution) {
                ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size);
              } else if (isInfluencer) {
                // Diamond shape
                ctx.beginPath();
                ctx.moveTo(node.x, node.y - size / 1.5);
                ctx.lineTo(node.x + size / 1.5, node.y);
                ctx.lineTo(node.x, node.y + size / 1.5);
                ctx.lineTo(node.x - size / 1.5, node.y);
                ctx.closePath();
                ctx.fill();
              } else {
                // Circle with a stroke for depth
                ctx.beginPath();
                ctx.arc(node.x, node.y, size / 2, 0, 2 * Math.PI, false);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.lineWidth = 1 / globalScale;
                ctx.stroke();
              }

              // 3. Label Rendering (Only on zoom)
              if (globalScale > 2.5) {
                const label = node.name;
                const fontSize = 12 / globalScale;
                ctx.font = `${fontSize}px 'Inter', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillText(label, node.x, node.y + size * 1.2);
              }

              ctx.restore();
            }}
            
            nodePointerAreaPaint={(node: any, color: string, ctx: any) => {
              ctx.fillStyle = color;
              const hitSize = Math.max(node.val * 1.5, 20); 
              ctx.fillRect(node.x - hitSize / 2, node.y - hitSize / 2, hitSize, hitSize);
            }}

            cooldownTicks={100}
            warmupTicks={0}
          />
        )}
      </div>
    </div>
  );
}
