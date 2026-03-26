-- ═══════════════════════════════════════════════════════════════
-- StatusVault — Supabase Schema
-- Run this ONCE in: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════

-- Single table: one encrypted JSON blob per user
-- The app encrypts ALL data client-side before upload
-- Supabase never sees plaintext immigration data

create table if not exists public.user_data (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  data_encrypted text not null,
  updated_at  timestamptz default now() not null,
  constraint  user_data_user_id_key unique (user_id)
);

-- Row Level Security — users can ONLY see their own row
alter table public.user_data enable row level security;

create policy "select_own"  on public.user_data for select  using (auth.uid() = user_id);
create policy "insert_own"  on public.user_data for insert  with check (auth.uid() = user_id);
create policy "update_own"  on public.user_data for update  using (auth.uid() = user_id);
create policy "delete_own"  on public.user_data for delete  using (auth.uid() = user_id);

-- Auto-update updated_at on every write
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_user_data_updated
  before update on public.user_data
  for each row execute function public.handle_updated_at();
