"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import {
  Crosshair,
  Lightning,
  Brain,
  ShieldCheck,
  ArrowRight,
} from "@phosphor-icons/react";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (m) => m.WalletMultiButton
    ),
  { ssr: false }
);

export default function LandingPage() {
  const { connected } = useWallet();

  return (
    <div className="flex flex-col items-center pt-16 pb-24 text-center">
      {/* Hero */}
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20">
        <Crosshair size={48} weight="bold" className="text-accent" />
      </div>

      <h1 className="mb-4 text-5xl font-bold tracking-tight md:text-6xl">
        Your Governance
        <br />
        <span className="text-accent">Command Center</span>
      </h1>

      <p className="mb-8 max-w-xl text-lg text-muted">
        See every DAO you belong to, get AI-powered proposal summaries, and vote
        across all your Solana DAOs — all from one dashboard.
      </p>

      <div className="flex gap-4">
        {connected ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Go to Dashboard
            <ArrowRight size={20} />
          </Link>
        ) : (
          <WalletMultiButton />
        )}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-6 py-3 font-medium text-muted hover:text-foreground hover:border-white/20 transition-colors"
        >
          Browse DAOs
        </Link>
      </div>

      {/* Features */}
      <div className="mt-24 grid w-full max-w-4xl gap-6 md:grid-cols-3">
        <FeatureCard
          icon={<Lightning size={32} weight="bold" />}
          title="One-Click Voting"
          description="Vote on proposals across all your DAOs without switching between apps."
        />
        <FeatureCard
          icon={<Brain size={32} weight="bold" />}
          title="AI Summaries"
          description="Understand complex proposals in seconds with AI-generated plain English summaries."
        />
        <FeatureCard
          icon={<ShieldCheck size={32} weight="bold" />}
          title="Full Visibility"
          description="Track your voting power, active proposals, and governance history in one place."
        />
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-sm">
      <div className="mb-3 text-accent">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted">{description}</p>
    </div>
  );
}
