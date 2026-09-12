# Menu manager setup

The menu and the Instagram gallery live in Supabase (project `zbiyaxtwyirezuxnwdul`)
and are edited at [backstreetcafe.com.au/admin](https://backstreetcafe.com.au/admin).

Run these five steps once. Until step 4 is done the website keeps serving the
bundled copy in `assets/menu-data.json`, so nothing breaks in the meantime.

Already set up? The one thing left to run is
`migration-01-categories-and-tags.sql`, which hands the categories and dietary
tags over to the client. It deletes no menu items. Paste it into the **SQL
Editor** and **Run**. `/admin` shows an error until it has been run.

Beer & Cocktails arrives as a hidden category: the eight alcoholic drinks stay
in the database and in `/admin`, but the section does not render on the website
until staff press **Show** on it.

Also run `migration-02-staff-access.sql`, which authorises the cafe's own
account and adds the permission check the panel uses. Put the cafe's email in
it before running.

## 1. Create the tables

Supabase dashboard → **SQL Editor** → paste all of `schema.sql` → **Run**.

The editor warns about destructive operations and a table without RLS. Choose
**Run without RLS**. The warning means `private.staff_emails`, and the private
schema is not exposed by the Data API, so no client key can reach it. The
"destructive" part is the `drop policy if exists` lines that let the script be
re-run safely.

This creates `menu_items`, `gallery_images`, the `menu-photos` storage bucket,
Row Level Security policies, and the staff allowlist seeded with
`heliocwoi@gmail.com`.

## 2. Import the current menu

Same SQL Editor → paste all of `seed.sql` → **Run**.

Loads the 92 dishes and 7 gallery photos. `Green Brekky Burrito` comes in as
*Backstreet Favourite* and `Breadless Benedict (gf)` as *Signature*.

Re-running it wipes both tables and reimports, so only use it for the first
load or to reset everything.

## 3. Create the login

**Authentication → Users → Add user**

- Email: `heliocwoi@gmail.com`
- Set a password and tick *Auto Confirm User*

Then **Authentication → Sign In / Providers** and turn **off**
*Allow new users to sign up*. Without this anyone could register an account,
and although the allowlist would still block them from editing, there is no
reason to let strangers create accounts.

For password reset emails to work, add `https://backstreetcafe.com.au/admin/`
under **Authentication → URL Configuration → Redirect URLs**.

## 4. Connect the website

Already done — `assets/supabase-config.js` holds this project's anon key. Only
redo this if the key gets rotated: **Project Settings → API keys** → copy the
**publishable** key and paste it in:

```js
window.BACKSTREET_SUPABASE = {
  url: 'https://zbiyaxtwyirezuxnwdul.supabase.co',
  publishableKey: 'sb_publishable_...'
};
```

Commit and push. This key is meant to be public: Row Level Security limits it
to reading published rows, and it can never write anything.

## 5. Check it worked

1. Open `/admin`, sign in, and change a price.
2. Reload the homepage and confirm the new price shows in the menu.
3. Sign out and confirm `/admin` asks for the login again.

## Keeping the project awake

This project was paused once before, which broke the site's photos for a while.
Free Supabase projects pause after about a week with no requests. The website
queries the menu on every visit, so normal traffic keeps it awake — but if the
site goes quiet, check the dashboard and hit **Restore** if it paused. While
paused the menu falls back to `assets/menu-data.json`, so visitors still see a
menu; they just would not see the client's latest edits.

## Adding another staff member

**Creating the account is only half of it.** An account that exists but is not
on this list can sign in, see the whole menu, and change nothing. Skipping the
second step is what made the cafe's first attempt at editing prices fail.

Create the user under **Authentication → Users**, then in the SQL Editor:

```sql
insert into private.staff_emails (email) values ('someone@example.com');
```

Removing access:

```sql
delete from private.staff_emails where email = 'someone@example.com';
```

To see who can edit, and which accounts exist but cannot:

```sql
select u.email, (s.email is not null) as can_edit
from auth.users u
left join private.staff_emails s on s.email = lower(u.email)
order by u.created_at;
```

The panel checks this at sign-in through `public.can_edit_menu()` and shows a
warning when the answer is no, so nobody has to find out by losing an edit.

## How access is enforced

| Who | Menu &amp; gallery | Photo uploads |
|---|---|---|
| Website visitor | Reads published rows only | No access |
| Signed in, not on allowlist | Reads everything, changes nothing | No access |
| Signed in and on allowlist | Full add / edit / delete | Full upload / replace / delete |

Row Level Security turns a refusal into "no rows matched", which for an update
or a delete is indistinguishable from success. Every write in the panel goes
through `applyChange()`, which asks for the affected rows back and treats an
empty answer as the refusal it is.

## Categories and dietary tags

Both are rows in `menu_categories` and `dietary_tags`, managed from `/admin`
under **Add / delete** next to the Category and Dietary tags fields. No code
change is needed to add either.

A category carries:

| Column | Meaning |
|---|---|
| `key` | what `menu_items.category` points at; set once from the name and never changes |
| `label` | the section heading shown on the website |
| `tab` | which tab it appears under: `breakfast`, `lunch` or `drinks` |
| `layout` | `cards` shows photos, `list` is a plain name + price list |
| `sort_order` | position within its tab, lower first |
| `is_visible` | off hides the whole section from the website |

`menu_items.category` is a foreign key with `on delete restrict`, so a category
holding items cannot be deleted; the panel says so and offers Hide instead.
Renaming a category is safe because the key stays put.

Deleting a dietary tag also strips its code from every item that used it.

The three tabs themselves are fixed in `assets/menu-browser.js` and the
`menu_categories_tab_check` constraint. Adding a fourth tab is the one change
here that still needs code.
