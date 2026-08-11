-- ============================================================================
-- Supabase Schema — User Features Database
-- ============================================================================
-- Run this in the Supabase SQL Editor after creating your project.
--
-- This schema creates ALL user-feature tables. Content tables (books, remedies,
-- rubrics, etc.) live in NEON and are NEVER created here.
--
-- Tables created:
--   1. user_profiles              — extended user info beyond Supabase auth.users
--   2. user_preferences           — UI/theme/language preferences
--   3. bookmarks                  — saved items (remedies, rubrics, books, etc.)
--   4. favorites                  — starred items
--   5. notes                      — user notes attached to any item
--   6. reading_history            — recently viewed items
--   7. highlights                 — text highlights inside book chapters
--   8. reading_progress           — per-chapter scroll/percent progress
--   9. ai_chat_history            — AI assistant conversation history
--  10. notifications              — in-app notifications
--
-- CRITICAL: All tables are keyed by `user_id` (uuid, references auth.users.id).
-- No content data is duplicated here — only references to content item IDs
-- (which live in Neon).
-- ============================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. user_profiles
-- ============================================================================
create table if not exists public.user_profiles (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  display_name    text,
  avatar_url      text,
  bio             text,
  role            text default 'user' check (role in ('admin', 'staff', 'user')),
  preferences     jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_user_profiles_user_id on public.user_profiles(user_id);

-- ============================================================================
-- 2. user_preferences
-- ============================================================================
create table if not exists public.user_preferences (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  theme           text default 'light' check (theme in ('light', 'dark', 'system')),
  font_size       text default 'medium' check (font_size in ('small', 'medium', 'large', 'xl')),
  language        text default 'en',
  email_notifications boolean default true,
  push_notifications boolean default false,
  custom_settings jsonb default '{}'::jsonb,
  updated_at      timestamptz not null default now()
);

-- ============================================================================
-- 3. bookmarks
-- ============================================================================
-- Composite unique prevents duplicate bookmarks per user+item.
create table if not exists public.bookmarks (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  item_id         text not null,           -- references content in Neon (NOT a FK)
  item_type       text not null,           -- 'remedy' | 'rubric' | 'book' | 'chapter' | 'therapeutic' | etc.
  title           text,
  href            text,
  author          text,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  unique (user_id, item_id, item_type)
);

create index if not exists idx_bookmarks_user_id on public.bookmarks(user_id);
create index if not exists idx_bookmarks_user_type on public.bookmarks(user_id, item_type);
create index if not exists idx_bookmarks_created_at on public.bookmarks(created_at desc);

-- ============================================================================
-- 4. favorites
-- ============================================================================
create table if not exists public.favorites (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  item_id         text not null,
  item_type       text not null,
  title           text,
  href            text,
  author          text,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  unique (user_id, item_id, item_type)
);

create index if not exists idx_favorites_user_id on public.favorites(user_id);
create index if not exists idx_favorites_user_type on public.favorites(user_id, item_type);

-- ============================================================================
-- 5. notes
-- ============================================================================
create table if not exists public.notes (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  item_id         text not null,
  item_type       text not null,
  text            text not null,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_notes_user_id on public.notes(user_id);
create index if not exists idx_notes_user_item on public.notes(user_id, item_id, item_type);
create index if not exists idx_notes_updated_at on public.notes(updated_at desc);

-- ============================================================================
-- 6. reading_history
-- ============================================================================
create table if not exists public.reading_history (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  item_id         text not null,
  item_type       text not null,
  title           text,
  href            text,
  metadata        jsonb default '{}'::jsonb,
  visited_at      timestamptz not null default now(),
  unique (user_id, item_id, item_type)
);

create index if not exists idx_history_user_id on public.reading_history(user_id);
create index if not exists idx_history_user_visited on public.reading_history(user_id, visited_at desc);

-- ============================================================================
-- 7. highlights
-- ============================================================================
create table if not exists public.highlights (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  item_id         text not null,
  item_type       text not null,
  highlighted_text text not null,
  color           text default 'yellow',
  start_offset    integer,
  end_offset      integer,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_highlights_user_id on public.highlights(user_id);
create index if not exists idx_highlights_user_item on public.highlights(user_id, item_id, item_type);

-- ============================================================================
-- 8. reading_progress
-- ============================================================================
create table if not exists public.reading_progress (
  user_id         uuid not null references auth.users(id) on delete cascade,
  item_id         text not null,
  item_type       text not null,
  scroll_percent  numeric(5,2) default 0 check (scroll_percent >= 0 and scroll_percent <= 100),
  last_chapter_id text,
  last_position   jsonb,
  completed       boolean default false,
  updated_at      timestamptz not null default now(),
  primary key (user_id, item_id, item_type)
);

create index if not exists idx_progress_user_id on public.reading_progress(user_id);
create index if not exists idx_progress_updated on public.reading_progress(updated_at desc);

-- ============================================================================
-- 9. ai_chat_history
-- ============================================================================
create table if not exists public.ai_chat_history (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null default uuid_generate_v4(),
  role            text not null check (role in ('user', 'assistant', 'system')),
  content         text not null,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_ai_chat_user_id on public.ai_chat_history(user_id);
create index if not exists idx_ai_chat_conversation on public.ai_chat_history(conversation_id);
create index if not exists idx_ai_chat_created_at on public.ai_chat_history(created_at desc);

-- ============================================================================
-- 10. notifications
-- ============================================================================
create table if not exists public.notifications (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  type            text not null,           -- 'system' | 'comment' | 'mention' | 'reminder' | etc.
  title           text not null,
  body            text,
  read            boolean default false,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_user_read on public.notifications(user_id, read);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

-- ============================================================================
-- Row Level Security (RLS) — users can only access their own data
-- ============================================================================
alter table public.user_profiles     enable row level security;
alter table public.user_preferences  enable row level security;
alter table public.bookmarks         enable row level security;
alter table public.favorites         enable row level security;
alter table public.notes             enable row level security;
alter table public.reading_history   enable row level security;
alter table public.highlights        enable row level security;
alter table public.reading_progress  enable row level security;
alter table public.ai_chat_history   enable row level security;
alter table public.notifications     enable row level security;

-- Helper: current user id
create or replace function public.current_user_id()
returns uuid
language sql
stable
security definer
as $$
  select auth.uid();
$$;

-- RLS policies: SELECT / INSERT / UPDATE / DELETE only on own rows
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'user_profiles', 'user_preferences', 'bookmarks', 'favorites',
    'notes', 'reading_history', 'highlights', 'reading_progress',
    'ai_chat_history', 'notifications'
  ])
  loop
    execute format('drop policy if exists "own_select" on public.%I', t);
    execute format('drop policy if exists "own_insert" on public.%I', t);
    execute format('drop policy if exists "own_update" on public.%I', t);
    execute format('drop policy if exists "own_delete" on public.%I', t);
    execute format('create policy "own_select" on public.%I for select using (user_id = public.current_user_id())', t);
    execute format('create policy "own_insert" on public.%I for insert with check (user_id = public.current_user_id())', t);
    execute format('create policy "own_update" on public.%I for update using (user_id = public.current_user_id())', t);
    execute format('create policy "own_delete" on public.%I for delete using (user_id = public.current_user_id())', t);
  end loop;
end$$;

-- ============================================================================
-- Triggers: auto-update updated_at on every row update
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'user_profiles', 'user_preferences', 'notes', 'reading_progress'
  ])
  loop
    execute format('drop trigger if exists trg_%I_touch on public.%I', t, t);
    execute format('create trigger trg_%I_touch before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end$$;

-- ============================================================================
-- Auto-create user_profiles + user_preferences row on auth.users insert
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email))
  on conflict (user_id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Done.
-- ============================================================================
-- Verification queries:
--   select table_name from information_schema.tables where table_schema = 'public';
--   select policyname, tablename from pg_policies where schemaname = 'public';
-- ============================================================================
