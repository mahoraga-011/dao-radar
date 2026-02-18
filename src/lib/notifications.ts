/**
 * Browser notification service for DAO proposal alerts.
 */

const PERMISSION_KEY = "dao-radar-notif-permission-asked";
const SEEN_PROPOSALS_KEY = "dao-radar-seen-proposals";

/** Request notification permission (only asks once) */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;

  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  // Only ask once per session
  const asked = sessionStorage.getItem(PERMISSION_KEY);
  if (asked) return false;

  sessionStorage.setItem(PERMISSION_KEY, "true");
  const result = await Notification.requestPermission();
  return result === "granted";
}

/** Get set of already-seen proposal IDs */
function getSeenProposals(): Set<string> {
  try {
    const stored = localStorage.getItem(SEEN_PROPOSALS_KEY);
    if (stored) return new Set(JSON.parse(stored));
  } catch {}
  return new Set();
}

/** Mark proposals as seen */
function markProposalsSeen(ids: string[]): void {
  const seen = getSeenProposals();
  ids.forEach((id) => seen.add(id));
  // Keep only last 500 to prevent unbounded growth
  const arr = Array.from(seen).slice(-500);
  localStorage.setItem(SEEN_PROPOSALS_KEY, JSON.stringify(arr));
}

export interface ActiveProposalAlert {
  proposalId: string;
  proposalName: string;
  daoName: string;
  realmId: string;
}

/** Send browser notification for new active proposals */
export function notifyNewProposals(proposals: ActiveProposalAlert[]): ActiveProposalAlert[] {
  const seen = getSeenProposals();
  const newOnes = proposals.filter((p) => !seen.has(p.proposalId));

  if (newOnes.length === 0) return [];

  // Mark as seen
  markProposalsSeen(newOnes.map((p) => p.proposalId));

  // Send browser notification if permitted
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    if (newOnes.length === 1) {
      const p = newOnes[0];
      new Notification(`New proposal in ${p.daoName}`, {
        body: p.proposalName,
        icon: "/favicon.svg",
        tag: `dao-radar-${p.proposalId}`,
      });
    } else {
      new Notification(`${newOnes.length} new active proposals`, {
        body: newOnes.map((p) => `${p.daoName}: ${p.proposalName}`).slice(0, 3).join("\n"),
        icon: "/favicon.svg",
        tag: "dao-radar-batch",
      });
    }
  }

  return newOnes;
}
