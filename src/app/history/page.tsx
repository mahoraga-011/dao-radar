"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import {
  getUserVoteRecords,
  getProposalDetail,
  VoteKind,
  type ProgramAccount,
  type VoteRecord,
  type Proposal,
} from "@/lib/governance";
import { shortenAddress } from "@/lib/utils";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  ClockCounterClockwise,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  Wallet,
} from "@phosphor-icons/react";

type VoteHistoryItem = {
  voteRecord: ProgramAccount<VoteRecord>;
  proposal?: ProgramAccount<Proposal>;
};

export default function HistoryPage() {
  const { publicKey, connected } = useWallet();
  const [votes, setVotes] = useState<VoteHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!publicKey) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const voteRecords = await getUserVoteRecords(publicKey);
        const items: VoteHistoryItem[] = [];

        // Fetch proposal names in batches of 5 to avoid RPC overload
        const recent = voteRecords.slice(0, 20);
        const BATCH_SIZE = 5;
        for (let i = 0; i < recent.length; i += BATCH_SIZE) {
          const batch = recent.slice(i, i + BATCH_SIZE);
          await Promise.allSettled(
            batch.map(async (vr) => {
              try {
                const proposal = await getProposalDetail(vr.account.proposal);
                items.push({ voteRecord: vr, proposal });
              } catch {
                items.push({ voteRecord: vr });
              }
            })
          );
        }

        if (!cancelled) setVotes(items);
      } catch (err) {
        console.error("Failed to load vote history:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [publicKey]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Wallet size={48} className="mb-4 text-muted" />
        <p className="text-lg font-medium">Connect Your Wallet</p>
        <p className="text-sm text-muted mt-1">
          Connect your wallet to see your voting history across all DAOs.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ClockCounterClockwise size={32} />
          Voting History
        </h1>
        <p className="text-sm text-muted mt-1">
          Your votes across all Solana DAOs
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner size={40} />
          <span className="ml-3 text-muted">Loading voting history...</span>
        </div>
      ) : votes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ClockCounterClockwise size={48} className="mb-4 text-muted" />
          <p className="text-lg font-medium">No votes yet</p>
          <p className="text-sm text-muted mt-1">
            Start participating in DAO governance!
          </p>
          <Link
            href="/dashboard"
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Explore DAOs
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {votes.map((item) => (
              <VoteHistoryRow key={item.voteRecord.pubkey.toBase58()} item={item} />
            ))}
          </div>
          {votes.length >= 20 && (
            <p className="mt-4 text-center text-xs text-muted">Showing 20 most recent votes</p>
          )}
        </>
      )}
    </div>
  );
}

function VoteHistoryRow({ item }: { item: VoteHistoryItem }) {
  const vr = item.voteRecord.account;
  const vote = vr.vote;

  let voteIcon = <MinusCircle size={20} className="text-gray-400" />;
  let voteLabel = "Unknown";

  if (vote) {
    if (vote.voteType === VoteKind.Approve) {
      voteIcon = <ThumbsUp size={20} className="text-green-400" />;
      voteLabel = "Approved";
    } else if (vote.voteType === VoteKind.Deny) {
      voteIcon = <ThumbsDown size={20} className="text-red-400" />;
      voteLabel = "Denied";
    } else if (vote.voteType === VoteKind.Abstain) {
      voteIcon = <MinusCircle size={20} className="text-gray-400" />;
      voteLabel = "Abstained";
    }
  }

  const proposalName = item.proposal?.account.name || shortenAddress(vr.proposal.toBase58(), 8);

  return (
    <Link href={`/proposal/${vr.proposal.toBase58()}`}>
      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 hover:border-accent/30 hover:bg-white/[0.07] transition-all cursor-pointer">
        {voteIcon}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{proposalName}</p>
          <p className="text-xs text-muted">
            Proposal: {shortenAddress(vr.proposal.toBase58())}
          </p>
        </div>
        <span className="text-sm text-muted">{voteLabel}</span>
      </div>
    </Link>
  );
}
