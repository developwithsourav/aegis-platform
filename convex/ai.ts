import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/* AI triage. Works in three modes:
   1. LLM_PROVIDER=anthropic|openai|gemini with a key: full LLM triage grounded in SOPs.
   2. No key set: deterministic rule based triage + SOP lookup by category.
      The demo works end to end with zero API keys (judged edge case: AI fails => manual mode).
   SOP retrieval uses vector search when embeddings exist, else the category index. */

export const getForTriage = internalQuery({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, { incidentId }) => {
    const inc = await ctx.db.get(incidentId);
    if (!inc) return null;
    const report = await ctx.db.query("reports")
      .filter((q) => q.eq(q.field("incidentId"), incidentId)).first();
    return { inc, description: report?.description ?? "", hasPhoto: !!report?.photoId };
  },
});

export const getSopsByCategory = internalQuery({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    const docs = await ctx.db.query("sops")
      .withIndex("by_category", (q) => q.eq("category", category)).take(4);
    if (docs.length) return docs;
    return await ctx.db.query("sops")
      .withIndex("by_category", (q) => q.eq("category", "other")).take(4);
  },
});

export const getSopsByIds = internalQuery({
  args: { ids: v.array(v.id("sops")) },
  handler: async (ctx, { ids }) => {
    const out = [];
    for (const id of ids) { const d = await ctx.db.get(id); if (d) out.push(d); }
    return out;
  },
});

// ---------- embeddings (RAG over the SOP knowledge base) ----------

export const listSopsForEmbedding = internalQuery({
  args: {},
  handler: async (ctx) => await ctx.db.query("sops").collect(),
});

export const setSopEmbedding = internalMutation({
  args: { id: v.id("sops"), embedding: v.array(v.float64()) },
  handler: async (ctx, { id, embedding }) => await ctx.db.patch(id, { embedding }),
});

/* One embedding helper for both providers, always emitting 1536 dims so the
   vector index in schema.ts never has to change when we swap providers.
   Gemini returns unnormalised vectors at non-default dimensions, so we unit
   normalise; OpenAI already returns normalised vectors at 1536. */
const EMBED_DIMS = 1536;

async function embed(text: string): Promise<number[] | null> {
  const provider = process.env.LLM_PROVIDER ?? "";
  const timeout = AbortSignal.timeout(15_000);
  try {
    if (provider === "gemini" && process.env.GEMINI_API_KEY) {
      const r = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent",
        {
          method: "POST", signal: timeout,
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            model: "models/gemini-embedding-001",
            content: { parts: [{ text }] },
            outputDimensionality: EMBED_DIMS,
          }),
        });
      const j = await r.json();
      const vals: number[] | undefined = j.embedding?.values;
      if (!vals?.length) return null;
      const norm = Math.hypot(...vals) || 1;
      return vals.map((x) => x / norm);
    }
    if (process.env.OPENAI_API_KEY) {
      const r = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST", signal: timeout,
        headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: "text-embedding-3-small", input: text, dimensions: EMBED_DIMS }),
      });
      const j = await r.json();
      return j.data?.[0]?.embedding ?? null;
    }
  } catch { return null; }
  return null;
}

/* Run once after seeding: npx convex run ai:embedAllSops
   Safe to re-run; it simply recomputes every SOP vector. */
export const embedAllSops = action({
  args: {},
  handler: async (ctx): Promise<{ embedded: number; failed: number }> => {
    const sops = await ctx.runQuery(internal.ai.listSopsForEmbedding, {});
    let embedded = 0, failed = 0;
    for (const s of sops) {
      const vec = await embed(`${s.category}: ${s.title}. ${s.text}`);
      if (!vec) { failed++; continue; }
      await ctx.runMutation(internal.ai.setSopEmbedding, { id: s._id, embedding: vec });
      embedded++;
    }
    return { embedded, failed };
  },
});

function ruleTriage(category: string, description: string, zone: string) {
  let priority = 3;
  if (category === "crowd" || category === "fire") priority = 1;
  if (category === "medical")
    priority = /unconscious|breath|chest|cardiac|seizure|bleed|collapse/i.test(description) ? 1 : 2;
  if (category === "violence_security") priority = 2;
  if (category === "accident_infra") priority = 2;
  if (category === "other")
    priority = /child|kid|minor/i.test(description) ? 2 : 3;
  const names: Record<string, string> = {
    fire: "Fire", medical: "Medical emergency", crowd: "Crowd crush risk",
    accident_infra: "Accident / infrastructure", violence_security: "Security incident", other: "Assistance needed",
  };
  return {
    priority,
    headline: `${names[category] ?? category}, ${zone}`,
    summary: `${names[category] ?? category} reported at ${zone}.` +
      (description ? ` Reporter said: "${description}".` : "") +
      (priority === 1 ? " Golden window response required." : " Standard response."),
    confidence: description ? 62 : 50,
  };
}

/* One Gemini attempt against a specific model. Returns the text, or null with
   the reason logged, so the caller can try the next model in the chain. */
async function tryGemini(model: string, prompt: string): Promise<string | null> {
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        signal: AbortSignal.timeout(9_000),
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY!,
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
    const j = await r.json();
    if (j.error) { console.log(`[triage] gemini ${model} error ${j.error.code}: ${j.error.message}`); return null; }
    // Thinking models can emit a thought part first, so take the first part
    // that actually carries text rather than assuming index 0.
    const text = j.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text ?? null;
    if (text) console.log(`[triage] LLM ok via gemini:${model}`);
    return text;
  } catch (e) {
    console.log(`[triage] gemini ${model} threw: ${String(e).slice(0, 120)}`);
    return null;
  }
}

