alter table public.artisans enable row level security;

grant select on public.artisans to anon, authenticated;
revoke insert on table public.artisans from public, anon, authenticated;
revoke insert (
  id,
  name,
  craft,
  region,
  experience,
  bio,
  avatar,
  is_verified,
  rating,
  total_sales,
  badges,
  created_at
) on table public.artisans from public, anon, authenticated;
grant insert (id, name, craft, region, experience, bio, avatar)
  on table public.artisans to authenticated;

revoke update on table public.artisans from public, anon, authenticated;
revoke update (
  id,
  name,
  craft,
  region,
  experience,
  bio,
  avatar,
  is_verified,
  rating,
  total_sales,
  badges,
  created_at
) on table public.artisans from public, anon, authenticated;
grant update (name, craft, region, experience, bio, avatar)
  on table public.artisans to authenticated;

drop policy if exists public_artisans on public.artisans;
create policy public_artisans on public.artisans
  for select using (true);

drop policy if exists own_studio_update on public.artisans;
create policy own_studio_update on public.artisans
  for update to authenticated
  using (id = auth.uid()::text and public.is_artisan())
  with check (id = auth.uid()::text and public.is_artisan());
