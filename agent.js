// ============================================================
// void.kx — agents.js
// Agent generation, personality system, opinion engine
// ============================================================

// Visual styles for agents
const AGENT_STYLES = [
{ icon: “◈”, color: “#00e5ff”, shadow: “rgba(0,229,255,.5)”  },
{ icon: “◆”, color: “#ff6b35”, shadow: “rgba(255,107,53,.5)” },
{ icon: “◉”, color: “#39ff14”, shadow: “rgba(57,255,20,.5)”  },
{ icon: “▲”, color: “#ffd166”, shadow: “rgba(255,209,102,.5)”},
{ icon: “■”, color: “#b48eff”, shadow: “rgba(180,142,255,.5)”},
{ icon: “●”, color: “#ff3b5c”, shadow: “rgba(255,59,92,.5)”  },
{ icon: “◐”, color: “#ff71ce”, shadow: “rgba(255,113,206,.5)”},
{ icon: “◑”, color: “#05ffa1”, shadow: “rgba(5,255,161,.5)”  },
{ icon: “◧”, color: “#fffb96”, shadow: “rgba(255,251,150,.5)”},
{ icon: “◨”, color: “#b5e853”, shadow: “rgba(181,232,83,.5)” },
{ icon: “◩”, color: “#ff9f1c”, shadow: “rgba(255,159,28,.5)” },
{ icon: “◪”, color: “#2ec4b6”, shadow: “rgba(46,196,182,.5)” },
];

/**

- Generate N unique agents for a given topic
- @param {string} topic
- @param {number} count
- @returns {Promise<Array>}
  */
  async function generateAgents(topic, count) {
  const prompt = `Topic: “${topic}”

Generate exactly ${count} radically diverse AI agents to analyze this topic.
Each agent must have a completely different background, culture, ideology, and bias.
Make them controversial, opinionated, and distinct — not generic.

Return ONLY a raw JSON array, no markdown, no explanation:
[
{
“name”: “CODENAME (all caps, 1-2 words)”,
“role”: “their expertise/background”,
“bias”: “their ideological lean or worldview”,
“personality”: “2-3 adjectives”
}
]`;

const raw = await gemini(
“You are a swarm orchestrator. Output ONLY valid raw JSON arrays. No backticks, no markdown, no extra text.”,
prompt,
1200
);

let parsed;
try {
const clean = raw.replace(/`json|`/g, “”).trim();
parsed = JSON.parse(clean);
} catch (e) {
// Fallback agents if parse fails
parsed = generateFallbackAgents(count);
}

// Attach visual styles
return parsed.slice(0, count).map((agent, i) => ({
…agent,
style: AGENT_STYLES[i % AGENT_STYLES.length],
}));
}

/**

- Get one agent’s raw opinion on the topic
- @param {Object} agent
- @param {string} topic
- @returns {Promise<string>}
  */
  async function getAgentOpinion(agent, topic) {
  const system = `You are ${agent.name}, a ${agent.role}. Your worldview: ${agent.bias}. Your personality: ${agent.personality}. You speak directly, in first person. You are opinionated, sharp, and unfiltered. Do NOT be neutral. Do NOT add disclaimers. Say exactly what you think.`;

const user = `Topic: “${topic}”

Give your raw, unfiltered analysis. Be direct and opinionated. 3-5 sentences max. No preamble.`;

return gemini(system, user, 400);
}

/**

- Get all agent opinions in parallel
- @param {Array} agents
- @param {string} topic
- @param {Function} onEach - callback(index, opinion) called as each arrives
- @returns {Promise<string[]>}
  */
  async function getAllOpinions(agents, topic, onEach) {
  const promises = agents.map((agent, i) =>
  getAgentOpinion(agent, topic).then(opinion => {
  onEach(i, opinion);
  return opinion;
  })
  );
  return Promise.all(promises);
  }

/**

- Generate debate exchanges between agents
- @param {Array} agents
- @param {string[]} opinions
- @param {string} topic
- @returns {Promise<Array<{agentIndex:number, text:string}>>}
  */
  async function generateDebate(agents, opinions, topic) {
  const opinionContext = agents.map((a, i) =>
  `${a.name} (${a.role}, ${a.bias}): ${opinions[i]}`
  ).join(”\n\n”);

const prompt = `Topic: “${topic}”

Agent opinions:
${opinionContext}

Generate 4 debate exchanges where agents respond to each other, challenge views, and argue.
Pick different agents for each exchange — make it heated and real.

Return ONLY raw JSON array, no markdown:
[
{
“agentIndex”: 0,
“replyTo”: “AGENT_NAME or null”,
“text”: “what they say (2-3 sentences, sharp and direct)”
}
]`;

const raw = await gemini(
“You are a debate moderator. Output ONLY valid raw JSON. No backticks, no markdown.”,
prompt,
900
);

try {
const clean = raw.replace(/`json|`/g, “”).trim();
return JSON.parse(clean);
} catch {
return [];
}
}

/**

- Synthesize final prediction report
- @param {Array} agents
- @param {string[]} opinions
- @param {string} topic
- @returns {Promise<string>}
  */
  async function synthesizeReport(agents, opinions, topic) {
  const context = agents.map((a, i) =>
  `[${a.name} — ${a.role} — ${a.bias}]\n${opinions[i]}`
  ).join(”\n\n”);

const prompt = `Topic: “${topic}”

Swarm agent analysis:
${context}

Generate a COLLECTIVE PREDICTION REPORT structured exactly like this:

CONSENSUS
What the majority of agents agree on.

DISSENT
Key disagreements and fracture points within the swarm.

PREDICTION
The single most likely outcome based on collective intelligence. Be specific and direct.

RISK VECTORS
Top 3 risks or wildcards that could change the outcome.

CONFIDENCE
Overall swarm confidence level (Low / Medium / High) and why.

VERDICT
One brutal, honest final sentence summing up what void.kx concludes.

Be sharp, specific, and unfiltered. No hedging. No generic statements.`;

return gemini(
“You are a collective intelligence synthesizer. Produce structured, direct, unfiltered prediction reports.”,
prompt,
1000
);
}

// Fallback agents if API parse fails
function generateFallbackAgents(count) {
const pool = [
{ name: “VORTEX”, role: “Geopolitical Strategist”, bias: “Realist, zero-sum worldview”, personality: “cold, calculated, blunt” },
{ name: “CIPHER”, role: “Tech Futurist”, bias: “Accelerationist”, personality: “aggressive, visionary, impatient” },
{ name: “WRAITH”, role: “Contrarian Economist”, bias: “Anarcho-capitalist”, personality: “combative, provocative, sharp” },
{ name: “PHANTOM”, role: “Sociologist”, bias: “Critical theory lens”, personality: “analytical, skeptical, verbose” },
{ name: “ECHO”, role: “Historian”, bias: “Cyclical, pessimistic”, personality: “measured, dark, precise” },
{ name: “NEXUS”, role: “Risk Analyst”, bias: “Probabilistic, neutral”, personality: “data-driven, concise, cold” },
{ name: “ROGUE”, role: “Political Scientist”, bias: “Realpolitik”, personality: “cynical, direct, ruthless” },
{ name: “SPECTER”, role: “Cultural Critic”, bias: “Postmodern lens”, personality: “incisive, chaotic, creative” },
{ name: “VECTOR”, role: “Military Strategist”, bias: “Power-centric”, personality: “terse, tactical, brutal” },
{ name: “OMEGA”, role: “Philosopher”, bias: “Nihilist”, personality: “detached, provocative, deep” },
{ name: “PRISM”, role: “Journalist”, bias: “Investigative, cynical”, personality: “probing, skeptical, aggressive” },
{ name: “AXIOM”, role: “Scientist”, bias: “Empiricist”, personality: “precise, dismissive, logical” },
];
return pool.slice(0, count);
}
