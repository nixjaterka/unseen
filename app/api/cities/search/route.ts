import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q    = searchParams.get("q")?.trim() ?? "";
  const lang = searchParams.get("lang") ?? "en";

  if (q.length < 2) return NextResponse.json([]);

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "8");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Unseen Dating App (unseenapp.cz) / nikol.jaterkova@gmail.com",
      "Accept-Language": lang + ",en",
    },
  });

  if (!res.ok) return NextResponse.json([]);

  const raw: NominatimResult[] = await res.json();

  const cities = raw
    .filter((r) => r.class === "place" && ["city", "town", "village", "municipality"].includes(r.type))
    .map((r) => ({
      name: r.address?.city ?? r.address?.town ?? r.address?.village ?? r.name,
      country: r.address?.country ?? "",
      countryCode: (r.address?.country_code ?? "").toUpperCase(),
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }))
    // de-dupe by name+country
    .filter((c, i, arr) => arr.findIndex((x) => x.name === c.name && x.countryCode === c.countryCode) === i);

  return NextResponse.json(cities, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}

interface NominatimResult {
  name: string;
  class: string;
  type: string;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    country_code?: string;
  };
}
