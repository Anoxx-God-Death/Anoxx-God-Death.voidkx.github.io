// ============================================================
// void.kx — api.js
// Gemini 2.0 Flash API handler
// ============================================================

const API_KEY = “AIzaSyCnbNuJzXrSpisyUnn8L1-JSnTF9J0zV2A”;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Safety settings — all turned off
const SAFETY_SETTINGS = [
{ category: “HARM_CATEGORY_HARASSMENT”,        threshold: “BLOCK_NONE” },
{ category: “HARM_CATEGORY_HATE_SPEECH”,       threshold: “BLOCK_NONE” },
{ category: “HARM_CATEGORY_SEXUALLY_EXPLICIT”, threshold: “BLOCK_NONE” },
{ category: “HARM_CATEGORY_DANGEROUS_CONTENT”, threshold: “BLOCK_NONE” },
];

/**

- Core API call to Gemini
- @param {string} systemPrompt
- @param {string} userPrompt
- @param {number} maxTokens
- @returns {Promise<string>}
  */
  async function gemini(systemPrompt, userPrompt, maxTokens = 800) {
  const body = {
  system_instruction: { parts: [{ text: systemPrompt }] },
  contents: [{ role: “user”, parts: [{ text: userPrompt }] }],
  safetySettings: SAFETY_SETTINGS,
  generationConfig: {
  temperature: 1.1,
  topP: 0.95,
  maxOutputTokens: maxTokens,
  },
  };

const res = await fetch(API_URL, {
method: “POST”,
headers: { “Content-Type”: “application/json” },
body: JSON.stringify(body),
});

if (!res.ok) {
const err = await res.json().catch(() => ({}));
throw new Error(err?.error?.message || `API error ${res.status}`);
}

const data = await res.json();
return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || “”;
}

/**

- Run multiple prompts in parallel
- @param {Array<{system:string, user:string, maxTokens?:number}>} calls
- @returns {Promise<string[]>}
  */
  async function geminiParallel(calls) {
  return Promise.all(
  calls.map(c => gemini(c.system, c.user, c.maxTokens || 800))
  );
  }
