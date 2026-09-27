import { NextResponse } from "next/server";
import { getApiUser } from "../../../../lib/apiUser";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

// GET /api/date/places?matchId=123&q=cafe
//
// Place suggestions for "Plan a date", used by BOTH apps (web + mobile).
// Results are biased toward the midpoint between the two matched people.
// The midpoint is computed here on the server, so neither client ever learns
// the other person's location — only a list of public places comes back.
//
// Provider: Photon (OpenStreetMap, komoot) — free, no key, made for
// search-as-you-type. Swappable later (e.g. Mapy.cz) without touching clients.
//
// Response: { ok: true, places: [{ name, address, lat, lon }] }

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string; street?: string; housenumber?: string;
    city?: string; district?: string; locality?: string; country?: string;
    osm_key?: string; osm_value?: string;
  };
};

export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const matchId = Number(url.searchParams.get("matchId"));
  if (q.length < 3) return NextResponse.json({ ok: true, places: [] });
  if (!matchId) return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });

  const { data: match } = await supabaseAdmin
    .from("matches").select("user_a, user_b").eq("id", matchId).maybeSingle();
  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  // Midpoint of the two people (whoever has coordinates).
  const { data: profs } = await supabaseAdmin
    .from("profiles").select("latitude, longitude")
    .in("user_id", [match.user_a, match.user_b]);
  const pts = (profs ?? []).filter(
    (p) => typeof p.latitude === "number" && typeof p.longitude === "number"
  ) as { latitude: number; longitude: number }[];

  const photon = new URL("https://photon.komoot.io/api/");
  photon.searchParams.set("q", q);
  photon.searchParams.set("limit", "8");
  if (pts.length > 0) {
    const lat = pts.reduce((s, p) => s + p.latitude, 0) / pts.length;
    const lon = pts.reduce((s, p) => s + p.longitude, 0) / pts.length;
    photon.searchParams.set("lat", lat.toFixed(4));
    photon.searchParams.set("lon", lon.toFixed(4));
  }

  try {
    const res = await fetch(photon.toString(), {
      headers: { "User-Agent": "Unseen Dating App (unseenapp.cz)" },
    });
    if (!res.ok) return NextResponse.json({ ok: true, places: [] });
    const json = (await res.json()) as { features?: PhotonFeature[] };

    const seen = new Set<string>();
    const places = (json.features ?? [])
      .map((f) => {
        const p = f.properties ?? {};
        const [lon, lat] = f.geometry?.coordinates ?? [NaN, NaN];
        const street = [p.street, p.housenumber].filter(Boolean).join(" ");
        const town = p.city ?? p.locality ?? p.district ?? "";
        const name = p.name ?? street;
        const address = [p.name ? street : "", town].filter(Boolean).join(", ");
        return { name, address, lat, lon };
      })
      .filter((p) => p.name && Number.isFinite(p.lat) && Number.isFinite(p.lon))
      .filter((p) => {
        const key = `${p.name}|${p.address}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);

    return NextResponse.json({ ok: true, places });
  } catch {
    return NextResponse.json({ ok: true, places: [] });
  }
}
