-- ============================================================================
-- Migration 003: MCQ Question Bank tracking tables
-- ============================================================================
-- Tables for tracking quiz attempts, bookmarks, review-later queue, and
-- daily usage limits. user_id is text (matches Neon CUID auth).
-- ============================================================================

-- 1. mcq_attempts — track every quiz attempt
create table if not exists public.mcq_attempts (
  id              uuid primary key default uuid_generate_v4(),
  user_id         text not null,
  question_id     text not null,           -- stable hash of question content
  question_type   text,
  difficulty      text,
  selected_answer text[],                  -- array of option ids
  correct_answer  text[],                  -- array of option ids
  is_correct      boolean not null default false,
  time_taken      integer default 0,       -- seconds
  marks           numeric default 1,
  negative_mark   numeric default 0,
  score           numeric default 0,
  source_type     text,                    -- internal: 'remedy' | 'rubric' | 'book'
  source_ref      text,                    -- internal: book/author/chapter (NEVER shown to user)
  created_at      timestamptz not null default now()
);
create index if not exists idx_mcq_attempts_user_id on public.mcq_attempts(user_id);
create index if not exists idx_mcq_attempts_user_date on public.mcq_attempts(user_id, created_at desc);
create index if not exists idx_mcq_attempts_question on public.mcq_attempts(question_id);

-- 2. mcq_bookmarks — user bookmarked questions for later review
create table if not exists public.mcq_bookmarks (
  id              uuid primary key default uuid_generate_v4(),
  user_id         text not null,
  question_id     text not null,
  question_data   jsonb not null,          -- full question JSON (so we can display without regenerating)
  created_at      timestamptz not null default now(),
  unique (user_id, question_id)
);
create index if not exists idx_mcq_bookmarks_user on public.mcq_bookmarks(user_id);

-- 3. mcq_review_later — questions user wants to review later
create table if not exists public.mcq_review_later (
  id              uuid primary key default uuid_generate_v4(),
  user_id         text not null,
  question_id     text not null,
  question_data   jsonb not null,
  user_answer     text[],                  -- what the user selected
  is_correct      boolean default false,
  created_at      timestamptz not null default now(),
  unique (user_id, question_id)
);
create index if not exists idx_mcq_review_later_user on public.mcq_review_later(user_id);

-- 4. mcq_daily_usage — track daily question count per user (for 25/day limit)
create table if not exists public.mcq_daily_usage (
  user_id         text not null,
  usage_date      date not null default current_date,
  questions_generated integer not null default 0,
  questions_attempted integer not null default 0,
  is_premium      boolean default false,
  updated_at      timestamptz not null default now(),
  primary key (user_id, usage_date)
);
create index if not exists idx_mcq_daily_usage_user on public.mcq_daily_usage(user_id);

-- 5. mcq_question_index — deduplication + coverage tracking
-- Stores hashes of generated questions so we don't repeat them
create table if not exists public.mcq_question_index (
  question_id     text primary key,        -- stable hash
  source_type     text not null,
  source_ref      text not null,           -- internal reference
  question_type   text,
  difficulty      text,
  content_preview text,                    -- first 200 chars of question
  times_used      integer default 0,
  created_at      timestamptz not null default now()
);
create index if not exists idx_mcq_question_index_source on public.mcq_question_index(source_type, source_ref);
create index if not exists idx_mcq_question_index_used on public.mcq_question_index(times_used);

-- 6. mcq_book_sources — admin-controlled book enable/disable
create table if not exists public.mcq_book_sources (
  source_id       text primary key,        -- e.g. 'organon-bk-sarkar'
  source_type     text not null,           -- 'book' | 'remedy' | 'rubric'
  display_name    text,
  enabled         boolean default true,
  coverage_percent numeric default 0,
  last_indexed    timestamptz,
  created_at      timestamptz not null default now()
);

-- Trigger: auto-update updated_at on mcq_daily_usage
create or replace function public.touch_mcq_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_mcq_daily_usage_touch on public.mcq_daily_usage;
create trigger trg_mcq_daily_usage_touch before update on public.mcq_daily_usage
  for each row execute function public.touch_mcq_updated_at();

-- Note: RLS is NOT enabled.
-- Security is enforced server-side via requireAuth().
-- Source references (book names, authors) are NEVER sent to the client.
