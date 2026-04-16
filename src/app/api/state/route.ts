import { NextResponse } from 'next/server';
import {
  getSimulations,
  getSimulation,
  getAgents,
  getInteractions,
} from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const simId = searchParams.get('simId');

  if (!simId) {
    const simulations = await getSimulations();
    return NextResponse.json({ simulations });
  }

  const [simulation, agents, interactions] = await Promise.all([
    getSimulation(simId),
    getAgents(simId),
    getInteractions(simId),
  ]);

  return NextResponse.json({ simulation: simulation ?? null, agents, interactions });
}
