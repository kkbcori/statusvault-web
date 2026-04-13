# StatusVault — Supabase Cloud Sync Setup

Run these SQL statements in **Supabase → SQL Editor** in order.

---

## Step 1: Create user_data table (encrypted cloud backup)

```sql
-- Main encrypted data table
create table if not exists public.user_data (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null unique,
  data_encrypted text not null,
  updated_at   timestamptz default now() not null
);

-- Auto-update updated_at on every change
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_data_updated_at
  before update on public.user_data
  for each row execute function public.set_updated_at();

-- Row Level Security: users can only read/write their own row
alter table public.user_data enable row level security;

create policy "Users can read own data"
  on public.user_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own data"
  on public.user_data for update
  using (auth.uid() = user_id);

create policy "Users can delete own data"
  on public.user_data for delete
  using (auth.uid() = user_id);
```

---

## Step 2: Create user_alerts table (notification contacts)

```sql
create table if not exists public.user_alerts (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid references auth.users(id) on delete cascade not null unique,
  notification_email  text,
  whatsapp_phone      text,
  expiring_docs       jsonb default '[]'::jsonb,
  updated_at          timestamptz default now() not null
);

create trigger user_alerts_updated_at
  before update on public.user_alerts
  for each row execute function public.set_updated_at();

alter table public.user_alerts enable row level security;

create policy "Users manage own alerts"
  on public.user_alerts for all
  using (auth.uid() = user_id);
```

---

## Step 3: Verify setup

```sql
-- Should return both tables
select table_name from information_schema.tables
where table_schema = 'public'
and table_name in ('user_data', 'user_alerts');

-- Should show 5 policies
select policyname, tablename, cmd from pg_policies
where tablename in ('user_data', 'user_alerts')
order by tablename, cmd;
```

---

## How It Works (Option C: Hybrid)

| Event | Action |
|-------|--------|
| User adds/edits any document | Auto-sync to cloud (1.5s debounce) |
| User logs in on NEW device | Pull cloud backup → restore all data |
| User logs in on SAME device | Local data preferred, cloud checked |
| Lost device, new laptop login | All docs, family, timers, premium restored |
| No internet | Works offline, syncs when reconnected |

## Security

- Data is **AES-256 encrypted before leaving the device**
- Supabase stores only ciphertext — even a DB breach reveals nothing
- Encryption key = PBKDF2(userId + email + APP_SALT, 10,000 iterations)
- Only the user's own session can decrypt their data
- RLS ensures no cross-user data access at the database level

## Encryption Key Note

The key is derived from `userId + email`. If a user changes their email address, they would need to re-encrypt their data. This is handled automatically by the app's `syncToCloud` on next save.
