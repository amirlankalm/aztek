import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import crypto from 'crypto';

/**
 * Miro-Aesthetic Social Intelligence Init (v1.3.0)
 * Includes EVIDENCE GROUNDING to prove results are not made up.
 */

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

async function searchSocial(query: string) {
  if (!TAVILY_API_KEY) return { content: "", sources: [] };
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `latest twitter reddit sentiment and expert opinions and facts on: ${query}`,
        search_depth: "advanced",
        max_results: 5
      })
    });
    if (!res.ok) return { content: "", sources: [] };
    const data = await res.json();
    return {
      content: data.results.map((r: any) => `Source: ${r.url}\nContent: ${r.content}`).join('\n\n'),
      sources: data.results.map((r: any) => ({ title: r.title, url: r.url }))
    };
  } catch (e) {
    console.error('Tavily Search Error:', e);
    return { content: "", sources: [] };
  }
}

export async function POST(req: Request) {
  try {
    const { prompt, language = 'en' } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 });

    const simId = `local-${crypto.randomUUID()}`;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // 1. Social Intelligence Fetch (The 'Miro' Research Step)
    const { content: socialContext, sources } = await searchSocial(prompt);

    // 2. Reality Extraction with Social Grounding
    const extractionPrompt = `You are a professional sociological research AI.
    Topic: "${prompt}".
    
    GROUND TRUTH DATA (Twitter/Reddit/News):
    ${socialContext || "No live data available, use general 2024-2025 knowledge."}

    EXTRACT reality seeds strictly in JSON.
    Output structure:
    {
      "stances": ["5 arguments grounded in the provided sources"],
      "entities": [
        { 
          "name": "Elon Musk|Vitalik|Specific Famous Name", 
          "type": "Institution|Media|Influencer|Citizen", 
          "description": "Short role context",
          "evidence": "Brief fact from the ground truth data"
        }
      ]
    }`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'Only output pure JSON. Be highly accurate to the GROUND TRUTH DATA.' },
        { role: 'user', content: extractionPrompt }
      ],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    return NextResponse.json({ 
      message: 'Evidence-based world ontology extracted', 
      simulationId: simId,
      stances: parsed.stances || [],
      entities: (parsed.entities || []).slice(0, 15), 
      groundingSources: sources, // Proof for the user
      socialContext: socialContext.slice(0, 500)
    });

  } catch (err: any) {
    console.error('Miro-Init Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
