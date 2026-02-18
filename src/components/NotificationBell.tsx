"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { Bell, Lightning, X } from "@phosphor-icons/react";
import { getUserDAOs } from "@/lib/governance";
import { ProposalState } from "@solana/spl-governance";
import {
  requestNotificationPermission,
  notifyNewProposals,
  type ActiveProposalAlert,
} from "@/lib/notifications";
import { getAllProposals } from "@solana/spl-governance";
import { getConnection, SPL_GOV_PROGRAM_ID } from "@/lib/governance";

interface ProposalNotif {
  proposalId: string;
  proposalName: string;
  daoName: string;
  realmId: string;
  isNew: boolean;
}

export default function NotificationBell() {
  const { publicKey, connected } = useWallet();
  const [notifications, setNotifications] = useState<ProposalNotif[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!publicKey || !connected) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const daos = await getUserDAOs(publicKey);
      const allActive: ProposalNotif[] = [];
      const alertBatch: ActiveProposalAlert[] = [];

      for (const dao of daos) {
        try {
          const connection = getConnection();
          const proposals = await getAllProposals(
            connection,
            SPL_GOV_PROGRAM_ID,
            dao.realmPubkey
          );

          for (const batch of proposals) {
            for (const p of batch) {
              if (p.account.state === ProposalState.Voting) {
                const item = {
                  proposalId: p.pubkey.toBase58(),
                  proposalName: p.account.name,
                  daoName: dao.realm.account.name,
                  realmId: dao.realmPubkey.toBase58(),
                };
                allActive.push({ ...item, isNew: false });
                alertBatch.push(item);
              }
            }
          }
        } catch {
          // Skip failed DAOs
        }
      }

      // Check which are new and send browser notifications
      const newOnes = notifyNewProposals(alertBatch);
      const newIds = new Set(newOnes.map((n) => n.proposalId));

      setNotifications(
        allActive.map((n) => ({
          ...n,
          isNew: newIds.has(n.proposalId),
        }))
      );
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected]);

  // Fetch on wallet connect + request permission
  useEffect(() => {
    if (connected && publicKey) {
      requestNotificationPermission();
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [connected, publicKey, fetchNotifications]);

  // Poll every 5 minutes
  useEffect(() => {
    if (!connected) return;
    const interval = setInterval(fetchNotifications, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [connected, fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!connected) return null;

  const activeCount = notifications.length;
  const newCount = notifications.filter((n) => n.isNew).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:border-red-500/30 hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} weight={activeCount > 0 ? "fill" : "regular"} className={activeCount > 0 ? "text-red-400" : "text-muted"} />
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-white/10 bg-[#111111] shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-semibold">
              Active Proposals
              {activeCount > 0 && (
                <span className="ml-2 text-xs text-red-400">({activeCount})</span>
              )}
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-muted hover:text-foreground">
              <X size={16} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted">
                Scanning your DAOs...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted">
                No active proposals right now
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.proposalId}
                  href={`/proposal/${n.proposalId}?realm=${n.realmId}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                >
                  <div className="mt-0.5">
                    <Lightning
                      size={16}
                      weight="fill"
                      className={n.isNew ? "text-red-400" : "text-green-400"}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {n.proposalName}
                    </p>
                    <p className="text-xs text-muted truncate">{n.daoName}</p>
                  </div>
                  {n.isNew && (
                    <span className="mt-0.5 rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
                      NEW
                    </span>
                  )}
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-white/10 px-4 py-2">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                View all DAOs →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
