"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  getRealmInfo,
  getRealmProposals,
  getVoterTokenOwnerRecord,
  getExistingVoteRecord,
  buildCastVoteIx,
  getConnection,
  parseVoteError,
  type ProposalInfo,
  type ProgramAccount,
  type Realm,
  type TokenOwnerRecord,
  type VoteRecord,
  ProposalState,
  VoteKind,
} from "@/lib/governance";
import { getRegistryMap, type RegistryDAO } from "@/lib/registry";
import DAOAvatar from "@/components/DAOAvatar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { shortenAddress, timeAgo, safeToNumber } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import { SkeletonProposalList } from "@/components/Skeleton";
import VoteConfirmDialog from "@/components/VoteConfirmDialog";
import { ArrowLeft, FileText, Funnel, Warning, ThumbsUp, ThumbsDown, MinusCircle, CheckCircle } from "@phosphor-icons/react";

type FilterType = "all" | "active" | "completed" | "defeated";

export default function DAODetailPage() {
  const params = useParams();
  const realmId = params.realmId as string;
  const { publicKey, signTransaction, connected } = useWallet();

  const [realm, setRealm] = useState<ProgramAccount<Realm> | null>(null);
  const [registry, setRegistry] = useState<RegistryDAO | undefined>();
  const [proposals, setProposals] = useState<ProposalInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [voterRecord, setVoterRecord] = useState<ProgramAccount<TokenOwnerRecord> | null>(null);
  const [existingVotes, setExistingVotes] = useState<Map<string, ProgramAccount<VoteRecord>>>(new Map());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        let realmPubkey: PublicKey;
        try {
          realmPubkey = new PublicKey(realmId);
        } catch {
          if (!cancelled) {
            setError("Invalid DAO address");
            setLoading(false);
          }
          return;
        }
        const [realmData, regMap] = await Promise.all([
          getRealmInfo(realmPubkey),
          getRegistryMap(),
        ]);
        const regEntry = regMap.get(realmId);
        const progId = regEntry?.programId
          ? new PublicKey(regEntry.programId)
          : undefined;
        const proposalData = await getRealmProposals(realmPubkey, progId);
        if (!cancelled) {
          setRealm(realmData);
          setProposals(proposalData);
          setRegistry(regEntry);
        }
      } catch (err) {
        console.error("Failed to load DAO:", err);
        if (!cancelled) setError("Failed to load DAO. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [realmId]);

  // Fetch voter record when wallet is connected and realm is loaded
  useEffect(() => {
    let cancelled = false;
    async function loadVoterData() {
      if (!publicKey || !realm) return;
      try {
        const record = await getVoterTokenOwnerRecord(
          new PublicKey(realmId),
          realm.account.communityMint,
          publicKey
        );
        if (cancelled) return;
        setVoterRecord(record);

        // Check existing votes for active proposals
        if (record) {
          const activeProposals = proposals.filter((p) => p.proposal.state === ProposalState.Voting);
          const votes = new Map<string, ProgramAccount<VoteRecord>>();
          for (const p of activeProposals) {
            try {
              const vr = await getExistingVoteRecord(p.pubkey, record.pubkey);
              if (vr && !cancelled) votes.set(p.pubkey.toBase58(), vr);
            } catch { /* skip */ }
          }
          if (!cancelled) setExistingVotes(votes);
        }
      } catch { /* skip */ }
    }
    loadVoterData();
    return () => { cancelled = true; };
  }, [publicKey, realm, realmId, proposals]);

  const handleInlineVote = async (
    proposalInfo: ProposalInfo,
    voteType: "approve" | "deny" | "abstain"
  ) => {
    if (!publicKey || !signTransaction || !voterRecord || !realm) return;
    const proposalKey = proposalInfo.pubkey.toBase58();

    // Optimistic update: immediately mark as voted to prevent double-clicks
    const optimisticVote = {
      pubkey: proposalInfo.pubkey,
      account: { vote: { voteType: voteType === "approve" ? VoteKind.Approve : voteType === "deny" ? VoteKind.Deny : VoteKind.Abstain } },
    } as ProgramAccount<VoteRecord>;
    setExistingVotes((prev) => new Map(prev).set(proposalKey, optimisticVote));

    try {
      const p = proposalInfo.proposal;
      const instructions = await buildCastVoteIx({
        realm: new PublicKey(realmId),
        governance: p.governance,
        proposal: proposalInfo.pubkey,
        proposalOwnerRecord: p.tokenOwnerRecord,
        voterTokenOwnerRecord: voterRecord.pubkey,
        governanceAuthority: publicKey,
        governingTokenMint: p.governingTokenMint,
        payer: publicKey,
        voteType,
      });

      const connection = getConnection();
      const tx = new Transaction();
      tx.add(...instructions);
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig);

      // Refresh with real vote record from chain
      try {
        const vr = await getExistingVoteRecord(proposalInfo.pubkey, voterRecord.pubkey);
        if (vr) setExistingVotes((prev) => new Map(prev).set(proposalKey, vr));
      } catch { /* optimistic update stays */ }

      return { success: true, sig };
    } catch (err) {
      // Rollback optimistic update on failure
      setExistingVotes((prev) => {
        const next = new Map(prev);
        next.delete(proposalKey);
        return next;
      });
      return { success: false, error: parseVoteError(err) };
    }
  };

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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Warning size={48} className="mb-4 text-red-400" />
        <p className="text-lg font-medium">Something went wrong</p>
        <p className="text-sm text-muted mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          Try Again
        </button>
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
          <div className="flex items-center gap-3 mb-1">
            <DAOAvatar imageUrl={registry?.ogImage} name={realm.account.name} size={44} />
            <h1 className="text-3xl font-bold">{realm.account.name}</h1>
          </div>
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
            <ProposalRow
              key={p.pubkey.toBase58()}
              proposal={p}
              realmId={realmId}
              canVote={connected && !!voterRecord && !existingVotes.has(p.pubkey.toBase58())}
              existingVote={existingVotes.get(p.pubkey.toBase58()) ?? null}
              onVote={handleInlineVote}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalRow({
  proposal,
  realmId,
  canVote,
  existingVote,
  onVote,
}: {
  proposal: ProposalInfo;
  realmId: string;
  canVote: boolean;
  existingVote: ProgramAccount<VoteRecord> | null;
  onVote: (p: ProposalInfo, voteType: "approve" | "deny" | "abstain") => Promise<{ success: boolean; sig?: string; error?: string } | undefined>;
}) {
  const p = proposal.proposal;
  const timestamp = p.votingAt ? safeToNumber(p.votingAt) : safeToNumber(p.draftAt);
  const isActive = p.state === ProposalState.Voting;
  const [voting, setVoting] = useState(false);
  const [inlineResult, setInlineResult] = useState<{ success: boolean; message: string } | null>(null);
  const [pendingVote, setPendingVote] = useState<"approve" | "deny" | "abstain" | null>(null);

  const handleClick = (e: React.MouseEvent, voteType: "approve" | "deny" | "abstain") => {
    e.preventDefault();
    e.stopPropagation();
    setPendingVote(voteType);
  };

  const confirmVote = async () => {
    if (!pendingVote) return;
    const voteType = pendingVote;
    setPendingVote(null);
    setVoting(true);
    setInlineResult(null);
    const result = await onVote(proposal, voteType);
    setVoting(false);
    if (result?.success) {
      setInlineResult({ success: true, message: "Vote submitted!" });
    } else if (result?.error) {
      setInlineResult({ success: false, message: result.error });
    }
  };

  return (
    <Link href={`/proposal/${proposal.pubkey.toBase58()}?realm=${realmId}`}>
      <div className="group rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-accent/30 hover:bg-white/[0.07] cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge state={p.state} />
              <span className="text-xs text-muted">{timeAgo(timestamp)}</span>
            </div>
            <h3 className="font-medium truncate">{p.name}</h3>
          </div>

          {isActive && (
            <div className="ml-4 flex-shrink-0">
              <VoteBar proposal={p} />
            </div>
          )}
        </div>

        {/* Inline vote buttons for active proposals */}
        {isActive && (
          <div className="mt-3 flex items-center gap-2">
            {existingVote ? (
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <CheckCircle size={14} className="text-green-400" />
                <span>Voted {
                  existingVote.account.vote?.voteType === VoteKind.Approve ? "For" :
                  existingVote.account.vote?.voteType === VoteKind.Deny ? "Against" : "Abstain"
                }</span>
              </div>
            ) : canVote && !inlineResult ? (
              <>
                {voting ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <LoadingSpinner size={12} />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={(e) => handleClick(e, "approve")}
                      className="flex items-center gap-1 rounded-md bg-green-500/15 border border-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400 hover:bg-green-500/25 transition-colors"
                    >
                      <ThumbsUp size={12} weight="bold" />
                      For
                    </button>
                    <button
                      onClick={(e) => handleClick(e, "deny")}
                      className="flex items-center gap-1 rounded-md bg-red-500/15 border border-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/25 transition-colors"
                    >
                      <ThumbsDown size={12} weight="bold" />
                      Against
                    </button>
                    <button
                      onClick={(e) => handleClick(e, "abstain")}
                      className="flex items-center gap-1 rounded-md bg-gray-500/15 border border-gray-500/20 px-2.5 py-1 text-xs font-medium text-gray-400 hover:bg-gray-500/25 transition-colors"
                    >
                      <MinusCircle size={12} weight="bold" />
                      Abstain
                    </button>
                  </>
                )}
              </>
            ) : inlineResult ? (
              <div className={`flex items-center gap-1.5 text-xs ${inlineResult.success ? "text-green-400" : "text-red-400"}`}>
                {inlineResult.success ? <CheckCircle size={14} /> : <Warning size={14} />}
                <span>{inlineResult.message}</span>
              </div>
            ) : null}
          </div>
        )}

        {pendingVote && (
          <VoteConfirmDialog
            proposalName={p.name}
            voteType={pendingVote}
            onConfirm={confirmVote}
            onCancel={() => setPendingVote(null)}
          />
        )}
      </div>
    </Link>
  );
}

function VoteBar({ proposal }: { proposal: import("@solana/spl-governance").Proposal }) {
  const yes = proposal.options?.[0]?.voteWeight ? safeToNumber(proposal.options[0].voteWeight) : 0;
  const no = proposal.denyVoteWeight ? safeToNumber(proposal.denyVoteWeight) : 0;
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
