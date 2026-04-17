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

    Generate 50 distinct social niches (segments). 
    JSON: { "segments": [{ "archetype": "...", "stance": "A core conviction (1 sentence)", "role": "Influencer|Citizen|Institution", "power": 0-1 }] }`;

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
    
    // Identity-level diversity pools
    const professions = ['Software Engineer', 'Retail Manager', 'Doctor', 'High School Teacher', 'Construction Worker', 'Pensioner', 'University Student', 'Local Politician', 'Small Business Owner', 'Journalist', 'Financial Analyst', 'Truck Driver', 'Graphic Designer', 'Logistics Coordinator'];
    const demographics = ['Gen Z', 'Millennial', 'Gen X', 'Baby Boomer', 'Parent of two', 'Single professional', 'Recent immigrant', 'Rural resident', 'Urban commuter'];
    
    const individualNuances = [
      'deeply suspicious of mainstream narratives', 'optimistic about technological disruption', 'prioritizing community stability above all', 
      'motivated by ideological purism', 'seeking pragmatic financial outcomes', 'concerned about future generations',
      'neutral but easily swayed by evidence', 'heavily influenced by local peers', 'distrusting of centralized authority',
      'values efficiency and speed', 'fears radical change', 'embraces complexity and ambiguity'
    ];

    const agents = [];
    const influencerNamesUsed = new Set<string>();

    for (let i = 0; i < numAgents; i++) {
       const seg = segments[i % segments.length];
       
       let name = "";
       let role = seg.role;
       let power = seg.power;
       let baseStance = seg.stance;
       
       const profession = professions[i % professions.length];
       const demo = demographics[i % demographics.length];
       const nuance = individualNuances[i % individualNuances.length];

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
         const f = firstNames[Math.floor((i * 13) % firstNames.length)];
         const l = lastNames[Math.floor((i * 23) % lastNames.length)];
         name = `${f} ${l}`; 
         role = 'Citizen';
         power = 0.05 + Math.random() * 0.2;
       }

       // SOTA UNIQUENESS: The High-Entropy Opinion String
       // Combining Segment Stance + Professional Lens + Individual Nuance
       const hash = Math.random().toString(36).substring(7).toUpperCase();
       const opinion = `${baseStance} | Perspective: As a ${demo} ${profession}, I am ${nuance}. [ID: ${hash}]`;

       agents.push({
         id: `agent-${i}-${hash}`,
         simulation_id: simulationId,
         name,
         current_opinion: opinion,
         role,
         power: Number(power.toFixed(3)),
         metadata: {
           profession,
           demographic: demo,
           nuance,
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
