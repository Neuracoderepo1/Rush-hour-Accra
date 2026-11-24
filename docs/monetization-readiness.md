# Future monetary-rewards readiness

## Product decision

Rush Hour, Accra is non-monetary at launch, but its architecture should leave a clean path for a separately authorized monetary-rewards capability in a future release. This is an extension point, not a promise that rewards, cash value, or withdrawals are available.

## Capability states

1. **OFF (default):** only gameplay scores and non-redeemable tokens exist. No monetary balance, reward entitlement, payout, or cash-out operation is available.
2. **DESIGN_ONLY:** future requirements, legal review, risk assessment, and threat modelling may be documented. No money movement or user-facing monetary promise is enabled.
3. **AUTHORIZED_FUTURE_RELEASE:** a future release may introduce a separately reviewed rewards service after the release gates below are satisfied. This state must not be enabled by a client-side flag or ordinary game configuration.

The current release must remain in OFF. No environment variable or public API may activate monetary functionality.

## Keep the domains separate

Do not turn game tokens, scores, leaderboard points, or pending run submissions into money. If a future release is approved, implement a separate bounded context with its own data model, permissions, audit trail, operational controls, and independent tests. Do not add monetary columns to `game_runs` or overload the existing score ledger.

The future domain should distinguish, at minimum, eligibility decisions from game scoring and from any later financial settlement. The game client must never be authoritative for eligibility, balances, or settlement. The public leaderboard must never expose financial or identity data.

## Mandatory release gates

Before any monetary-rewards capability is designed for production or enabled, require documented approval for:

- Applicable Ghanaian and any other relevant laws, consumer-protection rules, tax treatment, advertising rules, promotions/contest rules, and payment-provider requirements, reviewed by qualified local counsel and the relevant providers.
- Age eligibility, guardian/consent requirements where applicable, identity and fraud controls, and a clear policy for ineligible participants.
- Funding source, reward budget ownership, accounting reconciliation, reserve sufficiency, and a stop mechanism if funding or reconciliation fails.
- Transparent official rules: eligibility, entry mechanics, odds or judging criteria where relevant, limits, timing, geographic restrictions, dispute handling, and expiry.
- Independent security review, abuse testing, privacy review, incident response, audit retention, and operational ownership.
- A controlled rollout, monitoring, kill switch, and tested rollback that cannot corrupt the existing non-monetary game.

No legal or regulatory conclusion is made by this document. Obtain current Ghana-specific professional advice before selecting a model or provider.

## Technical extension points reserved

- Keep game score ingestion and verification independent from any future reward decision.
- Preserve stable player and run identifiers without exposing them publicly.
- Keep any future reward service behind server-side authorization and an explicit release gate.
- Keep secrets and privileged credentials server-side only.
- Require append-only audit evidence for privileged future reward decisions.
- Make any future financial operations idempotent and reconcilable, with clear failure and reversal handling.
- Do not let sponsor views or ad impressions silently grant a monetary entitlement.

These are architecture constraints only. The current repository does not implement a wallet, monetary ledger, ad-funded reward accounting, payment integration, or cash-out.

## Current release acceptance criteria

- Monetary capability is OFF.
- Scores and tokens have no cash value and cannot be transferred or redeemed.
- No monetary balance or payout API exists.
- Existing pending/verified score workflow remains separate.
- CI verifies the documented default-off boundary.
