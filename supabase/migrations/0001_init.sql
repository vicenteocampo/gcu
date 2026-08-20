-- GCU (Gente Como Uno) — initial schema
-- Eligibility rule (per spec): school on list OR location on list -> eligible.
-- Either being "Other" (not on either closed list) never auto-rejects — it
-- puts the profile on_hold for Vicente's manual review in /admin.

create extension if not exists "pgcrypto";

-- schools: eligible undergrad list, seeded from content/eligible-schools.md
create table if not exists schools (
  id serial primary key,
  name text unique not null,
  created_at timestamptz default now()
);

alter table schools enable row level security;

create policy "schools are publicly readable"
  on schools for select
  using (true);

-- locations: closed "where are you based" list, seeded from content/gcu-locations.md
create table if not exists locations (
  id serial primary key,
  name text unique not null,
  created_at timestamptz default now()
);

alter table locations enable row level security;

create policy "locations are publicly readable"
  on locations for select
  using (true);

-- profiles: one row per authenticated user
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  school text,
  school_on_list boolean not null default false,
  based_in text,
  location_on_list boolean not null default false,
  eligibility_status text not null default 'on_hold'
    check (eligibility_status in ('eligible', 'on_hold', 'not_eligible')),
  referral_code text unique not null,
  referred_by text references profiles(referral_code),
  referral_count int not null default 0,
  activated boolean not null default false,
  onboarding_completed boolean not null default false,
  questionnaire_completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- Deliberately no client-facing UPDATE policy: onboarding_completed,
-- questionnaire_completed, eligibility_status, school/location fields, and
-- referral/activation counters are all system- or admin-controlled. Every
-- write goes through server routes using the service-role client so a
-- signed-in user can never self-promote eligibility_status via RLS.

-- auth_codes: custom 8-digit passwordless OTP store (server/service-role only, no RLS policies granted)
create table if not exists auth_codes (
  id bigserial primary key,
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

alter table auth_codes enable row level security;

create index if not exists auth_codes_email_idx on auth_codes (email);

-- questionnaire_responses
create table if not exists questionnaire_responses (
  id serial primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  question_key text not null,
  answer jsonb not null,
  created_at timestamptz not null default now(),
  unique (profile_id, question_key)
);

alter table questionnaire_responses enable row level security;

create policy "users can view own questionnaire responses"
  on questionnaire_responses for select
  using (auth.uid() = profile_id);

create policy "users can upsert own questionnaire responses"
  on questionnaire_responses for insert
  with check (auth.uid() = profile_id);

create policy "users can update own questionnaire responses"
  on questionnaire_responses for update
  using (auth.uid() = profile_id);

-- email_log: tracks sends so we don't double-send (server/service-role only)
create table if not exists email_log (
  id serial primary key,
  profile_id uuid references profiles(id) on delete cascade,
  email_type text not null,
  sent_at timestamptz not null default now()
);

alter table email_log enable row level security;

create index if not exists email_log_profile_type_idx on email_log (profile_id, email_type);

-- referral_count bookkeeping: bump referrer when a new profile records referred_by
create or replace function bump_referrer_count()
returns trigger as $$
begin
  if new.referred_by is not null then
    update profiles
      set referral_count = referral_count + 1,
          activated = (referral_count + 1) >= 2
      where referral_code = new.referred_by;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger profiles_bump_referrer_count
  after insert on profiles
  for each row
  execute function bump_referrer_count();

-- Storage: profile photos (questionnaire "photos" question, 4-6 images/user)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "users can upload own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can update own photos"
  on storage.objects for update
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can delete own photos"
  on storage.objects for delete
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'photos');
