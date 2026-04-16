import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { readDB } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { simId, message, history } = await req.json();
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });

    const db = readDB();
    const simulation = simId 
      ? db.simulations.find(s => s.id === simId)
      : db.simulations[db.simulations.length - 1]; // most recent fallback

    if (!simulation) throw new Error('Simulation network not found');

    const agents = db.agents.filter(a => a.simulation_id === simulation.id);
    const uniqueStances = Array.from(new Set(agents.map(a => {
        if (typeof a.current_opinion === 'object' && a.current_opinion !== null) {
          return a.current_opinion.label || a.current_opinion.stance || JSON.stringify(a.current_opinion);
        }
        return a.current_opinion;
    })));

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const systemPrompt = `You are the AZTEK AI reporter analyzing an information dynamics simulation.
Topic: "${simulation.user_prompt}"
Metrics: ${agents.length} agents, ${db.interactions.filter(a => a.simulation_id === simulation.id).length} interactions mapped.
Active Clusters: ${uniqueStances.join(', ')}

Your instructions:
1. Answer questions about the simulation, polarization, and opinions clearly and simply.
2. DO NOT use ANY Markdown formatting. No asterisks (*), no hash symbols (#), no bullet points.
3. Speak in plain text, conversational yet analytical paragraphs. Respond in the user's language natively.`;

    const messages = [
        { role: 'system', content: systemPrompt },
        ...(history || []).map((msg: any) => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: message }
    ];

    const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: messages as any
    });

    const reply = completion.choices[0]?.message?.content || 'connection terminated.';

    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
