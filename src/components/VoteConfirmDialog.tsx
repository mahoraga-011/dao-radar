"use client";

import { ThumbsUp, ThumbsDown, MinusCircle, Warning } from "@phosphor-icons/react";

type VoteType = "approve" | "deny" | "abstain";

const VOTE_CONFIG: Record<VoteType, { label: string; icon: typeof ThumbsUp; colorClass: string; bgClass: string }> = {
  approve: { label: "For", icon: ThumbsUp, colorClass: "text-green-400", bgClass: "bg-green-500 hover:bg-green-400" },
  deny: { label: "Against", icon: ThumbsDown, colorClass: "text-red-400", bgClass: "bg-red-500 hover:bg-red-400" },
  abstain: { label: "Abstain", icon: MinusCircle, colorClass: "text-gray-400", bgClass: "bg-gray-500 hover:bg-gray-400" },
};

export default function VoteConfirmDialog({
  proposalName,
  voteType,
  onConfirm,
  onCancel,
}: {
  proposalName: string;
  voteType: VoteType;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const config = VOTE_CONFIG[voteType];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="mx-4 w-full max-w-sm rounded-xl border border-white/10 bg-[#141414] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <Warning size={24} className="text-amber-400" />
          <h3 className="text-lg font-semibold">Confirm Vote</h3>
        </div>

        <p className="text-sm text-muted mb-1">You are about to vote</p>
        <div className={`flex items-center gap-2 text-lg font-semibold mb-3 ${config.colorClass}`}>
          <Icon size={24} weight="bold" />
          {config.label}
        </div>
        <p className="text-sm text-muted mb-6">
          on <span className="text-foreground font-medium">{proposalName.length > 80 ? proposalName.slice(0, 80) + "..." : proposalName}</span>
        </p>

        <p className="text-xs text-muted mb-5">This action cannot be undone. Votes are recorded on-chain.</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium text-white transition-colors ${config.bgClass}`}
          >
            Confirm {config.label}
          </button>
        </div>
      </div>
    </div>
  );
}
