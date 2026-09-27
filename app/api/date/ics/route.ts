// GET /api/date/ics?start=<ISO>&place=<text>&label=<codename>
//
// "Add to calendar" for the date card — both apps (web + mobile) open this URL.
// Returns a standard .ics invite (2 h slot) that iPhone Calendar, Google
// Calendar and Outlook all accept. Only uses what's already on the shared card
// (time, place, codename) — no private data, so no auth needed.

function icsEscape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
function icsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const start = new Date(url.searchParams.get("start") ?? "");
  const place = (url.searchParams.get("place") ?? "").slice(0, 300);
  const label = (url.searchParams.get("label") ?? "").slice(0, 60);
  if (Number.isNaN(start.getTime())) {
    return new Response("invalid start", { status: 400 });
  }
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const title = label ? `Date · ${label} (Unseen)` : "Date (Unseen)";
  const uid = `${icsDate(start)}-${Math.random().toString(36).slice(2)}@unseenapp.cz`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Unseen//Date//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsEscape(title)}`,
    place ? `LOCATION:${icsEscape(place)}` : "",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="unseen-date.ics"',
      "Cache-Control": "no-store",
    },
  });
}
