// Destination cards: real flag SVGs (emoji flags render as plain letters on
// Windows) + country outline silhouettes (public-domain shapes from mapsicon,
// served from /landing/maps/ and tinted via CSS mask).

export type DestCode = "is" | "es" | "fi" | "lt";

export function Flag({ code, className = "" }: { code: DestCode; className?: string }) {
  const base = `overflow-hidden rounded-md shadow ring-1 ring-black/10 ${className}`;
  switch (code) {
    case "is":
      return (
        <svg viewBox="0 0 25 18" className={base} role="img" aria-label="Flag of Iceland">
          <rect width="25" height="18" fill="#02529C" />
          <rect x="7" width="4" height="18" fill="#fff" />
          <rect y="7" width="25" height="4" fill="#fff" />
          <rect x="8" width="2" height="18" fill="#DC1E35" />
          <rect y="8" width="25" height="2" fill="#DC1E35" />
        </svg>
      );
    case "fi":
      return (
        <svg viewBox="0 0 18 11" className={base} role="img" aria-label="Flag of Finland">
          <rect width="18" height="11" fill="#fff" />
          <rect x="5" width="3" height="11" fill="#002F6C" />
          <rect y="4" width="18" height="3" fill="#002F6C" />
        </svg>
      );
    case "es":
      return (
        <svg viewBox="0 0 30 20" className={base} role="img" aria-label="Flag of Spain">
          <rect width="30" height="20" fill="#AA151B" />
          <rect y="5" width="30" height="10" fill="#F1BF00" />
        </svg>
      );
    case "lt":
      return (
        <svg viewBox="0 0 30 18" className={base} role="img" aria-label="Flag of Lithuania">
          <rect width="30" height="6" fill="#FDB913" />
          <rect y="6" width="30" height="6" fill="#006A44" />
          <rect y="12" width="30" height="6" fill="#C1272D" />
        </svg>
      );
  }
}

export function CountrySilhouette({
  code,
  gradient,
  className = "",
}: {
  code: DestCode;
  gradient: string;
  className?: string;
}) {
  const mask: React.CSSProperties = {
    WebkitMaskImage: `url(/landing/maps/${code}.svg)`,
    maskImage: `url(/landing/maps/${code}.svg)`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  };
  return <div style={mask} className={`bg-gradient-to-br ${gradient} ${className}`} aria-hidden />;
}

export function DestinationCard({
  code,
  name,
  blurb,
  gradient,
}: {
  code: DestCode;
  name: string;
  blurb: string;
  gradient: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 text-center shadow-sm transition-transform hover:-translate-y-1 dark:border-neutral-800 dark:bg-neutral-900">
      <CountrySilhouette
        code={code}
        gradient={gradient}
        className="mx-auto h-28 w-32 transition-transform group-hover:scale-110"
      />
      <div className="mt-3 flex items-center justify-center gap-2">
        <Flag code={code} className="h-5 w-8" />
        <h3 className="text-lg font-bold">{name}</h3>
      </div>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{blurb}</p>
    </div>
  );
}
