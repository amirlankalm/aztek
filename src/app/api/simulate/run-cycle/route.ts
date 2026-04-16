import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { generateDeterministicEmbedding } from '@/lib/embeddings';
import { readDB, writeDB } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { simulationId, roundNumber } = await req.json();
    if (!simulationId || roundNumber == null) return NextResponse.json({ error: 'simulationId and roundNumber required' }, { status: 400 });

    const db = readDB();
    const simulation = db.simulations.find(s => s.id === simulationId);
    if (!simulation) throw new Error('Simulation not found');

    const agents = db.agents.filter(a => a.simulation_id === simulationId);
    if (!agents || agents.length === 0) throw new Error('No agents found');

    const clusters: Record<string, any[]> = {};
    agents.forEach(agent => {
        if (!clusters[agent.current_opinion]) clusters[agent.current_opinion] = [];
        clusters[agent.current_opinion].push(agent);
    });

    const distinctOpinions = Object.keys(clusters);
    
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const discussionPrompt = `Topic: "${simulation.user_prompt}". Current opinions: ${distinctOpinions.map((o, i) => `${i + 1}. ${o}`).join('\n')}. Simulate a debate round that subtly shifts, merges, or reinforces opinions. In addition, evaluate the net Economic Sentiment (-1.0 for severe crash, 0.0 for stable, +1.0 for major boom) of this topic dynamics. Respond strictly in "${simulation.language || 'en'}" locale. Output strictly valid JSON: { "evolved_opinions": { "old_opinion_1": "new_opinion_1" }, "economic_sentiment": 0.0 }`;

    let evolvedOpinions: Record<string, string> = {};
    let sentimentFactor = 0;
    try {
        const cycleCompletion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'system', content: 'Output strictly valid JSON.' }, { role: 'user', content: discussionPrompt }],
            response_format: { type: 'json_object' }
        });
        const parsed = JSON.parse(cycleCompletion.choices[0]?.message?.content || '{}');
        evolvedOpinions = parsed.evolved_opinions || parsed;
        sentimentFactor = parsed.economic_sentiment || 0;
    } catch {
        evolvedOpinions = {};
    }

    const newEmbeddingsMap: Record<string, number[]> = {};
    Object.keys(evolvedOpinions).forEach(old => {
        const newStance = evolvedOpinions[old];
        if (newStance && typeof newStance === 'string' && newStance !== old) {
            newEmbeddingsMap[newStance] = generateDeterministicEmbedding(newStance);
        }
    });

    let updatesCount = 0;
    
    // Simulate Small-World network interaction structure instead of random uniform
    // Each agent interacts with up to 5 random peers to emulate network depth.
    for (const agent of agents) {
        // Find peers to interact with
        const peerCount = Math.floor(Math.random() * 5) + 1;
        const peers = [];
        for (let i = 0; i < peerCount; i++) {
           peers.push(agents[Math.floor(Math.random() * agents.length)]);
        }

        for (const peer of peers) {
             if (peer.id === agent.id) continue;
             
             // Exposure math
             const impactScore = agent.adaptability * peer.trust_propensity;
             const isExposed = Math.random() < agent.interaction_frequency;
             
             if (isExposed) {
                 const newStance = evolvedOpinions[peer.current_opinion];
                 if (newStance && typeof newStance === 'string' && newStance !== agent.current_opinion) {
                     const adoptionThreshold = 0.5;
                     if (impactScore > adoptionThreshold) {
                         const newEmbed = newEmbeddingsMap[newStance];
                         agent.current_opinion = newStance;
                         if (newEmbed) agent.opinion_embedding = newEmbed;
                         
                         const LOG_TEMPLATES: Record<string, string> = {
                             en: `Influenced to adopt: ${newStance}`,
                             ru: `Под влиянием перешел к: ${newStance}`,
                             kk: `Ақпарат әсерінен қабылдады: ${newStance}`
                         };
                         const interactionMsg = LOG_TEMPLATES[simulation.language || 'en'] || LOG_TEMPLATES.en;

                         db.interactions.push({
                             id: crypto.randomUUID(),
                             simulation_id: simulationId,
                             source_agent_id: peer.id,
                             target_agent_id: agent.id,
                             message: interactionMsg,
                             impact_score: impactScore,
                             round_number: roundNumber
                         });
                         updatesCount++;
                     }
                 }
             }
        }
    }

    // Apply strict bounds and volatility logic to market simulation
    if (simulation.stock_market) {
        // High volatility during severe sentiment changes, mild drift otherwise
        const volatility = 0.05 + Math.random() * 0.02; 
        const marketShift = 1 + (sentimentFactor * volatility) + ((Math.random() - 0.5) * 0.01);
        const newPrice = Math.max(0.1, simulation.stock_market.current * marketShift);
        simulation.stock_market.current = Number(newPrice.toFixed(2));
        simulation.stock_market.history.push(simulation.stock_market.current);
    }

    writeDB(db);

    return NextResponse.json({ message: 'Cycle complete', agentsUpdated: updatesCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
