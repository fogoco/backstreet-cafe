# backstreet-cafe

Landing page base for Backstreet Cafe with Supabase newsletter capture.

## Files

- `backstreet_cafe_landing_preview.jsx`
- `.env.example`

## Supabase setup

1. Copy `.env.example` to `.env`.
2. Add your `anon` key from Supabase:
   - `VITE_SUPABASE_ANON_KEY=...` (Vite)
   - or `REACT_APP_SUPABASE_ANON_KEY=...` (Create React App)
3. Create table `newsletter_signups` in Supabase.

Suggested SQL:

```sql
create table if not exists newsletter_signups (
  id bigint generated always as identity primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);
```

## Publish to GitHub

```bash
git add .
git commit -m "Add landing page and Supabase newsletter integration"
git push origin main
```
