import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { generateDeterministicEmbedding } from '@/lib/embeddings';
import {
  getSimulation,
  getAgents,
  batchUpdateAgents,
  insertInteractions,
  updateSimulation,
  countInteractions,
} from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { simulationId, roundNumber } = await req.json();
    if (!simulationId || roundNumber == null)
      return NextResponse.json({ error: 'simulationId and roundNumber required' }, { status: 400 });

    const simulation = await getSimulation(simulationId);
    if (!simulation) throw new Error('Simulation not found');

    const agents = await getAgents(simulationId);
    if (!agents || agents.length === 0) throw new Error('No agents found');

    const distinctOpinions = [...new Set(agents.map((a: any) => a.current_opinion as string))];

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const discussionPrompt = `Topic: "${simulation.user_prompt}". Current opinions: ${distinctOpinions.map((o, i) => `${i + 1}. ${o}`).join('\n')}. Simulate a debate round that subtly shifts, merges, or reinforces opinions. In addition, evaluate the net Economic Sentiment (-1.0 for severe crash, 0.0 for stable, +1.0 for major boom) of this topic dynamics. Respond strictly in "${simulation.language || 'en'}" locale. Output strictly valid JSON: { "evolved_opinions": { "old_opinion_1": "new_opinion_1" }, "economic_sentiment": 0.0 }`;

    let evolvedOpinions: Record<string, string> = {};
    let sentimentFactor = 0;
    try {
      const cycleCompletion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Output strictly valid JSON.' },
          { role: 'user', content: discussionPrompt },
        ],
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(cycleCompletion.choices[0]?.message?.content || '{}');
      evolvedOpinions = parsed.evolved_opinions || parsed;
      sentimentFactor = parsed.economic_sentiment || 0;
    } catch {
      evolvedOpinions = {};
    }

    const newEmbeddingsMap: Record<string, number[]> = {};
    Object.keys(evolvedOpinions).forEach((old) => {
      const newStance = evolvedOpinions[old];
      if (newStance && typeof newStance === 'string' && newStance !== old) {
        newEmbeddingsMap[newStance] = generateDeterministicEmbedding(newStance);
      }
    });

    const agentUpdates: Array<{ id: string; current_opinion: string; opinion_embedding?: number[] }> = [];
    const newInteractions: any[] = [];

    const LOG_TEMPLATES: Record<string, string> = {
      en: `Influenced to adopt`,
      ru: `Под влиянием перешел к`,
      kk: `Ақпарат әсерінен қабылдады`,
    };
    const logPrefix = LOG_TEMPLATES[simulation.language || 'en'] || LOG_TEMPLATES.en;

    // Small-world network interaction
    for (const agent of agents) {
      const peerCount = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < peerCount; i++) {
        const peer = agents[Math.floor(Math.random() * agents.length)];
        if (peer.id === agent.id) continue;

        const impactScore = agent.adaptability * peer.trust_propensity;
        const isExposed = Math.random() < agent.interaction_frequency;

        if (isExposed) {
          const newStance = evolvedOpinions[peer.current_opinion];
          if (newStance && typeof newStance === 'string' && newStance !== agent.current_opinion) {
            if (impactScore > 0.5) {
              const newEmbed = newEmbeddingsMap[newStance];
              agent.current_opinion = newStance;

              agentUpdates.push({
                id: agent.id,
                current_opinion: newStance,
                ...(newEmbed ? { opinion_embedding: newEmbed } : {}),
              });

              newInteractions.push({
                id: crypto.randomUUID(),
                simulation_id: simulationId,
                source_agent_id: peer.id,
                target_agent_id: agent.id,
                message: `${logPrefix}: ${newStance}`,
                impact_score: impactScore,
                round_number: roundNumber,
              });
            }
          }
        }
      }
    }

    // Persist updates in parallel
    const stockMarket = simulation.stock_market ?? { current: 10000, history: [10000] };
    const volatility = 0.05 + Math.random() * 0.02;
    const marketShift = 1 + sentimentFactor * volatility + (Math.random() - 0.5) * 0.01;
    const newPrice = Number(Math.max(0.1, stockMarket.current * marketShift).toFixed(2));
    stockMarket.current = newPrice;
    stockMarket.history = [...(stockMarket.history ?? []), newPrice];

    await Promise.all([
      batchUpdateAgents(agentUpdates),
      insertInteractions(newInteractions),
      updateSimulation(simulationId, { stock_market: stockMarket }),
    ]);

    return NextResponse.json({ message: 'Cycle complete', agentsUpdated: agentUpdates.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
