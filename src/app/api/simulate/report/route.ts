import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import {
  getSimulation,
  getAgents,
  countInteractions,
  updateSimulation,
} from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { simulationId, localData } = await req.json();
    if (!simulationId) return NextResponse.json({ error: 'simulationId required' }, { status: 400 });

    let simulation: any;
    let agents: any[] = [];
    let totalInteractions = 0;

    if (simulationId.startsWith('local-') && localData) {
      simulation = {
        user_prompt: localData.user_prompt || 'local simulation',
        language: localData.language || 'en'
      };
      agents = localData.agents || [];
      totalInteractions = localData.interactionsCount || 0;
    } else {
      simulation = await getSimulation(simulationId);
      if (!simulation) throw new Error('Simulation not found');
      agents = await getAgents(simulationId);
      totalInteractions = await countInteractions(simulationId);
    }

    const totalAgents = agents.length;

    const opinionCounts: Record<string, number> = {};
    agents.forEach((a: any) => {
      opinionCounts[a.current_opinion] = (opinionCounts[a.current_opinion] || 0) + 1;
    });

    const distinctOpinions = Object.keys(opinionCounts).length;
    const sortedOpinions = Object.entries(opinionCounts).sort((a, b) => b[1] - a[1]);
    const topOpinion = sortedOpinions[0];
    const stabilityScore = distinctOpinions <= 3 ? 'high' : distinctOpinions <= 7 ? 'medium' : 'low';

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const reportPrompt = `Analyze telemetry. Topic: "${simulation.user_prompt}". Stats: ${totalAgents} agents, ${totalInteractions} interactions. Dominant Opinion: "${topOpinion ? topOpinion[0] : 'none'}". Stability: ${stabilityScore}. Write a concise qualitative report responding strictly in "${simulation.language || 'en'}" locale. Return valid JSON: { "report": "..." }`;

    let finalReportText = 'no report generated.';
    try {
      const reportCompletion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Output valid JSON.' },
          { role: 'user', content: reportPrompt },
        ],
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(reportCompletion.choices[0]?.message?.content || '{}');
      const rawReport = parsed.report || Object.values(parsed)[0] || 'no report generated.';
      finalReportText = typeof rawReport === 'string' ? rawReport : JSON.stringify(rawReport, null, 2);
    } catch {
      finalReportText = 'system degraded, could not synthesize report.';
    }

    const metrics = {
      total_interactions: totalInteractions,
      distinct_opinions: distinctOpinions,
      stability: stabilityScore,
      report_text: finalReportText,
    };

    await updateSimulation(simulationId, { metrics, status: 'completed' });

    return NextResponse.json({ report: finalReportText, metrics });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
