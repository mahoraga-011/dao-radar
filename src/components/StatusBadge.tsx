"use client";

import { ProposalState, getProposalStateLabel, getProposalStateColor } from "@/lib/governance";

export default function StatusBadge({ state }: { state: ProposalState }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getProposalStateColor(state)}`}
    >
      {getProposalStateLabel(state)}
    </span>
  );
}
