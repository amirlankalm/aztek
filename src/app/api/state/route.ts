import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const simId = searchParams.get('simId');

  if (!simId) return NextResponse.json({ error: 'simId required' }, { status: 400 });

  const db = readDB();
  const agents = db.agents.filter(a => a.simulation_id === simId);
  const interactions = db.interactions.filter(i => i.simulation_id === simId);

  const simulation = db.simulations.find(s => s.id === simId) || null;

  return NextResponse.json({ simulation, agents, interactions });
}
