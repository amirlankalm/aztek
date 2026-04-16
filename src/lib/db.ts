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

/** Delete the oldest simulations, keeping at most (MAX_HISTORY - 1) to make room. */
export async function pruneOldSimulations() {
  const { data, error } = await supabaseAdmin
    .from('simulations')
    .select('id, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  if (!data) return;

  if (data.length >= MAX_HISTORY) {
    const toDelete = data.slice(0, data.length - (MAX_HISTORY - 1));
    const ids = toDelete.map((s) => s.id);
    // Cascade deletes agents/interactions/kg via FK constraints
    await supabaseAdmin.from('simulations').delete().in('id', ids);
  }
}

// ─── Agents ─────────────────────────────────────────────────────────────────

export async function insertAgents(agents: any[]) {
  if (!agents.length) return;
  // Supabase has a 1000-row upsert limit; chunk to be safe
  const CHUNK = 500;
  for (let i = 0; i < agents.length; i += CHUNK) {
    const { error } = await supabaseAdmin
      .from('agents')
      .insert(agents.slice(i, i + CHUNK));
    if (error) throw error;
  }
}

export async function getAgents(simulationId: string) {
  const { data, error } = await supabaseAdmin
    .from('agents')
    .select('*')
    .eq('simulation_id', simulationId);
  if (error) throw error;
  return data ?? [];
}

export async function updateAgent(id: string, updates: Record<string, any>) {
  const { error } = await supabaseAdmin
    .from('agents')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

// Batch update agents — used by run-cycle route
export async function batchUpdateAgents(
  updates: Array<{ id: string; current_opinion: string; opinion_embedding?: number[] }>
) {
  if (!updates.length) return;
  // Supabase/Postgres may timeout on massive single-statement upserts. Chunk into 500s.
  const CHUNK = 500;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const { error } = await supabaseAdmin
      .from('agents')
      .upsert(updates.slice(i, i + CHUNK), { onConflict: 'id' });
    if (error) throw error;
  }
}

// ─── Interactions ────────────────────────────────────────────────────────────

export async function insertInteractions(interactions: any[]) {
  if (!interactions.length) return;
  const CHUNK = 500;
  for (let i = 0; i < interactions.length; i += CHUNK) {
    const { error } = await supabaseAdmin
      .from('interactions')
      .insert(interactions.slice(i, i + CHUNK));
    if (error) throw error;
  }
}

export async function getInteractions(simulationId: string) {
  const { data, error } = await supabaseAdmin
    .from('interactions')
    .select('*')
    .eq('simulation_id', simulationId);
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
