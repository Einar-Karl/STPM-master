import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizeRegistration } from "@/lib/registration-intake";

// Kajabi (or Zapier/Make) posts a new website registration here and we drop the
// person straight onto the matching course roster. Secured with a shared secret
// so only your automation can call it.
//
// Configure in the hosting env:
//   STPM_WEBHOOK_SECRET       — the token Kajabi must send (?token=… or header)
//   SUPABASE_SERVICE_ROLE_KEY — lets this trusted endpoint write past RLS

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function providedSecret(req: Request): string | null {
  const url = new URL(req.url);
  return url.searchParams.get("token") ?? req.headers.get("x-webhook-secret");
}

export async function GET() {
  // Simple liveness check for wiring things up. Reveals nothing sensitive.
  return NextResponse.json({ ok: true, endpoint: "kajabi-registration", method: "POST" });
}

export async function POST(req: Request) {
  const secret = process.env.STPM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Registration webhook is not enabled (STPM_WEBHOOK_SECRET unset)." },
      { status: 503 },
    );
  }
  if (providedSecret(req) !== secret) return unauthorized();

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Server not configured (SUPABASE_SERVICE_ROLE_KEY unset)." },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const reg = normalizeRegistration(payload);

  // Always log what arrived so staff can see and debug it, whatever the outcome.
  const logEvent = (status: string, detail: string | null, sessionId: string | null) =>
    supabase.from("registration_events").insert({
      source: "kajabi",
      participant_name: reg.participant_name,
      email: reg.participant_email,
      registration_key: reg.registration_key,
      session_id: sessionId,
      status,
      detail,
      raw: payload as never,
    });

  if (!reg.participant_name && !reg.participant_email) {
    await logEvent("invalid", "No name or email found in the payload.", null);
    return NextResponse.json({ status: "invalid", error: "No name or email in payload." }, { status: 422 });
  }

  // Resolve which course this registration is for.
  let sessionId = reg.session_id;
  if (!sessionId && reg.registration_key) {
    const { data } = await supabase
      .from("course_sessions")
      .select("id")
      .eq("registration_key", reg.registration_key)
      .maybeSingle();
    sessionId = data?.id ?? null;
  }

  if (!sessionId) {
    await logEvent(
      "unmatched",
      reg.registration_key
        ? `No course has the registration key "${reg.registration_key}".`
        : "No registration key or session id in the payload.",
      null,
    );
    return NextResponse.json({ status: "unmatched" }, { status: 202 });
  }

  // De-duplicate: skip if this name or email is already on the roster.
  const { data: existing } = await supabase
    .from("course_bookings")
    .select("participant_name, participant_email")
    .eq("session_id", sessionId);
  const nameSeen = new Set((existing ?? []).map((b) => (b.participant_name ?? "").trim().toLowerCase()));
  const emailSeen = new Set(
    (existing ?? []).map((b) => (b.participant_email ?? "").trim().toLowerCase()).filter(Boolean),
  );
  const dupByEmail = reg.participant_email && emailSeen.has(reg.participant_email.trim().toLowerCase());
  const dupByName = reg.participant_name && nameSeen.has(reg.participant_name.trim().toLowerCase());

  if (dupByEmail || dupByName) {
    await logEvent("duplicate", "Already on the roster.", sessionId);
    return NextResponse.json({ status: "duplicate" }, { status: 200 });
  }

  const { error } = await supabase.from("course_bookings").insert({
    session_id: sessionId,
    participant_name: reg.participant_name ?? reg.participant_email ?? "Unknown",
    first_name: reg.first_name,
    participant_email: reg.participant_email,
    nationality: reg.nationality,
    school: reg.school,
    coordinator: reg.coordinator,
    phone: reg.phone,
    tour_booked: reg.tour_booked,
    status: "confirmed",
  });

  if (error) {
    await logEvent("invalid", `Insert failed: ${error.message}`, sessionId);
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }

  await logEvent("imported", null, sessionId);
  return NextResponse.json({ status: "imported" }, { status: 200 });
}
