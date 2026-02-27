-- ============================================================================
-- COLISEUM ANALYTICS - DNA LEADERBOARD SYSTEM
-- Migration 011: DNA-Native Leaderboards (4 Domains × 3 Time Ranges)
-- ============================================================================
-- Purpose: Create materialized views for A/T/G/C domain leaderboards
-- Alignment: Buckets V2 MVP Sprint Protocol
-- Status: Production-ready
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PART 1: Domain Strength Storage (Source Table)
-- ----------------------------------------------------------------------------

create table if not exists coliseum_domain_strength (
  id uuid primary key default gen_random_uuid(),

  -- Entity identification
  entity_id uuid not null,
  entity_type text not null check (entity_type in ('artist', 'event', 'user', 'brand')),

  -- The 4 DNA domains (raw strength scores)
  a_strength numeric not null default 0,  -- Adenine: Cultural Identity
  t_strength numeric not null default 0,  -- Thymine: Behavioral Patterns
  g_strength numeric not null default 0,  -- Guanine: Economic Signals
  c_strength numeric not null default 0,  -- Cytosine: Spatial Geography

  -- Composite score (optional, for overall ranking)
  composite_strength numeric generated always as (
    a_strength + t_strength + g_strength + c_strength
  ) stored,

  -- Domain-specific metadata (detailed metrics)
  a_metadata jsonb not null default '{}',
  t_metadata jsonb not null default '{}',
  g_metadata jsonb not null default '{}',
  c_metadata jsonb not null default '{}',

  -- Time window
  time_range text not null check (time_range in ('7d', '30d', 'alltime')),

  -- Timestamps
  calculated_at timestamptz not null default now(),

  -- Unique constraint: one record per entity per time range
  constraint unique_entity_time_range unique (entity_id, entity_type, time_range)
);

-- Indexes for fast lookups by domain
create index idx_domain_strength_artist_a on coliseum_domain_strength(entity_id, a_strength desc)
  where entity_type = 'artist';
create index idx_domain_strength_artist_t on coliseum_domain_strength(entity_id, t_strength desc)
  where entity_type = 'artist';
create index idx_domain_strength_artist_g on coliseum_domain_strength(entity_id, g_strength desc)
  where entity_type = 'artist';
create index idx_domain_strength_artist_c on coliseum_domain_strength(entity_id, c_strength desc)
  where entity_type = 'artist';
create index idx_domain_strength_time_range on coliseum_domain_strength(time_range, entity_type);

-- Comment
comment on table coliseum_domain_strength is 'Source table for DNA domain strength calculations. Updated by aggregation processor.';

-- ----------------------------------------------------------------------------
-- PART 2: A-DOMAIN LEADERBOARDS (Cultural Identity)
-- ----------------------------------------------------------------------------

-- 7-day A-domain leaderboard
create materialized view coliseum_leaderboard_a_7d as
select
  ds.entity_id as artist_id,
  ap.artist_name,
  ds.a_strength as domain_strength,

  -- A-domain specific metrics (from metadata)
  (ds.a_metadata->>'genre_diversity_index')::numeric as genre_diversity_index,
  (ds.a_metadata->>'cultural_influence_radius')::numeric as cultural_influence_radius,
  (ds.a_metadata->>'crossover_potential')::numeric as crossover_potential,
  (ds.a_metadata->>'niche_depth')::numeric as niche_depth,
  ds.a_metadata->'primary_genres' as primary_genres,

  -- Ranking metadata
  ds.calculated_at as last_updated,
  '7d' as time_range
from coliseum_domain_strength ds
join artist_profiles ap on ap.id = ds.entity_id
where ds.entity_type = 'artist'
  and ds.time_range = '7d'
  and ds.a_strength > 0
order by ds.a_strength desc;

create unique index on coliseum_leaderboard_a_7d (artist_id);
create index on coliseum_leaderboard_a_7d (domain_strength desc);
create index on coliseum_leaderboard_a_7d using gin (primary_genres jsonb_path_ops);

comment on materialized view coliseum_leaderboard_a_7d is
  'A-Domain (Cultural) leaderboard: Genre diversity, crossover potential, cultural influence (7-day window)';

