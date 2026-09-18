-- Private maps: anonymous visitors have no access, users only see their own rows.
create table if not exists public.atlas_maps (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  profile text not null check (char_length(profile) between 1 and 100),
  fields jsonb not null check (jsonb_typeof(fields) = 'object'),
  created_at timestamptz not null default now()
);
alter table public.atlas_maps enable row level security;
revoke all on public.atlas_maps from anon;
grant select, insert, update, delete on public.atlas_maps to authenticated;
create policy "atlas_maps_select_own" on public.atlas_maps for select to authenticated using ((select auth.uid()) = owner_id);
create policy "atlas_maps_insert_own" on public.atlas_maps for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "atlas_maps_update_own" on public.atlas_maps for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "atlas_maps_delete_own" on public.atlas_maps for delete to authenticated using ((select auth.uid()) = owner_id);
create index if not exists atlas_maps_owner_created on public.atlas_maps(owner_id, created_at desc);
