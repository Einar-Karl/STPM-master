// Standard preparation checklists ("action plans") that can be loaded into a
// course week (planner) or a course session (teacher) and then ticked off.
// Order matters: items are roughly in the order they need to happen.

export type PrepRole = "planner" | "teacher";

export const PLANNER_CHECKLIST: string[] = [
  "Venue booked & confirmed (rooms, wifi, projector)",
  "Venue accessibility checked (wheelchair access, lifts, toilets)",
  "Lead & support teachers assigned to every course",
  "Sign-up sheet linked and importing correctly",
  "Special-needs & allergy alerts reviewed for every course",
  "Payments chased — roster payment status up to date",
  "Hotel rooms booked and assigned to all guests",
  "Arrival info & airport transfer details sent to participants",
  "Welcome email sent (meeting point, first-day start time, map link)",
  "Tours & activities booked (guides, buses, tickets)",
  "Catering ordered with the allergy list applied",
  "Badges, rosters and certificates printed",
  "Emergency contacts & local info sheet prepared",
  "Feedback form ready to send on the last day",
];

export const TEACHER_CHECKLIST: string[] = [
  "Roster reviewed — know your participants and their special needs",
  "Day-by-day programme filled in and shared",
  "Meeting point / location set for every day (shows on the venue map)",
  "Materials & props packed for each activity",
  "Tech checked (slides, speakers, adapters, wifi)",
  "Icebreaker & first-morning welcome planned",
  "Participant list printed or saved offline",
  "Backup plan ready for weather-dependent days",
  "Certificates prepared with participant names",
  "Closing session & feedback round planned",
];

export function checklistTemplate(role: PrepRole): string[] {
  return role === "planner" ? PLANNER_CHECKLIST : TEACHER_CHECKLIST;
}