-- 30-day A-domain leaderboard
create materialized view coliseum_leaderboard_a_30d as
select
  ds.entity_id as artist_id,
  ap.artist_name,
  ds.a_strength as domain_strength,

  (ds.a_metadata->>'genre_diversity_index')::numeric as genre_diversity_index,
  (ds.a_metadata->>'cultural_influence_radius')::numeric as cultural_influence_radius,
  (ds.a_metadata->>'crossover_potential')::numeric as crossover_potential,
  (ds.a_metadata->>'niche_depth')::numeric as niche_depth,
  ds.a_metadata->'primary_genres' as primary_genres,

  ds.calculated_at as last_updated,
  '30d' as time_range
from coliseum_domain_strength ds
join artist_profiles ap on ap.id = ds.entity_id
where ds.entity_type = 'artist'
  and ds.time_range = '30d'
  and ds.a_strength > 0
order by ds.a_strength desc;

create unique index on coliseum_leaderboard_a_30d (artist_id);
create index on coliseum_leaderboard_a_30d (domain_strength desc);
create index on coliseum_leaderboard_a_30d using gin (primary_genres jsonb_path_ops);

-- All-time A-domain leaderboard
create materialized view coliseum_leaderboard_a_alltime as
select
  ds.entity_id as artist_id,
  ap.artist_name,
  ds.a_strength as domain_strength,

  (ds.a_metadata->>'genre_diversity_index')::numeric as genre_diversity_index,
  (ds.a_metadata->>'cultural_influence_radius')::numeric as cultural_influence_radius,
  (ds.a_metadata->>'crossover_potential')::numeric as crossover_potential,
  (ds.a_metadata->>'niche_depth')::numeric as niche_depth,
  ds.a_metadata->'primary_genres' as primary_genres,

  ds.calculated_at as last_updated,
  'alltime' as time_range
from coliseum_domain_strength ds
join artist_profiles ap on ap.id = ds.entity_id
where ds.entity_type = 'artist'
  and ds.time_range = 'alltime'
  and ds.a_strength > 0
order by ds.a_strength desc;

create unique index on coliseum_leaderboard_a_alltime (artist_id);
create index on coliseum_leaderboard_a_alltime (domain_strength desc);
create index on coliseum_leaderboard_a_alltime using gin (primary_genres jsonb_path_ops);

-- ----------------------------------------------------------------------------
-- PART 3: T-DOMAIN LEADERBOARDS (Behavioral Patterns)
-- ----------------------------------------------------------------------------

-- 7-day T-domain leaderboard
create materialized view coliseum_leaderboard_t_7d as
select
  ds.entity_id as artist_id,
  ap.artist_name,
  ds.t_strength as domain_strength,

  -- T-domain specific metrics
  (ds.t_metadata->>'loyalty_index')::numeric as loyalty_index,
  (ds.t_metadata->>'conversion_rate')::numeric as conversion_rate,
  (ds.t_metadata->>'superfan_percentage')::numeric as superfan_percentage,
  (ds.t_metadata->>'engagement_consistency')::numeric as engagement_consistency,
  (ds.t_metadata->>'activation_rate')::numeric as activation_rate,
  (ds.t_metadata->>'churn_risk_score')::numeric as churn_risk_score,

  ds.calculated_at as last_updated,
  '7d' as time_range
from coliseum_domain_strength ds
join artist_profiles ap on ap.id = ds.entity_id
where ds.entity_type = 'artist'
  and ds.time_range = '7d'
  and ds.t_strength > 0
order by ds.t_strength desc;

create unique index on coliseum_leaderboard_t_7d (artist_id);
create index on coliseum_leaderboard_t_7d (domain_strength desc);
create index on coliseum_leaderboard_t_7d (loyalty_index desc);

comment on materialized view coliseum_leaderboard_t_7d is
  'T-Domain (Behavioral) leaderboard: Fan loyalty, conversion rates, engagement consistency (7-day window)';

