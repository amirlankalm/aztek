import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getSimulation, getAgents, countInteractions, getSimulations } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { simId, message, history, localData } = await req.json();
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });

    let simulation: any;
    let agents: any[] = [];
    let interactionCount = 0;
    let uniqueStances: string[] = [];

    if (simId?.startsWith('local-') && localData) {
      // Local Mode: Use provided telemetry
      simulation = {
        id: simId,
        user_prompt: localData.user_prompt || 'unknown local simulation',
        language: localData.language || 'en'
      };
      agents = localData.agents || [];
      interactionCount = localData.interactionsCount || 0;
      uniqueStances = localData.topStances || [];
    } else {
      // DB Mode: Fetch from Supabase
      if (simId) {
        simulation = await getSimulation(simId);
      } else {
        const sims = await getSimulations();
        simulation = sims[0] ?? null;
      }

      if (!simulation) throw new Error('Simulation network not found');

      agents = await getAgents(simulation.id);
      interactionCount = await countInteractions(simulation.id);
      
      uniqueStances = Array.from(
        new Set(
          agents.map((a: any) => {
            let str = 'unknown';
            if (typeof a.current_opinion === 'object' && a.current_opinion !== null) {
              str = a.current_opinion.label || a.current_opinion.stance || JSON.stringify(a.current_opinion);
            } else {
              str = String(a.current_opinion);
            }
            return str.split('|')[0].trim();
          })
        )
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemPrompt = `You are the AZTEK AI reporter analyzing an information dynamics simulation.
Topic: "${simulation.user_prompt}"
Metrics: ${agents.length} agents, ${interactionCount} interactions mapped.
Active Clusters: ${uniqueStances.join(', ')}

Your instructions:
1. Answer questions about the simulation, polarization, and opinions clearly and simply.
2. DO NOT use ANY Markdown formatting. No asterisks (*), no hash symbols (#), no bullet points.
3. Speak in plain text, conversational yet analytical paragraphs. Respond in the user's language natively.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map((msg: any) => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: message },
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: messages as any,
    });

    const reply = completion.choices[0]?.message?.content || 'connection terminated.';

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
