import type { Metadata } from "next";
import Link from "next/link";
import { CoursesGrid, PhotoCard, type LandingCourse } from "@/components/landing-bits";
import { DestinationCard } from "@/components/landing-flags";

export const metadata: Metadata = {
  title: "Smart Teachers Play More — Teacher training that plays",
  description:
    "Erasmus+ teacher training weeks in Iceland, Spain, Finland and Lithuania — play-based learning, mindfulness, outdoor education and more.",
};

// The full 2026 catalog (minus placeholders). First six show by default,
// the rest unfold behind "See more".
const COURSES: LandingCourse[] = [
  { icon: "🎲", name: "Smart Teachers Play More", blurb: "Our flagship week: playful methods that turn any classroom into a place kids run to.", color: "from-amber-100 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/30" },
  { icon: "🌲", name: "Play More Outdoors", blurb: "Take the learning outside — games, movement and nature as your co-teacher.", color: "from-emerald-100 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/30" },
  { icon: "🧘", name: "Mindfulness & Meditation", blurb: "Calm classrooms start with calm teachers. Practical well-being tools that stick.", color: "from-violet-100 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/30" },
  { icon: "🤖", name: "AI in Education", blurb: "Use AI to plan less and teach more — hands-on, hype-free, classroom-ready.", color: "from-sky-100 to-cyan-50 dark:from-sky-950/50 dark:to-cyan-950/30" },
  { icon: "🗣️", name: "Inspiring Language Learners (CLIL)", blurb: "Content and language, learned together — through play, drama and real tasks.", color: "from-rose-100 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/30" },
  { icon: "🧩", name: "Special Needs & Inclusive Education", blurb: "Every learner in the game: practical inclusion strategies from Icelandic classrooms.", color: "from-lime-100 to-green-50 dark:from-lime-950/50 dark:to-green-950/30" },
  { icon: "🪁", name: "Play-Based Learning", blurb: "The research and the recipes: why play works and how to build lessons around it.", color: "from-cyan-100 to-sky-50 dark:from-cyan-950/50 dark:to-sky-950/30" },
  { icon: "🧸", name: "Kindergarten Play to Learn", blurb: "Early-years magic — play as the engine of language, motor skills and confidence.", color: "from-pink-100 to-rose-50 dark:from-pink-950/50 dark:to-rose-950/30" },
  { icon: "🎭", name: "Drama in Education", blurb: "Roles, stories and stagecraft that pull even the quietest students into the lesson.", color: "from-fuchsia-100 to-purple-50 dark:from-fuchsia-950/50 dark:to-purple-950/30" },
  { icon: "🍃", name: "Well-being & Stress Management", blurb: "Protect your energy: routines and boundaries that keep great teachers teaching.", color: "from-teal-100 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/30" },
  { icon: "☀️", name: "The Positive Teacher", blurb: "Positive psychology tools that change the weather in your classroom.", color: "from-yellow-100 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/30" },
  { icon: "🌍", name: "Eco-Explorers", blurb: "Sustainability education through curiosity, exploration and the outdoors.", color: "from-green-100 to-lime-50 dark:from-green-950/50 dark:to-lime-950/30" },
  { icon: "🚀", name: "Emerging Leaders", blurb: "For teachers stepping into leadership — influence, teams and change that lasts.", color: "from-indigo-100 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/30" },
  { icon: "🏫", name: "Icelandic Education System", blurb: "Inside Icelandic schools: study visits, structure and what makes them tick.", color: "from-blue-100 to-sky-50 dark:from-blue-950/50 dark:to-sky-950/30" },
  { icon: "📚", name: "Improve Your English", blurb: "A confidence week for teachers — real communication, not grammar drills.", color: "from-orange-100 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/30" },
  { icon: "🤝", name: "Intercultural Understanding", blurb: "Classrooms are global now — tools for empathy, identity and belonging.", color: "from-red-100 to-rose-50 dark:from-red-950/50 dark:to-rose-950/30" },
  { icon: "✨", name: "AI-Enhanced Erasmus+", blurb: "Plan, run and report your Erasmus+ project with AI as your assistant.", color: "from-purple-100 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/30" },
  { icon: "🔍", name: "Job Shadowing", blurb: "Spend the week inside a real Icelandic school, side by side with local teachers.", color: "from-stone-200 to-neutral-100 dark:from-stone-900/60 dark:to-neutral-900/40" },
];

