"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { getRealms } from "@solana/spl-governance";
import { getConnection, SPL_GOV_PROGRAM_ID } from "@/lib/governance";
import { getRegistry, getRegistryMap, type RegistryDAO } from "@/lib/registry";
import DAOAvatar from "@/components/DAOAvatar";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  Warning,
  Globe,
  Database,
} from "@phosphor-icons/react";

type ExploreDAO = {
  pubkey: string;
  name: string;
  ogImage?: string;
  category?: string;
  shortDescription?: string;
};

const ALL_REALMS_CACHE_KEY = "all_realms_cache";
const ALL_REALMS_CACHE_TTL = 30 * 60 * 1000;
const PAGE_SIZE = 50;

function getCachedAllRealms(): ExploreDAO[] | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(ALL_REALMS_CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < ALL_REALMS_CACHE_TTL) return data;
  } catch {
    /* ignore */
  }
  return null;
}

function setCachedAllRealms(data: ExploreDAO[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      ALL_REALMS_CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

export default function ExplorePage() {
  const [registryDAOs, setRegistryDAOs] = useState<ExploreDAO[]>([]);
  const [allDAOs, setAllDAOs] = useState<ExploreDAO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [allLoading, setAllLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);

  // Load registry DAOs on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const registry = await getRegistry();
        if (!cancelled) {
          setRegistryDAOs(
            registry
              .map((r) => ({
                pubkey: r.realmId,
                name: r.displayName,
                ogImage: r.ogImage,
                category: r.category,
                shortDescription: r.shortDescription,
              }))
              .sort((a, b) => a.name.localeCompare(b.name))
          );
        }
      } catch (err) {
        console.error("Failed to load registry:", err);
        if (!cancelled) setError("Failed to load DAO registry.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load all on-chain DAOs when toggled
  useEffect(() => {
    if (!showAll || allDAOs) return;
    let cancelled = false;

    async function loadAll() {
      setAllLoading(true);

      // Check cache
      const cached = getCachedAllRealms();
      if (cached) {
        if (!cancelled) {
          setAllDAOs(cached);
          setAllLoading(false);
        }
        return;
      }

      try {
        const [allRealms, registryMap] = await Promise.all([
          getRealms(getConnection(), SPL_GOV_PROGRAM_ID),
          getRegistryMap(),
        ]);
        const entries: ExploreDAO[] = allRealms
          .map((r) => {
            const pk = r.pubkey.toBase58();
            const reg = registryMap.get(pk);
            return {
              pubkey: pk,
              name: reg?.displayName || r.account.name || "Unnamed DAO",
              ogImage: reg?.ogImage,
              category: reg?.category,
              shortDescription: reg?.shortDescription,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        if (!cancelled) {
          setAllDAOs(entries);
          setCachedAllRealms(entries);
        }
      } catch (err) {
        console.error("Failed to load all realms:", err);
        const msg =
          err instanceof Error && err.message.includes("timeout")
            ? "Request timed out. The RPC may be overloaded — try again in a moment."
            : "Failed to load all DAOs. The RPC may be rate-limited — try again in a moment.";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setAllLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [showAll, allDAOs]);

  const daos = showAll && allDAOs ? allDAOs : registryDAOs;

  const filtered = useMemo(() => {
    if (!searchTerm) return daos;
    const term = searchTerm.toLowerCase();
    return daos.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.category?.toLowerCase().includes(term) ||
        r.shortDescription?.toLowerCase().includes(term)
    );
  }, [daos, searchTerm]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRealms = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when search or mode changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm, showAll]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe size={32} weight="bold" />
            Explore DAOs
          </h1>
          <p className="text-sm text-muted mt-1">
            {showAll && allDAOs
              ? `${allDAOs.length.toLocaleString()} DAOs on Solana governance`
              : registryDAOs.length > 0
                ? `${registryDAOs.length} curated DAOs with logos & metadata`
                : "Loading curated DAOs..."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAll((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
              showAll
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-white/10 bg-white/5 text-muted hover:text-foreground"
            }`}
          >
            <Database size={16} />
            {showAll ? "Showing all DAOs" : "Show all 4,000+ DAOs"}
          </button>

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
      </div>

      {loading || (showAll && allLoading) ? (
        <div className="flex flex-col items-center justify-center py-24">
          <LoadingSpinner size={40} />
          <span className="mt-3 text-muted">
            {showAll
              ? "Loading all DAOs — this may take a moment..."
              : "Loading curated DAOs..."}
          </span>
        </div>
      ) : error ? (
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
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <MagnifyingGlass size={48} className="mb-4 text-muted" />
              <p className="text-lg font-medium">No matching DAOs</p>
              <p className="text-sm text-muted mt-1">
                Try a different search term
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pageRealms.map((r) => (
                  <Link
                    key={r.pubkey}
                    href={`/dao/${r.pubkey}`}
                    className="card-hover rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3">
                      <DAOAvatar
                        imageUrl={r.ogImage}
                        name={r.name}
                        size={36}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-sm">
                          {r.name}
                        </p>
                        {r.category && (
                          <span className="text-xs text-muted">
                            {r.category}
                          </span>
                        )}
                      </div>
                    </div>
                    {r.shortDescription && (
                      <p className="mt-2 text-xs text-muted line-clamp-2">
                        {r.shortDescription}
                      </p>
                    )}
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm disabled:opacity-30 hover:bg-white/10 transition-colors"
                  >
                    <CaretLeft size={16} /> Previous
                  </button>
                  <span className="text-sm text-muted">
                    Page {page + 1} of {totalPages} (
                    {filtered.length.toLocaleString()} results)
                  </span>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page >= totalPages - 1}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm disabled:opacity-30 hover:bg-white/10 transition-colors"
                  >
                    Next <CaretRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
