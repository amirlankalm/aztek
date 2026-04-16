-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Simulations Table (Stores the overarching scenarios)
CREATE TABLE simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_prompt TEXT NOT NULL,
    language VARCHAR(2) DEFAULT 'en', -- en, ru, kk
    status VARCHAR(50) DEFAULT 'initializing', -- initializing, running, completed
    metrics JSONB, -- Stores accuracy, convergence, diversity, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Knowledge Graph Table (GraphRAG extracted entities)
CREATE TABLE knowledge_graph (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    entity_source TEXT NOT NULL,
    relationship TEXT NOT NULL,
    entity_target TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Agents Table (1000 parameterized personas)
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    name VARCHAR(255),
    -- Behavioral Dimensions (0.0 to 1.0)
    trust_propensity FLOAT NOT NULL,
    adaptability FLOAT NOT NULL,
    interaction_frequency FLOAT NOT NULL,
    -- State
    initial_stance TEXT NOT NULL,
    current_opinion TEXT NOT NULL,
    opinion_embedding vector(1536), -- For tracking clusters and changes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Interactions Table (The simulation timeline)
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    source_agent_id UUID REFERENCES agents(id),
    target_agent_id UUID REFERENCES agents(id), -- Can be NULL if it's a broadcast
    message TEXT NOT NULL,
    impact_score FLOAT, -- How much it changed the target's opinion
    round_number INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance (Crucial for 1000 agents)
CREATE INDEX idx_agents_simulation ON agents(simulation_id);
CREATE INDEX idx_interactions_simulation ON interactions(simulation_id);
CREATE INDEX idx_interactions_round ON interactions(round_number);
