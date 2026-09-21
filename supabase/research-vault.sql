-- Optional schema; requires a Supabase project configured in atlas-auth.json.
-- Research plaintext remains in the browser. Only AES-GCM ciphertext is stored here.
-- Run in a transaction using the Supabase SQL editor; test RLS with two real users.
begin;
create table if not exists public.atlas_research_vault (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  record_hash text not null check (record_hash ~ '^[a-f0-9]{64}$'),
  ciphertext jsonb not null check (
    jsonb_typeof(ciphertext) = 'object'
    and ciphertext ->> 'v' = '1'
    and jsonb_typeof(ciphertext -> 'salt') = 'string'
    and jsonb_typeof(ciphertext -> 'iv') = 'string'
    and jsonb_typeof(ciphertext -> 'data') = 'string'
    and octet_length(ciphertext::text) < 3000000
  ),
  created_at timestamptz not null default now()
);
alter table public.atlas_research_vault enable row level security;
revoke all on table public.atlas_research_vault from public, anon, authenticated;
grant select, insert, delete on table public.atlas_research_vault to authenticated;

drop policy if exists "research_select_own" on public.atlas_research_vault;
create policy "research_select_own"
  on public.atlas_research_vault for select to authenticated
  using ((select auth.uid()) = owner_id);
drop policy if exists "research_insert_own" on public.atlas_research_vault;
create policy "research_insert_own"
  on public.atlas_research_vault for insert to authenticated
  with check ((select auth.uid()) = owner_id);
drop policy if exists "research_delete_own" on public.atlas_research_vault;
create policy "research_delete_own"
  on public.atlas_research_vault for delete to authenticated
  using ((select auth.uid()) = owner_id);
-- No UPDATE privilege or policy: snapshots are immutable after upload.
create index if not exists atlas_research_vault_owner_created
  on public.atlas_research_vault(owner_id,created_at desc);
commit;