-- 30-day T-domain leaderboard
create materialized view coliseum_leaderboard_t_30d as
select
  ds.entity_id as artist_id,
  ap.artist_name,
  ds.t_strength as domain_strength,

  (ds.t_metadata->>'loyalty_index')::numeric as loyalty_index,
  (ds.t_metadata->>'conversion_rate')::numeric as conversion_rate,
  (ds.t_metadata->>'superfan_percentage')::numeric as superfan_percentage,
  (ds.t_metadata->>'engagement_consistency')::numeric as engagement_consistency,
  (ds.t_metadata->>'activation_rate')::numeric as activation_rate,
  (ds.t_metadata->>'churn_risk_score')::numeric as churn_risk_score,

  ds.calculated_at as last_updated,
  '30d' as time_range
from coliseum_domain_strength ds
join artist_profiles ap on ap.id = ds.entity_id
where ds.entity_type = 'artist'
  and ds.time_range = '30d'
  and ds.t_strength > 0
order by ds.t_strength desc;

create unique index on coliseum_leaderboard_t_30d (artist_id);
create index on coliseum_leaderboard_t_30d (domain_strength desc);
create index on coliseum_leaderboard_t_30d (loyalty_index desc);

-- All-time T-domain leaderboard
create materialized view coliseum_leaderboard_t_alltime as
select
  ds.entity_id as artist_id,
  ap.artist_name,
  ds.t_strength as domain_strength,

  (ds.t_metadata->>'loyalty_index')::numeric as loyalty_index,
  (ds.t_metadata->>'conversion_rate')::numeric as conversion_rate,
  (ds.t_metadata->>'superfan_percentage')::numeric as superfan_percentage,
  (ds.t_metadata->>'engagement_consistency')::numeric as engagement_consistency,
  (ds.t_metadata->>'activation_rate')::numeric as activation_rate,
  (ds.t_metadata->>'churn_risk_score')::numeric as churn_risk_score,

  ds.calculated_at as last_updated,
  'alltime' as time_range
from coliseum_domain_strength ds
join artist_profiles ap on ap.id = ds.entity_id
where ds.entity_type = 'artist'
  and ds.time_range = 'alltime'
  and ds.t_strength > 0
order by ds.t_strength desc;

create unique index on coliseum_leaderboard_t_alltime (artist_id);
create index on coliseum_leaderboard_t_alltime (domain_strength desc);
create index on coliseum_leaderboard_t_alltime (loyalty_index desc);

-- ----------------------------------------------------------------------------
-- PART 4: G-DOMAIN LEADERBOARDS (Economic Signals)
-- ----------------------------------------------------------------------------

-- 7-day G-domain leaderboard
create materialized view coliseum_leaderboard_g_7d as
select
  ds.entity_id as artist_id,
  ap.artist_name,
  ds.g_strength as domain_strength,

  -- G-domain specific metrics
  (ds.g_metadata->>'avg_transaction_value')::numeric as avg_transaction_value,
  (ds.g_metadata->>'willingness_to_pay_index')::numeric as willingness_to_pay_index,
  (ds.g_metadata->>'revenue_concentration')::numeric as revenue_concentration,
  (ds.g_metadata->>'lifetime_value_per_fan')::numeric as lifetime_value_per_fan,
  (ds.g_metadata->>'monetization_efficiency')::numeric as monetization_efficiency,
  (ds.g_metadata->>'whale_fan_count')::int as whale_fan_count,

  ds.calculated_at as last_updated,
  '7d' as time_range
from coliseum_domain_strength ds
join artist_profiles ap on ap.id = ds.entity_id
where ds.entity_type = 'artist'
  and ds.time_range = '7d'
  and ds.g_strength > 0
order by ds.g_strength desc;

create unique index on coliseum_leaderboard_g_7d (artist_id);
create index on coliseum_leaderboard_g_7d (domain_strength desc);
create index on coliseum_leaderboard_g_7d (avg_transaction_value desc);

comment on materialized view coliseum_leaderboard_g_7d is
  'G-Domain (Economic) leaderboard: Revenue per fan, monetization efficiency, willingness to pay (7-day window)';

