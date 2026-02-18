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
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Buildings,
  Lightning,
  Users,
  MagnifyingGlass,
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
          // If user has no DAOs, show featured as well
          if (results.length === 0) {
            results = await getFeaturedRealms();
          }
        } else {
          results = await getFeaturedRealms();
        }
        if (!cancelled) setDaos(results);
      } catch (err) {
        console.error("Failed to load DAOs:", err);
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
            className="rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner size={40} />
          <span className="ml-3 text-muted">Loading DAOs...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Buildings size={48} className="mb-4 text-muted" />
          <p className="text-lg font-medium">No DAOs found</p>
          <p className="text-sm text-muted mt-1">
            {connected
              ? "You don't have governance tokens deposited in any DAOs"
              : "Connect your wallet to see your DAOs"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      <div className="group rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:border-accent/30 hover:bg-white/[0.07] cursor-pointer">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Buildings size={24} weight="bold" />
          </div>
          <h3 className="text-lg font-semibold truncate">
            {dao.realm.account.name}
          </h3>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted">
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
