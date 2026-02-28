"use client";
import Link from "next/link";

import { ModeToggle } from "./mode-toggle";
import { ConnectButton } from "./wallet/connect-button";

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/vaults", label: "Vaults" },
  ] as const;

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-4 py-2">
        <nav className="flex gap-4 text-sm font-medium">
          {links.map(({ to, label }) => (
            <Link key={to} href={to}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ConnectButton />
          <ModeToggle />
        </div>
      </div>
      <hr />
    </div>
  );
}
