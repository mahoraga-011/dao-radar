"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  getProposalDetail,
  getRealmInfo,
  fetchProposalDescription,
  buildCastVoteIx,
  getConnection,
  ProposalState,
  type ProgramAccount,
  type Proposal,
  type Realm,
} from "@/lib/governance";
import { summarizeProposal } from "@/lib/ai-summary";
import { shortenAddress, timeAgo, formatNumber } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import Markdown from "react-markdown";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  Brain,
  Warning,
  CheckCircle,
} from "@phosphor-icons/react";

export default function ProposalDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const proposalId = params.proposalId as string;
  const realmId = searchParams.get("realm");

  const { publicKey, signTransaction, connected } = useWallet();

  const [proposal, setProposal] = useState<ProgramAccount<Proposal> | null>(null);
  const [realm, setRealm] = useState<ProgramAccount<Realm> | null>(null);
  const [description, setDescription] = useState("");
  const [aiSummary, setAiSummary] = useState<{ summary: string; impact: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [voteResult, setVoteResult] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const proposalPubkey = new PublicKey(proposalId);
        const proposalData = await getProposalDetail(proposalPubkey);
        if (cancelled) return;
        setProposal(proposalData);

        if (realmId) {
          try {
            const realmData = await getRealmInfo(new PublicKey(realmId));
            if (!cancelled) setRealm(realmData);
          } catch { /* skip */ }
        }

        // Fetch description
        if (proposalData.account.descriptionLink) {
          const desc = await fetchProposalDescription(proposalData.account.descriptionLink);
          if (!cancelled) setDescription(desc);
        }
      } catch (err) {
        console.error("Failed to load proposal:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [proposalId, realmId]);

  const generateSummary = useCallback(async () => {
    if (!proposal) return;
    setAiLoading(true);
    try {
      const result = await summarizeProposal(proposal.account.name, description);
      setAiSummary(result);
    } catch (err) {
      console.error("AI summary error:", err);
    } finally {
      setAiLoading(false);
    }
  }, [proposal, description]);

  // Auto-generate summary when description is loaded
  useEffect(() => {
    if (proposal && !aiSummary && !aiLoading) {
      generateSummary();
    }
  }, [proposal, description, aiSummary, aiLoading, generateSummary]);

  const handleVote = async (voteType: "approve" | "deny" | "abstain") => {
    if (!publicKey || !signTransaction || !proposal || !realmId) return;
    setVoting(true);
    setVoteResult(null);

    try {
      const p = proposal.account;
      const instructions = await buildCastVoteIx({
        realm: new PublicKey(realmId),
        governance: p.governance,
        proposal: proposal.pubkey,
        proposalOwnerRecord: p.tokenOwnerRecord,
        voterTokenOwnerRecord: p.tokenOwnerRecord, // user's record - simplified
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

      setVoteResult(`Vote submitted! Signature: ${shortenAddress(sig, 8)}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setVoteResult(`Vote failed: ${message}`);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size={40} />
        <span className="ml-3 text-muted">Loading proposal...</span>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Warning size={48} className="mb-4 text-muted" />
        <p className="text-lg">Proposal not found</p>
      </div>
    );
  }

  const p = proposal.account;
  const yesVotes = p.options?.[0]?.voteWeight?.toNumber() || 0;
  const noVotes = p.denyVoteWeight?.toNumber() || 0;
  const abstainVotes = p.abstainVoteWeight?.toNumber() || 0;
  const totalVotes = yesVotes + noVotes + abstainVotes;
  const yesPercent = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0;
  const noPercent = totalVotes > 0 ? (noVotes / totalVotes) * 100 : 0;
  const timestamp = p.votingAt?.toNumber() || p.draftAt.toNumber();
  const isActive = p.state === ProposalState.Voting;

  return (
    <div className="max-w-3xl">
      <Link
        href={realmId ? `/dao/${realmId}` : "/dashboard"}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        {realm ? `Back to ${realm.account.name}` : "Back"}
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <StatusBadge state={p.state} />
          <span className="text-sm text-muted">{timeAgo(timestamp)}</span>
        </div>
        <h1 className="text-2xl font-bold">{p.name}</h1>
        {realm && (
          <p className="text-sm text-muted mt-1">{realm.account.name}</p>
        )}
      </div>

      {/* AI Summary */}
      <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={20} className="text-accent" />
          <h2 className="font-semibold text-accent">AI Summary</h2>
        </div>
        {aiLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <LoadingSpinner size={16} />
            Generating summary...
          </div>
        ) : aiSummary ? (
          <div>
            <p className="text-sm leading-relaxed mb-2">{aiSummary.summary}</p>
            <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium">
              Impact: {aiSummary.impact}
            </span>
          </div>
        ) : (
          <button
            onClick={generateSummary}
            className="text-sm text-accent hover:underline"
          >
            Generate AI summary
          </button>
        )}
      </div>

      {/* Vote Counts */}
      <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-semibold mb-4">Vote Results</h2>

        <div className="space-y-3">
          <VoteBarRow label="For" count={yesVotes} percent={yesPercent} color="bg-green-400" />
          <VoteBarRow label="Against" count={noVotes} percent={noPercent} color="bg-red-400" />
          {abstainVotes > 0 && (
            <VoteBarRow
              label="Abstain"
              count={abstainVotes}
              percent={totalVotes > 0 ? (abstainVotes / totalVotes) * 100 : 0}
              color="bg-gray-400"
            />
          )}
        </div>

        <p className="mt-3 text-xs text-muted">
          Total votes: {formatNumber(totalVotes / 1e6)}
        </p>
      </div>

      {/* Vote Buttons */}
      {isActive && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold mb-4">Cast Your Vote</h2>

          {!connected ? (
            <p className="text-sm text-muted">
              Connect your wallet to vote on this proposal.
            </p>
          ) : (
            <>
              <div className="flex gap-3">
                <button
                  onClick={() => handleVote("approve")}
                  disabled={voting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-500/20 border border-green-500/30 py-3 font-medium text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                >
                  <ThumbsUp size={20} weight="bold" />
                  For
                </button>
                <button
                  onClick={() => handleVote("deny")}
                  disabled={voting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500/20 border border-red-500/30 py-3 font-medium text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  <ThumbsDown size={20} weight="bold" />
                  Against
                </button>
                <button
                  onClick={() => handleVote("abstain")}
                  disabled={voting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-500/20 border border-gray-500/30 py-3 font-medium text-gray-400 hover:bg-gray-500/30 transition-colors disabled:opacity-50"
                >
                  <MinusCircle size={20} weight="bold" />
                  Abstain
                </button>
              </div>

              {voting && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                  <LoadingSpinner size={16} />
                  Submitting vote...
                </div>
              )}

              {voteResult && (
                <div className={`mt-3 flex items-center gap-2 text-sm ${voteResult.includes("failed") ? "text-red-400" : "text-green-400"}`}>
                  {voteResult.includes("failed") ? <Warning size={16} /> : <CheckCircle size={16} />}
                  {voteResult}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Description */}
      {description && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold mb-3">Description</h2>
          <div className="prose prose-invert prose-sm max-w-none text-sm text-muted leading-relaxed [&_a]:text-red-400 [&_a:hover]:underline [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_code]:bg-white/10 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-white/5 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_blockquote]:border-l-2 [&_blockquote]:border-red-400/30 [&_blockquote]:pl-3 [&_blockquote]:italic">
            <Markdown>{description}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}

function VoteBarRow({
  label,
  count,
  percent,
  color,
}: {
  label: string;
  count: number;
  percent: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted">
          {formatNumber(count / 1e6)} ({percent.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full animate-vote-bar ${color}`}
          style={{ width: `${Math.max(percent, 0.5)}%` }}
        />
      </div>
    </div>
  );
}
