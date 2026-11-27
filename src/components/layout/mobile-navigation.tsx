"use client";

import Link from "next/link";
import { useRef } from "react";

export function MobileNavigation({
  links,
  label = "Menu",
  navigationLabel = "Mobile",
}: {
  links: string[][];
  label?: string;
  navigationLabel?: string;
}) {
  const menu = useRef<HTMLDetailsElement>(null);

  return (
    <details
      ref={menu}
      className="mobile-nav"
      onKeyDown={(event) => {
        if (event.key === "Escape" && menu.current?.open) {
          menu.current.open = false;
          menu.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary>{label}</summary>
      <nav aria-label={navigationLabel}>
        {links.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            onClick={() => {
              if (menu.current) {
                menu.current.open = false;
                menu.current.querySelector("summary")?.focus();
              }
            }}
          >
            {label}
          </Link>
        ))}
      </nav>
    </details>
  );
}
