alter table public.profiles
  add column if not exists full_name text,
  add column if not exists studio_name text,
  add column if not exists requested_role text not null default 'buyer'
    check (requested_role in ('buyer', 'artisan'));

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, studio_name, requested_role)
  values (
    new.id,
    'buyer',
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'studio_name'), ''),
    case
      when new.raw_user_meta_data ->> 'requested_role' = 'artisan' then 'artisan'
      else 'buyer'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create table if not exists public.buyer_enquiries (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references auth.users (id) on delete set null,
  product_id text not null,
  product_title text not null,
  buyer_name text not null,
  buyer_email text not null,
  quantity text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists buyer_enquiries_buyer_created_at_idx
  on public.buyer_enquiries (buyer_id, created_at desc);

alter table public.buyer_enquiries enable row level security;

grant insert on public.buyer_enquiries to anon, authenticated;
grant select on public.buyer_enquiries to authenticated;

drop policy if exists "Buyers can submit enquiries" on public.buyer_enquiries;
create policy "Buyers can submit enquiries"
  on public.buyer_enquiries
  for insert
  to anon, authenticated
  with check (
    buyer_id is null or buyer_id = (select auth.uid())
  );

drop policy if exists "Buyers can read their own enquiries" on public.buyer_enquiries;
create policy "Buyers can read their own enquiries"
  on public.buyer_enquiries
  for select
  to authenticated
  using ((select auth.uid()) = buyer_id);
