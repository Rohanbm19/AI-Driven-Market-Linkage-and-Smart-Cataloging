-- Promote only confirmed users who explicitly registered for artisan access.
update public.profiles as profile
set role = 'artisan',
    full_name = coalesce(
      nullif(btrim(auth_user.raw_user_meta_data->>'full_name'), ''),
      profile.full_name
    ),
    studio_name = coalesce(
      nullif(btrim(auth_user.raw_user_meta_data->>'studio_name'), ''),
      profile.studio_name
    )
from auth.users as auth_user
where profile.id = auth_user.id
  and profile.role = 'buyer'
  and profile.requested_role = 'artisan'
  and auth_user.email_confirmed_at is not null;

insert into public.artisans (id, name, craft, region)
select
  profile.id::text,
  coalesce(nullif(btrim(profile.studio_name), ''), profile.full_name, 'My Studio'),
  '',
  ''
from public.profiles as profile
where profile.role = 'artisan'
on conflict (id) do nothing;

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

  update public.profiles
    set role = 'artisan',
        full_name = btrim(p_full_name),
        studio_name = btrim(p_studio_name)
    where id = v_user_id
      and requested_role = 'artisan'
      and role in ('buyer', 'artisan');

  if not found then
    raise exception 'This account role cannot be changed through artisan registration.';
  end if;

  insert into public.artisans (id, name, craft, region)
  values (v_user_id::text, btrim(p_studio_name), '', '')
  on conflict (id) do nothing;
end;
$$;

revoke all on function public.register_artisan_account(text, text)
  from public, anon, authenticated;
grant execute on function public.register_artisan_account(text, text)
  to authenticated;
