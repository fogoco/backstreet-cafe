-- Backstreet Cafe — menu and gallery managed from /admin
-- Run this once in the Supabase SQL editor (project zbiyaxtwyirezuxnwdul).
-- The editor warns that private.staff_emails has no RLS: choose "Run without
-- RLS". The private schema is not exposed by the Data API, so no client key can
-- reach that table; the tables that are exposed enable RLS further down.

-- ---------------------------------------------------------------------------
-- Staff allowlist
--
-- Being signed in is not enough to edit the menu: the account's email also has
-- to be on this list. It lives in an unexposed schema so it can never be read
-- or changed through the Data API, only from the SQL editor.
--
-- To add someone:    insert into private.staff_emails (email) values ('name@example.com');
-- To remove someone: delete from private.staff_emails where email = 'name@example.com';
-- ---------------------------------------------------------------------------

create schema if not exists private;

create table if not exists private.staff_emails (
  email text primary key,
  added_at timestamptz not null default now()
);

insert into private.staff_emails (email)
values ('heliocwoi@gmail.com')
on conflict (email) do nothing;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.staff_emails
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function private.is_staff() from public;
grant execute on function private.is_staff() to authenticated;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10, 2) not null default 0,
  category text not null,
  image_url text,
  tags text[] not null default '{}',
  badge text,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_items_category_check check (
    category in (
      'BREAKFAST',
      'BIG_BREAKFAST',
      'SWEET_BREAKFAST',
      'KIDS_STUFF',
      'LUNCH',
      'BURGERS',
      'SIDES',
      'EXTRA_BITS',
      'DRINKS_HOT',
      'DRINKS_COLD',
      'DRINKS_SWIRLS',
      'BEER_COCKTAILS'
    )
  ),
  constraint menu_items_badge_check check (
    badge is null or badge in ('Signature', 'Backstreet Favourite')
  )
);

create index if not exists menu_items_category_sort_idx
  on public.menu_items (category, sort_order, name);

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt_text text not null default '',
  link_url text,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists gallery_images_sort_idx
  on public.gallery_images (sort_order, created_at);

-- ---------------------------------------------------------------------------
-- Keep updated_at fresh
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists menu_items_set_updated_at on public.menu_items;
create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Visitors read published rows. Only signed-in staff can write.
-- ---------------------------------------------------------------------------

alter table public.menu_items enable row level security;
alter table public.gallery_images enable row level security;

drop policy if exists "Public reads available menu items" on public.menu_items;
create policy "Public reads available menu items"
  on public.menu_items for select
  to anon
  using (is_available);

-- Staff see hidden items too, so they can toggle them back on.
drop policy if exists "Staff reads every menu item" on public.menu_items;
create policy "Staff reads every menu item"
  on public.menu_items for select
  to authenticated
  using (is_available or private.is_staff());

drop policy if exists "Staff inserts menu items" on public.menu_items;
create policy "Staff inserts menu items"
  on public.menu_items for insert
  to authenticated
  with check (private.is_staff());

drop policy if exists "Staff updates menu items" on public.menu_items;
create policy "Staff updates menu items"
  on public.menu_items for update
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());

drop policy if exists "Staff deletes menu items" on public.menu_items;
create policy "Staff deletes menu items"
  on public.menu_items for delete
  to authenticated
  using (private.is_staff());

drop policy if exists "Public reads visible gallery images" on public.gallery_images;
create policy "Public reads visible gallery images"
  on public.gallery_images for select
  to anon
  using (is_visible);

drop policy if exists "Staff reads every gallery image" on public.gallery_images;
create policy "Staff reads every gallery image"
  on public.gallery_images for select
  to authenticated
  using (is_visible or private.is_staff());

drop policy if exists "Staff inserts gallery images" on public.gallery_images;
create policy "Staff inserts gallery images"
  on public.gallery_images for insert
  to authenticated
  with check (private.is_staff());

drop policy if exists "Staff updates gallery images" on public.gallery_images;
create policy "Staff updates gallery images"
  on public.gallery_images for update
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());

drop policy if exists "Staff deletes gallery images" on public.gallery_images;
create policy "Staff deletes gallery images"
  on public.gallery_images for delete
  to authenticated
  using (private.is_staff());

-- ---------------------------------------------------------------------------
-- Storage bucket for photos uploaded from the admin panel
-- Public bucket: anyone can view a photo URL, only staff can change files.
-- Upsert needs INSERT + SELECT + UPDATE together.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-photos',
  'menu-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = true,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

drop policy if exists "Staff uploads menu photos" on storage.objects;
create policy "Staff uploads menu photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'menu-photos' and private.is_staff());

drop policy if exists "Staff reads menu photos" on storage.objects;
create policy "Staff reads menu photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'menu-photos' and private.is_staff());

drop policy if exists "Staff replaces menu photos" on storage.objects;
create policy "Staff replaces menu photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'menu-photos' and private.is_staff())
  with check (bucket_id = 'menu-photos' and private.is_staff());

drop policy if exists "Staff deletes menu photos" on storage.objects;
create policy "Staff deletes menu photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'menu-photos' and private.is_staff());
