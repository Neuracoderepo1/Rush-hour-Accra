# Backend setup (non-monetary)

## Architecture

- Supabase Auth supplies the signed-in player identity.
- The `submit-run` Edge Function accepts a valid user JWT only.
- PostgreSQL stores each run as `pending`, with unique player/run and player/idempotency constraints.
- A database trigger enforces per-player submission limits and score plausibility.
- The public `leaderboard` function exposes only aggregate rows from verified runs.
- There is no public or client-accessible path to mark a run verified.

## Apply to a dedicated project

1. Create or select a dedicated Supabase project for Rush Hour, Accra. Do not reuse another product's database without an explicit architecture decision.
2. Review `supabase/setup.sql`, then apply it in that project's SQL editor.
3. Deploy the two functions from this repository with the Supabase CLI.
4. Keep JWT verification enabled for `submit-run`; the public leaderboard is the only unauthenticated function.
5. Configure the browser with the project Functions URL, its publishable key, and a sign-in integration that supplies a current access token.
6. Never put a Supabase secret/service-role key in the browser.

The repository does not contain a project URL, API key, user credentials, or a deployment secret. No hosted database or Edge Function has been changed by this PR.

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
