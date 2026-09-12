-- Backstreet Cafe — migration 02
-- Authorise the cafe's own account, and let the panel say when it cannot edit.
--
-- The symptom: the client signed in, changed a price, the dialog closed and
-- nothing changed. Being signed in was never enough — the account's email also
-- has to be on private.staff_emails — but Row Level Security refuses an UPDATE
-- by matching no rows rather than by failing, which over the wire is
-- indistinguishable from a save that worked. Only my address was on the list,
-- so every edit the cafe made quietly did nothing.
--
-- Run in the SQL editor. Safe to run twice. Deletes nothing.

-- ---------------------------------------------------------------------------
-- 0. Am I in the right project?
--
-- This account has several Supabase projects, and the first attempt at this
-- migration ran in the wrong one. That fails with "relation
-- private.staff_emails does not exist", which reads like a broken script
-- rather than a wrong browser tab. Say which it is.
--
-- The menu lives in the project whose URL is in assets/supabase-config.js:
-- https://supabase.com/dashboard/project/zbiyaxtwyirezuxnwdul/sql/new
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.menu_items') is null then
    raise exception
      'Wrong project: public.menu_items is missing here. Open the SQL editor for zbiyaxtwyirezuxnwdul, the project assets/supabase-config.js points at.';
  end if;

  if to_regclass('private.staff_emails') is null then
    raise exception
      'private.staff_emails is missing. Run supabase/schema.sql in this project before this migration.';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 1. Find the address the cafe actually signed in with
--
-- Run this line on its own first. The insert below needs the exact address,
-- and an account created with a typo is its own silent failure.
-- ---------------------------------------------------------------------------

-- select email, created_at, last_sign_in_at from auth.users order by created_at;

-- ---------------------------------------------------------------------------
-- 2. Authorise it
--
-- Lowercase, one line per person. Anyone not on this list can read the menu
-- but not change it. contact@fogoco.com.au is the address the cafe signs in
-- with; confirmed against auth.users while reproducing the fault.
-- ---------------------------------------------------------------------------

insert into private.staff_emails (email) values
  ('heliocwoi@gmail.com'),
  ('contact@fogoco.com.au')
on conflict (email) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Let the panel ask whether this account may edit
--
-- private.is_staff() cannot be reached from a browser: the private schema is
-- deliberately not exposed by the Data API. This wrapper in public is, so the
-- panel can warn at sign-in instead of letting the first save look successful.
-- ---------------------------------------------------------------------------

create or replace function public.can_edit_menu()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_staff();
$$;

revoke all on function public.can_edit_menu() from public;
grant execute on function public.can_edit_menu() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Confirm
--
-- Run this to see who is authorised now.
-- ---------------------------------------------------------------------------

-- select email from private.staff_emails order by email;
