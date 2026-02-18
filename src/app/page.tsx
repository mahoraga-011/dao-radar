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
  Target,
} from "@phosphor-icons/react";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (m) => m.WalletMultiButton
    ),
  { ssr: false }
);

function RadarScanner() {
  return (
    <div className="radar-container mx-auto mb-8">
      {/* Circles */}
      <div className="radar-circle radar-circle-1" />
      <div className="radar-circle radar-circle-2" />
      <div className="radar-circle radar-circle-3" />

      {/* Crosshairs */}
      <div className="radar-crosshair-h" />
      <div className="radar-crosshair-v" />

      {/* Sweep */}
      <div className="radar-sweep" />

      {/* Center dot */}
      <div className="radar-center-dot" />

      {/* Ping rings */}
      <div className="radar-ping" />
      <div className="radar-ping" style={{ animationDelay: "1s" }} />

      {/* Blips (simulated DAO detections) */}
      <div className="radar-blip" style={{ top: "25%", left: "60%", animationDelay: "0.5s" }} />
      <div className="radar-blip" style={{ top: "40%", left: "75%", animationDelay: "1.2s" }} />
      <div className="radar-blip" style={{ top: "65%", left: "30%", animationDelay: "0.8s" }} />
      <div className="radar-blip" style={{ top: "35%", left: "20%", animationDelay: "1.8s" }} />
      <div className="radar-blip" style={{ top: "70%", left: "65%", animationDelay: "0.3s" }} />

      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
          <Target size={28} weight="bold" className="text-red-400" />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { connected } = useWallet();

  return (
    <div className="flex flex-col items-center pt-8 pb-24 text-center grain-overlay">
      {/* Radar Animation */}
      <div className="animate-fade-in-up">
        <RadarScanner />
      </div>

      <h1 className="mb-4 text-5xl font-bold tracking-tight md:text-6xl animate-fade-in-up-delay-1">
        <span className="text-red-400">DAO</span> Radar
      </h1>

      <p className="mb-2 text-sm font-mono text-red-400/60 uppercase tracking-[0.3em] animate-fade-in-up-delay-1">
        Governance Command Center
      </p>

      <p className="mb-8 max-w-xl text-lg text-muted animate-fade-in-up-delay-2">
        Scan every DAO you belong to. AI-powered proposal intelligence.
        One-click voting across all your Solana DAOs.
      </p>

      <div className="flex gap-4 animate-fade-in-up-delay-3">
        {connected ? (
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-lg bg-red-500 px-6 py-3 font-medium text-white hover:bg-red-400 transition-all animate-glow-pulse"
          >
            Launch Dashboard
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <WalletMultiButton />
        )}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-6 py-3 font-medium text-muted hover:text-foreground hover:border-red-500/40 transition-all"
        >
          Browse DAOs
        </Link>
      </div>

      {/* Stats bar */}
      <div className="mt-16 flex items-center gap-8 text-center animate-fade-in-up-delay-3">
        <div>
          <p className="text-2xl font-bold text-red-400 font-mono">4,262</p>
          <p className="text-xs text-muted uppercase tracking-wider">DAOs Tracked</p>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div>
          <p className="text-2xl font-bold text-red-400 font-mono">$500M+</p>
          <p className="text-xs text-muted uppercase tracking-wider">Total TVL</p>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div>
          <p className="text-2xl font-bold text-red-400 font-mono">AI</p>
          <p className="text-xs text-muted uppercase tracking-wider">Powered</p>
        </div>
      </div>

      {/* Features */}
      <div className="mt-20 grid w-full max-w-4xl gap-6 md:grid-cols-3">
        <FeatureCard
          icon={<Crosshair size={32} weight="bold" />}
          title="Scan & Detect"
          description="Connect your wallet and instantly detect every DAO where you have voting power."
          delay={1}
        />
        <FeatureCard
          icon={<Brain size={32} weight="bold" />}
          title="AI Intelligence"
          description="Complex proposals decoded into plain English. Know exactly what you're voting on."
          delay={2}
        />
        <FeatureCard
          icon={<Lightning size={32} weight="bold" />}
          title="One-Click Vote"
          description="Cast your vote across any DAO without switching apps. For, Against, or Abstain."
          delay={3}
        />
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <div className={`rounded-xl border border-red-500/10 bg-red-500/5 p-6 text-left backdrop-blur-sm hover:border-red-500/20 transition-all animate-fade-in-up-delay-${delay}`}>
      <div className="mb-3 text-red-400">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted">{description}</p>
    </div>
  );
}
