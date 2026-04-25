import React, { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const features = [
  { icon: "🍽️", title: "Crafted Menu", text: "Dishes designed to look incredible and taste even better." },
  { icon: "🌊", title: "Beachside Location", text: "Just steps from Mooloolaba Beach — the perfect place to slow down." },
  { icon: "☕", title: "Specialty Coffee", text: "Carefully brewed coffee that completes every coastal morning." },
];

const menuImages = [
  "https://images.unsplash.com/photo-1590301157890-4810ed352733?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1528207776546-365bb710ee93?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=900&auto=format&fit=crop",
];

const reviews = [
  "Best brunch spot in Mooloolaba. Amazing food and vibe.",
  "Coffee is perfect and the atmosphere is even better.",
  "Every dish looks as good as it tastes.",
];

const supabaseUrl = "https://zbiyaxtwyirezuxnwdul.supabase.co";
const supabaseAnonKey =
  (typeof import.meta !== "undefined" && import.meta?.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== "undefined" && process?.env?.REACT_APP_SUPABASE_ANON_KEY) ||
  "";

export default function BackstreetCafeLanding() {
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = useMemo(() => {
    if (!supabaseAnonKey) return null;
    return createClient(supabaseUrl, supabaseAnonKey);
  }, []);

  const handleSubscribe = async (event) => {
    event.preventDefault();

    if (!email) {
      setSubscribeStatus("Please enter your email first.");
      return;
    }

    if (!supabase) {
      setSubscribeStatus("Supabase not configured yet. Add your anon key to continue.");
      return;
    }

    setIsSubmitting(true);
    setSubscribeStatus("");

    const { error } = await supabase.from("newsletter_signups").insert({ email });

    if (error) {
      setSubscribeStatus("Could not save your email right now. Please try again.");
      setIsSubmitting(false);
      return;
    }

    setSubscribeStatus("Thanks! You are on the Backstreet list.");
    setEmail("");
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#fbf8f3] text-[#151515]">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#fbf8f3]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-lg text-white">☕</div>
            <div>
              <p className="text-sm font-semibold tracking-[0.22em]">BACKSTREET</p>
              <p className="text-xs uppercase tracking-[0.25em] text-black/50">Cafe · Est. 2016</p>
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-black/70 md:flex">
            <a href="#menu">Menu</a>
            <a href="#experience">Experience</a>
            <a href="#visit">Visit</a>
          </nav>
          <a href="#visit" className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-black/80">
            Visit Us
          </a>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 py-16 md:py-24">
          <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-[#d8c3a5]/30 blur-3xl" />
          <div className="absolute bottom-0 left-8 h-72 w-72 rounded-full bg-[#b9c7b1]/30 blur-3xl" />

          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm text-black/65 shadow-sm">
                🌊 Steps from Mooloolaba Beach
              </div>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] md:text-7xl">
                A beachside café experience in Mooloolaba.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-black/65 md:text-xl">
                Fresh brunch, specialty coffee, and moments worth slowing down for — served daily by the coast.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="#menu" className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-black/10 transition hover:bg-black/80">
                  View Menu →
                </a>
                <a href="#visit" className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-7 py-4 text-sm font-semibold text-black shadow-sm transition hover:bg-white/70">
                  Visit Us Today
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-4 text-sm text-black/55">
                <span>🕒 Open 7 days · 6am–1pm</span>
                <span>📍 Mooloolaba, QLD</span>
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] bg-white p-3 shadow-2xl shadow-black/10">
                <img
                  src="https://images.unsplash.com/photo-1533777324565-a040eb52fac1?q=80&w=1400&auto=format&fit=crop"
                  alt="Beachside brunch table"
                  className="h-[560px] w-full rounded-[1.5rem] object-cover"
                />
              </div>
              <div className="absolute -bottom-6 left-8 rounded-3xl bg-white/95 p-5 shadow-xl shadow-black/10 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-black/45">Signature mood</p>
                <p className="mt-1 text-lg font-semibold">Coffee · Brunch · Coast</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-14">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-black/40">More than coffee</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] md:text-5xl">It’s a moment.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-black/60">
              Backstreet Café is where mornings feel lighter, brunch feels indulgent, and every detail is crafted to elevate your experience — from the first sip to the last bite.
            </p>
          </div>
        </section>

        <section className="px-6 py-10">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
            {features.map((item) => (
              <div key={item.title} className="rounded-[1.75rem] border border-black/5 bg-white p-8 shadow-sm">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#efe6d9] text-xl">{item.icon}</div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 leading-7 text-black/60">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="menu" className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-black/40">Food experience</p>
                <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.03em] md:text-5xl">Crafted to be seen. Made to be remembered.</h2>
              </div>
              <p className="max-w-md leading-7 text-black/60">
                Fresh ingredients, bold flavours, and presentation that turns every meal into an experience.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-4">
              {menuImages.map((src, index) => (
                <div key={src} className={`overflow-hidden rounded-[1.75rem] bg-white shadow-sm ${index === 0 ? "md:col-span-2 md:row-span-2" : ""}`}>
                  <img src={src} alt="Backstreet Cafe menu item" className={`${index === 0 ? "h-[520px]" : "h-[250px]"} w-full object-cover transition duration-500 hover:scale-105`} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="experience" className="px-6 py-16">
          <div className="mx-auto grid max-w-7xl items-center gap-10 rounded-[2.5rem] bg-[#1b1b1b] p-6 text-white md:grid-cols-2 md:p-10">
            <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop" alt="Coffee lifestyle" className="h-[420px] w-full rounded-[2rem] object-cover" />
            <div className="p-4 md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/40">Mooloolaba lifestyle</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] md:text-5xl">Your go-to spot by the beach.</h2>
              <p className="mt-5 max-w-lg text-lg leading-8 text-white/65">
                Whether you're starting your morning, catching up with friends, or enjoying a slow weekend brunch — Backstreet Café is your place by the beach.
              </p>
              <a href="#visit" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black">
                Get Directions →
              </a>
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-black/40">Loved by locals</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] md:text-5xl">Good food. Good coffee. Good mornings.</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {reviews.map((review) => (
                <div key={review} className="rounded-[1.75rem] bg-white p-7 shadow-sm">
                  <div className="mb-4 text-black">★★★★★</div>
                  <p className="text-lg leading-8 text-black/65">“{review}”</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="visit" className="px-6 py-20">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] bg-white p-9 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-black/40">Visit us</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em]">Find us by the beach.</h2>
              <div className="mt-8 space-y-5 text-black/65">
                <p>📍 3/121 Mooloolaba Esplanade, Mooloolaba, QLD</p>
                <p>🕒 Open 7 days · 6am – 1pm</p>
                <p>☕ Specialty coffee, brunch, and beachside mornings.</p>
              </div>
              <form className="mt-8 space-y-3" onSubmit={handleSubscribe}>
                <label htmlFor="newsletter-email" className="block text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
                  Join our newsletter
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-full border border-black/10 bg-[#fbf8f3] px-5 py-3 text-sm outline-none ring-black/20 transition focus:ring"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Saving..." : "Subscribe"}
                  </button>
                </div>
                {subscribeStatus ? <p className="text-sm text-black/60">{subscribeStatus}</p> : null}
              </form>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a href="https://www.google.com/maps/search/?api=1&query=Backstreet+Cafe+Mooloolaba" target="_blank" rel="noreferrer" className="rounded-full bg-black px-6 py-3 text-center text-sm font-semibold text-white">
                  Get Directions
                </a>
                <a href="#menu" className="rounded-full border border-black/10 bg-[#fbf8f3] px-6 py-3 text-center text-sm font-semibold">
                  View Menu
                </a>
              </div>
            </div>
            <div className="min-h-[420px] overflow-hidden rounded-[2rem] bg-[#e9dfd2] shadow-sm">
              <iframe
                title="Backstreet Cafe Map"
                className="h-full min-h-[420px] w-full"
                loading="lazy"
                src="https://www.google.com/maps?q=Backstreet%20Cafe%20Mooloolaba&output=embed"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-black/50 md:flex-row">
          <p>© 2026 Backstreet Café. All rights reserved.</p>
          <p>Come for the coffee. Stay for the experience.</p>
        </div>
      </footer>
    </div>
  );
}
