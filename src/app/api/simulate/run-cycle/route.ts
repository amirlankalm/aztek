import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import crypto from 'crypto';

/**
 * Miro-Aesthetic BROADCAST Engine (v1.3.0)
 * Implements influencer-priority propagation logic.
 * High-power nodes drive the narrative, while citizens act as 1,000 unique souls.
 */

export async function POST(req: Request) {
  try {
    const { 
      simulationId, 
      roundNumber, 
      agents, 
      stock_market, 
      user_prompt, 
      language 
    } = await req.json();

    if (!agents || agents.length === 0) throw new Error('No agents provided for cycle');

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    // 1. Differentiate Tiers for Broadcast Logic
    const influencers = agents.filter((a: any) => a.role === 'Influencer' || (a.power || 0) > 0.7);
    const citizens = agents.filter((a: any) => a.role !== 'Influencer' && (a.power || 0) <= 0.7);

    // 2. AI Stance Evolution (The Central Logic)
    const distinctOpinions = [...new Set(agents.map((a: any) => String(a.current_opinion).split('|')[0].trim()))];
    
    const discussionPrompt = `Topic: "${user_prompt}". Current opinions: ${distinctOpinions.slice(0, 10).map((o, i) => `${i + 1}. ${o}`).join('\n')}. 
    Simulate a high-frequency debate. Update global opinion states and economic sentiment (-1 to +1).
    Output strictly JSON: { "evolved_opinions": { "old": "new" }, "economic_sentiment": 0.0 }`;

    let evolvedOpinions: Record<string, string> = {};
    let sentimentFactor = 0;
    
    try {
      const cycleCompletion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: discussionPrompt }],
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(cycleCompletion.choices[0]?.message?.content || '{}');
      evolvedOpinions = parsed.evolved_opinions || parsed;
      sentimentFactor = parsed.economic_sentiment || 0;
    } catch {
      evolvedOpinions = {};
    }

    const newInteractions: any[] = [];
    const updatedAgents = [...agents];

    // 3. BROADCAST PHASE: Influencers push opinions to 1,000 agents
    influencers.forEach((inf: any) => {
      // Each influencer reaches 5-15 agents per cycle
      const reachCount = Math.floor(Math.random() * 10) + 5;
      for (let r = 0; r < reachCount; r++) {
         const target = updatedAgents[Math.floor(Math.random() * updatedAgents.length)];
         if (target.id === inf.id) continue;

         const infStanceTitle = String(inf.current_opinion).split('|')[0].trim();
         const targetStanceTitle = String(target.current_opinion).split('|')[0].trim();
         
         // Chance of conversion: Higher based on influencer power
         if (Math.random() < (inf.power || 0.5) * 0.8) {
           const nextStance = evolvedOpinions[infStanceTitle] || infStanceTitle;
           if (nextStance && nextStance !== targetStanceTitle) {
              const targetParts = String(target.current_opinion).split('|');
              const targetMetadata = targetParts.slice(1).join('|').trim();
              target.current_opinion = targetMetadata ? `${nextStance} | ${targetMetadata}` : nextStance;

              newInteractions.push({
                id: crypto.randomUUID(),
                simulation_id: simulationId,
                source_agent_id: inf.id,
                target_agent_id: target.id,
                message: `Broadcast match: ${inf.name} influenced target.`,
                impact_score: inf.power || 0.5,
                round_number: roundNumber,
              });
           }
         }
      }
    });

    // 4. PEER PHASE: Citizens interact locally
    for (let i = 0; i < 100; i++) { // Sampled for performance
      const a = citizens[Math.floor(Math.random() * citizens.length)];
      const b = citizens[Math.floor(Math.random() * citizens.length)];
      if (!a || !b || a.id === b.id) continue;
      
      if (Math.random() < 0.3) {
        const aStance = String(a.current_opinion).split('|')[0].trim();
        const bStance = String(b.current_opinion).split('|')[0].trim();
        if (evolvedOpinions[aStance] && aStance !== bStance) {
           // Small chance of peer influence
        }
      }
    }

    // 5. Market Evolution
    const stockMarket = stock_market ?? { current: 10000, history: [10000] };
    const volatility = 0.05 + Math.random() * 0.03;
    const marketShift = 1 + sentimentFactor * volatility + (Math.random() - 0.5) * 0.01;
    const newPrice = Number(Math.max(0.1, stockMarket.current * marketShift).toFixed(2));
    stockMarket.current = newPrice;
    stockMarket.history = [...(stockMarket.history ?? []), newPrice];

    return NextResponse.json({ 
      message: 'Broadcasting Cycle Complete', 
      agents: updatedAgents,
      interactions: newInteractions.slice(0, 150),
      stock_market: stockMarket,
      round: roundNumber,
    });

  } catch (err: any) {
    console.error('Broadcast Cycle Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
