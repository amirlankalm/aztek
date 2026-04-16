import { NextResponse } from 'next/server';
import {
  getSimulations,
  getWorldState,
} from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const simId = searchParams.get('simId');

    if (!simId) {
      const simulations = await getSimulations();
      return NextResponse.json({ simulations });
    }

    const { simulation, agents, interactions } = await getWorldState(simId);

    return NextResponse.json({ simulation: simulation ?? null, agents, interactions });
  } catch (err: any) {
    console.error('State API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
