"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import {
  getUserDAOs,
  getFeaturedRealms,
  type DAOInfo,
} from "@/lib/governance";
import { formatNumber } from "@/lib/utils";
import { SkeletonGrid } from "@/components/Skeleton";
import {
  Buildings,
  Lightning,
  Users,
  MagnifyingGlass,
  Crosshair,
} from "@phosphor-icons/react";

export default function DashboardPage() {
  const { publicKey, connected } = useWallet();
  const [daos, setDaos] = useState<DAOInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        let results: DAOInfo[];
        if (connected && publicKey) {
          results = await getUserDAOs(publicKey);
          if (results.length === 0) {
            results = await getFeaturedRealms();
          }
        } else {
          results = await getFeaturedRealms();
        }
        if (!cancelled) setDaos(results);
      } catch (err) {
        console.error("Failed to load DAOs:", err);
        if (!cancelled) setDaos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [publicKey, connected]);

  const filtered = daos.filter((d) =>
    d.realm.account.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {connected ? "Your DAOs" : "Explore DAOs"}
          </h1>
          <p className="text-muted text-sm mt-1">
            {connected
              ? "DAOs where you have governance tokens deposited"
              : "Connect your wallet to see your DAOs, or browse featured ones"}
          </p>
        </div>

        <div className="relative">
          <MagnifyingGlass
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Search DAOs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none w-full md:w-64"
          />
        </div>
      </div>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          {searchTerm ? (
            <>
              <MagnifyingGlass size={48} className="mb-4 text-muted" />
              <p className="text-lg font-medium">No matching DAOs</p>
              <p className="text-sm text-muted mt-1">
                Try a different search term or clear the filter
              </p>
            </>
          ) : (
            <>
              <Buildings size={48} className="mb-4 text-muted" />
              <p className="text-lg font-medium">No DAOs found</p>
              <p className="text-sm text-muted mt-1 max-w-md">
                {connected
                  ? "You don't have governance tokens deposited in any DAOs yet. Browse featured DAOs below to get started."
                  : "Connect your wallet to discover the DAOs where you have voting power."}
              </p>
              {connected && (
                <Link
                  href="/dashboard"
                  className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
                >
                  <Crosshair size={16} className="inline mr-1.5 -mt-0.5" />
                  Browse Featured DAOs
                </Link>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((dao) => (
            <DAOCard key={dao.realmPubkey.toBase58()} dao={dao} />
          ))}
        </div>
      )}
    </div>
  );
}

function DAOCard({ dao }: { dao: DAOInfo }) {
  const votingPower = dao.votingPower
    ? formatNumber(dao.votingPower / 1e6)
    : null;

  return (
    <Link href={`/dao/${dao.realmPubkey.toBase58()}`}>
      <div className="card-hover group rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm cursor-pointer">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Buildings size={24} weight="bold" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold truncate">
              {dao.realm.account.name}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          {dao.activeProposals > 0 && (
            <div className="flex items-center gap-1">
              <Lightning size={16} className="text-green-400" />
              <span className="text-green-400 font-medium">
                {dao.activeProposals} active
              </span>
            </div>
          )}
          {votingPower && (
            <div className="flex items-center gap-1">
              <Users size={16} />
              <span>{votingPower} voting power</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
