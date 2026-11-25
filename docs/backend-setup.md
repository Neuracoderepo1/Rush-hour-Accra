# Backend setup (non-monetary)

## Architecture

- Supabase Auth supplies the signed-in player identity.
- The `submit-run` Edge Function accepts a valid user JWT only.
- All game-owned database data lives in the isolated `rush_hour_accra` schema.
- A uniquely prefixed `public.rha_submit_game_run` RPC wrapper accepts submissions without exposing the game schema through the Data API.
- PostgreSQL stores each run as `pending`, with unique player/run and player/idempotency constraints.
- A database trigger enforces per-player submission limits and score plausibility.
- The public `rha_game_leaderboard` view and `leaderboard` Edge Function expose only aggregate rows from verified runs.
- There is no public or client-accessible path to mark a run verified.

## Apply to the approved project

1. Confirm the target Supabase project ref before applying the migration.
2. Confirm that `rush_hour_accra` does not already exist. The migration intentionally fails rather than adopting an existing schema.
3. Review `supabase/setup.sql`, then apply it as a migration to the approved project.
4. Deploy the two functions from this repository with the Supabase CLI.
5. Keep JWT verification enabled for `submit-run`; the public leaderboard is the only unauthenticated function.
6. Configure the browser with the project Functions URL, its publishable key, and a sign-in integration that supplies a current access token.
7. Never put a Supabase secret/service-role key in the browser.

The repository does not contain a project URL, API key, user credentials, or a deployment secret. The database migration creates only the `rush_hour_accra` schema and the two uniquely prefixed public API objects. It does not alter the existing `traffic` schema, traffic tables, or traffic Edge Function.

## Browser configuration

Before the game script loads, configure:

- `window.RHA_API_BASE_URL`: the project's `/functions/v1` base URL.
- `window.RHA_SUPABASE_PUBLISHABLE_KEY`: the project's publishable key.
- `window.RHA_GET_ACCESS_TOKEN`: an async callback returning the current signed-in user's Supabase access token.

If any value is absent, the game remains local-only. The browser sends only a publishable key and the signed-in user's short-lived access token. A secret/service-role key must never be exposed.

## Score review and leaderboard

A client-reported score is untrusted. Submissions are stored as `pending`; the API always returns `leaderboard_eligible: false` until an operator has independently reviewed the run and changed its status to `verified` using privileged database access. No public verification endpoint exists.

The current game sends aggregate score and duration only. This is not cryptographic proof of gameplay. Before automatic verification or a competitive leaderboard is enabled, add server-simulated runs or a server-verifiable signed event protocol, then independently test it.

Rate limits are 10 submissions per 10 minutes and 100 per 24 hours per authenticated player. These are abuse controls, not proof that a score is legitimate.
