"use client";

import { useState } from "react";

/**
 * Polaroid-style photo card. Tries to load the image from /landing/photos/;
 * until real photos are dropped into public/landing/photos/ it renders a
 * playful illustrated fallback, so the page never shows a broken image.
 */
export function PhotoCard({
  src,
  alt,
  caption,
  emoji,
  gradient,
  tilt = "0deg",
  className = "",
  float = false,
}: {
  src: string;
  alt: string;
  caption: string;
  emoji: string;
  gradient: string;
  tilt?: string;
  className?: string;
  float?: boolean;
}) {
  const [broken, setBroken] = useState(false);

  return (
    <figure
      style={{ "--tilt": tilt, transform: `rotate(${tilt})` } as React.CSSProperties}
      className={`rounded-xl bg-white p-2 pb-3 shadow-lg ring-1 ring-neutral-200 transition-transform hover:z-10 hover:scale-105 hover:!rotate-0 dark:bg-neutral-100 ${
        float ? "animate-float-slow" : ""
      } ${className}`}
    >
      {broken ? (
        <div
          className={`flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-gradient-to-br text-5xl ${gradient}`}
          role="img"
          aria-label={alt}
        >
          {emoji}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setBroken(true)}
          className="aspect-[4/3] w-full rounded-lg object-cover"
        />
      )}
      <figcaption className="pt-2 text-center text-xs font-semibold text-neutral-600">{caption}</figcaption>
    </figure>
  );
}

export type LandingCourse = {
  icon: string;
  name: string;
  blurb: string;
  color: string;
};

/** Courses grid: shows the first six, the rest unfold behind "See more". */
export function CoursesGrid({ courses }: { courses: LandingCourse[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? courses : courses.slice(0, 6);

  return (
    <>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((c, i) => (
          <div
            key={c.name}
            style={showAll && i >= 6 ? { animationDelay: `${(i - 6) * 45}ms` } : undefined}
            className={`rounded-3xl border border-neutral-200 bg-gradient-to-br p-6 shadow-sm transition-transform hover:-translate-y-1 dark:border-neutral-800 ${c.color} ${
              showAll && i >= 6 ? "animate-fade-up" : ""
            }`}
          >
            <span className="text-3xl" aria-hidden>
              {c.icon}
            </span>
            <h3 className="mt-3 text-lg font-bold">{c.name}</h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{c.blurb}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="rounded-full border-2 border-dashed border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          {showAll ? "Show fewer courses" : `See all ${courses.length} courses 🎈`}
        </button>
      </div>
    </>
  );
}
