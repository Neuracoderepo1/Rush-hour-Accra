# Score API contract (non-monetary)

This is an integration contract, not a deployed server. Until an authenticated API is configured, the game remains playable in local-only mode.

## Product boundary

- Scores and tokens are non-monetary game data only.
- They cannot be redeemed, transferred, sold, exchanged, or withdrawn.
- Sponsor placements are optional and never grant points, boosts, extra lives, or gameplay advantages.
- The browser is untrusted. A client-submitted score is a claim, not proof of a legitimate run.

## POST /api/v1/runs

Require an authenticated same-origin session cookie. Enforce CSRF protection and an explicit allowed-origin policy.

Headers: `Content-Type: application/json`, `Idempotency-Key: <unique run id>`.

Body:

```json
{
  "run_id": "uuid",
  "score": 1250,
  "duration_seconds": 42
}
```

The server must authenticate the player from a server-managed session, validate types and ranges, enforce idempotency on both key and run ID, rate-limit submissions, and reject impossible score rates. Prefer server-simulated runs or signed event streams before ranking results. Store accepted run records and audit rejections without unnecessary personal data. Repeated idempotency keys must return the original result.

Suggested response:

```json
{
  "run_id": "uuid",
  "status": "accepted",
  "score": 1250,
  "leaderboard_eligible": false
}
```

Keep `leaderboard_eligible` false until server-side anti-cheat validation is implemented and independently tested.

## GET /api/v1/leaderboard

Return public aggregate scores only. Never expose email addresses, session identifiers, IP addresses, or private player data. Add pagination and caching. The current frontend does not consume this endpoint.

## Operational requirements

- HTTPS only; session cookies must be HttpOnly, Secure, and use an appropriate SameSite policy.
- CSRF token validation for state-changing requests.
- Server-side rate limits and strict request schema validation.
- Database uniqueness constraint on (player_id, run_id).
- Structured audit events for accepted and rejected submissions.
- No cash balances, ad-revenue allocations, payment rails, or redemption endpoints in this project scope.
