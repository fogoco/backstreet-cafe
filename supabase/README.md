# Menu manager setup

The menu and the Instagram gallery live in Supabase (project `zbiyaxtwyirezuxnwdul`)
and are edited at [backstreetcafe.com.au/admin](https://backstreetcafe.com.au/admin).

Run these five steps once. Until step 4 is done the website keeps serving the
bundled copy in `assets/menu-data.json`, so nothing breaks in the meantime.

## 1. Create the tables

Supabase dashboard → **SQL Editor** → paste all of `schema.sql` → **Run**.

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

Create the user under **Authentication → Users**, then in the SQL Editor:

```sql
insert into private.staff_emails (email) values ('someone@example.com');
```

Removing access:

```sql
delete from private.staff_emails where email = 'someone@example.com';
```

## How access is enforced

| Who | Menu &amp; gallery | Photo uploads |
|---|---|---|
| Website visitor | Reads published rows only | No access |
| Signed in, not on allowlist | Reads published rows only | No access |
| Signed in and on allowlist | Full add / edit / delete | Full upload / replace / delete |

## Categories

Item categories are fixed by a database constraint and must be one of:

`BREAKFAST`, `BIG_BREAKFAST`, `SWEET_BREAKFAST`, `KIDS_STUFF`,
`LUNCH`, `BURGERS`, `SIDES`, `EXTRA_BITS`,
`DRINKS_HOT`, `DRINKS_COLD`, `DRINKS_SWIRLS`, `BEER_COCKTAILS`

The website groups them into the three tabs — Breakfast, Lunch, Drinks — in
`assets/menu-browser.js`. `EXTRA_BITS` renders as a plain price list without
photos. Adding a brand new category means updating the constraint in
`schema.sql` plus `CATEGORY_LABELS` and `TAB_GROUPS` in that file and in
`admin/index.html`.
