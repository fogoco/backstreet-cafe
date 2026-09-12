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
-- 1. Find the address the cafe actually signed in with
--
-- Run this line on its own first. The insert below needs the exact address,
-- and an account created with a typo is its own silent failure.
-- ---------------------------------------------------------------------------

-- select email, created_at, last_sign_in_at from auth.users order by created_at;

-- ---------------------------------------------------------------------------
-- 2. Authorise it
--
-- Lowercase, one line per person. Uncomment the second line and put the real
-- address in it. Anyone not on this list can read the menu but not change it.
-- ---------------------------------------------------------------------------

insert into private.staff_emails (email) values
  ('heliocwoi@gmail.com')
  -- , ('the-cafe-address@example.com')
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
