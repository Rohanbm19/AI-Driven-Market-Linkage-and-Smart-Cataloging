-- Safe setup: does not drop tables or existing data.
-- 202611010001_create_artisans.sql
CREATE TABLE IF NOT EXISTS artisans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    craft TEXT NOT NULL,
    region TEXT NOT NULL,
    experience TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    avatar TEXT NOT NULL DEFAULT '',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
    total_sales INTEGER NOT NULL DEFAULT 0,
    badges TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 202611010002_create_products.sql
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other',
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    artisan_name TEXT NOT NULL,
    artisan_id TEXT REFERENCES artisans(id) ON DELETE SET NULL,
    region TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    materials TEXT[] NOT NULL DEFAULT '{}',
    image_url TEXT NOT NULL DEFAULT '',
    enhanced_image_url TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
    reviews_count INTEGER NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    fair_trade BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 202611010003_create_enquiries.sql
CREATE TABLE IF NOT EXISTS enquiries (
    id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    product_title TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    quantity TEXT NOT NULL DEFAULT 'Single piece / Inquiry',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reply TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 202611040001_add_original_image_url.sql
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS original_image_url TEXT;


-- 202611140001_merge_auth_and_ownership.sql
-- Apply AFTER main's existing migrations. Non-destructive: preserves existing rows.
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'buyer' check (role in ('buyer','artisan')),
 full_name text, studio_name text,
 requested_role text not null default 'buyer' check (requested_role in ('buyer','artisan')),
 created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists studio_name text;
alter table public.profiles add column if not exists requested_role text not null default 'buyer';
alter table public.enquiries add column if not exists buyer_id uuid references auth.users(id) on delete set null;
create index if not exists enquiries_buyer_id_idx on public.enquiries(buyer_id);

create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id, role, full_name, studio_name, requested_role)
 values(new.id, 'buyer', nullif(btrim(new.raw_user_meta_data->>'full_name'),''),
 nullif(btrim(new.raw_user_meta_data->>'studio_name'),''),
 case when new.raw_user_meta_data->>'requested_role' = 'artisan' then 'artisan' else 'buyer' end)
 on conflict(id) do nothing;
 return new;
end; $$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
for each row execute function public.handle_new_auth_user();
insert into public.profiles(id, full_name, studio_name, requested_role)
select id, raw_user_meta_data->>'full_name', raw_user_meta_data->>'studio_name',
 case when raw_user_meta_data->>'requested_role' = 'artisan' then 'artisan' else 'buyer' end
from auth.users on conflict(id) do nothing;

-- Roles are assigned by the project owner in SQL, never by client metadata.
create or replace function public.is_artisan() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id = auth.uid() and role = 'artisan');
$$;
revoke all on function public.is_artisan() from public;
grant execute on function public.is_artisan() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.artisans enable row level security;
alter table public.products enable row level security;
alter table public.enquiries enable row level security;
-- Replace permissive legacy policies on these four tables with ownership rules.
do $$ declare p record; begin
 for p in select schemaname, tablename, policyname from pg_policies
 where schemaname = 'public' and tablename in ('profiles','artisans','products','enquiries')
 loop execute format('drop policy %I on %I.%I',p.policyname,p.schemaname,p.tablename); end loop;
end $$;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.artisans, public.products to anon, authenticated;
grant insert, update, delete on public.artisans, public.products to authenticated;
grant insert, select on public.enquiries to anon, authenticated;
revoke update on public.enquiries from anon, authenticated;
grant update(status,reply,updated_at) on public.enquiries to authenticated;
create policy own_profile on public.profiles for select to authenticated using(id = auth.uid());
create policy public_artisans on public.artisans for select using(true);
create policy own_studio_insert on public.artisans for insert to authenticated with check(id = auth.uid()::text and public.is_artisan());
create policy own_studio_update on public.artisans for update to authenticated using(id = auth.uid()::text and public.is_artisan()) with check(id = auth.uid()::text and public.is_artisan());
create policy public_products on public.products for select using(true);
create policy own_products_insert on public.products for insert to authenticated with check(artisan_id = auth.uid()::text and public.is_artisan());
create policy own_products_update on public.products for update to authenticated using(artisan_id = auth.uid()::text and public.is_artisan()) with check(artisan_id = auth.uid()::text and public.is_artisan());
create policy own_products_delete on public.products for delete to authenticated using(artisan_id = auth.uid()::text and public.is_artisan());
create policy submit_enquiry on public.enquiries for insert to anon, authenticated with check((buyer_id is null or buyer_id = auth.uid()) and status = 'pending' and reply is null);
create policy own_enquiries on public.enquiries for select to anon, authenticated using(
 buyer_id = auth.uid() or
 exists(select 1 from public.products p where p.id = product_id and p.artisan_id = auth.uid()::text and public.is_artisan())
);
create policy reply_enquiries on public.enquiries for update to authenticated using(
 exists(select 1 from public.products p where p.id = product_id and p.artisan_id = auth.uid()::text and public.is_artisan())
) with check(exists(select 1 from public.products p where p.id = product_id and p.artisan_id = auth.uid()::text and public.is_artisan()));

insert into storage.buckets(id,name,public) values('product-images','product-images',true) on conflict(id) do nothing;
-- Remove only old policies applying to the product image bucket; retain other buckets.
do $$ declare p record; begin
 for p in select policyname from pg_policies where schemaname='storage' and tablename='objects'
 and (coalesce(qual,'') || coalesce(with_check,'')) like '%product-images%'
 loop execute format('drop policy %I on storage.objects',p.policyname); end loop;
end $$;
create policy product_images_read on storage.objects for select using(bucket_id='product-images');
create policy product_images_upload on storage.objects for insert to authenticated with check(
 bucket_id='product-images' and (storage.foldername(name))[1]=auth.uid()::text and public.is_artisan());
