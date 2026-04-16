import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { readDB, writeDB, resetDB } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { prompt, language = 'en' } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 });

    // Enforce strict Rolling Database Retention (preserve up to 5 simulations) to prevent JSON bloat
    const db = readDB();
    const MAX_HISTORY = 5;
    
    if (db.simulations.length >= MAX_HISTORY) {
        const retainedSims = db.simulations.slice(-(MAX_HISTORY - 1)); // Leave exact room for the incoming pushing
        const retainedIds = new Set(retainedSims.map((s: any) => s.id));
        
        db.simulations = retainedSims;
        db.agents = db.agents.filter((a: any) => retainedIds.has(a.simulation_id));
        db.interactions = db.interactions.filter((a: any) => retainedIds.has(a.simulation_id));
        db.knowledge_graph = db.knowledge_graph.filter((a: any) => retainedIds.has(a.simulation_id));
    }

    const simId = crypto.randomUUID();
    const newSim = {
      id: simId,
      user_prompt: prompt,
      language,
      status: 'initialized',
      created_at: new Date().toISOString(),
      stock_market: {
         current: 10000.00,
         history: [10000.00]
      }
    };
    db.simulations.push(newSim);

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const extractionPrompt = `You are an expert graph extraction AI. Extract the core entities, their descriptions, and the relationships connecting them. Topic: "${prompt}". Respond in "${language}". Output valid JSON: { "relationships": [ { "source": "Entity1", "target": "Entity2", "relationship": "allies with", "description": "" } ] }`;

    let relationships = [];
    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'system', content: 'Only output valid JSON.' }, { role: 'user', content: extractionPrompt }],
            response_format: { type: 'json_object' }
        });

        const parsed = JSON.parse(completion.choices[0]?.message?.content || '{"relationships":[]}');
        relationships = parsed.relationships || Object.values(parsed).find(Array.isArray) || [];
    } catch {
        // graceful degrade
        relationships = [{ source: 'System', target: 'Population', relationship: 'Initialized' }];
    }

    if (relationships && relationships.length > 0) {
      const kgInserts = relationships.map((rel: any) => ({
        id: crypto.randomUUID(),
        simulation_id: simId,
        entity_source: rel.source || 'Unknown',
        relationship: rel.relationship || 'Related to',
        entity_target: rel.target || 'Unknown'
      }));
      db.knowledge_graph.push(...kgInserts);
    }

    writeDB(db);

    return NextResponse.json({ message: 'map compiled', simulationId: simId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
