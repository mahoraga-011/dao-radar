"use client";

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="skeleton h-10 w-10 rounded-lg" />
        <div className="skeleton h-5 w-36" />
      </div>
      <div className="flex items-center gap-4">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-4 w-24" />
      </div>
    </div>
  );
}

export function SkeletonProposalRow() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-4 w-12" />
        </div>
        <div className="skeleton h-5 w-64" />
      </div>
      <div className="skeleton h-6 w-24 ml-4" />
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonProposalList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProposalRow key={i} />
      ))}
    </div>
  );
}
