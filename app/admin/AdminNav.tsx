"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin",         label: "Dashboard",  icon: "📊" },
  { href: "/admin/photos",  label: "Photos",     icon: "🖼️"  },
  { href: "/admin/reports", label: "Reports",    icon: "🚩"  },
  { href: "/admin/users",   label: "Users",      icon: "👤"  },
];

export default function AdminNav() {
  const path = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {links.map((l) => {
        const active = l.href === "/admin"
          ? path === "/admin"
          : path.startsWith(l.href);

        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-[#E0175C] text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <span>{l.icon}</span>
            <span>{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
