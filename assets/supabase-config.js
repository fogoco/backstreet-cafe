// Backstreet Cafe — Supabase connection used by the public site and /admin.
//
// The publishable (anon) key is safe to ship in the browser: every table is
// protected by Row Level Security, so it can only read published rows and can
// never write anything without a signed-in staff session.
//
// Paste the publishable key from:
//   Supabase dashboard > Project Settings > API keys
window.BACKSTREET_SUPABASE = {
  url: 'https://zbiyaxtwyirezuxnwdul.supabase.co',
  publishableKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiaXlheHR3eWlyZXp1eG53ZHVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwODg3NjMsImV4cCI6MjA5MjY2NDc2M30.dmh-nXHHYlDZxNKeQPWAh6AyOs42mmEevopCDT3taGk'
};
