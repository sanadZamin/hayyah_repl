import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowRight,
  ChevronRight,
  Facebook,
  Instagram,
  LayoutGrid,
  Linkedin,
  Percent,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const serif = "Georgia, 'Times New Roman', serif";

/** Marketing palette — teal accent + charcoal promise band */
const L = {
  blue: "#0066FF",
  teal: "#3dd9c0",
  tealDeep: "#2bc4aa",
  charcoal: "#252525",
  grey: "#f0f2f4",
} as const;

const HERO_BG =
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=2000&q=85";

const COLLECTION = [
  {
    title: "Artisan Cleaning",
    desc: "Editorial-grade care for every surface, tailored to your home.",
    img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=720&q=80",
  },
  {
    title: "Master Repair",
    desc: "Skilled maintenance and fixes, scheduled around your life.",
    img: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=720&q=80",
  },
  {
    title: "Valet & Bell",
    desc: "Concierge-style coordination for arrivals, errands, and handoffs.",
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=720&q=80",
  },
  {
    title: "Architectural Finishes",
    desc: "Care for walls, fixtures, and details that complete the room.",
    img: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=720&q=80",
  },
] as const;

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const APP_STORE_BADGE_IMG =
  "https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83";
const GOOGLE_PLAY_BADGE_IMG =
  "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png";

const STORE_BADGE_BOX =
  "flex h-[52px] w-[184px] flex-none shrink-0 items-center justify-center border-0 bg-transparent p-0 shadow-none outline-none ring-0 transition sm:h-[56px] sm:w-[196px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/40 focus-visible:ring-offset-0";
const STORE_BADGE_APP_IMG_CLASS =
  "block max-h-full max-w-full border-0 object-contain object-center shadow-none outline-none ring-0 select-none";
const STORE_BADGE_PLAY_IMG_CLASS = `${STORE_BADGE_APP_IMG_CLASS} origin-center scale-[1.02] sm:scale-[1.03]`;

function StoreBadgeRow({
  iosUrl,
  playUrl,
  align = "center",
  className = "",
}: {
  iosUrl: string;
  playUrl: string;
  align?: "center" | "start";
  className?: string;
}) {
  const justify = align === "start" ? "justify-start" : "justify-center";

  return (
    <div className={`flex flex-wrap items-center gap-3 sm:gap-4 ${justify} ${className}`}>
      {iosUrl ? (
        <a
          href={iosUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${STORE_BADGE_BOX} hover:opacity-95`}
          aria-label="Download on the App Store"
        >
          <img src={APP_STORE_BADGE_IMG} alt="" className={STORE_BADGE_APP_IMG_CLASS} />
        </a>
      ) : (
        <span className={`${STORE_BADGE_BOX} opacity-40 grayscale`} title="Set VITE_IOS_APP_STORE_URL to enable the link">
          <img src={APP_STORE_BADGE_IMG} alt="App Store" className={STORE_BADGE_APP_IMG_CLASS} />
        </span>
      )}
      {playUrl ? (
        <a
          href={playUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${STORE_BADGE_BOX} hover:opacity-95`}
          aria-label="Get it on Google Play"
        >
          <img src={GOOGLE_PLAY_BADGE_IMG} alt="" className={STORE_BADGE_PLAY_IMG_CLASS} />
        </a>
      ) : (
        <span className={`${STORE_BADGE_BOX} opacity-40 grayscale`} title="Set VITE_PLAY_STORE_URL to enable the link">
          <img src={GOOGLE_PLAY_BADGE_IMG} alt="Google Play" className={STORE_BADGE_PLAY_IMG_CLASS} />
        </span>
      )}
    </div>
  );
}

/**
 * Public marketing landing inside the SPA.
 * Route: `/welcome` — signed-in users are sent to the dashboard.
 */
