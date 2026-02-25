"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { type DAOInfo } from "@/lib/governance";
import { getRegistry, type RegistryDAO } from "@/lib/registry";
import { useGovernance } from "@/contexts/GovernanceContext";
import { formatNumber } from "@/lib/utils";
import DAOAvatar from "@/components/DAOAvatar";
import { SkeletonGrid } from "@/components/Skeleton";
import {
  Lightning,
  Users,
  MagnifyingGlass,
  Globe,
  Buildings,
} from "@phosphor-icons/react";

// Curated subset of registry DAOs for browse mode (no RPC needed)
const BROWSE_REALM_IDS = new Set([
  "2Z5BXuRCJPqYUCBGyQTwAXHeJoFAnbtvoXja19aZFLKY", // Jupiter
  "9nUyxzVL2FUMuWUiVZG66gwK15CJiM3PoLkfrnGfkvt6", // Drift
  "3gmcbygQUUDgmtDtx41R7xSf3K4oFXrH9icPNijyq9pS", // Marinade
  "WQa9YVA3SVspDUjmnjMj4uygJpxR814mD931FhLxLvx",  // Pyth
  "6qGHqcZY4zLCWFvvBKfr8tHQfkD8arz8mAQPt4TDvTy5", // Helium
  "DPiH3H3c7t47BMxqTxLsuPQpEC6Kne8GA9VXbxpnZxFE", // Mango
  "84pGFuy1Y27ApK67ApethaPvexeDWA66zNV8gm38TVeQ", // Bonk
  "4sgAydAiSvnpT73rALCcnYGhi5K2LrB9pJFAEbLMfrXt", // Tensor
  "ConzwGtFktKLA2M7451S6jmW1tB3tRD9augz9zFA46Yr", // Metaplex
  "53pMaU2DXieGxwXZLMN1rgDECwFrxuYw5u9QgEFCx4Rd", // Kamino
  "m8BR9yA89AJ9f2u3KeAFasJSuXDnd3xYDJJkBvQ2iw6", // MonkeDAO
  "FoVoUr6dFeXYDw2vKr76tZLkjJ8zFeVsjMruWNghtoXJ", // marginfi
  "8msNFq5VBectsGAv66zYx5QRve1p3m6ZEz49xaWX3tbd", // Parcl
  "5EuXAPZCpzZnqpzVRX5Ytizh9BFVtbz3H8Xk9H5onxHD", // Solend
  "GDBJ3qv4tJXiCbz5ASkSMYq6Xfb35MdXsMzgVaMnr9Q7", // Raydium
  "By2sVGZXwfQq6rAiAM3rNPJ9iQfb5e2QhnF4YjJ4Bip", // Grape
  "DkSvNgykZPPFczhJVh8HDkhz25ByrDoPcB32q75AYu9k", // UXD
  "9MwbgfEkV8ZaeycfciBqytcxwfdYHqD2NYjsTZkH4GxA", // Magic Eden
]);

interface BrowseDAO {
  realmId: string;
  displayName: string;
  ogImage?: string;
}

export default function DashboardPage() {
  const { connected } = useWallet();
  const { userDAOs, registryMap, loading: contextLoading } = useGovernance();
  const [browseDaos, setBrowseDaos] = useState<BrowseDAO[]>([]);
  const [browseLoading, setBrowseLoading] = useState(!connected);
  const [searchTerm, setSearchTerm] = useState("");

  // Load browse DAOs from registry when not connected (0 RPC calls)
  useEffect(() => {
    if (connected) {
      setBrowseDaos([]);
      return;
    }
    setBrowseLoading(true);
    getRegistry()
      .then((registry) => {
        const curated = registry
          .filter((d) => BROWSE_REALM_IDS.has(d.realmId))
          .map((d) => ({ realmId: d.realmId, displayName: d.displayName, ogImage: d.ogImage }));
        setBrowseDaos(curated);
      })
      .catch(() => setBrowseDaos([]))
      .finally(() => setBrowseLoading(false));
  }, [connected]);

  const loading = connected ? contextLoading : browseLoading;

  // Filter logic
  const filteredDAOs = connected
    ? userDAOs.filter((d) =>
        d.realm.account.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : browseDaos.filter((d) =>
        d.displayName.toLowerCase().includes(searchTerm.toLowerCase())
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
      ) : filteredDAOs.length === 0 ? (
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
                  ? "You don't have governance tokens deposited in any DAOs. To participate in governance, acquire tokens for a DAO and deposit them via Realms."
                  : "Connect your wallet to discover the DAOs where you have voting power."}
              </p>
              {connected && (
                <Link
                  href="/explore"
                  className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
                >
                  Explore DAOs
                </Link>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {connected
              ? (filteredDAOs as DAOInfo[]).map((dao) => (
                  <DAOCard
                    key={dao.realmPubkey.toBase58()}
                    dao={dao}
                    registry={registryMap.get(dao.realmPubkey.toBase58())}
                  />
                ))
              : (filteredDAOs as BrowseDAO[]).map((dao) => (
                  <BrowseCard key={dao.realmId} dao={dao} />
                ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors"
            >
              <Globe size={16} />
              Explore all DAOs
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function DAOCard({ dao, registry }: { dao: DAOInfo; registry?: RegistryDAO }) {
  const votingPower = dao.votingPower
    ? formatNumber(dao.votingPower / 1e6)
    : null;

  return (
    <Link href={`/dao/${dao.realmPubkey.toBase58()}`}>
      <div className="card-hover group rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm cursor-pointer">
        <div className="mb-3 flex items-center gap-3">
          <DAOAvatar imageUrl={registry?.ogImage} name={dao.realm.account.name} size={40} />
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

function BrowseCard({ dao }: { dao: BrowseDAO }) {
  return (
    <Link href={`/dao/${dao.realmId}`}>
      <div className="card-hover group rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm cursor-pointer">
        <div className="mb-3 flex items-center gap-3">
          <DAOAvatar imageUrl={dao.ogImage} name={dao.displayName} size={40} />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold truncate">
              {dao.displayName}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );
}