-- 30-day G-domain leaderboard
create materialized view coliseum_leaderboard_g_30d as
select
  ds.entity_id as artist_id,
  ap.artist_name,
  ds.g_strength as domain_strength,

  (ds.g_metadata->>'avg_transaction_value')::numeric as avg_transaction_value,
  (ds.g_metadata->>'willingness_to_pay_index')::numeric as willingness_to_pay_index,
  (ds.g_metadata->>'revenue_concentration')::numeric as revenue_concentration,
  (ds.g_metadata->>'lifetime_value_per_fan')::numeric as lifetime_value_per_fan,
  (ds.g_metadata->>'monetization_efficiency')::numeric as monetization_efficiency,
  (ds.g_metadata->>'whale_fan_count')::int as whale_fan_count,

  ds.calculated_at as last_updated,
  '30d' as time_range
from coliseum_domain_strength ds
join artist_profiles ap on ap.id = ds.entity_id
where ds.entity_type = 'artist'
  and ds.time_range = '30d'
  and ds.g_strength > 0
order by ds.g_strength desc;

create unique index on coliseum_leaderboard_g_30d (artist_id);
create index on coliseum_leaderboard_g_30d (domain_strength desc);
create index on coliseum_leaderboard_g_30d (avg_transaction_value desc);

-- All-time G-domain leaderboard
create materialized view coliseum_leaderboard_g_alltime as
select
  ds.entity_id as artist_id,
  ap.artist_name,
  ds.g_strength as domain_strength,

  (ds.g_metadata->>'avg_transaction_value')::numeric as avg_transaction_value,
  (ds.g_metadata->>'willingness_to_pay_index')::numeric as willingness_to_pay_index,
  (ds.g_metadata->>'revenue_concentration')::numeric as revenue_concentration,
  (ds.g_metadata->>'lifetime_value_per_fan')::numeric as lifetime_value_per_fan,
  (ds.g_metadata->>'monetization_efficiency')::numeric as monetization_efficiency,
  (ds.g_metadata->>'whale_fan_count')::int as whale_fan_count,

  ds.calculated_at as last_updated,
  'alltime' as time_range
from coliseum_domain_strength ds
join artist_profiles ap on ap.id = ds.entity_id
where ds.entity_type = 'artist'
  and ds.time_range = 'alltime'
  and ds.g_strength > 0
order by ds.g_strength desc;

create unique index on coliseum_leaderboard_g_alltime (artist_id);
create index on coliseum_leaderboard_g_alltime (domain_strength desc);
create index on coliseum_leaderboard_g_alltime (avg_transaction_value desc);

-- ----------------------------------------------------------------------------
-- PART 5: C-DOMAIN LEADERBOARDS (Spatial Geography)
-- ----------------------------------------------------------------------------

-- 7-day C-domain leaderboard
create materialized view coliseum_leaderboard_c_7d as
select
  ds.entity_id as artist_id,
  ap.artist_name,
  ds.c_strength as domain_strength,

  -- C-domain specific metrics
  ds.c_metadata->'primary_cities' as primary_cities,
  (ds.c_metadata->>'geographic_reach_index')::numeric as geographic_reach_index,
  (ds.c_metadata->>'touring_viability_score')::numeric as touring_viability_score,
  (ds.c_metadata->>'city_to_city_mobility')::numeric as city_to_city_mobility,
  (ds.c_metadata->>'market_penetration_top_city')::numeric as market_penetration_top_city,
  (ds.c_metadata->>'expansion_velocity')::numeric as expansion_velocity,

  ds.calculated_at as last_updated,
  '7d' as time_range
from coliseum_domain_strength ds
join artist_profiles ap on ap.id = ds.entity_id
where ds.entity_type = 'artist'
  and ds.time_range = '7d'
  and ds.c_strength > 0
order by ds.c_strength desc;

create unique index on coliseum_leaderboard_c_7d (artist_id);
create index on coliseum_leaderboard_c_7d (domain_strength desc);
create index on coliseum_leaderboard_c_7d (touring_viability_score desc);
create index on coliseum_leaderboard_c_7d using gin (primary_cities jsonb_path_ops);

comment on materialized view coliseum_leaderboard_c_7d is
  'C-Domain (Spatial) leaderboard: Geographic reach, touring viability, market penetration (7-day window)';

