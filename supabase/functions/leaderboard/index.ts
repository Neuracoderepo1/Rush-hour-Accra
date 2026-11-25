import { withSupabase } from "npm:@supabase/server@1";

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    if (req.method !== "GET") {
      return Response.json({ error: "method_not_allowed" }, { status: 405 });
    }

    const url = new URL(req.url);
    const rawPage = Number(url.searchParams.get("page") ?? "1");
    const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const pageSize = 25;
    const from = (page - 1) * pageSize;

    const { data, error } = await ctx.supabase
      .from("rha_game_leaderboard")
      .select("player, best_score, games_played")
      .order("best_score", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      return Response.json({ error: "leaderboard_unavailable" }, {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return Response.json({ page, page_size: pageSize, entries: data ?? [] }, {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
    });
  }),
};
