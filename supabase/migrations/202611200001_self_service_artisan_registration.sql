-- Ensure every existing and future Auth user has a Buyer row unless a stored role already exists.
drop trigger if exists on_auth_user_created_profile on auth.users;

insert into public.users (user_id, role)
select u.id, 'Buyer'
from auth.users as u
on conflict (user_id) do nothing;

-- Promote confirmed registrations recorded before this migration.
update public.users as app_user
set role = 'Artisan'
from auth.users as auth_user
where app_user.user_id = auth_user.id
  and app_user.role = 'Buyer'
  and auth_user.email_confirmed_at is not null
  and auth_user.raw_user_meta_data->>'requested_role' = 'artisan';

insert into public.artisans (id, name, craft, region)
select
  app_user.user_id::text,
  coalesce(
    nullif(btrim(auth_user.raw_user_meta_data->>'studio_name'), ''),
    nullif(btrim(auth_user.raw_user_meta_data->>'full_name'), ''),
    'My Studio'
  ),
  '',
  ''
from public.users as app_user
left join auth.users as auth_user on auth_user.id = app_user.user_id
where app_user.role = 'Artisan'
on conflict (id) do nothing;

alter table public.enquiries
  add column if not exists buyer_id uuid references auth.users(id) on delete set null;
create index if not exists enquiries_buyer_id_idx on public.enquiries (buyer_id);

create or replace function public.handle_new_kalasetu_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (user_id, role)
  values (new.id, 'Buyer')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_kalasetu_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_kalasetu_user on auth.users;
create trigger on_auth_user_created_kalasetu_user
after insert on auth.users
for each row execute function public.handle_new_kalasetu_user();

create or replace function public.get_my_kalasetu_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lower(app_user.role::text)
  from public.users as app_user
  where app_user.user_id = auth.uid();
$$;

revoke all on function public.get_my_kalasetu_role() from public, anon, authenticated;
grant execute on function public.get_my_kalasetu_role() to authenticated;

create or replace function public.register_artisan_account(
  p_full_name text,
  p_studio_name text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email_confirmed_at timestamptz;
  v_requested_role text;
  v_existing_role text;
  v_affected_rows integer;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to register an artisan account.';
  end if;

  if nullif(btrim(coalesce(p_full_name, '')), '') is null
    or nullif(btrim(coalesce(p_studio_name, '')), '') is null then
    raise exception 'Your name and studio or artisan name are required.';
  end if;

  select auth_user.email_confirmed_at,
         auth_user.raw_user_meta_data->>'requested_role'
    into v_email_confirmed_at, v_requested_role
    from auth.users as auth_user
    where auth_user.id = v_user_id;

  if not found or v_email_confirmed_at is null then
    raise exception 'Confirm your email before registering as an artisan.';
  end if;

  if v_requested_role is distinct from 'artisan' then
    raise exception 'An explicit artisan signup is required to register this account.';
  end if;

  select app_user.role::text
    into v_existing_role
    from public.users as app_user
    where app_user.user_id = v_user_id
    for update;

  if found and (v_existing_role is null or v_existing_role not in ('Buyer', 'Artisan')) then
    raise exception 'This account role cannot be changed through artisan registration.';
  end if;

  insert into public.users as existing_user (user_id, role)
  values (v_user_id, 'Artisan')
  on conflict (user_id) do update
    set role = 'Artisan'
    where existing_user.role in ('Buyer', 'Artisan');

  get diagnostics v_affected_rows = row_count;
  if v_affected_rows = 0 then
    raise exception 'This account role cannot be changed through artisan registration.';
  end if;

  insert into public.artisans (id, name, craft, region)
  values (v_user_id::text, btrim(p_studio_name), '', '')
  on conflict (id) do nothing;
end;
$$;

revoke all on function public.register_artisan_account(text, text) from public, anon, authenticated;
grant execute on function public.register_artisan_account(text, text) to authenticated;

create or replace function public.is_artisan()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users as app_user
    where app_user.user_id = auth.uid()
      and app_user.role = 'Artisan'
  );
$$;

revoke all on function public.is_artisan() from public, anon, authenticated;
grant execute on function public.is_artisan() to anon, authenticated;

alter table public.artisans enable row level security;
alter table public.products enable row level security;
alter table public.enquiries enable row level security;

grant select on public.artisans, public.products to anon, authenticated;
grant insert, update, delete on public.artisans, public.products to authenticated;
grant insert, select on public.enquiries to anon, authenticated;
revoke update on public.enquiries from anon, authenticated;
grant update (status, reply, updated_at) on public.enquiries to authenticated;

drop policy if exists public_artisans on public.artisans;
drop policy if exists own_studio_insert on public.artisans;
drop policy if exists own_studio_update on public.artisans;
create policy public_artisans on public.artisans for select using (true);
create policy own_studio_insert on public.artisans
  for insert to authenticated
  with check (id = auth.uid()::text and public.is_artisan());
create policy own_studio_update on public.artisans
  for update to authenticated
  using (id = auth.uid()::text and public.is_artisan())
  with check (id = auth.uid()::text and public.is_artisan());

drop policy if exists public_products on public.products;
drop policy if exists own_products_insert on public.products;
drop policy if exists own_products_update on public.products;
drop policy if exists own_products_delete on public.products;
create policy public_products on public.products for select using (true);
create policy own_products_insert on public.products
  for insert to authenticated
  with check (artisan_id = auth.uid()::text and public.is_artisan());
create policy own_products_update on public.products
  for update to authenticated
  using (artisan_id = auth.uid()::text and public.is_artisan())
  with check (artisan_id = auth.uid()::text and public.is_artisan());
create policy own_products_delete on public.products
  for delete to authenticated
  using (artisan_id = auth.uid()::text and public.is_artisan());

drop policy if exists submit_enquiry on public.enquiries;
drop policy if exists own_enquiries on public.enquiries;
drop policy if exists reply_enquiries on public.enquiries;
create policy submit_enquiry on public.enquiries
  for insert to anon, authenticated
  with check (
    (buyer_id is null or buyer_id = auth.uid())
    and status = 'pending'
    and reply is null
  );
create policy own_enquiries on public.enquiries
  for select to anon, authenticated
  using (
    buyer_id = auth.uid()
    or exists (
      select 1 from public.products as product
      where product.id = product_id
        and product.artisan_id = auth.uid()::text
        and public.is_artisan()
    )
  );
create policy reply_enquiries on public.enquiries
  for update to authenticated
  using (
    exists (
      select 1 from public.products as product
      where product.id = product_id
        and product.artisan_id = auth.uid()::text
        and public.is_artisan()
    )
  )
  with check (
    exists (
      select 1 from public.products as product
      where product.id = product_id
        and product.artisan_id = auth.uid()::text
        and public.is_artisan()
    )
  );

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
drop policy if exists product_images_read on storage.objects;
create policy product_images_read on storage.objects
  for select using (bucket_id = 'product-images');
drop policy if exists product_images_upload on storage.objects;
create policy product_images_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_artisan()
  );
