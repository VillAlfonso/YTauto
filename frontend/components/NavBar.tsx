"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/studio", label: "Studio" },
  { href: "/keys", label: "Keys" },
  { href: "/info", label: "Info" },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-20 bg-bg/80 backdrop-blur border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-14 flex items-center gap-6">
        <Link href="/" className="font-bold tracking-tight">
          YT<span className="text-accent">auto</span>
        </Link>
        <div className="flex gap-1">
          {TABS.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={[
                  "px-3 py-1.5 rounded-md text-sm transition",
                  active
                    ? "bg-bg-elevated text-text"
                    : "text-text-muted hover:text-text hover:bg-bg-elevated/50",
                ].join(" ")}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
