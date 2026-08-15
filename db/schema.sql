-- Matric Bot — Stage 1 schema
-- Run this in the Supabase SQL editor (or `psql < schema.sql`)

create table if not exists universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text not null,
  type text -- e.g. 'public', 'private'
);

create table if not exists departments (
  -- BROWSING ONLY. Never joined in prediction logic.
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references universities(id) on delete cascade,
  name text not null,
  field text
);

create table if not exists university_capacity (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references universities(id) on delete cascade,
  year int not null,
  total_seats int not null,
  unique (university_id, year)
);

create table if not exists historical_cutoffs (
  -- starts EMPTY. Filled in by Stage 6 post-placement reporting.
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references universities(id) on delete cascade,
  year int not null,
  min_score_accepted numeric not null,
  unique (university_id, year)
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,
  full_name text,
  registration_number text,
  exam_year int,
  estimated_score numeric,
  official_score numeric,
  wants_notification boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists preferences (
  -- university-level, ranked. No department_id — that's the #1 mistake to avoid.
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  university_id uuid not null references universities(id) on delete cascade,
  rank_order int not null,
  unique (student_id, rank_order)
);

create table if not exists reported_outcomes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  university_id uuid not null references universities(id) on delete cascade,
  year int not null,
  unique (student_id, year)
);

-- Helpful indexes
create index if not exists idx_preferences_student on preferences(student_id);
create index if not exists idx_departments_university on departments(university_id);
create index if not exists idx_cutoffs_university_year on historical_cutoffs(university_id, year desc);