-- 30-day C-domain leaderboard
create materialized view coliseum_leaderboard_c_30d as
select
  ds.entity_id as artist_id,
  ap.artist_name,
  ds.c_strength as domain_strength,

  ds.c_metadata->'primary_cities' as primary_cities,
  (ds.c_metadata->>'geographic_reach_index')::numeric as geographic_reach_index,
  (ds.c_metadata->>'touring_viability_score')::numeric as touring_viability_score,
  (ds.c_metadata->>'city_to_city_mobility')::numeric as city_to_city_mobility,
  (ds.c_metadata->>'market_penetration_top_city')::numeric as market_penetration_top_city,
  (ds.c_metadata->>'expansion_velocity')::numeric as expansion_velocity,

  ds.calculated_at as last_updated,
  '30d' as time_range
from coliseum_domain_strength ds
join artist_profiles ap on ap.id = ds.entity_id
where ds.entity_type = 'artist'
  and ds.time_range = '30d'
  and ds.c_strength > 0
order by ds.c_strength desc;

create unique index on coliseum_leaderboard_c_30d (artist_id);
create index on coliseum_leaderboard_c_30d (domain_strength desc);
create index on coliseum_leaderboard_c_30d (touring_viability_score desc);
create index on coliseum_leaderboard_c_30d using gin (primary_cities jsonb_path_ops);

-- All-time C-domain leaderboard
create materialized view coliseum_leaderboard_c_alltime as
select
  ds.entity_id as artist_id,
  ap.artist_name,
  ds.c_strength as domain_strength,

  ds.c_metadata->'primary_cities' as primary_cities,
  (ds.c_metadata->>'geographic_reach_index')::numeric as geographic_reach_index,
  (ds.c_metadata->>'touring_viability_score')::numeric as touring_viability_score,
  (ds.c_metadata->>'city_to_city_mobility')::numeric as city_to_city_mobility,
  (ds.c_metadata->>'market_penetration_top_city')::numeric as market_penetration_top_city,
  (ds.c_metadata->>'expansion_velocity')::numeric as expansion_velocity,

  ds.calculated_at as last_updated,
  'alltime' as time_range
from coliseum_domain_strength ds
join artist_profiles ap on ap.id = ds.entity_id
where ds.entity_type = 'artist'
  and ds.time_range = 'alltime'
  and ds.c_strength > 0
order by ds.c_strength desc;

create unique index on coliseum_leaderboard_c_alltime (artist_id);
create index on coliseum_leaderboard_c_alltime (domain_strength desc);
create index on coliseum_leaderboard_c_alltime (touring_viability_score desc);
create index on coliseum_leaderboard_c_alltime using gin (primary_cities jsonb_path_ops);

-- ----------------------------------------------------------------------------
-- PART 6: COMPOSITE LEADERBOARD (Overall DNA Strength)
-- ----------------------------------------------------------------------------

-- Optional: Composite leaderboard combining all 4 domains
create materialized view coliseum_leaderboard_composite_7d as
select
  ds.entity_id as artist_id,
  ap.artist_name,
  ds.composite_strength as domain_strength,
  ds.a_strength,
  ds.t_strength,
  ds.g_strength,
  ds.c_strength,

  ds.calculated_at as last_updated,
  '7d' as time_range
from coliseum_domain_strength ds
join artist_profiles ap on ap.id = ds.entity_id
where ds.entity_type = 'artist'
  and ds.time_range = '7d'
  and ds.composite_strength > 0
order by ds.composite_strength desc;

create unique index on coliseum_leaderboard_composite_7d (artist_id);
create index on coliseum_leaderboard_composite_7d (domain_strength desc);

comment on materialized view coliseum_leaderboard_composite_7d is
  'Composite leaderboard: Sum of all 4 DNA domains (overall artist strength)';

-- 30-day composite
create materialized view coliseum_leaderboard_composite_30d as
select
  ds.entity_id as artist_id,
  ap.artist_name,
  ds.composite_strength as domain_strength,
  ds.a_strength,
  ds.t_strength,
  ds.g_strength,
  ds.c_strength,

  ds.calculated_at as last_updated,
  '30d' as time_range
from coliseum_domain_strength ds
join artist_profiles ap on ap.id = ds.entity_id
where ds.entity_type = 'artist'
  and ds.time_range = '30d'
  and ds.composite_strength > 0
order by ds.composite_strength desc;