async function tryOpenAI(prompt: string): Promise<string | null> {
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: AbortSignal.timeout(9_000),
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini", max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const j = await r.json();
    if (j.error) { console.log(`[triage] openai error: ${j.error.message}`); return null; }
    const text = j.choices?.[0]?.message?.content ?? null;
    if (text) console.log("[triage] LLM ok via openai:gpt-4o-mini");
    return text;
  } catch { return null; }
}

async function callLLM(prompt: string): Promise<string | null> {
  const provider = process.env.LLM_PROVIDER ?? "";
  const timeout = AbortSignal.timeout(10_000);

  /* Gemini's free tier returns transient 503 "high demand" and per-minute 429s.
     A single model is therefore not dependable during a live demo, so walk a
     chain of models and then cross over to OpenAI if a key is present, before
     giving up and letting the caller use deterministic rules. */
  if (provider === "gemini" && process.env.GEMINI_API_KEY) {
    for (const model of ["gemini-flash-latest", "gemini-2.0-flash", "gemini-flash-lite-latest"]) {
      const out = await tryGemini(model, prompt);
      if (out) return out;
    }
    if (process.env.OPENAI_API_KEY) {
      console.log("[triage] all gemini models failed, crossing over to openai");
      return await tryOpenAI(prompt);
    }
    return null;
  }

  try {
    if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", signal: timeout,
        headers: {
          "content-type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001", max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const j = await r.json();
      return j.content?.[0]?.text ?? null;
    }
    if (provider === "openai" && process.env.OPENAI_API_KEY) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", signal: timeout,
        headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: "gpt-4o-mini", max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const j = await r.json();
      return j.choices?.[0]?.message?.content ?? null;
    }
  } catch { return null; }
  // No provider configured, or the configured one has no key: the caller falls
  // back to deterministic rule triage, which is a supported operating mode.
  return null;
}

export const triage = internalAction({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, { incidentId }) => {
    const data = await ctx.runQuery(internal.ai.getForTriage, { incidentId });
    if (!data) return;
    const { inc, description, hasPhoto } = data;

    // 1. Retrieve SOPs. Preferred path is semantic vector search over the NDMA
    //    knowledge base; if embeddings are not seeded or the embedding call
    //    fails we fall back to the category index so triage never blocks.
    let sopDocs = null;
    let retrieval = "category index";
    const queryVec = await embed(`${inc.category} emergency at ${inc.zone}. ${description}`);
    if (queryVec) {
      const hits = await ctx.vectorSearch("sops", "by_embedding", { vector: queryVec, limit: 4 });
      if (hits.length) {
        const docs = await ctx.runQuery(internal.ai.getSopsByIds, { ids: hits.map((h) => h._id) });
        if (docs.length) { sopDocs = docs; retrieval = "vector search"; }
      }
    }
    if (!sopDocs)
      sopDocs = await ctx.runQuery(internal.ai.getSopsByCategory, { category: inc.category });
    console.log(`[triage] SOP retrieval via ${retrieval}, ${sopDocs.length} docs`);

    const rules = ruleTriage(inc.category, description, inc.zone);
    const sopSteps = sopDocs.map((d) => d.text);
    const sopSource = sopDocs[0]?.source ?? "Team curated NDMA excerpts";

    // 2. Ask the LLM (if configured); fall back to rules silently
    const prompt =
`You are the triage engine of an emergency command system at a crowded venue.
Incident category: ${inc.category}. Zone: ${inc.zone}. Reporter said: "${description}".
Merged reports: ${inc.reportCount}. Photo attached: ${hasPhoto ? "yes" : "no"}.
Official SOP excerpts (the ONLY allowed source for steps):
${sopDocs.map((d) => `[${d.source}] ${d.text}`).join("\n")}

Return ONLY valid JSON, no markdown:
{"priority": 1, "headline": "max 8 words: CATEGORY, zone", "summary": "2 sentences for the operator",
 "confidence": 80, "sopSteps": ["3 to 6 imperative steps taken only from the excerpts"], "sopSource": "source label"}

Priority rules: crowd crush, fire, cardiac or breathing = 1. Violence, injury, smoke = 2.
Lost adult or minor hazard = 3. Complaints = 4. Lost child = 2.`;

    const raw = await callLLM(prompt);
    if (raw) {
      try {
        const out = JSON.parse(raw.replace(/```json|```/g, "").trim());
        await ctx.runMutation(internal.incidents.applyTriage, {
          incidentId,
          priority: Math.min(4, Math.max(1, Number(out.priority) || rules.priority)),
          headline: String(out.headline ?? rules.headline).slice(0, 80),
          summary: String(out.summary ?? rules.summary).slice(0, 400),
          confidence: Math.min(99, Math.max(1, Number(out.confidence) || rules.confidence)),
          sopSteps: Array.isArray(out.sopSteps) && out.sopSteps.length
            ? out.sopSteps.map(String).slice(0, 6) : sopSteps.slice(0, 5),
          sopSource: String(out.sopSource ?? sopSource),
        });
        return;
      } catch { /* fall through to rules */ }
    }
    await ctx.runMutation(internal.incidents.applyTriage, {
      incidentId, ...rules,
      sopSteps: sopSteps.slice(0, 5), sopSource,
      aiFailed: !process.env.LLM_PROVIDER ? undefined : true,
    });
  },
});
