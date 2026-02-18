"use client";

import { Crosshair } from "@phosphor-icons/react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0A0A0A]/80 py-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 text-center text-sm text-muted">
        <div className="flex items-center gap-1.5">
          <Crosshair size={14} className="text-red-400" />
          <span>
            Built for{" "}
            <a
              href="https://www.solanagraveyard.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:underline"
            >
              Solana Graveyard Hackathon
            </a>
          </span>
        </div>
        <a
          href="https://app.realms.today/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted/60 hover:text-muted transition-colors"
        >
          Powered by Realms DAO
        </a>
      </div>
    </footer>
  );
}