create unique index on coliseum_leaderboard_composite_30d (artist_id);
create index on coliseum_leaderboard_composite_30d (domain_strength desc);

-- All-time composite
create materialized view coliseum_leaderboard_composite_alltime as
select
  ds.entity_id as artist_id,
  ap.artist_name,
  ds.composite_strength as domain_strength,
  ds.a_strength,
  ds.t_strength,
  ds.g_strength,
  ds.c_strength,

  ds.calculated_at as last_updated,
  'alltime' as time_range
from coliseum_domain_strength ds
join artist_profiles ap on ap.id = ds.entity_id
where ds.entity_type = 'artist'
  and ds.time_range = 'alltime'
  and ds.composite_strength > 0
order by ds.composite_strength desc;

create unique index on coliseum_leaderboard_composite_alltime (artist_id);
create index on coliseum_leaderboard_composite_alltime (domain_strength desc);

-- ----------------------------------------------------------------------------
-- PART 7: REFRESH FUNCTIONS
-- ----------------------------------------------------------------------------

-- Refresh all leaderboards for a specific time range
create or replace function refresh_coliseum_leaderboards(
  p_time_range text default '7d'
) returns void as $$
begin
  -- Validate time range
  if p_time_range not in ('7d', '30d', 'alltime') then
    raise exception 'Invalid time_range. Must be 7d, 30d, or alltime';
  end if;

  -- Refresh A-domain
  execute format('refresh materialized view concurrently coliseum_leaderboard_a_%s', p_time_range);

  -- Refresh T-domain
  execute format('refresh materialized view concurrently coliseum_leaderboard_t_%s', p_time_range);

  -- Refresh G-domain
  execute format('refresh materialized view concurrently coliseum_leaderboard_g_%s', p_time_range);

  -- Refresh C-domain
  execute format('refresh materialized view concurrently coliseum_leaderboard_c_%s', p_time_range);

  -- Refresh composite
  execute format('refresh materialized view concurrently coliseum_leaderboard_composite_%s', p_time_range);

  raise notice 'Refreshed all leaderboards for time_range=%', p_time_range;
end;
$$ language plpgsql;

comment on function refresh_coliseum_leaderboards is
  'Refresh all domain leaderboards for a specific time range (7d, 30d, or alltime)';

-- Refresh all leaderboards (all time ranges)
create or replace function refresh_all_coliseum_leaderboards() returns void as $$
begin
  perform refresh_coliseum_leaderboards('7d');
  perform refresh_coliseum_leaderboards('30d');
  perform refresh_coliseum_leaderboards('alltime');

  raise notice 'Refreshed all leaderboards for all time ranges';
end;
$$ language plpgsql;

comment on function refresh_all_coliseum_leaderboards is
  'Refresh all domain leaderboards for all time ranges (7d, 30d, alltime). Run this via CRON every 5 minutes.';

-- ----------------------------------------------------------------------------
-- PART 8: RLS POLICIES (Row-Level Security)
-- ----------------------------------------------------------------------------

-- Enable RLS on source table
alter table coliseum_domain_strength enable row level security;

-- Policy: Artists can see their own DNA strength
create policy "Artists view own domain strength" on coliseum_domain_strength
  for select using (
    entity_id in (
      select id from artist_profiles where user_id = auth.uid()
    )
  );

