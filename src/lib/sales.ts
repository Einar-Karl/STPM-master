// Helpers for the Sales channel: stage styling, a rule-based suggestion engine
// ("AI suggested sales moves"), and a school-specific cold-outreach email
// draft generator.

import type { Channel } from "./planner";

export type SalesStage = "new" | "contacted" | "interested" | "negotiating" | "won" | "lost";

export const SALES_STAGES: { value: SalesStage; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "negotiating", label: "Negotiating" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export function stageLabel(stage: string): string {
  return SALES_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export function stageBadgeClass(stage: string): string {
  switch (stage) {
    case "contacted":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
    case "interested":
      return "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300";
    case "negotiating":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
    case "won":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
    case "lost":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
    default:
      return "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";
  }
}

export function orgTypeLabel(orgType: string): string {
  if (orgType === "kindergarten") return "Kindergarten";
  if (orgType === "school") return "School";
  return "Organisation";
}

/**
 * Fold Icelandic/accented characters to ASCII — used to guess Reykjavík school
 * email slugs and to build clean web-search queries.
 */
export function foldAscii(input: string): string {
  const map: Record<string, string> = {
    á: "a", à: "a", ä: "a", â: "a", å: "a",
    é: "e", è: "e", ë: "e", ê: "e",
    í: "i", ì: "i", ï: "i", î: "i",
    ó: "o", ò: "o", ö: "o", ô: "o", ø: "o",
    ú: "u", ù: "u", ü: "u", û: "u",
    ý: "y", ÿ: "y",
    æ: "ae", œ: "oe", ð: "d", þ: "th", ç: "c", ñ: "n",
  };
  return input
    .toLowerCase()
    .replace(/[áàäâåéèëêíìïîóòöôøúùüûýÿæœðþçñ]/g, (c) => map[c] ?? c);
}

/** Google search URL to help staff find a lead's email quickly. */
export function findEmailUrl(name: string, municipality: string | null): string {
  const q = `${name} ${municipality ?? ""} netfang email`.trim();
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

// ---------------------------------------------------------------------------
// Suggestion engine
// ---------------------------------------------------------------------------

export type Suggestion = {
  title: string;
  detail: string;
  tone: "opportunity" | "action" | "warning";
};

export type CountryStat = { country: string; count: number };
export type SenderStat = { name: string; people: number; countries: number; email: string | null };

export function buildOutieSuggestions(
  countries: CountryStat[],
  senders: SenderStat[],
  totalParticipants: number
): Suggestion[] {
  const out: Suggestion[] = [];

  if (countries.length) {
    const top = countries[0];
    const share = totalParticipants ? Math.round((top.count / totalParticipants) * 100) : 0;
    out.push({
      title: `${top.country} is your #1 market (${top.count} participants, ${share}%)`,
      detail: `Double down where you already win: run ${top.country}-language ads, translate the landing page, and target Erasmus+ consortia and national teacher associations in ${top.country}.`,
      tone: "opportunity",
    });
  }

  const emerging = countries.slice(3, 6).filter((c) => c.count >= 10);
  if (emerging.length) {
    out.push({
      title: `Growing markets: ${emerging.map((c) => c.country).join(", ")}`,
      detail: `These countries already send 10+ teachers with little effort. A single targeted campaign or one strong coordinator relationship could turn each into a top market.`,
      tone: "opportunity",
    });
  }

  const bigSenders = senders.filter((s) => s.people >= 5);
  if (bigSenders.length) {
    const s = bigSenders[0];
    out.push({
      title: `Nurture your repeat coordinators — ${s.name} sent ${s.people} people`,
      detail: `Coordinators who bring whole groups are your cheapest growth. Offer ${s.name} a returning-group discount, ask for a testimonial, and request 2–3 referrals to neighbouring schools.`,
      tone: "action",
    });
    out.push({
      title: `Launch a referral / loyalty programme`,
      detail: `${bigSenders.length} coordinators have each sent 5+ participants. A simple "bring a colleague school, both get a discount" offer turns them into a sales force.`,
      tone: "action",
    });
  }

  out.push({
    title: "Re-engage last year's participants before they rebook elsewhere",
    detail:
      "Everyone in the roster is a warm lead for next season. Send a spring newsletter with new courses and an early-bird price, and a personal note to each coordinator.",
    tone: "action",
  });

  return out;
}

export function buildInnieSuggestions(stats: {
  total: number;
  notContacted: number;
  missingEmail: number;
  followUpsDue: number;
  interested: number;
}): Suggestion[] {
  const out: Suggestion[] = [];

  if (stats.followUpsDue > 0) {
    out.push({
      title: `${stats.followUpsDue} follow-up${stats.followUpsDue > 1 ? "s" : ""} due`,
      detail:
        "These schools were contacted but went quiet, or their follow-up date has passed. A short second nudge now is where most deals are actually won.",
      tone: "warning",
    });
  }

  if (stats.notContacted > 0) {
    out.push({
      title: `${stats.notContacted} schools not contacted yet`,
      detail:
        "Work the list top-down by municipality. Open a school, copy the ready-made draft, send it, then hit “Mark contacted”. Aim for 5–10 fresh emails a day.",
      tone: "action",
    });
  }

  if (stats.missingEmail > 0) {
    out.push({
      title: `${stats.missingEmail} leads still missing an email`,
      detail:
        "Use the “Find email” link on each of those rows — it opens a pre-filled search. Paste the address in and it’s ready to contact.",
      tone: "action",
    });
  }

  if (stats.interested > 0) {
    out.push({
      title: `${stats.interested} school${stats.interested > 1 ? "s" : ""} showed interest — book the call`,
      detail:
        "Interest fades fast. Move each of these to a concrete date and a draft itinerary within a week while the enthusiasm is fresh.",
      tone: "opportunity",
    });
  }

  out.push({
    title: "Time outreach to the planning calendar",
    detail:
      "Icelandic schools plan study trips (vettvangsferðir) in autumn for the following year. September–November is prime season — front-load your cold emails then.",
    tone: "opportunity",
  });

  return out;
}

// ---------------------------------------------------------------------------
// School-specific email draft
// ---------------------------------------------------------------------------

export type Draft = { subject: string; body: string };

const DEFAULT_DESTINATIONS = ["Spánar", "Finnlands", "Litháens"];

/** Icelandic cold-outreach draft offering a school a study trip. */
export function buildSchoolDraftIs(
  name: string,
  orgType: string,
  destinations: string[]
): Draft {
  const groupWord = orgType === "kindergarten" ? "leikskólahópinn" : "kennarahópinn";
  const dest = (destinations.length ? destinations : DEFAULT_DESTINATIONS).join(", ");
  const subject = `Námsferð fyrir ${groupWord} í ${name}?`;
  const body = `Sæl/sæll,

Ég heiti [þitt nafn] og starfa hjá Endurmenntunarferðum (Smart Teachers Play More). Við skipuleggjum námsferðir og starfsþróun fyrir íslenska kennara og skólahópa — meðal annars til ${dest}.

Mig langaði að heyra hvort áhugi væri hjá ${name} á að við tækjum stutt spjall (síma eða stuttan fund) þar sem við gætum sett saman ferð sem hentar ykkar hópi: fagleg dagskrá, skólaheimsóknir og menningarupplifun — allt skipulagt fyrir ykkur frá A til Ö.

Ferðirnar má sníða að þörfum hópsins og henta bæði sem starfsdagar og sem liður í Erasmus+ verkefnum.

Væri í lagi að ég heyrði í ykkur? Endilega láttu mig vita hvað hentar, þá sendi ég nánari upplýsingar eða dagsetningar.

Með góðri kveðju,
[Þitt nafn]
Endurmenntunarferðir · endurmenntunarferdir.is · [sími]`;
  return { subject, body };
}

/** English variant of the same draft. */
export function buildSchoolDraftEn(
  name: string,
  orgType: string,
  destinations: string[]
): Draft {
  const groupWord = orgType === "kindergarten" ? "kindergarten team" : "teaching team";
  const dest = (destinations.length ? destinations : ["Spain", "Finland", "Lithuania"]).join(", ");
  const subject = `A study trip for the ${groupWord} at ${name}?`;
  const body = `Hello,

My name is [your name] and I work with Endurmenntunarferðir (Smart Teachers Play More). We organise study trips and professional development for Icelandic teachers and school groups — including to ${dest}.

I wanted to ask whether ${name} would be interested in a short chat (a call or brief meeting) where we could put together a trip that fits your group: a professional programme, school visits and cultural experiences — fully organised for you from start to finish.

Trips can be tailored to your group and work well both as staff development days and as part of Erasmus+ projects.

Would it be alright if I got in touch? Just let me know what suits you and I'll send dates and more details.

Warm regards,
[Your name]
Endurmenntunarferðir · endurmenntunarferdir.is · [phone]`;
  return { subject, body };
}

export function mailtoUrl(email: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

export const SALES_CHANNELS: { value: Channel; label: string; blurb: string }[] = [
  { value: "outie", label: "Outies", blurb: "Foreign teachers coming to STPM — market intelligence & repeat coordinators" },
  { value: "innie", label: "Innies", blurb: "Icelandic schools & kindergartens — cold-call list & outreach" },
];
