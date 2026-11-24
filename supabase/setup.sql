-- Rush Hour, Accra: non-monetary score storage.
-- Apply only to a dedicated Supabase project after reviewing the target project.
-- This is a bootstrap SQL file, not an applied migration.
-- No payments, cash balances, ad-revenue allocation, or redemption tables exist here.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create table if not exists private.game_runs (
  id bigint generated always as identity primary key,
  player_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null,
  idempotency_key uuid not null,
  score integer not null check (score between 0 and 1000000),
  duration_seconds integer not null check (duration_seconds between 1 and 3600),
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  constraint game_runs_player_run_unique unique (player_id, run_id),
  constraint game_runs_player_idempotency_unique unique (player_id, idempotency_key),
  constraint game_runs_verification_consistency check (
    (status = 'verified' and verified_at is not null) or
    (status <> 'verified' and verified_at is null)
  )
);

create index if not exists game_runs_player_created_idx
  on private.game_runs (player_id, created_at desc);
create index if not exists game_runs_verified_score_idx
  on private.game_runs (score desc, created_at asc)
  where status = 'verified';

alter table private.game_runs enable row level security;

revoke all on private.game_runs from public;
grant select, insert on private.game_runs to authenticated;
grant select on private.game_runs to anon;

drop policy if exists game_runs_read_own_or_verified on private.game_runs;
create policy game_runs_read_own_or_verified
  on private.game_runs for select
  to authenticated
  using (player_id = (select auth.uid()) or status = 'verified');

drop policy if exists game_runs_public_verified on private.game_runs;
create policy game_runs_public_verified
  on private.game_runs for select
  to anon
  using (status = 'verified');

drop policy if exists game_runs_insert_pending_own on private.game_runs;
create policy game_runs_insert_pending_own
  on private.game_runs for insert
  to authenticated
  with check (
    player_id = (select auth.uid())
    and status = 'pending'
    and verified_at is null
  );

create or replace function private.enforce_game_run_limits()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  recent_count integer;
  daily_count integer;
begin
  if auth.uid() is null or new.player_id <> auth.uid() then
    raise exception using errcode = '42501', message = 'player_identity_mismatch';
  end if;

  if new.duration_seconds < 1 or new.duration_seconds > 3600
     or new.score < 0 or new.score > 1000000
     or new.score > (new.duration_seconds * 80 + 100) then
    raise exception using errcode = '23514', message = 'run_score_out_of_range';
  end if;

  select count(*) into recent_count
    from private.game_runs
   where player_id = auth.uid()
     and created_at > now() - interval '10 minutes';

  select count(*) into daily_count
    from private.game_runs
   where player_id = auth.uid()
     and created_at > now() - interval '24 hours';

  if recent_count >= 10 or daily_count >= 100 then
    raise exception using errcode = 'P0001', message = 'submission_rate_limited';
  end if;

  return new;
end;
$$;

drop trigger if exists game_runs_enforce_limits on private.game_runs;
create trigger game_runs_enforce_limits
before insert on private.game_runs
for each row execute function private.enforce_game_run_limits();

create or replace function public.submit_game_run(
  p_run_id uuid,
  p_score integer,
  p_duration_seconds integer,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_player_id uuid := auth.uid();
  v_run private.game_runs%rowtype;
begin
  if v_player_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if p_run_id is null or p_idempotency_key is null
     or p_score is null or p_duration_seconds is null then
    raise exception using errcode = '22023', message = 'missing_run_fields';
  end if;

  select * into v_run
    from private.game_runs
   where player_id = v_player_id
     and (run_id = p_run_id or idempotency_key = p_idempotency_key)
   limit 1;

  if found then
    return jsonb_build_object(
      'run_id', v_run.run_id,
      'status', v_run.status,
      'score', v_run.score,
      'leaderboard_eligible', (v_run.status = 'verified')
    );
  end if;

  insert into private.game_runs (
    player_id, run_id, idempotency_key, score, duration_seconds
  ) values (
    v_player_id, p_run_id, p_idempotency_key, p_score, p_duration_seconds
  )
  on conflict do nothing
  returning * into v_run;

  if not found then
    select * into v_run
      from private.game_runs
     where player_id = v_player_id
       and (run_id = p_run_id or idempotency_key = p_idempotency_key)
     limit 1;
  end if;

  return jsonb_build_object(
    'run_id', v_run.run_id,
    'status', v_run.status,
    'score', v_run.score,
    'leaderboard_eligible', (v_run.status = 'verified')
  );
end;
$$;

revoke all on function public.submit_game_run(uuid, integer, integer, uuid) from public, anon;
grant execute on function public.submit_game_run(uuid, integer, integer, uuid) to authenticated;

create or replace view public.game_leaderboard
with (security_invoker = true)
as
select
  'Driver-' || upper(substr(replace(player_id::text, '-', ''), 1, 6)) as player,
  max(score) as best_score,
  count(*)::integer as games_played
from private.game_runs
where status = 'verified'
group by player_id;

grant select on public.game_leaderboard to anon, authenticated;

-- Verification is deliberately an operator-controlled review step.
-- Do not expose UPDATE privileges or a public verification endpoint.
-- An authorized database operator may verify an independently reviewed run:
-- update private.game_runs
--    set status = 'verified', verified_at = now()
--  where id = <reviewed_run_id> and status = 'pending';
