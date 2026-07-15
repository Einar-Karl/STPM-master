import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Smart Teachers Play More — Teacher training that plays",
  description:
    "Erasmus+ teacher training weeks in Iceland, Spain, Finland and Lithuania — play-based learning, mindfulness, outdoor education and more.",
};

const COURSES = [
  {
    icon: "🎲",
    name: "Smart Teachers Play More",
    blurb: "Our flagship week: playful methods that turn any classroom into a place kids run to.",
    color: "from-amber-100 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/30",
  },
  {
    icon: "🌲",
    name: "Play More Outdoors",
    blurb: "Take the learning outside — games, movement and nature as your co-teacher.",
    color: "from-emerald-100 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/30",
  },
  {
    icon: "🧘",
    name: "Mindfulness & Meditation",
    blurb: "Calm classrooms start with calm teachers. Practical well-being tools that stick.",
    color: "from-violet-100 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/30",
  },
  {
    icon: "🤖",
    name: "AI in Education",
    blurb: "Use AI to plan less and teach more — hands-on, hype-free, classroom-ready.",
    color: "from-sky-100 to-cyan-50 dark:from-sky-950/50 dark:to-cyan-950/30",
  },
  {
    icon: "🗣️",
    name: "Inspiring Language Learners (CLIL)",
    blurb: "Content and language, learned together — through play, drama and real tasks.",
    color: "from-rose-100 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/30",
  },
  {
    icon: "🧩",
    name: "Special Needs & Inclusive Education",
    blurb: "Every learner in the game: practical inclusion strategies from Icelandic classrooms.",
    color: "from-lime-100 to-green-50 dark:from-lime-950/50 dark:to-green-950/30",
  },
];

const DESTINATIONS = [
  { flag: "🇮🇸", name: "Iceland", blurb: "Our home base — Reykjavík, golden circle, northern lights." },
  { flag: "🇪🇸", name: "Spain", blurb: "Sunshine weeks with the same playful programme." },
  { flag: "🇫🇮", name: "Finland", blurb: "Inside the world's most admired school system." },
  { flag: "🇱🇹", name: "Lithuania", blurb: "New perspectives in the Baltics." },
];

const STEPS = [
  {
    n: "1",
    title: "Pick your week",
    body: "Choose a course and a week that fits your school calendar — Erasmus+ KA1 friendly, with all the paperwork support you need.",
  },
  {
    n: "2",
    title: "We plan everything",
    body: "Programme, venues, tours and tips for your stay. You get a day-by-day itinerary before you fly.",
  },
  {
    n: "3",
    title: "Play, learn, bring it home",
    body: "A week of hands-on sessions with teachers from across Europe — and a bag of methods your students will feel on Monday.",
  },
];

