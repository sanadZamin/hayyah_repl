import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Facebook,
  Instagram,
  Linkedin,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/** Marketing palette aligned to product reference */
const L = {
  blue: "#0066FF",
  teal: "#40E0D0",
  grey: "#F5F5F5",
} as const;

const SERVICE_CARDS = [
  {
    title: "Cleaning",
    desc: "Deep, routine, and editorial dusting.",
    img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "Repairing",
    desc: "Artisan maintenance and fixes.",
    img: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "Laundry",
    desc: "Valet wash, fold, and pressing.",
    img: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "Painting",
    desc: "Expert strokes for your gallery walls.",
    img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=640&q=80",
  },
] as const;

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Official marketing badge artwork (Apple / Google). */
const APP_STORE_BADGE_IMG =
  "https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83";
const GOOGLE_PLAY_BADGE_IMG =
  "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png";

/**
 * Fixed hit area only — no background, shadow, or radius so nothing reads as a
 * frame around the official badge artwork (global `*` border-color is cleared too).
 */
const STORE_BADGE_BOX =
  "flex h-[52px] w-[184px] flex-none shrink-0 items-center justify-center border-0 bg-transparent p-0 shadow-none outline-none ring-0 transition sm:h-[56px] sm:w-[196px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/40 focus-visible:ring-offset-0";
const STORE_BADGE_APP_IMG_CLASS =
  "block max-h-full max-w-full border-0 object-contain object-center shadow-none outline-none ring-0 select-none";
