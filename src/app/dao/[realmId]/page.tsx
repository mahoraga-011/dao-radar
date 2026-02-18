"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import {
  getRealmInfo,
  getRealmProposals,
  type ProposalInfo,
  type ProgramAccount,
  type Realm,
  ProposalState,
} from "@/lib/governance";
import { shortenAddress, timeAgo } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import { SkeletonProposalList } from "@/components/Skeleton";
import { ArrowLeft, FileText, Funnel } from "@phosphor-icons/react";

type FilterType = "all" | "active" | "completed" | "defeated";

export default function DAODetailPage() {
  const params = useParams();
  const realmId = params.realmId as string;

  const [realm, setRealm] = useState<ProgramAccount<Realm> | null>(null);
  const [proposals, setProposals] = useState<ProposalInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const realmPubkey = new PublicKey(realmId);
        const [realmData, proposalData] = await Promise.all([
          getRealmInfo(realmPubkey),
          getRealmProposals(realmPubkey),
        ]);
        if (!cancelled) {
          setRealm(realmData);
          setProposals(proposalData);
        }
      } catch (err) {
        console.error("Failed to load DAO:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [realmId]);

  const filtered = proposals.filter((p) => {
    switch (filter) {
      case "active":
        return p.proposal.state === ProposalState.Voting;
      case "completed":
        return [ProposalState.Succeeded, ProposalState.Completed, ProposalState.Executing].includes(p.proposal.state);
      case "defeated":
        return [ProposalState.Defeated, ProposalState.Cancelled, ProposalState.Vetoed].includes(p.proposal.state);
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div>
        <div className="mb-6 skeleton h-4 w-32" />
        <div className="mb-8">
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-64" />
        </div>
        <SkeletonProposalList count={5} />
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      {realm && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{realm.account.name}</h1>
          <p className="mt-1 text-sm text-muted">
            Community Mint: {shortenAddress(realm.account.communityMint.toBase58())}
            {realm.account.config.councilMint && (
              <> · Council Mint: {shortenAddress(realm.account.config.councilMint.toBase58())}</>
            )}
          </p>
          <p className="mt-1 text-sm text-muted">
            {proposals.length} proposal{proposals.length !== 1 ? "s" : ""} ·{" "}
            {proposals.filter((p) => p.proposal.state === ProposalState.Voting).length} active
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-6 flex items-center gap-2">
        <Funnel size={18} className="text-muted" />
        {(["all", "active", "completed", "defeated"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-sm capitalize transition-colors ${
              filter === f
                ? "bg-accent text-white"
                : "bg-white/5 text-muted hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText size={48} className="mb-4 text-muted" />
          <p className="text-lg font-medium">No proposals found</p>
          <p className="text-sm text-muted">Try changing the filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <ProposalRow key={p.pubkey.toBase58()} proposal={p} realmId={realmId} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalRow({ proposal, realmId }: { proposal: ProposalInfo; realmId: string }) {
  const p = proposal.proposal;
  const timestamp = p.votingAt?.toNumber() || p.draftAt.toNumber();

  return (
    <Link href={`/proposal/${proposal.pubkey.toBase58()}?realm=${realmId}`}>
      <div className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-accent/30 hover:bg-white/[0.07] cursor-pointer">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge state={p.state} />
            <span className="text-xs text-muted">{timeAgo(timestamp)}</span>
          </div>
          <h3 className="font-medium truncate">{p.name}</h3>
        </div>

        {p.state === ProposalState.Voting && (
          <div className="ml-4 flex-shrink-0">
            <VoteBar proposal={p} />
          </div>
        )}
      </div>
    </Link>
  );
}

function VoteBar({ proposal }: { proposal: import("@solana/spl-governance").Proposal }) {
  const yes = proposal.options?.[0]?.voteWeight?.toNumber() || 0;
  const no = proposal.denyVoteWeight?.toNumber() || 0;
  const total = yes + no;
  const yesPercent = total > 0 ? (yes / total) * 100 : 50;

  return (
    <div className="w-24">
      <div className="flex justify-between text-xs text-muted mb-1">
        <span className="text-green-400">{total > 0 ? yesPercent.toFixed(0) : 0}%</span>
        <span className="text-red-400">{total > 0 ? (100 - yesPercent).toFixed(0) : 0}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-green-400"
          style={{ width: `${yesPercent}%` }}
        />
      </div>
    </div>
  );
}
