/**
 * db.ts — Supabase-backed persistence layer.
 * All functions are async. The local fs approach is no longer used.
 * Max 10 simulations are retained (rolling window — oldest pruned on init).
 */

import { supabaseAdmin } from './supabase';

export const MAX_HISTORY = 10;

// ─── Simulations ────────────────────────────────────────────────────────────

export async function getSimulations() {
  const { data, error } = await supabaseAdmin
    .from('simulations')
    .select('id, user_prompt, language, status, created_at, stock_market, metrics')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getSimulation(id: string) {
  const { data, error } = await supabaseAdmin
    .from('simulations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Miro-style: Fetch EVERYTHING (Agents + Interactions + Metadata) in 1 row */
export async function getWorldState(id: string) {
  const { data: sim, error } = await supabaseAdmin
    .from('simulations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !sim) return { simulation: null, agents: [], interactions: [] };

  const agents = sim.metrics?.active_agents || [];
  const interactions = sim.metrics?.recent_interactions || [];

  return { simulation: sim, agents, interactions };
}

export async function insertSimulation(sim: {
  id: string;
  user_prompt: string;
  language: string;
  status: string;
  created_at: string;
  stock_market: object;
}) {
  const { error } = await supabaseAdmin.from('simulations').insert(sim);
  if (error) throw error;
}

export async function updateSimulation(id: string, updates: Record<string, any>) {
  const { error } = await supabaseAdmin
    .from('simulations')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteSimulation(id: string) {
  const { error } = await supabaseAdmin
    .from('simulations')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/** Delete the oldest simulations, keeping at most (MAX_HISTORY - 1) to make room. */
export async function pruneOldSimulations() {
  // No-op to prevent DB deadlocks during high-scale runs.
  // Cleanup should be handled by an offline batch job.
  return;
}

// ─── Agents ─────────────────────────────────────────────────────────────────

export async function insertAgents(agents: any[]) {
  if (!agents.length) return;
  const CHUNK = 100; // Smaller chunks for more breathing room
  for (let i = 0; i < agents.length; i += CHUNK) {
    const chunk = agents.slice(i, i + CHUNK);
    const { error } = await supabaseAdmin.from('agents').insert(chunk);
    if (error) {
      console.error(`Error inserting agents chunk ${i}:`, error);
      throw error;
    }
    console.log(`Successfully persisted agent chunk: ${i + chunk.length}/${agents.length}`);
    // Brief sleep to avoid saturating connection pool/CPU
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

export async function getAgents(simulationId: string, options: { light?: boolean; full?: boolean } = {}) {
  // 1. Try fetching from the simulation metrics blob first (Miro-style sync)
  const { data: sim, error: simError } = await supabaseAdmin
    .from('simulations')
    .select('metrics')
    .eq('id', simulationId)
    .maybeSingle();
  
  if (!simError && sim?.metrics?.active_agents) {
    let agents = sim.metrics.active_agents;
    if (options.light) {
      return agents.map((a: any) => ({ id: a.id, name: a.name, current_opinion: a.current_opinion }));
    }
    return agents;
  }

  // 2. Fallback to legacy agents table
  let select = '*';
  if (options.light) {
    select = 'id, name, current_opinion';
  } else if (!options.full) {
    select = 'id, name, current_opinion, adaptability, trust_propensity, interaction_frequency, gender, demographics, occupation';
  }

  const { data, error } = await supabaseAdmin
    .from('agents')
    .select(select)
    .eq('simulation_id', simulationId);

  if (error) throw error;
  return data ?? [];
}

/** Miro-style: Batch saving all active state into a single blob */
export async function saveSimulationState(simulationId: string, agents: any[], interactions?: any[]) {
  const { error } = await supabaseAdmin
    .from('simulations')
    .update({ 
      metrics: { 
        active_agents: agents,
        recent_interactions: interactions || []
      }
    })
    .eq('id', simulationId);
  if (error) throw error;
}

export async function updateAgent(id: string, updates: Record<string, any>) {
  const { error } = await supabaseAdmin
    .from('agents')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

/** Batch update agents — used by run-cycle route */
export async function batchUpdateAgents(
  updates: Array<{ id: string; current_opinion: string; opinion_embedding?: number[] }>
) {
  if (!updates.length) return;
  const CHUNK = 300;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK);
    const { error } = await supabaseAdmin
      .from('agents')
      .upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.error(`Error batch updating agents chunk ${i}:`, error);
      throw error;
    }
    console.log(`Successfully persisted agent update chunk: ${i + chunk.length}/${updates.length}`);
  }
}

// ─── Interactions ────────────────────────────────────────────────────────────

export async function insertInteractions(interactions: any[]) {
  if (!interactions.length) return;
  const CHUNK = 300;
  for (let i = 0; i < interactions.length; i += CHUNK) {
    const chunk = interactions.slice(i, i + CHUNK);
    const { error } = await supabaseAdmin.from('interactions').insert(chunk);
    if (error) {
      console.error(`Error inserting interactions chunk ${i}:`, error);
      throw error;
    }
    console.log(`Successfully persisted interactions chunk: ${i + chunk.length}/${interactions.length}`);
  }
}

export async function getInteractions(simulationId: string, limit: number | null = null) {
  let query = supabaseAdmin
    .from('interactions')
    .select('*')
    .eq('simulation_id', simulationId);
    
  if (limit) {
    query = query.order('round_number', { ascending: false }).limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function countInteractions(simulationId: string) {
  const { count, error } = await supabaseAdmin
    .from('interactions')
    .select('id', { count: 'exact', head: true })
    .eq('simulation_id', simulationId);
  if (error) throw error;
  return count ?? 0;
}

// ─── Knowledge Graph ─────────────────────────────────────────────────────────

export async function insertKnowledgeGraph(entries: any[]) {
  if (!entries.length) return;
  const CHUNK = 500;
  for (let i = 0; i < entries.length; i += CHUNK) {
    const { error } = await supabaseAdmin
      .from('knowledge_graph')
      .insert(entries.slice(i, i + CHUNK));
    if (error) throw error;
  }
}

export async function getKnowledgeGraph(simulationId: string) {
  const { data, error } = await supabaseAdmin
    .from('knowledge_graph')
    .select('*')
    .eq('simulation_id', simulationId);
  if (error) throw error;
  return data ?? [];
}
