# Score API contract (non-monetary)

The backend implementation is in `supabase/`. It is not deployed by this repository change. Until a dedicated Supabase project and authenticated sign-in integration are configured, the game remains playable in local-only mode.

## Product boundary

- Scores and tokens are non-monetary game data only.
- They cannot be redeemed, transferred, sold, exchanged, or withdrawn.
- Sponsor placements are optional and never grant points, boosts, extra lives, or gameplay advantages.
- The browser is untrusted. A client-submitted score is a claim, not proof of a legitimate run.

## POST /submit-run

The authenticated Supabase Edge Function requires a valid Supabase user JWT. It accepts:

Headers: `Authorization: Bearer <user access token>`, `apikey: <publishable key>`, `Content-Type: application/json`, and `Idempotency-Key: <UUID>`.

Body:

```json
{
  "run_id": "uuid",
  "score": 1250,
  "duration_seconds": 42
}
```

The server derives player identity from the verified JWT. It does not accept a client-supplied player ID. The database enforces unique (player_id, run_id) and (player_id, idempotency_key), validates score and duration bounds, and limits submissions to 10 per 10 minutes and 100 per 24 hours per player.

Accepted submissions are stored as `pending`. Replaying an idempotency key returns the original result. The endpoint does not grant any redeemable value.

Suggested response:

```json
{
  "run_id": "uuid",
  "status": "pending",
  "score": 1250,
  "leaderboard_eligible": false
}
```

## GET /leaderboard

Public endpoint returning aggregate scores from verified runs only. It exposes a generated player alias, best score, and number of verified games. It does not expose email addresses, user IDs, session identifiers, IP addresses, or private player data.

## Verification boundary

A client-reported score is not proof of legitimate play. No public verification endpoint or client update permission exists. Runs remain pending until independently reviewed by an authorized database operator. Automatic verification requires a server-simulated run or server-verifiable signed event protocol and independent anti-cheat testing.

## Operational requirements

- HTTPS only; never expose a Supabase secret/service-role key in the browser.
- Keep Edge Function JWT verification enabled for `submit-run`.
- Use Supabase Auth access tokens and a publishable key in the client.
- Keep row-level security enabled on the private run table.
- Review and apply `supabase/setup.sql` only to a dedicated project.
- No cash balances, ad-revenue allocations, payment rails, or redemption endpoints are part of this project.
