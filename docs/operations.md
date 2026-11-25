# Operations

## Local development

1. Install Node.js 20 or newer.
2. Run `npm test`.
3. Open `index.html` in a modern browser.

No build step or third-party runtime package is required for the static game.

## Optional score API

The Supabase Edge Function backend is documented in [backend-setup.md](./backend-setup.md). Configure these values before the game script loads:

- `window.RHA_API_BASE_URL`: Supabase Functions base URL ending in `/functions/v1`.
- `window.RHA_SUPABASE_PUBLISHABLE_KEY`: the project's publishable key.
- `window.RHA_GET_ACCESS_TOKEN`: async callback returning the current signed-in user's access token.

Leave any value unset for local-only mode. Never put a Supabase secret/service-role key in browser code. The client does not send player IDs or personal profile data.

## Sponsor slots

The two sponsor buttons are placeholders. They do not load an ad SDK, collect data, or alter gameplay. Viewing them never grants score, boosts, extra lives, or gameplay advantages.
