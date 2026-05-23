"use client";

import { useEffect, useRef, useState } from "react";
import { searchCities, type City } from "../../lib/cities-data";

interface Props {
  value: string;
  onChange: (city: string, lat: number | null, lng: number | null) => void;
  placeholder?: string;
}

export default function CityPicker({ value, onChange, placeholder = "Search city…" }: Props) {
  const [query, setQuery]       = useState(value);
  const [results, setResults]   = useState<City[]>([]);
  const [open, setOpen]         = useState(false);
  const [selected, setSelected] = useState(!!value);
  const containerRef            = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
    setSelected(!!value);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // If user typed but never selected, revert to last confirmed value
        if (!selected) setQuery(value);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [selected, value]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    setSelected(false);
    const hits = searchCities(q);
    setResults(hits);
    setOpen(hits.length > 0);
  }

  function handleSelect(city: City) {
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
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-transparent outline-none text-[#1C1410] placeholder:text-neutral-400 pr-8"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-[#A89488] hover:text-[#E0175C] text-xl leading-none"
            aria-label="Clear"
          >
            ×
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#EDE3DA] rounded-2xl shadow-lg overflow-hidden">
          {results.map((city, i) => (
            <li key={`${city.name}-${city.cc}-${i}`}>
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

      {open && results.length === 0 && query.length >= 2 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#EDE3DA] rounded-2xl shadow-lg px-4 py-3">
          <p className="text-sm text-[#A89488]">No city found. Try a different spelling.</p>
        </div>
      )}
    </div>
  );
}
