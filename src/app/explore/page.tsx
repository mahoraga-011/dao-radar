"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { getRealms } from "@solana/spl-governance";
import { getConnection, SPL_GOV_PROGRAM_ID } from "@/lib/governance";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Buildings,
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  Warning,
  Globe,
} from "@phosphor-icons/react";

type RealmEntry = {
  pubkey: string;
  name: string;
};

const CACHE_KEY = "all_realms_cache";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const PAGE_SIZE = 50;

function getCachedRealms(): RealmEntry[] | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) return data;
  } catch { /* ignore */ }
  return null;
}

function setCachedRealms(data: RealmEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch { /* ignore */ }
}

export default function ExplorePage() {
  const [realms, setRealms] = useState<RealmEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = getCachedRealms();
      if (cached) {
        if (!cancelled) {
          setRealms(cached);
          setLoading(false);
        }
        return;
      }

      try {
        const connection = getConnection();
        const allRealms = await getRealms(connection, SPL_GOV_PROGRAM_ID);
        const entries: RealmEntry[] = allRealms
          .map((r) => ({
            pubkey: r.pubkey.toBase58(),
            name: r.account.name || "Unnamed DAO",
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        if (!cancelled) {
          setRealms(entries);
          setCachedRealms(entries);
        }
      } catch (err) {
        console.error("Failed to load realms:", err);
        const msg = err instanceof Error && err.message.includes("timeout")
          ? "Request timed out. The RPC may be overloaded — try again in a moment."
          : "Failed to load DAOs. The RPC may be rate-limited — try again in a moment.";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!searchTerm) return realms;
    const term = searchTerm.toLowerCase();
    return realms.filter((r) => r.name.toLowerCase().includes(term));
  }, [realms, searchTerm]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRealms = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when search changes
  useEffect(() => { setPage(0); }, [searchTerm]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe size={32} weight="bold" />
            Explore All DAOs
          </h1>
          <p className="text-sm text-muted mt-1">
            {realms.length > 0
              ? `${realms.length.toLocaleString()} DAOs on Solana governance`
              : "Loading all Solana governance DAOs..."}
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
        <div className="flex flex-col items-center justify-center py-24">
          <LoadingSpinner size={40} />
          <span className="mt-3 text-muted">Loading all DAOs — this may take a moment...</span>
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
              <p className="text-sm text-muted mt-1">Try a different search term</p>
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
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <Buildings size={20} weight="bold" />
                      </div>
                      <p className="font-medium truncate text-sm">{r.name}</p>
                    </div>
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
                    Page {page + 1} of {totalPages} ({filtered.length.toLocaleString()} results)
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
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
