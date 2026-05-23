import { NextResponse } from "next/server";

export const runtime = "edge";

// Europe bounding box — biases results without hard-excluding other regions
const EU_VIEWBOX = "-25,35,45,71";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q    = searchParams.get("q")?.trim() ?? "";
  const lang = searchParams.get("lang") ?? "en";

  if (q.length < 2) return NextResponse.json([]);

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "12");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("viewbox", EU_VIEWBOX);
  url.searchParams.set("bounded", "0"); // bias only, don't exclude outside Europe

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Unseen Dating App (unseenapp.cz) / nikol.jaterkova@gmail.com",
      "Accept-Language": lang + ",en",
    },
  });

  if (!res.ok) return NextResponse.json([]);

  const raw: NominatimResult[] = await res.json();

  const cities = raw
    .filter((r) =>
      r.class === "place" &&
      ["city", "town", "municipality"].includes(r.type) // drop villages — too small
    )
    .map((r) => ({
      name: r.address?.city ?? r.address?.town ?? r.name,
      country: r.address?.country ?? "",
      countryCode: (r.address?.country_code ?? "").toUpperCase(),
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      importance: parseFloat(r.importance ?? "0"),
    }))
    // de-dupe by name + country
    .filter((c, i, arr) =>
      arr.findIndex((x) => x.name === c.name && x.countryCode === c.countryCode) === i
    )
    // most important first (population proxy)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 6)
    .map(({ importance: _i, ...c }) => c); // strip importance from response

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
  importance?: string;
  address?: {
    city?: string;
    town?: string;
    country?: string;
    country_code?: string;
  };
}