export default function WelcomeLanding() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [heroQuery, setHeroQuery] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const iosStoreUrl = String(import.meta.env.VITE_IOS_APP_STORE_URL ?? "").trim();
  const playStoreUrl = String(import.meta.env.VITE_PLAY_STORE_URL ?? "").trim();

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-sm text-slate-500">Redirecting…</p>
      </div>
    );
  }

  const goLogin = () => setLocation("/login");
  const advisor = () => {
    if (heroQuery.trim()) scrollToId("collection");
    else goLogin();
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-white text-slate-900 antialiased"
      style={{ fontFamily: "'Plus Jakarta Sans', var(--font-sans, Inter, sans-serif)" }}
    >
      {/* —— Header: centered logo, auth on the right —— */}
      <header className="sticky top-0 z-50 border-b border-slate-100/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto grid max-w-6xl grid-cols-3 items-center gap-2 px-4 py-4 sm:gap-4 sm:px-6">
          <div className="min-w-0" aria-hidden />
          <div className="flex justify-center">
            <button type="button" onClick={() => scrollToId("hero")} className="border-0 bg-transparent p-0 cursor-pointer" aria-label="Hayyah home">
              <img src={`${base}/hayyah-logo.png`} alt="Hayyah" className="h-8 w-auto sm:h-9" />
            </button>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
            <button type="button" onClick={goLogin} className="text-sm font-semibold text-slate-700 hover:text-slate-900 border-0 bg-transparent cursor-pointer whitespace-nowrap">
              Log In
            </button>
            <button
              type="button"
              onClick={goLogin}
              className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-900 shadow-sm transition hover:opacity-95 sm:px-5 sm:text-sm sm:font-semibold sm:normal-case sm:tracking-normal"
              style={{ background: L.teal }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* —— Hero —— */}
        <section id="hero" className="relative scroll-mt-16 min-h-[min(78vh,640px)] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${HERO_BG}')` }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/88 via-white/75 to-white/92" aria-hidden />
          <div className="relative z-10 mx-auto flex min-h-[min(78vh,640px)] max-w-3xl flex-col justify-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pb-24 sm:pt-20">
            <h1
              className="text-4xl font-semibold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl md:text-[3.1rem]"
              style={{ fontFamily: serif }}
            >
              Your Home, Curated.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              A calmer way to book, manage, and elevate home care — with advisors who treat your space like their own.
            </p>

            <div className="mx-auto mt-10 w-full max-w-xl">
              <div className="flex overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200/80">
                <div className="flex min-w-0 flex-1 items-center gap-2 pl-4 text-slate-400">
                  <Search className="h-5 w-5 shrink-0" aria-hidden />
                  <input
                    type="search"
                    value={heroQuery}
                    onChange={(e) => setHeroQuery(e.target.value)}
                    placeholder="Describe what you need…"
                    className="min-h-14 w-full border-0 bg-transparent py-3 pr-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    aria-label="Describe what you need"
                  />
                </div>
                <button
                  type="button"
                  onClick={advisor}
                  className="shrink-0 px-3 text-[10px] font-bold uppercase leading-tight tracking-[0.1em] text-slate-900 transition hover:opacity-95 sm:px-6 sm:text-xs sm:leading-none sm:tracking-[0.14em]"
                  style={{ background: L.teal }}
                >
                  Personal advisor
                </button>
              </div>
            </div>

            <div className="mx-auto mt-10 max-w-xl">
              <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Get the app</p>
              <StoreBadgeRow iosUrl={iosStoreUrl} playUrl={playStoreUrl} />
            </div>
          </div>
        </section>

        {/* —— The Collection —— */}
        <section id="collection" className="scroll-mt-16 border-t border-slate-100 bg-white px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">The Collection</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: serif }}>
                Services, composed for you
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
                Choose the mix that fits your home — each category is crafted to expand or simplify as your needs change.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {COLLECTION.map((item) => (
                <article
                  key={item.title}
                  className="group flex min-h-0 flex-col overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200/70 transition hover:shadow-lg"
                >
                  <div className="relative aspect-[4/5] min-h-[200px] overflow-hidden bg-slate-200">
                    <img
                      src={item.img}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h3 className="text-lg font-bold leading-snug text-slate-900">{item.title}</h3>
                    <p className="mt-2 min-h-[3rem] flex-1 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                    <button
                      type="button"
                      onClick={() => scrollToId("collection")}
                      className="mt-4 inline-flex items-center gap-1 self-start text-sm font-semibold border-0 bg-transparent cursor-pointer"
                      style={{ color: L.blue }}
                    >
                      Learn more
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* —— The Curator's Promise —— */}
        <section id="promise" className="scroll-mt-16 px-4 py-16 text-white sm:px-6 sm:py-20" style={{ background: L.charcoal }}>
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.75rem]" style={{ fontFamily: serif }}>
              The Curator&apos;s Promise
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-white/70 sm:text-base">
              Three principles we return to on every visit — clarity, trust, and pricing you can understand.
            </p>

            <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white">
                  <LayoutGrid className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="text-lg font-bold">Curated solutions</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  Recommendations tailored to your home — not one-size packages pushed on everyone.
                </p>
              </div>
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white">
                  <Users className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="text-lg font-bold">Trusted partners</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  Vetted professionals with clear profiles, so you always know who is at your door.
                </p>
              </div>
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white">
                  <Percent className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="text-lg font-bold">No hidden fees</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  Upfront estimates and transparent add-ons — no surprises on the invoice.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* —— Your Active Curation —— */}
        <section id="active" className="scroll-mt-16 px-4 py-16 sm:px-6 sm:py-20" style={{ background: L.grey }}>
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl" style={{ fontFamily: serif }}>
              Your active curation
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-600 sm:text-base">A glimpse of how ongoing care looks inside Hayyah.</p>

            <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-7">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <img
                        src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=96&h=96&q=80"
                        alt=""
                        className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-100"
                      />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deep restoration</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">Elena Voss</p>
                        <span
                          className="mt-2 inline-block rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{ borderColor: L.tealDeep, color: L.tealDeep, background: "rgba(61,217,192,0.12)" }}
                        >
                          Hand picked
                        </span>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">$180</p>
                  </div>
                  <p className="mt-5 text-sm text-slate-600">Thursday, 9:00 AM — 1:30 PM</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button className="rounded-xl border-0 font-semibold text-slate-900 shadow-sm" style={{ background: L.teal }} onClick={goLogin}>
                      Reschedule
                    </Button>
                    <Button variant="outline" className="rounded-xl border-slate-200 bg-white font-semibold">
                      Direct message
                    </Button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Auto renew curation</p>
                <div className="mt-4 space-y-4">
                  {[
                    { title: "Weekly linen refresh", when: "Renews every Monday" },
                    { title: "Seasonal HVAC tune-up", when: "Renews quarterly" },
                  ].map((row) => (
                    <div
                      key={row.title}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{row.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{row.when}</p>
                      </div>
                      <button
                        type="button"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 text-white transition hover:opacity-90"
                        style={{ background: L.blue }}
                        aria-label={`Open ${row.title}`}
                      >
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={goLogin}
                  className="mt-6 w-full rounded-xl border-2 border-slate-900 bg-transparent py-3 text-sm font-bold uppercase tracking-wide text-slate-900 transition hover:bg-slate-900 hover:text-white"
                >
                  View all active curations
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* —— Footer —— */}
      <footer id="about" className="scroll-mt-16 mt-auto border-t border-slate-200 px-4 py-14 sm:px-6" style={{ background: L.grey }}>
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-4">
              <img src={`${base}/images/hayyah-wordmark-blue.png`} alt="Hayyah" className="h-8 w-auto" />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
                Hayyah curates home services with the same care you bring to the rest of your life — clear, calm, and
                considered.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://www.facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="https://www.linkedin.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-6">
                <StoreBadgeRow iosUrl={iosStoreUrl} playUrl={playStoreUrl} align="start" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:col-span-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">About</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {["Our story", "Careers", "Press"].map((label) => (
                    <li key={label}>
                      <button type="button" className="border-0 bg-transparent p-0 text-left hover:text-slate-900 cursor-pointer">
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Services</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {COLLECTION.slice(0, 4).map((item) => (
                    <li key={item.title}>
                      <button type="button" className="border-0 bg-transparent p-0 text-left hover:text-slate-900 cursor-pointer" onClick={() => scrollToId("collection")}>
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Support</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {["Help center", "FAQ", "Contact"].map((label) => (
                    <li key={label}>
                      <button type="button" className="border-0 bg-transparent p-0 text-left hover:text-slate-900 cursor-pointer">
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>
                    <a href="mailto:hello@hayyah.com" className="hover:text-slate-900">
                      hello@hayyah.com
                    </a>
                  </li>
                  <li>
                    <a href="tel:+15551234567" className="hover:text-slate-900">
                      +1 (555) 123-4567
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-8 text-xs text-slate-500 sm:flex-row">
            <p>© {new Date().getFullYear()} Hayyah. All rights reserved.</p>
            <div className="flex gap-6">
              <button type="button" className="border-0 bg-transparent p-0 hover:text-slate-800 cursor-pointer">
                Terms
              </button>
              <button type="button" className="border-0 bg-transparent p-0 hover:text-slate-800 cursor-pointer">
                Privacy
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
