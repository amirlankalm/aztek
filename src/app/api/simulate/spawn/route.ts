import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

/**
 * Miro-Aesthetic SOUL UNIQUENESS 3.0
 * Generates 1,000 agents with absolute identity entropy.
 * 20+ Unique Influencers + 980 Unique Individuals.
 */

export async function POST(req: Request) {
  try {
    const { simulationId, user_prompt, language = 'en', entities = [] } = await req.json();
    if (!simulationId) return NextResponse.json({ error: 'simulationId is required' }, { status: 400 });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const numAgents = 1000;

    // 1. Generate 30 distinct sub-archetypes to prevent cluster repetition
    const entityContext = entities.map((e: any) => `${e.name} (${e.type}): ${e.description}`).join('\n');
    
    const prompt = `Topic: "${user_prompt}".
    Entities:
    ${entityContext}

    Generate 30 distinct social segments. 
    JSON: { "segments": [{ "archetype": "...", "stance": "Core conviction", "role": "Influencer|Citizen|Institution", "power": 0-1 }] }`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'system', content: 'JSON only.' }, { role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    const segments = parsed.segments || [];

    // 2. High-Fidelity Identity pools
    const firstNames = ['James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','David','Elizabeth','William','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen','Christopher','Nancy','Daniel','Lisa','Matthew','Betty','Anthony','Margaret','Mark','Sandra','Donald','Ashley','Steven','Kimberly','Paul','Emily','Andrew','Donna','Joshua','Michelle','Kenneth','Dorothy','Kevin','Carol','Brian','Amanda','George','Melissa','Timothy','Deborah','Ronald','Stephanie','Edward','Rebecca','Jason','Sharon','Jeffrey','Laura','Ryan','Cynthia','Jacob','Kathleen','Gary','Amy','Nicholas','Shirley','Eric','Angela','Jonathan','Helen','Stephen','Anna','Larry','Brenda','Justin','Pamela','Scott','Nicole','Brandon','Emma','Benjamin','Samantha','Samuel','Katherine','Gregory','Christine','Alexander','Debra','Frank','Rachel','Patrick','Catherine','Raymond','Carolyn','Jack','Janet','Dennis','Ruth','Jerry','Maria'];
    const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts','Gomez','Phillips','Evans','Turner','Diaz','Parker','Cruz','Edwards','Collins','Reyes','Stewart','Morris','Morales','Murphy','Cook','Rogers','Gutierrez','Morgan','Dean','Khan','Patel','Abbott','Karpov','Chen','Popov','Silva','Schmidt','Ferrari','Sato','Suzuki','Wong','Gore','Tesla','Zucker','Altman','Buterin','Saylor','Novogratz','Wood'];
    
    const internalMotivations = [
      'driven by historical skepticism', 'fueled by economic anxiety', 'seeking social validation', 
      'protecting household stability', 'vocalizing for the unheard', 'peting for status',
      'fearing digital displacement', 'advocating for extreme transparency', 'hoping for market recovery',
      'deeply suspicious of institutional motives', 'prioritizing environmental ethics', 'obsessed with data accuracy'
    ];

    const agents = [];
    const influencerNamesUsed = new Set<string>();

    for (let i = 0; i < numAgents; i++) {
       const seg = segments[i % segments.length];
       
       let name = "";
       let role = seg.role;
       let power = seg.power;
       let alignment = seg.stance;

       // UNIQUNESS: Real entities prioritized for Influencer roles
       if (seg.role === 'Influencer' && i < 30) {
         const realE = entities[i % entities.length];
         if (realE && !influencerNamesUsed.has(realE.name)) {
            name = realE.name;
            influencerNamesUsed.add(name);
            role = realE.type;
            power = 0.85 + (Math.random() * 0.15);
         }
       }
       
       if (!name) {
         // Recursive uniqueness for citizens
         const f = firstNames[Math.floor((i * 13) % firstNames.length)];
         const l = lastNames[Math.floor((i * 23) % lastNames.length)];
         name = `${f} ${l} ${i + 1}`; 
         role = 'Citizen';
         power = 0.05 + Math.random() * 0.2;
       }

       // UNIQUENESS: Narrative Soul
       const motivation = internalMotivations[i % internalMotivations.length];
       const hash = Math.random().toString(36).substring(7).toUpperCase();
       alignment = `${seg.stance} | Context: ${motivation} | UID: ${hash}`;

       agents.push({
         id: `agent-${i}`,
         simulation_id: simulationId,
         name,
         current_opinion: alignment,
         role,
         power: Number(power.toFixed(3)),
         metadata: {
           bias: Math.random().toFixed(2),
           activity_score: Math.random().toFixed(2),
           identity_hash: hash
         }
       });
    }

    return NextResponse.json({ 
      message: `Deployed 1,000 unique souls into simulation ${simulationId}`, 
      agents,
      localOnly: true 
    });

  } catch (err: any) {
    console.error('Spawn Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
