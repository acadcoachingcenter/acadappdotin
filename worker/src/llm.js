// Replaces base44.integrations.Core.InvokeLLM({ prompt, response_json_schema }).
// Uses Groq's free-tier OpenAI-compatible API (same provider already used by
// ACAD's other tools, e.g. the AI Doubt Solver). Swap GROQ_MODEL / endpoint for
// any other OpenAI-compatible provider if you prefer.
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function invokeLLM(env, { prompt, response_json_schema }) {
  if (!env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const messages = [{ role: "user", content: prompt }];
  if (response_json_schema) {
    messages.unshift({
      role: "system",
      content:
        "You must respond with ONLY valid JSON (no markdown fences, no commentary) that matches " +
        "this JSON schema exactly:\n" +
        JSON.stringify(response_json_schema),
    });
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages,
      ...(response_json_schema ? { response_format: { type: "json_object" } } : {}),
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq error (${res.status}): ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";

  if (response_json_schema) {
    try {
      return JSON.parse(content);
    } catch {
      throw new Error("LLM did not return valid JSON: " + content.slice(0, 200));
    }
  }
  return { text: content };
}
