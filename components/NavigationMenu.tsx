"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookText, Users, Brain, UserCircle } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: <Home className="h-5 w-5" /> },
  { href: "/journal", label: "Journal", icon: <BookText className="h-5 w-5" /> },
  { href: "/friends", label: "Friends", icon: <Users className="h-5 w-5" /> },
  { href: "/ai-therapist", label: "Therapist", icon: <Brain className="h-5 w-5" /> },
  { href: "/profile", label: "Profile", icon: <UserCircle className="h-5 w-5" /> },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavigationMenu() {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-auto fixed left-0 top-0 z-[9200] hidden h-screen w-14 flex-col items-center gap-1 border-r border-[var(--border-soft)] bg-[var(--background)] py-4 sm:flex">
      {/* Logo */}
      <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-xs font-bold text-white">
        A
      </div>

      {/* Nav items */}
      <div className="flex flex-1 flex-col items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                active
                  ? "bg-[var(--surface-3)] text-[var(--foreground)]"
                  : "text-[var(--muted-text)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
              }`}
            >
              {item.icon}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
