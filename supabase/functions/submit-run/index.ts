import { withSupabase } from "npm:@supabase/server@1";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    const declaredLength = Number(req.headers.get("content-length") ?? "0");
    if (declaredLength > 2048) return json({ error: "payload_too_large" }, 413);

    let rawBody: string;
    try {
      rawBody = await req.text();
    } catch {
      return json({ error: "invalid_body" }, 400);
    }
    if (new TextEncoder().encode(rawBody).byteLength > 2048) {
      return json({ error: "payload_too_large" }, 413);
    }

    const idempotencyKey = req.headers.get("Idempotency-Key") ?? "";
    if (!UUID_RE.test(idempotencyKey)) {
      return json({ error: "invalid_idempotency_key" }, 400);
    }

    let body: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(rawBody);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return json({ error: "invalid_run_payload" }, 400);
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const runId = body.run_id;
    const score = body.score;
    const duration = body.duration_seconds;
    if (
      typeof runId !== "string" || !UUID_RE.test(runId) ||
      !Number.isSafeInteger(score) || (score as number) < 0 || (score as number) > 1_000_000 ||
      !Number.isSafeInteger(duration) || (duration as number) < 1 || (duration as number) > 3600
    ) {
      return json({ error: "invalid_run_payload" }, 400);
    }

    const { data, error } = await ctx.supabase.rpc("rha_submit_game_run", {
      p_run_id: runId,
      p_score: score,
      p_duration_seconds: duration,
      p_idempotency_key: idempotencyKey,
    });

    if (error) {
      if (error.code === "P0001" && error.message.includes("submission_rate_limited")) {
        return json({ error: "rate_limited" }, 429);
      }
      if (error.code === "42501") return json({ error: "forbidden" }, 403);
      if (error.code === "23514") return json({ error: "run_rejected" }, 422);
      return json({ error: "submission_unavailable" }, 503);
    }

    return json(data ?? { error: "submission_unavailable" }, data ? 200 : 503);
  }),
};
