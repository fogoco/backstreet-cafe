// Backstreet Cafe — Supabase connection used by the public site and /admin.
//
// The publishable (anon) key is safe to ship in the browser: every table is
// protected by Row Level Security, so it can only read published rows and can
// never write anything without a signed-in staff session.
//
// Paste the publishable key from:
//   Supabase dashboard > Project Settings > API keys
window.BACKSTREET_SUPABASE = {
  url: 'https://qpqppnulhlsanreiwigk.supabase.co',
  publishableKey: 'PASTE_PUBLISHABLE_KEY_HERE'
};
