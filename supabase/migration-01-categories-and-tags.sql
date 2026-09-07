-- Backstreet Cafe — migration 01
-- Hand the categories and the dietary tags over to the client.
--
-- Until now both lived in the code: categories as a CHECK constraint on
-- menu_items and tags as five hardcoded checkboxes. Adding one meant a code
-- change, which defeats the point of the manager. They are tables now.
--
-- Run this once in the SQL editor, on top of schema.sql + seed.sql.
-- Safe to run twice. The editor will warn about destructive operations
-- (the drop constraint and the Beer & Cocktails delete below) — that is
-- expected; choose "Run without RLS" if it also asks.

-- ---------------------------------------------------------------------------
-- Categories
--
-- key      stays fixed once created; menu_items.category points at it
-- tab      which of the three menu tabs the category shows under
-- layout   'cards' shows photos, 'list' is a plain name + price list
-- ---------------------------------------------------------------------------

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  tab text not null,
  layout text not null default 'cards',
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  constraint menu_categories_tab_check
    check (tab in ('breakfast', 'lunch', 'drinks')),
  constraint menu_categories_layout_check
    check (layout in ('cards', 'list')),
  -- Uppercase with underscores, so the key stays readable in the database.
  constraint menu_categories_key_check
    check (key ~ '^[A-Z][A-Z0-9_]*$')
);

create index if not exists menu_categories_tab_sort_idx
  on public.menu_categories (tab, sort_order, label);

-- The categories the menu already used. Beer & Cocktails is deliberately
-- absent: the client asked for it to go, and can recreate it from /admin.
insert into public.menu_categories (key, label, tab, layout, sort_order) values
  ('BREAKFAST',       'Breakfast',          'breakfast', 'cards', 10),
  ('BIG_BREAKFAST',   'Big Breakfast',      'breakfast', 'cards', 20),
  ('SWEET_BREAKFAST', 'Sweet Breakfast',    'breakfast', 'cards', 30),
  ('KIDS_STUFF',      'Kids Stuff',         'breakfast', 'cards', 40),
  ('LUNCH',           'Lunch Menu',         'lunch',     'cards', 10),
  ('BURGERS',         'BackStreet Burgers', 'lunch',     'cards', 20),
  ('SIDES',           'Sides',              'lunch',     'cards', 30),
  ('EXTRA_BITS',      'Extra Bits',         'lunch',     'list',  40),
  ('DRINKS_HOT',      'Hot Stuff',          'drinks',    'cards', 10),
  ('DRINKS_COLD',     'Cold Stuff',         'drinks',    'cards', 20),
  ('DRINKS_SWIRLS',   'Swirls',             'drinks',    'cards', 30)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Dietary tags
-- ---------------------------------------------------------------------------

create table if not exists public.dietary_tags (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  -- menu_items.tags stores these codes, so keep them short and lowercase.
  constraint dietary_tags_code_check check (code ~ '^[a-z][a-z0-9]*$')
);

insert into public.dietary_tags (code, label, sort_order) values
  ('gf',  'Gluten Free', 10),
  ('gfo', 'GF Option',   20),
  ('v',   'Vegetarian',  30),
  ('vg',  'Vegan',       40),
  ('df',  'Dairy Free',  50)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Drop Beer & Cocktails
--
-- This removes 8 items that came from the 2026 menu PDF: Corona, Great
-- Northern Super Crisp, Matsos Ginger Beer, Mimosa, Espresso Martini,
-- Aperol Spritz, Frozen Pina Colada and House Spirits. They are still in
-- seed.sql if they ever need to come back.
-- ---------------------------------------------------------------------------

delete from public.menu_items where category = 'BEER_COCKTAILS';

-- ---------------------------------------------------------------------------
-- Point menu_items at the new table
--
-- The old CHECK constraint listed the categories by hand, so the client could
-- never add one. A foreign key does the same job while letting the list grow.
-- on delete restrict means a category holding items cannot be deleted by
-- accident; /admin turns that error into a readable message.
-- ---------------------------------------------------------------------------

alter table public.menu_items
  drop constraint if exists menu_items_category_check;

alter table public.menu_items
  drop constraint if exists menu_items_category_fkey;

alter table public.menu_items
  add constraint menu_items_category_fkey
  foreign key (category) references public.menu_categories (key)
  on update cascade
  on delete restrict;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Visitors read; only staff on the allowlist can change anything.
-- ---------------------------------------------------------------------------

alter table public.menu_categories enable row level security;
alter table public.dietary_tags enable row level security;

drop policy if exists "Public reads visible categories" on public.menu_categories;
create policy "Public reads visible categories"
  on public.menu_categories for select
  to anon
  using (is_visible);

-- Staff see hidden categories too, so they can switch them back on.
drop policy if exists "Staff reads every category" on public.menu_categories;
create policy "Staff reads every category"
  on public.menu_categories for select
  to authenticated
  using (is_visible or private.is_staff());

drop policy if exists "Staff writes categories" on public.menu_categories;
create policy "Staff writes categories"
  on public.menu_categories for all
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());

drop policy if exists "Public reads dietary tags" on public.dietary_tags;
create policy "Public reads dietary tags"
  on public.dietary_tags for select
  to anon
  using (true);

drop policy if exists "Signed in reads dietary tags" on public.dietary_tags;
create policy "Signed in reads dietary tags"
  on public.dietary_tags for select
  to authenticated
  using (true);

drop policy if exists "Staff writes dietary tags" on public.dietary_tags;
create policy "Staff writes dietary tags"
  on public.dietary_tags for all
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());