-- Policy: Admins can see everything
create policy "Admins view all domain strength" on coliseum_domain_strength
  for select using (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Policy: Enterprise users can see all (via entitlements check in API layer)
-- Note: Materialized views don't support RLS directly, enforce in API

-- ----------------------------------------------------------------------------
-- PART 9: HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

-- Get artist rank in specific domain
create or replace function get_artist_rank(
  p_artist_id uuid,
  p_domain char(1),
  p_time_range text default '7d'
) returns int as $$
declare
  v_rank int;
  v_table_name text;
begin
  -- Validate inputs
  if p_domain not in ('A', 'T', 'G', 'C') then
    raise exception 'Invalid domain. Must be A, T, G, or C';
  end if;

  if p_time_range not in ('7d', '30d', 'alltime') then
    raise exception 'Invalid time_range. Must be 7d, 30d, or alltime';
  end if;

  -- Build table name
  v_table_name := format('coliseum_leaderboard_%s_%s', lower(p_domain), p_time_range);

  -- Get rank (using row_number)
  execute format(
    'select row_number() over (order by domain_strength desc)
     from %I
     where artist_id = $1',
    v_table_name
  ) into v_rank using p_artist_id;

  return v_rank;
end;
$$ language plpgsql;

comment on function get_artist_rank is
  'Get artist rank in specific DNA domain and time range. Returns NULL if artist not in leaderboard.';

-- Get artist percentile in specific domain
create or replace function get_artist_percentile(
  p_artist_id uuid,
  p_domain char(1),
  p_time_range text default '7d'
) returns numeric as $$
declare
  v_rank int;
  v_total int;
  v_percentile numeric;
  v_table_name text;
begin
  -- Get rank
  v_rank := get_artist_rank(p_artist_id, p_domain, p_time_range);

  if v_rank is null then
    return null;
  end if;

  -- Get total artists
  v_table_name := format('coliseum_leaderboard_%s_%s', lower(p_domain), p_time_range);
  execute format('select count(*) from %I', v_table_name) into v_total;

  -- Calculate percentile (0-1 scale, 0 = top)
  v_percentile := (v_rank::numeric - 1) / v_total::numeric;

  return v_percentile;
end;
$$ language plpgsql;

comment on function get_artist_percentile is
  'Get artist percentile in specific DNA domain (0 = top, 1 = bottom). Returns NULL if artist not in leaderboard.';

-- ----------------------------------------------------------------------------
-- PART 10: SEED DATA (Optional - for testing)
-- ----------------------------------------------------------------------------

-- Insert test domain strength data (will be replaced by real calculations)
-- Uncomment to seed test data
/*
insert into coliseum_domain_strength (entity_id, entity_type, time_range, a_strength, t_strength, g_strength, c_strength, a_metadata, t_metadata, g_metadata, c_metadata)
select
  id as entity_id,
  'artist' as entity_type,
  '7d' as time_range,
  random() * 1000 as a_strength,
  random() * 1000 as t_strength,
  random() * 1000 as g_strength,
  random() * 1000 as c_strength,
  jsonb_build_object(
    'genre_diversity_index', random(),
    'crossover_potential', random(),
    'primary_genres', json_build_array('electronic', 'house')
  ) as a_metadata,
  jsonb_build_object(
    'loyalty_index', random(),
    'conversion_rate', random(),
    'superfan_percentage', random() * 0.2
  ) as t_metadata,
  jsonb_build_object(
    'avg_transaction_value', random() * 100,
    'willingness_to_pay_index', random(),
    'revenue_concentration', random()
  ) as g_metadata,
  jsonb_build_object(
    'primary_cities', json_build_array('denver', 'austin'),
    'geographic_reach_index', random(),
    'touring_viability_score', random()
  ) as c_metadata
from artist_profiles
limit 50;

-- Refresh all views
select refresh_all_coliseum_leaderboards();
*/

-- ----------------------------------------------------------------------------
-- MIGRATION COMPLETE
-- ----------------------------------------------------------------------------

-- Summary
do $$
begin
  raise notice '============================================================================';
  raise notice 'COLISEUM DNA LEADERBOARDS - MIGRATION COMPLETE';
  raise notice '============================================================================';
  raise notice '';
  raise notice 'Created:';
  raise notice '  • 1 source table (coliseum_domain_strength)';
  raise notice '  • 15 materialized views (A/T/G/C/Composite × 7d/30d/alltime)';
  raise notice '  • 2 refresh functions';
  raise notice '  • 3 helper functions (rank, percentile)';
  raise notice '  • RLS policies for data access control';
  raise notice '';
  raise notice 'Next steps:';
  raise notice '  1. Set up CRON job to refresh views every 5 minutes';
  raise notice '  2. Build domain strength calculator (Phase 2)';
  raise notice '  3. Implement entitlement guards (Phase 4)';
  raise notice '  4. Create dashboard UI (Phase 5)';
  raise notice '';
  raise notice 'Manual refresh: SELECT refresh_all_coliseum_leaderboards();';
  raise notice '============================================================================';
end $$;
