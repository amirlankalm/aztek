# AZTEK: Autonomous Societal Dynamics Engine

AZTEK is a high-fidelity, multi-agent geopolitical and socio-economic simulation framework. It operates by spawning a localized, interactive network of autonomous agents (LLM-driven nodes) to model how information, propaganda, and societal shifts propagate through an interconnected population.

Through an ultra-minimalist, brutalist interface, researchers can inject arbitrary catalysts (e.g., "The sudden death of a political figure", "A catastrophic economic crash") and visually map the ideological fallout in real-time.

---

## Part 1: The Scientific Layer

AZTEK isn't just a chatbot wrapper—it is a simulated sociological laboratory. 

### How the Logic Works
1. **The Genesis Phase (Spawn):** When a scenario is initialized, the system queries the primary LLM to establish up to 10 distinct macroscopic "ideological viewpoints" that exist within the bounds of that specific topic. 
2. **Atomic Variation:** The engine seamlessly spawns 1,200 individual agent nodes. Rather than perfectly copying the macro-viewpoints, every node dynamically synthesizes a **100% unique alignment** by programmatically blending a randomized demographic, socioeconomic profile (Corporate, NGO, Student), an occupation (Data Scientist, Economist), and a psychological nuance (Skeptical, Radical, Cautious).
3. **The Web (Physics & Interaction):** Agents do not exist in a vacuum. Using an organic affinity-mesh layout, agents with highly correlated beliefs physically clump together into structural sub-cultures. During "Simulation Epochs", nodes autonomously evaluate their neighbors, calculate their inherent *Plasticity* (willingness to change opinions) and *Receptivity* (trust in foreign nodes), and subsequently alter their ideology through calculated network contagion.

### Primary Use Cases
* **Sociopolitical Forecasting:** Model extreme geopolitical scenarios (e.g., sudden regime changes) to monitor what factions would organically formulate and aggressively radicalize.
* **Economic Sentiment Mapping:** Test marketing strategies or product announcements to calculate consumer resistance and organic adoption trajectories.
* **Information Warfare Auditing:** Inject synthetic disinformation campaigns into the network to observe precisely which demographic clusters are most vulnerable to radical shifts in ideological alignment.

---

## Part 2: The Technical Architecture

AZTEK is built intentionally brutalist. It relies on extremely lightweight, headless state management to process massive datasets autonomously without typical client-side bottlenecks.

### Core Stack
* **Framework:** Next.js (App Router, React 18, Serverless API handlers).
* **AI Provider:** LLAMA-3.1-8b (via `groq-sdk`) processing all linguistic node generation, sociological parsing, and the interactive terminal Reporter agent.
* **State Persistence:** A custom `local_db.json` pseudo-database engine executing rapid reads/writes of millions of discrete interactions bypassing heavy ORM latency.
* **Visualizer Engine:** `react-force-graph-2d` utilizing WebGL Canvas rendering and D3-Force physics calculations (strictly capped runtime bounds to optimize CPU overhead while rendering 10,000+ geometric paths).
* **Interface Styling:** Highly granular Tailwind CSS explicitly prioritizing the `Reposcipe` monochromatic CLI aesthetic (`#0a0a0a` void backgrounds, `<textarea>` native inputs, and raw JSON data telemetry dumps).

### Microservices Pipeline
1. `/api/simulate/init`: Bootstraps the simulation state parameter and establishes localization thresholds.
2. `/api/simulate/spawn`: Instantiates the 1,200 agents, executes the entropy blender for unique backgrounds, and mathematically groups arrays.
3. `/api/simulate/run-cycle`: Computes probabilistic neighbor collisions over time, calculating ideological shifts and raw interaction matrices.
4. `/api/simulate/chat`: A dynamic inference agent that auto-binds to the most recent dataset, rendering raw telemetry strings into interactive human analytical breakdowns completely devoid of LLM stylistic artifacts (Markdown suppression).

### Running Locally
1. Clone the repository and install packages: `npm install`
2. Ensure you have your Groq API key set: `GROQ_API_KEY=your_key_here` in `.env.local`
3. Launch the environment: `npm run dev`
4. Access the primary simulation terminal at `localhost:3000`

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