function CtaButton({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "ghost" }) {
  const cls =
    variant === "primary"
      ? "bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      : "border border-neutral-300 text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800";
  return (
    <Link href={href} className={`inline-block rounded-full px-6 py-3 text-sm font-semibold transition-colors ${cls}`}>
      {children}
    </Link>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Sticky nav */}
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/80 backdrop-blur dark:border-neutral-800/70 dark:bg-neutral-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <a href="#top" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-base">
              🎈
            </span>
            <span className="text-sm font-bold tracking-tight sm:text-base">Smart Teachers Play More</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-300 md:flex">
            <a href="#courses" className="hover:text-neutral-900 dark:hover:text-white">Courses</a>
            <a href="#destinations" className="hover:text-neutral-900 dark:hover:text-white">Destinations</a>
            <a href="#how" className="hover:text-neutral-900 dark:hover:text-white">How it works</a>
            <a href="#brands" className="hover:text-neutral-900 dark:hover:text-white">For Icelandic schools</a>
          </nav>
          <Link
            href="/login"
            className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Staff sign in
          </Link>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-500/10" aria-hidden />
          <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-sky-200/50 blur-3xl dark:bg-sky-500/10" aria-hidden />
          <div className="pointer-events-none absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-500/10" aria-hidden />

          <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24 text-center">
            <span className="inline-block rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              Erasmus+ KA1 teacher training · Iceland & beyond
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Teachers learn best when they{" "}
              <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-violet-500 bg-clip-text text-transparent">play</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-300">
              One week. A new country. A classroom full of teachers from across Europe — and a
              suitcase of playful, practical methods your students will feel the Monday you’re back.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <CtaButton href="#courses">Explore the courses</CtaButton>
              <CtaButton href="https://www.smartteachersplaymore.com" variant="ghost">
                Visit smartteachersplaymore.com ↗
              </CtaButton>
            </div>

            {/* Stat band — real numbers from the 2026 programme */}
            <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["890+", "teachers in 2026"],
                ["25+", "countries"],
                ["20", "course weeks"],
                ["4", "destinations"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl border border-neutral-200 bg-white/70 px-4 py-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
                  <dt className="sr-only">{l}</dt>
                  <dd className="text-2xl font-extrabold sm:text-3xl">{v}</dd>
                  <dd className="mt-0.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Courses */}
        <section id="courses" className="mx-auto max-w-6xl px-6 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Courses that don’t feel like courses</h2>
            <p className="mt-3 text-neutral-600 dark:text-neutral-300">
              Hands-on from minute one. No slide marathons — you’ll be up, moving, playing and planning.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COURSES.map((c) => (
              <div
                key={c.name}
                className={`rounded-3xl border border-neutral-200 bg-gradient-to-br p-6 shadow-sm transition-transform hover:-translate-y-1 dark:border-neutral-800 ${c.color}`}
              >
                <span className="text-3xl" aria-hidden>{c.icon}</span>
                <h3 className="mt-3 text-lg font-bold">{c.name}</h3>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{c.blurb}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
            …plus Drama in Education, Well-being & Stress Management, Kindergarten Play to Learn,
            The Positive Teacher, Eco-Explorers and more — 20 courses in all.
          </p>
        </section>

        {/* Destinations */}
        <section id="destinations" className="border-y border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Four playgrounds to choose from</h2>
              <p className="mt-3 text-neutral-600 dark:text-neutral-300">
                Every destination runs the same playful programme — pick the adventure that fits.
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {DESTINATIONS.map((d) => (
                <div key={d.name} className="rounded-3xl border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  <span className="text-4xl" aria-hidden>{d.flag}</span>
                  <h3 className="mt-3 text-lg font-bold">{d.name}</h3>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{d.blurb}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl px-6 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">How a week with us works</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-lg font-extrabold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Two brands */}
        <section id="brands" className="border-y border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Two directions, one idea</h2>
              <p className="mt-3 text-neutral-600 dark:text-neutral-300">
                Whether you’re coming to us or heading out into the world — the play comes with you.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-8 shadow-sm dark:border-sky-900 dark:from-sky-950/40 dark:to-neutral-900">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">For European teachers</p>
                <h3 className="mt-2 text-2xl font-extrabold">Come play in Iceland</h3>
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
                  Erasmus+ funded training weeks in Iceland, Spain, Finland and Lithuania. Courses,
                  culture and a golden-circle tour — everything organised for you and your colleagues.
                </p>
                <a
                  href="https://www.smartteachersplaymore.com"
                  className="mt-5 inline-block text-sm font-semibold text-sky-700 hover:underline dark:text-sky-400"
                >
                  smartteachersplaymore.com ↗
                </a>
              </div>
              <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-8 shadow-sm dark:border-violet-900 dark:from-violet-950/40 dark:to-neutral-900">
                <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Fyrir íslenska skóla</p>
                <h3 className="mt-2 text-2xl font-extrabold">Námsferðir fyrir kennarahópa</h3>
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
                  Skipulagðar endurmenntunar- og námsferðir fyrir íslenska kennara og skólahópa —
                  fagleg dagskrá, skólaheimsóknir og menningarupplifun, allt frá A til Ö.
                </p>
                <a
                  href="https://endurmenntunarferdir.is"
                  className="mt-5 inline-block text-sm font-semibold text-violet-700 hover:underline dark:text-violet-400"
                >
                  endurmenntunarferdir.is ↗
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ready to play more?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-neutral-600 dark:text-neutral-300">
            Find your course and week on our main site, or sign in if you’re part of the STPM team.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <CtaButton href="https://www.smartteachersplaymore.com">Find your course ↗</CtaButton>
            <CtaButton href="/login" variant="ghost">Staff sign in</CtaButton>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-neutral-500 dark:text-neutral-400">
          <p>Smart Teachers Play More · Reykjavík, Iceland</p>
          <div className="flex gap-5">
            <a href="https://www.smartteachersplaymore.com" className="hover:underline">smartteachersplaymore.com</a>
            <a href="https://endurmenntunarferdir.is" className="hover:underline">endurmenntunarferdir.is</a>
            <Link href="/login" className="hover:underline">Staff sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
