import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { generateDeterministicEmbedding } from '@/lib/embeddings';
import { readDB, writeDB } from '@/lib/db';
import crypto from 'crypto';

function randomNormal(mean = 0.5, stdDev = 0.15) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  num = num / 10.0 + 0.5; 
  if (num > 1 || num < 0) num = randomNormal(mean, stdDev);
  return num;
}

export async function POST(req: Request) {
  try {
    const { simulationId } = await req.json();
    if (!simulationId) return NextResponse.json({ error: 'simulationId required' }, { status: 400 });

    const db = readDB();
    const simulation = db.simulations.find(s => s.id === simulationId);
    if (!simulation) throw new Error('Simulation not found');

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const archetypePrompt = `Base Topic: "${simulation.user_prompt}". Generate 10 distinct, highly varied opinion archetypes that people might have about this. Language: "${simulation.language}". Output valid JSON: { "stances": ["stance1"] }`;

    let stances: string[] = [];
    try {
        const arcCompletion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'system', content: 'Output valid JSON.' }, { role: 'user', content: archetypePrompt }],
            response_format: { type: 'json_object' }
        });
        const parsed = JSON.parse(arcCompletion.choices[0]?.message?.content || '{"stances": []}');
        stances = parsed.stances || Object.values(parsed).find(Array.isArray) || ['Neutral stance'];
    } catch {
        stances = ['Neutral stance', 'Opposed stance', 'Supporting stance'];
    }

    if (stances.length === 0) stances = ['Default Stance'];
    const stanceEmbeddings = stances.map(s => generateDeterministicEmbedding(s));

    const agentsToInsert = [];
    const NUM_AGENTS = 1200;
    
    // Unique data entropy pools
    const occupations = ['data scientist', 'journalist', 'researcher', 'engineer', 'financial analyst', 'sociologist', 'economist', 'academic', 'developer', 'systems architect', 'freelancer', 'consultant', 'policymaker', 'student', 'investigator'];
    const backgrounds = ['corporate', 'startup sector', 'ngo / non-profit', 'government', 'academia', 'independent / underground', 'public sector'];
    const genders = ['male', 'female', 'non-binary', 'undisclosed'];

    for (let i = 0; i < NUM_AGENTS; i++) {
        const stanceIndex = Math.floor(Math.random() * stances.length);
        const stance = stances[stanceIndex];
        const embedding = stanceEmbeddings[stanceIndex];

        // Generate massive unique variances
        const randomOcc = occupations[Math.floor(Math.random() * occupations.length)];
        const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
        const randomGen = genders[Math.floor(Math.random() * genders.length)];
        
        // Nuance modifiers to make every single opinion entirely unique
        const nuances = ['skeptical', 'passionate', 'analytical', 'indifferent', 'cautious', 'radical', 'pragmatic', 'idealistic', 'defensive', 'opportunistic'];
        const randomNuance = nuances[Math.floor(Math.random() * nuances.length)];

        // Construct 100% unique alignment string (safely handling objects from LLM)
        const baseStanceStr = typeof stance === 'string' 
           ? stance.trim() 
           : (typeof stance === 'object' && stance !== null 
              ? (stance as any).stance || (stance as any).name || (stance as any).label || JSON.stringify(stance) 
              : String(stance));
              
        const uniqueAlignment = `${baseStanceStr} | ${randomNuance} perspective rooted in ${randomBg} experience as a ${randomOcc}.`;

        // Generate pseudo-anonymous handler ID
        const idHex = crypto.randomBytes(3).toString('hex');

        agentsToInsert.push({
            id: crypto.randomUUID(),
            simulation_id: simulationId,
            name: `subject_${idHex}`,
            gender: randomGen,
            demographics: randomBg,
            occupation: randomOcc,
            trust_propensity: randomNormal(0.5, 0.2),
            adaptability: randomNormal(0.5, 0.2),
            interaction_frequency: randomNormal(0.5, 0.2),
            initial_stance: uniqueAlignment,
            current_opinion: uniqueAlignment,
            opinion_embedding: embedding
        });
    }

    db.agents.push(...agentsToInsert);
    simulation.status = 'running';
    writeDB(db);

    return NextResponse.json({ message: 'Agents Spawned successfully', agentsGenerated: 500 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