// Drop real photos into public/landing/photos/ as photo-1.jpg … photo-6.jpg
// and these cards pick them up automatically; until then each renders a
// playful illustrated fallback.
const PHOTOS = [
  { src: "/landing/photos/photo-1.jpg", alt: "Teachers playing a group game", caption: "Warm-up games, day one", emoji: "🤸", gradient: "from-amber-200 to-orange-300" },
  { src: "/landing/photos/photo-2.jpg", alt: "Outdoor session in Icelandic nature", caption: "Class is outside today", emoji: "🏔️", gradient: "from-sky-200 to-cyan-300" },
  { src: "/landing/photos/photo-3.jpg", alt: "Teachers laughing during a workshop", caption: "Serious professional development", emoji: "😄", gradient: "from-rose-200 to-pink-300" },
  { src: "/landing/photos/photo-4.jpg", alt: "Golden Circle tour", caption: "Golden Circle, between sessions", emoji: "🌋", gradient: "from-emerald-200 to-teal-300" },
  { src: "/landing/photos/photo-5.jpg", alt: "Group photo of a course week", caption: "One week, lifelong colleagues", emoji: "📸", gradient: "from-violet-200 to-purple-300" },
  { src: "/landing/photos/photo-6.jpg", alt: "Hands-on classroom activity", caption: "Make, play, teach", emoji: "🎨", gradient: "from-lime-200 to-green-300" },
];