/** Tiny scale — Google’s PNG has a bit more built-in padding than Apple’s badge. */
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
  const explore = () => {
    if (heroQuery.trim()) scrollToId("services");
    else goLogin();
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-white text-slate-900 antialiased"
      style={{ fontFamily: "'Plus Jakarta Sans', var(--font-sans, Inter, sans-serif)" }}
    >
      {/* —— Header —— */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => scrollToId("hero")}
            className="flex shrink-0 items-center border-0 bg-transparent p-0 cursor-pointer"
            aria-label="Hayyah home"
          >
            <img src={`${base}/hayyah-logo.png`} alt="Hayyah" className="h-8 w-auto sm:h-9" />
          </button>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex" aria-label="Primary">
            <button
              type="button"
              className="border-0 bg-transparent cursor-pointer pb-0.5 text-slate-900"
              style={{ boxShadow: `inset 0 -2px 0 0 ${L.blue}` }}
              onClick={() => scrollToId("services")}
            >
              Services
            </button>
            <button type="button" className="hover:text-slate-900 border-0 bg-transparent cursor-pointer" onClick={() => scrollToId("standard")}>
              How it Works
            </button>
            <button type="button" className="hover:text-slate-900 border-0 bg-transparent cursor-pointer" onClick={() => scrollToId("about")}>
              About Us
            </button>
            <button type="button" className="hover:text-slate-900 border-0 bg-transparent cursor-pointer" onClick={goLogin}>
              Login
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" className="md:hidden text-slate-600" onClick={goLogin}>
              Login
            </Button>
            <button
              type="button"
              onClick={goLogin}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:opacity-95 sm:px-5"
              style={{ background: L.teal }}
            >
              Book a Service
            </button>
          </div>
        </div>
        <nav
          className="flex border-t border-slate-100 px-4 py-2.5 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Sections"
        >
          <div className="flex min-w-full justify-center gap-5 overflow-x-auto text-sm font-medium text-slate-600">
            <button type="button" className="shrink-0 border-0 bg-transparent pb-0.5 text-slate-900 cursor-pointer" style={{ boxShadow: `inset 0 -2px 0 0 ${L.blue}` }} onClick={() => scrollToId("services")}>
              Services
            </button>
            <button type="button" className="shrink-0 border-0 bg-transparent cursor-pointer" onClick={() => scrollToId("standard")}>
              How it Works
            </button>
            <button type="button" className="shrink-0 border-0 bg-transparent cursor-pointer" onClick={() => scrollToId("about")}>
              About
            </button>
          </div>
        </nav>
      </header>

      <main>
        {/* —— Hero —— */}
        <section id="hero" className="scroll-mt-20 px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl md:text-[3.25rem]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Your Home, Curated to Perfection
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Experience the pristine standard in home care. From meticulous cleaning to bespoke chef services, we treat your sanctuary with editorial precision.
            </p>

            <div className="mx-auto mt-10 flex max-w-xl items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-1 items-center gap-2 pl-4 text-slate-400">
                <Search className="h-5 w-5 shrink-0" aria-hidden />
                <input
                  type="search"
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder="What service are you looking for?"
                  className="min-h-12 w-full border-0 bg-transparent py-3 pr-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  aria-label="Search services"
                />
              </div>
              <button
                type="button"
                onClick={explore}
                className="shrink-0 px-5 text-sm font-semibold text-slate-900 transition hover:opacity-95 sm:px-6"
                style={{ background: L.teal }}
              >
                Explore
              </button>
            </div>

            <div className="mx-auto mt-10 max-w-xl">
              <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Get the app</p>
              <StoreBadgeRow iosUrl={iosStoreUrl} playUrl={playStoreUrl} />
            </div>
          </div>
        </section>

        {/* —— Curated Services —— */}
        <section id="services" className="scroll-mt-20 border-t border-slate-100 bg-white px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: L.teal }}>
                  The Portfolio
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Curated Services</h2>
              </div>
              <button
                type="button"
                onClick={() => scrollToId("services")}
                className="flex items-center gap-1 self-start text-sm font-semibold border-0 bg-transparent cursor-pointer sm:self-auto"
                style={{ color: L.blue }}
              >
                View All Collections
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {SERVICE_CARDS.map((s) => (
                <article
                  key={s.title}
                  className="group flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                    <img src={s.img} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* —— The Hayyah Standard —— */}
        <section id="standard" className="scroll-mt-20 px-4 py-16 text-white sm:px-6 sm:py-20" style={{ background: L.blue }}>
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">The Philosophy</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">The Hayyah Standard</h2>

            <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              <div className="flex flex-col items-start">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <Shield className="h-6 w-6 text-white" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="text-lg font-bold">Trusted Pros</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/85">
                  Every specialist is vetted through rigorous background checks and skill assessments before they ever step through your door.
                </p>
              </div>
              <div className="flex flex-col items-start">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <CalendarDays className="h-6 w-6 text-white" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="text-lg font-bold">Scheduled Services</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/85">
                  Book one-off deep cleans or set up weekly routines. Your calendar, your cadence — we adapt to your lifestyle.
                </p>
              </div>
              <div className="flex flex-col items-start">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <Sparkles className="h-6 w-6 text-white" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="text-lg font-bold">Pristine Quality</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/85">
                  We don&apos;t just clean; we curate. Expect editorial-level attention to detail in every corner of your home.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* —— Dashboard preview —— */}
        <section id="preview" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20" style={{ background: L.grey }}>
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Booking</p>
              <div className="mt-4 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <img
                      src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=96&h=96&q=80"
                      alt=""
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-slate-100"
                    />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deep Cleaning</p>
                      <p className="mt-1 font-semibold text-slate-900">Marcus Thorne</p>
                      <span className="mt-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: L.blue }}>
                        Confirmed
                      </span>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-slate-900">$180.00</p>
                </div>
                <p className="mt-4 text-sm text-slate-600">Tomorrow, 10:00 AM — 2:00 PM</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-900 border-0 cursor-pointer" style={{ background: L.teal }}>
                    Reschedule
                  </button>
                  <Button variant="outline" className="rounded-lg border-slate-200 bg-white">
                    Message Pro
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick Re-order</p>
              <div className="mt-4 space-y-4">
                {[
                  { title: "Valet Wash & Fold", when: "Last ordered 3 days ago" },
                  { title: "AC Filter Change", when: "Last ordered 2 weeks ago" },
                ].map((row) => (
                  <div key={row.title} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{row.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{row.when}</p>
                    </div>
                    <button
                      type="button"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 text-white cursor-pointer transition hover:opacity-90"
                      style={{ background: L.blue }}
                      aria-label={`Re-order ${row.title}`}
                    >
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* —— Footer —— */}
      <footer id="about" className="scroll-mt-20 mt-auto border-t border-slate-200 px-4 py-14 sm:px-6" style={{ background: L.grey }}>
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-4">
              <img src={`${base}/images/hayyah-wordmark-blue.png`} alt="Hayyah" className="h-8 w-auto" />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
                Redefining home services with a commitment to excellence, transparency, and the art of living well.
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

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Company</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {["About Us", "Careers", "Press", "Privacy Policy"].map((label) => (
                    <li key={label}>
                      <button
                        type="button"
                        className="border-0 bg-transparent p-0 text-left hover:text-slate-900 cursor-pointer"
                        onClick={() => {
                          if (label === "About Us") scrollToId("about");
                        }}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Services</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {["House Cleaning", "Maintenance", "Personal Chef", "Concierge"].map((label) => (
                    <li key={label}>
                      <button type="button" className="border-0 bg-transparent p-0 text-left hover:text-slate-900 cursor-pointer" onClick={() => scrollToId("services")}>
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
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
                  <li>
                    <button type="button" className="border-0 bg-transparent p-0 hover:text-slate-900 cursor-pointer">
                      FAQ
                    </button>
                  </li>
                  <li>
                    <button type="button" className="border-0 bg-transparent p-0 hover:text-slate-900 cursor-pointer">
                      Contact
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-8 text-xs text-slate-500 sm:flex-row">
            <p>© {new Date().getFullYear()} Hayyah Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <button type="button" className="border-0 bg-transparent p-0 hover:text-slate-800 cursor-pointer">
                Terms of Service
              </button>
              <button type="button" className="border-0 bg-transparent p-0 hover:text-slate-800 cursor-pointer">
                Cookie Policy
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
