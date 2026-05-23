"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "../../lib/i18n/I18nProvider";

export interface CityResult {
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
}

interface Props {
  value: string;
  onChange: (city: string, lat: number | null, lng: number | null) => void;
  placeholder?: string;
}

export default function CityPicker({ value, onChange, placeholder = "Search city…" }: Props) {
  const { locale } = useLocale();
  const [query, setQuery]       = useState(value);
  const [results, setResults]   = useState<CityResult[]>([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(!!value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep query in sync when value changes externally (e.g. profile page load)
  useEffect(() => {
    setQuery(value);
    setSelected(!!value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    setSelected(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/cities/search?q=${encodeURIComponent(q)}&lang=${locale}`);
        const data: CityResult[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 320);
  }

  function handleSelect(city: CityResult) {
    setQuery(city.name);
    setSelected(true);
    setOpen(false);
    setResults([]);
    onChange(city.name, city.lat, city.lng);
  }

  function handleClear() {
    setQuery("");
    setSelected(false);
    setResults([]);
    setOpen(false);
    onChange("", null, null);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full bg-transparent outline-none text-[#1C1410] placeholder:text-neutral-400 pr-8 ${
            selected ? "text-[#1C1410]" : ""
          }`}
        />
        {loading && (
          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[#A89488] text-xs animate-pulse">…</span>
        )}
        {!loading && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-[#A89488] hover:text-[#E0175C] text-lg leading-none"
            aria-label="Clear"
          >
            ×
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#EDE3DA] rounded-2xl shadow-lg overflow-hidden">
          {results.map((city, i) => (
            <li key={`${city.name}-${city.countryCode}-${i}`}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(city); }}
                className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#FAF3EE] transition-colors"
              >
                <span className="text-sm text-[#1C1410] font-medium">{city.name}</span>
                <span className="text-xs text-[#A89488] shrink-0">{city.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