const STEPS = [
  { n: "1", title: "Pick your week", body: "Choose a course and a week that fits your school calendar — Erasmus+ KA1 friendly, with all the paperwork support you need." },
  { n: "2", title: "We plan everything", body: "Programme, venues, tours and tips for your stay. You get a day-by-day itinerary before you fly." },
  { n: "3", title: "Play, learn, bring it home", body: "A week of hands-on sessions with teachers from across Europe — and a bag of methods your students will feel on Monday." },
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

function SectionHeading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{children}</h2>
      <div className="mx-auto mt-3 h-1.5 w-24 rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-violet-400" aria-hidden />
      {sub && <p className="mt-4 text-neutral-600 dark:text-neutral-300">{sub}</p>}
    </div>
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
        <section className="relative overflow-hidden bg-gradient-to-b from-amber-50 via-white to-white dark:from-amber-950/20 dark:via-neutral-950 dark:to-neutral-950">
          <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-amber-200/60 blur-3xl dark:bg-amber-500/10" aria-hidden />
          <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-sky-200/60 blur-3xl dark:bg-sky-500/10" aria-hidden />
          <div className="pointer-events-none absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-rose-200/50 blur-3xl dark:bg-rose-500/10" aria-hidden />

          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-14 sm:pt-20 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <span className="inline-block rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                Erasmus+ KA1 teacher training · Iceland &amp; beyond
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
                Teachers learn best when they{" "}
                <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-violet-500 bg-clip-text text-transparent">play</span>.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-neutral-600 dark:text-neutral-300 lg:pr-6">
                One week. A new country. A classroom full of teachers from across Europe — and a
                suitcase of playful, practical methods your students will feel the Monday you’re back.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <CtaButton href="#courses">Explore the courses</CtaButton>
                <CtaButton href="https://www.smartteachersplaymore.com" variant="ghost">
                  smartteachersplaymore.com ↗
                </CtaButton>
              </div>

              {/* Sticker-style stats */}
              <div className="mt-10 flex flex-wrap justify-center gap-3 lg:justify-start">
                {[
                  ["890+ teachers in 2026", "bg-amber-100 text-amber-900 ring-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-800"],
                  ["25+ countries", "bg-sky-100 text-sky-900 ring-sky-300 dark:bg-sky-950/60 dark:text-sky-200 dark:ring-sky-800"],
                  ["20 course weeks", "bg-rose-100 text-rose-900 ring-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:ring-rose-800"],
                  ["4 destinations", "bg-violet-100 text-violet-900 ring-violet-300 dark:bg-violet-950/60 dark:text-violet-200 dark:ring-violet-800"],
                ].map(([label, cls]) => (
                  <span key={label} className={`-rotate-1 rounded-full px-4 py-1.5 text-sm font-bold ring-2 even:rotate-1 ${cls}`}>
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Photo collage */}
            <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-4 pt-4 lg:max-w-none">
              <PhotoCard {...PHOTOS[0]} tilt="-4deg" float className="mt-6" />
              <PhotoCard {...PHOTOS[1]} tilt="3deg" float />
              <PhotoCard {...PHOTOS[2]} tilt="2deg" float className="-mt-2" />
              <PhotoCard {...PHOTOS[3]} tilt="-3deg" float className="mt-4" />
              <span className="pointer-events-none absolute -left-6 top-0 -rotate-12 text-4xl" aria-hidden>⭐</span>
              <span className="pointer-events-none absolute -right-4 bottom-6 rotate-12 text-4xl" aria-hidden>🎈</span>
            </div>
          </div>
        </section>

        {/* Photo strip */}
        <section aria-label="Moments from our weeks" className="border-y border-neutral-200 bg-sky-50/60 py-10 dark:border-neutral-800 dark:bg-sky-950/20">
          <div className="mx-auto max-w-6xl overflow-x-auto px-6">
            <div className="flex min-w-max items-start gap-5 pb-2">
              {PHOTOS.map((p, i) => (
                <PhotoCard key={p.src} {...p} tilt={i % 2 ? "2deg" : "-2deg"} className="w-44 shrink-0 sm:w-52" />
              ))}
            </div>
          </div>
        </section>

        {/* Courses */}
        <section id="courses" className="mx-auto max-w-6xl px-6 py-16">
          <SectionHeading sub="Hands-on from minute one. No slide marathons — you’ll be up, moving, playing and planning.">
            Courses that don’t feel like courses
          </SectionHeading>
          <CoursesGrid courses={COURSES} />
        </section>

        {/* Destinations */}
        <section id="destinations" className="border-y border-neutral-200 bg-amber-50/50 dark:border-neutral-800 dark:bg-amber-950/10">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <SectionHeading sub="Every destination runs the same playful programme — pick the adventure that fits.">
              Four playgrounds to choose from
            </SectionHeading>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <DestinationCard code="is" name="Iceland" blurb="Our home base — Reykjavík, golden circle, northern lights." gradient="from-sky-500 to-indigo-600" />
              <DestinationCard code="es" name="Spain" blurb="Sunshine weeks with the same playful programme." gradient="from-amber-400 to-red-500" />
              <DestinationCard code="fi" name="Finland" blurb="Inside the world’s most admired school system." gradient="from-blue-500 to-cyan-500" />
              <DestinationCard code="lt" name="Lithuania" blurb="New perspectives in the Baltics." gradient="from-emerald-500 to-lime-500" />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl px-6 py-16">
          <SectionHeading>How a week with us works</SectionHeading>
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
        <section id="brands" className="border-y border-neutral-200 bg-violet-50/50 dark:border-neutral-800 dark:bg-violet-950/10">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <SectionHeading sub="Whether you’re coming to us or heading out into the world — the play comes with you.">
              Two directions, one idea
            </SectionHeading>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-8 shadow-sm dark:border-sky-900 dark:from-sky-950/40 dark:to-neutral-900">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">For European teachers</p>
                <h3 className="mt-2 text-2xl font-extrabold">Come play in Iceland</h3>
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
                  Erasmus+ funded training weeks in Iceland, Spain, Finland and Lithuania. Courses,
                  culture and a golden-circle tour — everything organised for you and your colleagues.
                </p>
                <a href="https://www.smartteachersplaymore.com" className="mt-5 inline-block text-sm font-semibold text-sky-700 hover:underline dark:text-sky-400">
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
                <a href="https://endurmenntunarferdir.is" className="mt-5 inline-block text-sm font-semibold text-violet-700 hover:underline dark:text-violet-400">
                  endurmenntunarferdir.is ↗
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to play more?</h2>
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
