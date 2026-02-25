"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import {
  Crosshair,
  Lightning,
  Brain,
  ArrowRight,
  Target,
  Wallet,
  NumberCircleOne,
  NumberCircleTwo,
  NumberCircleThree,
  ShieldCheck,
  ChartBar,
  Eye,
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
    <div className="radar-container radar-container-hero">
      <div className="radar-circle radar-circle-1" />
      <div className="radar-circle radar-circle-2" />
      <div className="radar-circle radar-circle-3" />
      <div className="radar-crosshair-h" />
      <div className="radar-crosshair-v" />
      <div className="radar-sweep" />
      <div className="radar-center-dot" />
      <div className="radar-ping" />
      <div className="radar-ping" style={{ animationDelay: "1s" }} />
      <div className="radar-blip" style={{ top: "25%", left: "60%", animationDelay: "0.5s" }} />
      <div className="radar-blip" style={{ top: "40%", left: "75%", animationDelay: "1.2s" }} />
      <div className="radar-blip" style={{ top: "65%", left: "30%", animationDelay: "0.8s" }} />
      <div className="radar-blip" style={{ top: "35%", left: "20%", animationDelay: "1.8s" }} />
      <div className="radar-blip" style={{ top: "70%", left: "65%", animationDelay: "0.3s" }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
          <Target size={22} weight="bold" className="text-red-400" />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { connected } = useWallet();

  return (
    <div className="grain-overlay">
      {/* ── Hero Section ── */}
      <section className="relative min-h-[calc(100vh-8rem)] flex items-center">
        {/* Background grid lines */}
        <div className="hero-grid-bg" />

        <div className="relative z-10 grid w-full grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 items-center py-12 lg:py-0">
          {/* Left: Content */}
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-3 py-1 mb-6">
              <Crosshair size={12} weight="bold" className="text-red-400" />
              <span className="text-xs font-medium text-red-400 tracking-wide uppercase">
                Powered by Realms DAO
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.1] mb-5">
              Your DAOs.<br />
              <span className="text-red-400">One dashboard.</span><br />
              Zero tab-switching.
            </h1>

            <p className="text-lg text-muted max-w-lg mb-8 leading-relaxed">
              AI-summarized proposals, one-click voting, and real-time alerts across every Solana DAO you belong to.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              {connected ? (
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-2.5 rounded-lg bg-red-500 px-7 py-3.5 font-semibold text-white hover:bg-red-400 transition-all animate-glow-pulse"
                >
                  Launch Dashboard
                  <ArrowRight size={18} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <span className="wallet-button-lg"><WalletMultiButton /></span>
              )}
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-7 h-[50px] min-w-[200px] font-semibold text-foreground hover:bg-white/10 hover:border-white/20 transition-all box-border"
              >
                Explore DAOs
              </Link>
            </div>

            {/* Inline stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <ChartBar size={16} className="text-red-400" />
                <span className="font-mono font-bold text-foreground">4,000+</span>
                <span className="text-muted">DAOs</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-red-400" />
                <span className="font-mono font-bold text-foreground">$500M+</span>
                <span className="text-muted">TVL secured</span>
              </div>
              <div className="h-4 w-px bg-white/10 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2">
                <Brain size={16} className="text-red-400" />
                <span className="text-muted">AI-powered</span>
              </div>
            </div>
          </div>

          {/* Right: Radar + floating context */}
          <div className="hidden lg:flex items-center justify-center relative animate-fade-in-up-delay-2">
            {/* Ambient glow behind radar */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-80 h-80 rounded-full bg-red-500/5 blur-3xl" />
            </div>

            <div className="relative">
              <RadarScanner />

              {/* Floating label: top-right */}
              <div className="absolute -top-2 -right-4 floating-label animate-fade-in-up-delay-3">
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#111]/90 backdrop-blur-sm px-3 py-2">
                  <div className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                  <span className="text-xs text-muted">Jupiter DAO</span>
                  <span className="text-[10px] font-mono text-green-400">3 active</span>
                </div>
              </div>

              {/* Floating label: bottom-left */}
              <div className="absolute -bottom-2 -left-8 floating-label-alt animate-fade-in-up-delay-3">
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#111]/90 backdrop-blur-sm px-3 py-2">
                  <div className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                  <span className="text-xs text-muted">Marinade</span>
                  <span className="text-[10px] font-mono text-amber-400">Vote ending</span>
                </div>
              </div>

              {/* Floating label: mid-right */}
              <div className="absolute top-1/2 -right-16 -translate-y-1/2 floating-label animate-fade-in-up-delay-3" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#111]/90 backdrop-blur-sm px-3 py-2">
                  <Brain size={12} className="text-red-400" />
                  <span className="text-[10px] text-muted">AI: <span className="text-foreground">High impact</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="relative py-4">
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
      </div>

      {/* ── How It Works ── */}
      <section className="py-20">
        <div className="text-center mb-14 animate-fade-in-up">
          <p className="text-xs font-mono text-red-400/60 uppercase tracking-[0.3em] mb-3">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Three steps. Full governance control.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StepCard
            step={<NumberCircleOne size={28} weight="duotone" />}
            icon={<Wallet size={24} weight="bold" />}
            title="Connect wallet"
            description="Link your Phantom or Solflare. We scan every DAO where you hold governance tokens."
            accent="border-red-500/15 hover:border-red-500/30"
            delay={1}
          />
          <StepCard
            step={<NumberCircleTwo size={28} weight="duotone" />}
            icon={<Eye size={24} weight="bold" />}
            title="Read AI briefs"
            description="Every active proposal gets an AI-generated summary with impact assessment. No more deciphering 10-page docs."
            accent="border-red-500/15 hover:border-red-500/30"
            delay={2}
          />
          <StepCard
            step={<NumberCircleThree size={28} weight="duotone" />}
            icon={<Lightning size={24} weight="bold" />}
            title="Vote in one click"
            description="For, Against, or Abstain — directly from the dashboard. No app-switching, no extra tabs."
            accent="border-red-500/15 hover:border-red-500/30"
            delay={3}
          />
        </div>
      </section>

      {/* ── Feature Highlights ── */}
      <section className="py-16">
        <div className="grid gap-4 md:grid-cols-2">
          <FeaturePanel
            icon={<Brain size={22} weight="bold" />}
            label="Intelligence"
            title="AI proposal summaries"
            description="GPT-powered analysis distills complex governance proposals into 2-3 sentence briefs with Low / Medium / High impact ratings."
            visual={
              <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] p-4 font-mono text-xs space-y-2">
                <div className="flex items-center gap-2 text-muted">
                  <Brain size={12} className="text-red-400" />
                  <span className="text-red-400">AI Summary</span>
                </div>
                <p className="text-muted leading-relaxed">
                  &quot;This proposal allocates 2M tokens to a liquidity mining program across three DEXs over 6 months. Expected to increase TVL by 40%.&quot;
                </p>
                <div className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400">
                  Impact: Medium — treasury allocation
                </div>
              </div>
            }
            delay={1}
          />
          <FeaturePanel
            icon={<Crosshair size={22} weight="bold" />}
            label="Detection"
            title="Never miss a vote"
            description="Browser notifications alert you when new proposals go live. Track your full voting history across every DAO."
            visual={
              <div className="mt-4 space-y-2">
                {[
                  { dao: "Jupiter", status: "Active", color: "bg-green-400", time: "2h ago" },
                  { dao: "Drift Protocol", status: "Ending soon", color: "bg-amber-400", time: "5h left" },
                  { dao: "Marinade", status: "New", color: "bg-red-400", time: "Just now" },
                ].map((item) => (
                  <div key={item.dao} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${item.color}`} />
                      <span className="text-xs font-medium">{item.dao}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted">{item.time}</span>
                      <span className="text-[10px] font-mono text-muted">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            }
            delay={2}
          />
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-20">
        <div className="relative overflow-hidden rounded-2xl border border-red-500/10 bg-gradient-to-br from-red-500/5 via-transparent to-transparent p-10 sm:p-14 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <h2 className="relative text-2xl sm:text-3xl font-bold mb-4 tracking-tight">
            Stop missing governance votes.
          </h2>
          <p className="relative text-muted max-w-md mx-auto mb-8">
            Join thousands of Solana governance participants using DAO Radar to stay on top of every proposal.
          </p>
          <div className="relative flex flex-wrap justify-center gap-3">
            {connected ? (
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2.5 rounded-lg bg-red-500 px-7 py-3.5 font-semibold text-white hover:bg-red-400 transition-all"
              >
                Go to Dashboard
                <ArrowRight size={18} weight="bold" className="group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <span className="wallet-button-lg"><WalletMultiButton /></span>
            )}
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-7 py-3.5 font-semibold text-foreground hover:bg-white/10 transition-all"
            >
              Browse All DAOs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  description,
  accent,
  delay,
}: {
  step: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  delay: number;
}) {
  return (
    <div className={`group relative rounded-xl border ${accent} bg-white/[0.02] p-6 transition-all animate-fade-in-up-delay-${delay}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-red-400/40">{step}</span>
        <span className="text-red-400">{icon}</span>
      </div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}

function FeaturePanel({
  icon,
  label,
  title,
  description,
  visual,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  description: string;
  visual: React.ReactNode;
  delay: number;
}) {
  return (
    <div className={`rounded-xl border border-white/5 bg-white/[0.02] p-6 sm:p-8 transition-all hover:border-white/10 animate-fade-in-up-delay-${delay}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-red-400">{icon}</span>
        <span className="text-[10px] font-mono text-red-400/60 uppercase tracking-widest">{label}</span>
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
      {visual}
    </div>
  );
}
