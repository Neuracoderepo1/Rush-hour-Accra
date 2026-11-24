# Score API contract (non-monetary)

The backend is deployed to the approved Supabase project **Neuracode Games** (\`jgmpodbamtqhofdocvdo\`, region \`eu-west-2\`). The public leaderboard endpoint has passed an external HTTP smoke test and currently returns an empty first page because no runs have been submitted or verified.

The browser game remains local-only until an Auth sign-in flow and browser configuration are connected. No authenticated test user/session is configured, so live score submission has not yet been tested.

## Product boundary

- Scores and tokens are non-monetary game data only.
- They cannot be redeemed, transferred, sold, exchanged, or withdrawn.
- Sponsor placements are optional and never grant points, boosts, extra lives, or gameplay advantages.
- The browser is untrusted. A client-submitted score is a claim, not proof of a legitimate run.

## POST /submit-run

Deployed Edge Function: \`https://jgmpodbamtqhofdocvdo.supabase.co/functions/v1/submit-run\`

The function requires a valid Supabase user JWT. It accepts:

Headers: \`Authorization: Bearer <user access token>\`, \`apikey: <publishable key>\`, \`Content-Type: application/json\`, and \`Idempotency-Key: <UUID>\`.

Body:

\`\`\`json
{
  "run_id": "uuid",
  "score": 1250,
  "duration_seconds": 42
}
\`\`\`

The server derives player identity from the verified JWT. It does not accept a client-supplied player ID. The database enforces unique (player_id, run_id) and (player_id, idempotency_key), validates score and duration bounds, and limits submissions to 10 per 10 minutes and 100 per 24 hours per player.

Accepted submissions are stored as \`pending\`. Replaying an idempotency key returns the original result. The endpoint does not grant any redeemable value.

## GET /leaderboard

Deployed public endpoint: \`https://jgmpodbamtqhofdocvdo.supabase.co/functions/v1/leaderboard\`

External HTTP smoke test: **PASS**. The endpoint returned HTTP-success JSON with \`page: 1\`, \`page_size: 25\`, and an empty \`entries\` array. Empty results are expected until independently reviewed runs are marked verified.

The endpoint returns aggregate scores from verified runs only. It exposes a generated player alias, best score, and number of verified games. It does not expose email addresses, user IDs, session identifiers, IP addresses, or private player data.

## Verification boundary

A client-reported score is not proof of legitimate play. No public verification endpoint or client update permission exists. Runs remain pending until independently reviewed by an authorized database operator. Automatic verification requires a server-simulated run or server-verifiable signed event protocol and independent anti-cheat testing.

## Operational requirements

- HTTPS only; never expose a Supabase secret/service-role key in the browser.
- Keep Edge Function JWT verification enabled for \`submit-run\`.
- Use Supabase Auth access tokens and a publishable key in the client.
- Keep row-level security enabled on \`rush_hour_accra.game_runs\`.
- Keep the \`rush_hour_accra\` schema out of the exposed Data API schemas; access it through the prefixed RPC and leaderboard view only.
- No cash balances, ad-revenue allocations, payment rails, or redemption endpoints are part of this project.
