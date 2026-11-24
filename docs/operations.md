# Operations

## Local development

1. Install Node.js 20 or newer.
2. Run `npm test`.
3. Open `index.html` in a modern browser.

No build step or third-party runtime package is required.

## Optional score API

Set `window.RHA_API_BASE_URL` before the game script loads to enable run-result submission to a compatible API. Leave it unset for local-only mode. The client sends a credentialed request and an idempotency key. The current game does not award any redeemable value based on an API response.

The API must implement [score-api.md](./score-api.md). Do not enable public leaderboard ranking until server-side validation and anti-cheat controls are independently tested.

## Sponsor slots

The two sponsor buttons are placeholders. They currently display a local informational message and do not load an ad SDK, collect data, or alter gameplay. Any future sponsor integration must be clearly labelled, optional, privacy-reviewed, and must not grant score or gameplay rewards for viewing.
