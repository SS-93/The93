-- ============================================================================
-- COLISEUM ANALYTICS - ENABLE PROCESSOR
-- Migration 012: Add processing columns and DNA mutations table
-- ============================================================================
-- Purpose: Enable Coliseum DNA mutation processor to consume Passport events
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PART 1: Add processing column to passport_entries
-- ----------------------------------------------------------------------------

-- Add column to track which events have been processed by Coliseum
alter table passport_entries
  add column if not exists coliseum_processed_at timestamptz;

-- Index for efficient querying of unprocessed events
create index if not exists idx_passport_coliseum_unprocessed
  on passport_entries(coliseum_processed_at)
  where coliseum_processed_at is null;

comment on column passport_entries.coliseum_processed_at is
  'Timestamp when this event was processed by Coliseum DNA mutation processor';

-- ----------------------------------------------------------------------------
-- PART 2: Create DNA mutations table
-- ----------------------------------------------------------------------------

create table if not exists coliseum_dna_mutations (
  id uuid primary key default gen_random_uuid(),

  -- Source event
  passport_entry_id uuid not null references passport_entries(id) on delete cascade,

  -- Who/what mutated
  user_id uuid not null,
  artist_id uuid,
  event_id uuid,

  -- ATGC mutation details
  domain char(1) not null check (domain in ('A', 'T', 'G', 'C')),
  key text not null,                     -- e.g., "electronic", "denver", "revenue"
  delta numeric not null,                -- Change magnitude
  weight numeric not null default 1,     -- Event importance
  recency_decay numeric not null default 1,

  -- Effective mutation (computed)
  effective_delta numeric not null,      -- delta × weight × recency_decay

  -- Timestamps
  occurred_at timestamptz not null,
  processed_at timestamptz default now(),

  -- Unique constraint (idempotent processing)
  constraint unique_passport_mutation unique (passport_entry_id)
);

-- Indexes for fast aggregation
create index if not exists idx_dna_mutations_user on coliseum_dna_mutations(user_id, occurred_at desc);
create index if not exists idx_dna_mutations_artist on coliseum_dna_mutations(artist_id, occurred_at desc);
create index if not exists idx_dna_mutations_domain on coliseum_dna_mutations(domain, effective_delta desc);
create index if not exists idx_dna_mutations_occurred on coliseum_dna_mutations(occurred_at desc);

comment on table coliseum_dna_mutations is
  'DNA mutations generated from Passport events. Each event can mutate multiple DNA bases (A/T/G/C).';

-- ----------------------------------------------------------------------------
-- PART 3: Create entitlements table
-- ----------------------------------------------------------------------------

create table if not exists coliseum_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null check (plan in ('free', 'basic', 'pro', 'enterprise')),
  status text not null check (status in ('active', 'past_due', 'canceled', 'trialing')),

  -- Stripe metadata
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,

  -- Usage tracking
  artists_tracked int not null default 0,
  api_calls_month int not null default 0,
  reports_generated_month int not null default 0,

  -- Billing period
  current_period_start timestamptz,
  current_period_end timestamptz,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_entitlements_plan on coliseum_entitlements(plan, status);
create index if not exists idx_entitlements_stripe on coliseum_entitlements(stripe_subscription_id);

comment on table coliseum_entitlements is
  'User subscription plans for Coliseum Analytics access (basic/pro/enterprise)';

-- ----------------------------------------------------------------------------
-- PART 4: Helper functions
-- ----------------------------------------------------------------------------

-- Increment usage counter
create or replace function increment_coliseum_usage(
  p_user_id uuid,
  p_metric text
) returns void as $$
begin
  update coliseum_entitlements
  set
    artists_tracked = case when p_metric = 'artists_tracked' then artists_tracked + 1 else artists_tracked end,
    api_calls_month = case when p_metric = 'api_calls_month' then api_calls_month + 1 else api_calls_month end,
    reports_generated_month = case when p_metric = 'reports_generated_month' then reports_generated_month + 1 else reports_generated_month end,
    updated_at = now()
  where user_id = p_user_id;
end;
$$ language plpgsql;

-- Reset monthly usage (run via CRON on 1st of month)
create or replace function reset_monthly_coliseum_usage() returns void as $$
begin
  update coliseum_entitlements
  set
    api_calls_month = 0,
    reports_generated_month = 0,
    updated_at = now();

  raise notice 'Reset monthly usage counters for all users';
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- PART 5: RLS Policies
-- ----------------------------------------------------------------------------

-- DNA mutations: Users can see their own
alter table coliseum_dna_mutations enable row level security;

drop policy if exists "Users view own mutations" on coliseum_dna_mutations;
create policy "Users view own mutations" on coliseum_dna_mutations
  for select using (auth.uid() = user_id);

drop policy if exists "Artists view mutations about them" on coliseum_dna_mutations;
create policy "Artists view mutations about them" on coliseum_dna_mutations
  for select using (
    auth.uid() in (
      select user_id from artist_profiles where id = coliseum_dna_mutations.artist_id
    )
  );

drop policy if exists "Admins view all mutations" on coliseum_dna_mutations;
create policy "Admins view all mutations" on coliseum_dna_mutations
  for select using (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Entitlements: Users can see their own
alter table coliseum_entitlements enable row level security;

drop policy if exists "Users view own entitlement" on coliseum_entitlements;
create policy "Users view own entitlement" on coliseum_entitlements
  for select using (auth.uid() = user_id);

drop policy if exists "Admins manage entitlements" on coliseum_entitlements;
create policy "Admins manage entitlements" on coliseum_entitlements
  for all using (
    auth.jwt() ->> 'role' = 'admin'
  );

-- ----------------------------------------------------------------------------
-- PART 6: Seed default entitlements (optional)
-- ----------------------------------------------------------------------------

-- Give all existing users free tier
insert into coliseum_entitlements (user_id, plan, status)
select
  id,
  'free' as plan,
  'active' as status
from auth.users
where id not in (select user_id from coliseum_entitlements)
on conflict (user_id) do nothing;

-- ----------------------------------------------------------------------------
-- MIGRATION COMPLETE
-- ----------------------------------------------------------------------------

do $$
begin
  raise notice '============================================================================';
  raise notice 'COLISEUM PROCESSOR ENABLED - MIGRATION COMPLETE';
  raise notice '============================================================================';
  raise notice '';
  raise notice 'Created:';
  raise notice '  • coliseum_dna_mutations table (append-only mutation log)';
  raise notice '  • coliseum_entitlements table (subscription plans)';
  raise notice '  • Processing column in passport_entries';
  raise notice '  • Helper functions for usage tracking';
  raise notice '  • RLS policies';
  raise notice '';
  raise notice 'Next steps:';
  raise notice '  1. Deploy Edge Function: supabase functions deploy coliseum-processor';
  raise notice '  2. Set up CRON: Call processor every 5 minutes';
  raise notice '  3. Set up view refresh: Refresh leaderboards every 5 minutes';
  raise notice '  4. Test with: curl -X POST [function-url]';
  raise notice '';
  raise notice 'Manual processor run: Invoke coliseum-processor Edge Function';
  raise notice 'Manual view refresh: SELECT refresh_all_coliseum_leaderboards();';
  raise notice '============================================================================';
end $$;
