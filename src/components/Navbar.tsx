"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { Crosshair, House, ClockCounterClockwise, Compass } from "@phosphor-icons/react";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

export default function Navbar() {
  const { connected } = useWallet();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <Crosshair size={28} weight="bold" className="text-accent" />
          <span>DAO Radar</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <House size={18} />
            Dashboard
          </Link>
          {connected && (
            <Link
              href="/history"
              className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
            >
              <ClockCounterClockwise size={18} />
              History
            </Link>
          )}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <Compass size={18} />
            Explore
          </Link>
        </div>

        <WalletMultiButton />
      </div>
    </nav>
  );
}
