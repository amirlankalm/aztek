import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { generateDeterministicEmbedding } from '@/lib/embeddings';
import { getSimulation, insertAgents, updateSimulation } from '@/lib/db';
import crypto from 'crypto';

function randomNormal(mean = 0.5, stdDev = 0.15): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  num = num / 10.0 + 0.5;
  if (num > 1 || num < 0) return randomNormal(mean, stdDev);
  return num;
}

export async function POST(req: Request) {
  try {
    const { simulationId } = await req.json();
    if (!simulationId) return NextResponse.json({ error: 'simulationId required' }, { status: 400 });

    const simulation = await getSimulation(simulationId);
    if (!simulation) throw new Error('Simulation not found');

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const archetypePrompt = `Base Topic: "${simulation.user_prompt}". Generate 10 distinct, highly varied opinion archetypes that people might have about this. Language: "${simulation.language}". Output valid JSON: { "stances": ["stance1"] }`;

    let stances: string[] = [];
    try {
      const arcCompletion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'system', content: 'Output valid JSON.' }, { role: 'user', content: archetypePrompt }],
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(arcCompletion.choices[0]?.message?.content || '{"stances": []}');
      stances = parsed.stances || Object.values(parsed).find(Array.isArray) || ['Neutral stance'];
    } catch {
      stances = ['Neutral stance', 'Opposed stance', 'Supporting stance'];
    }

    if (stances.length === 0) stances = ['Default Stance'];
    const stanceEmbeddings = stances.map((s) => generateDeterministicEmbedding(s));

    const LOCALIZED_ENTROPY: Record<string, any> = {
      en: {
        occupations: ['data scientist', 'journalist', 'researcher', 'engineer', 'financial analyst', 'sociologist', 'economist', 'academic', 'developer', 'systems architect', 'freelancer', 'consultant', 'policymaker', 'student', 'investigator'],
        backgrounds: ['corporate', 'startup sector', 'ngo / non-profit', 'government', 'academia', 'independent / underground', 'public sector'],
        genders: ['male', 'female', 'non-binary', 'undisclosed'],
        nuances: ['skeptical', 'passionate', 'analytical', 'indifferent', 'cautious', 'radical', 'pragmatic', 'idealistic', 'defensive', 'opportunistic'],
        motivations: ['a drive for societal stability', 'a deep distrust of institutional authority', 'a focus on long-term economic prosperity', 'a belief in aggressive systemic reform', 'a commitment to ethical transparency', 'a fear of impending socio-economic collapse'],
        methodologies: ['advocating for disruptive intervention', 'promoting gradual, consensus-based shifts', 'supporting decentralized community action', 'demanding strict regulatory oversight', 'prioritizing individual autonomy'],
        template: (base: string, n: string, m: string, b: string, o: string, meth: string) =>
          `${base} | A ${n} ideological framework driven by ${m}. Operating from a ${b} background, this ${o} evaluates external events by ${meth}.`,
      },
      ru: {
        occupations: ['дата-сайентист', 'журналист', 'исследователь', 'инженер', 'фин. аналитик', 'социолог', 'экономист', 'академик', 'разработчик', 'системный архитектор', 'фрилансер', 'консультант', 'политик', 'студент', 'расследователь'],
        backgrounds: ['корпоративной среды', 'сектора стартапов', 'НПО', 'госсектора', 'научной среды', 'независимой среды', 'общественного сектора'],
        genders: ['мужчина', 'женщина', 'небинарный', 'не указан'],
        nuances: ['скептическая', 'страстная', 'аналитическая', 'безразличная', 'осторожная', 'радикальная', 'прагматичная', 'идеалистическая', 'оборонительная', 'оппортунистическая'],
        motivations: ['стремлением к социальной стабильности', 'глубоким недоверием к властным институтам', 'фокусом на долгосрочном экономическом процветании', 'верой в агрессивные системные реформы', 'приверженностью этической прозрачности', 'страхом надвигающегося социально-экономического коллапса'],
        methodologies: ['пропаганду радикального вмешательства', 'продвижение постепенных изменений на основе консенсуса', 'поддержку децентрализованных действий сообщества', 'требование строгого регуляторного надзора', 'приоритет индивидуальной автономии'],
        template: (base: string, n: string, m: string, b: string, o: string, meth: string) =>
          `${base} | ${n} идеологическая основа, движимая ${m}. Действуя на базе опыта в ${b}, этот ${o} оценивает внешние события через ${meth}.`,
      },
      kk: {
        occupations: ['дата-сайентист', 'журналист', 'зерттеуші', 'инженер', 'қаржылық сарапшы', 'социолог', 'экономист', 'академик', 'әзірлеуші', 'жүйелік архитектор', 'фрилансер', 'консультант', 'саясаткер', 'студент', 'тергеуші'],
        backgrounds: ['корпоративтік орта', 'стартап секторы', 'ҮЕҰ', 'мемлекеттік сектор', 'академиялық орта', 'тәуелсіз орта', 'қоғамдық сектор'],
        genders: ['ер', 'әйел', 'бейтарап', 'көрсетілмеген'],
        nuances: ['скептикалық', 'құштарлық', 'аналитикалық', 'немқұрайлы', 'сақтық', 'радикалды', 'прагматикалық', 'идеалистік', 'қорғаныстық', 'оппортунистік'],
        motivations: ['әлеуметтік тұрақтылыққа ұмтылумен', 'институтционалдық билікке деген терең сенімсіздікпен', 'ұзақ мерзімді экономикалық өркендеуге назар аударумен', 'агрессивті жүйелік реформаларға сенумен', 'этикалық ашықтыққа адалдықпен', 'жақындап келе жатқан әлеуметтік-экономикалық күйзеліс қорқынышымен'],
        methodologies: ['радикалды араласуды насихаттау', 'консенсус негізінде біртіндеп өзгертуді алға жылжыту', 'орталықсыздандырылған қауымдастық әрекеттерін қолдау', 'қатаң реттеуші қадағалауды талап ету', 'жеке автономияға басымдық беру'],
        template: (base: string, n: string, m: string, b: string, o: string, meth: string) =>
          `${base} | ${m} негізделген ${n} идеологиялық негіз. ${b} тәжірибесіне сүйене отырып, бұл ${o} сыртқы оқиғаларды ${meth} арқылы бағалайды.`,
      },
    };

    const lang = simulation.language || 'en';
    const pool = LOCALIZED_ENTROPY[lang] || LOCALIZED_ENTROPY.en;

    const NUM_AGENTS = 800;
    const agentsToInsert = [];

    for (let i = 0; i < NUM_AGENTS; i++) {
      const stanceIndex = Math.floor(Math.random() * stances.length);
      const stance = stances[stanceIndex];
      const embedding = stanceEmbeddings[stanceIndex];

      const randomOcc = pool.occupations[Math.floor(Math.random() * pool.occupations.length)];
      const randomBg = pool.backgrounds[Math.floor(Math.random() * pool.backgrounds.length)];
      const randomGen = pool.genders[Math.floor(Math.random() * pool.genders.length)];
      const randomNuance = pool.nuances[Math.floor(Math.random() * pool.nuances.length)];
      const randomMotiv = pool.motivations[Math.floor(Math.random() * pool.motivations.length)];
      const randomMethod = pool.methodologies[Math.floor(Math.random() * pool.methodologies.length)];

      const extractStanceString = (st: any): string => {
        if (typeof st === 'string') return st.trim();
        if (typeof st === 'object' && st !== null) {
          return st.title || st.stance || st.name || st.label || st.category || Object.values(st).find((v) => typeof v === 'string') || 'Unknown Alignment';
        }
        return String(st);
      };

      const baseStanceStr = extractStanceString(stance);
      const uniqueAlignment = pool.template(baseStanceStr, randomNuance, randomMotiv, randomBg, randomOcc, randomMethod);
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
        opinion_embedding: embedding,
      });
    }

    await insertAgents(agentsToInsert);
    await updateSimulation(simulationId, { status: 'running' });

    return NextResponse.json({ message: 'Agents Spawned successfully', agentsGenerated: NUM_AGENTS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
