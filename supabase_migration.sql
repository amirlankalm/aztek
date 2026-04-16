-- AZTEK: Supabase Schema Migration
-- Run this in your Supabase SQL Editor before deploying.

-- 1. Simulations table
create table if not exists simulations (
  id uuid primary key,
  user_prompt text not null,
  language text not null default 'en',
  status text not null default 'initialized',
  created_at timestamptz not null default now(),
  stock_market jsonb,
  metrics jsonb
);

-- 2. Agents table
create table if not exists agents (
  id uuid primary key,
  simulation_id uuid not null references simulations(id) on delete cascade,
  name text,
  gender text,
  demographics text,
  occupation text,
  trust_propensity float8,
  adaptability float8,
  interaction_frequency float8,
  initial_stance text,
  current_opinion text,
  opinion_embedding float8[]
);
create index if not exists agents_sim_id on agents(simulation_id);

-- 3. Interactions table
create table if not exists interactions (
  id uuid primary key,
  simulation_id uuid not null references simulations(id) on delete cascade,
  source_agent_id uuid,
  target_agent_id uuid,
  message text,
  impact_score float8,
  round_number int
);
create index if not exists interactions_sim_id on interactions(simulation_id);

-- 4. Knowledge graph table
create table if not exists knowledge_graph (
  id uuid primary key,
  simulation_id uuid not null references simulations(id) on delete cascade,
  entity_source text,
  relationship text,
  entity_target text
);
create index if not exists kg_sim_id on knowledge_graph(simulation_id);
