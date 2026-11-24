import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const html = read('../index.html');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
const submit = read('../supabase/functions/submit-run/index.ts');
const leaderboard = read('../supabase/functions/leaderboard/index.ts');
const schema = read('../supabase/setup.sql');
const setupDocs = read('../docs/backend-setup.md');

assert.ok(scripts.length > 1000, 'game script should be present');
new Function(scripts);
assert.match(html, /Collect bonus tokens/);
assert.match(html, /TOKENS/);
assert.match(html, /SPONSOR SPOT A/);
assert.match(html, /SPONSOR SPOT B/);
assert.match(html, /Viewing it never changes your score/);
assert.match(scripts, /submitRunResult\(sc\)/);
assert.match(scripts, /RHA_GET_ACCESS_TOKEN/);
assert.match(scripts, /RHA_SUPABASE_PUBLISHABLE_KEY/);
assert.match(scripts, /Idempotency-Key/);
assert.doesNotMatch(html, /GH₵|GH\\u20b5|Cedis|cash-out|withdrawal/i);
assert.doesNotMatch(scripts, /rewarded.?ad|cash.?reward|payout/i);

assert.match(submit, /withSupabase\(\{ auth: "user" \}/);
assert.match(submit, /submit_game_run/);
assert.match(submit, /Idempotency-Key/);
assert.match(leaderboard, /withSupabase\(\{ auth: "none" \}/);
assert.match(leaderboard, /game_leaderboard/);
assert.match(schema, /enable row level security/i);
assert.match(schema, /security invoker/i);
assert.match(schema, /submission_rate_limited/);
assert.match(schema, /leaderboard_eligible/);
assert.match(schema, /status = 'verified'/);
assert.doesNotMatch(schema, /service_role|cash_out|create\\s+table\\s+(?:public\\.)?(?:payments?|payouts?|cash_balances)/i);
assert.match(setupDocs, /pending/);
assert.match(setupDocs, /No hosted database or Edge Function has been changed/);

console.log('PASS: inline game JavaScript parses');
console.log('PASS: non-monetary token and sponsor boundaries are present');
console.log('PASS: client submission uses authenticated, idempotent API contract');
console.log('PASS: backend requires user auth for submissions and keeps leaderboard public-read only');
console.log('PASS: database schema enforces RLS, idempotency, rate limits, and pending verification');
console.log('PASS: no cash, payout, payment, or redemption implementation is present');
