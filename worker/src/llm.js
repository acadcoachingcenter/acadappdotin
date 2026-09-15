// Replaces base44.integrations.Core.InvokeLLM({ prompt, response_json_schema }).
// Uses Groq's free-tier OpenAI-compatible API (same provider already used by
// ACAD's other tools, e.g. the AI Doubt Solver). Swap GROQ_MODEL / endpoint for
// any other OpenAI-compatible provider if you prefer.
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const MAX_RETRIES = 2;
const MAX_WAIT_MS = 20000; // Workers have execution time limits -- don't wait
                            // longer than this for any single retry.

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Groq's 429 body includes "Please try again in 15.1125s" -- honor that
// exact wait instead of guessing, since retrying too soon just burns
// another attempt against the same rate limit.
function parseRetryAfterMs(errorText) {
  const match = errorText.match(/try again in ([\d.]+)s/);
  if (match) {
    return Math.min(Math.ceil(parseFloat(match[1]) * 1000) + 500, MAX_WAIT_MS);
  }
  return 2000;
}

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

  const body = JSON.stringify({
    model: env.GROQ_MODEL || "llama-3.3-70b-versatile",
    messages,
    ...(response_json_schema ? { response_format: { type: "json_object" } } : {}),
    temperature: 0.4,
  });

  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body,
    });

    if (res.ok) {
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

    const text = await res.text();
    lastError = new Error(`Groq error (${res.status}): ${text}`);

    // Only rate limits are worth retrying -- anything else (bad request,
    // auth failure, model not found) will fail identically on retry.
    if (res.status !== 429 || attempt === MAX_RETRIES) {
      throw lastError;
    }

    await sleep(parseRetryAfterMs(text));
  }

  throw lastError;
}
