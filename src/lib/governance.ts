import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_URL } from "./rpc";
import { safeToNumber } from "./utils";
import {
  getRealm,
  getAllProposals,
  getTokenOwnerRecordsByOwner,
  getVoteRecordsByVoter,
  getGovernance,
  getProposal,
  getTokenOwnerRecordForRealm,
  withCastVote,
  Vote,
  VoteKind,
  VoteChoice,
  YesNoVote,
  ProposalState,
  type ProgramAccount,
  type Realm,
  type Proposal,
  type TokenOwnerRecord,
  type VoteRecord,
  type Governance,
} from "@solana/spl-governance";
export const SPL_GOV_PROGRAM_ID = new PublicKey(
  "GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw"
);

// Run async tasks with limited concurrency to avoid RPC rate limits
async function pMap<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency = 5
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = { status: "fulfilled", value: await fn(items[idx]) };
      } catch (reason) {
        results[idx] = { status: "rejected", reason };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

let _connection: Connection | null = null;
export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(RPC_URL, "confirmed");
  }
  return _connection;
}


export type DAOInfo = {
  realmPubkey: PublicKey;
  realm: ProgramAccount<Realm>;
  votingPower?: number;
  activeProposals: number;
  activeProposalSummaries: { pubkey: string; name: string }[];
  tokenOwnerRecord?: ProgramAccount<TokenOwnerRecord>;
};

export type ProposalInfo = {
  pubkey: PublicKey;
  proposal: Proposal;
  governancePubkey: PublicKey;
};

// Fetch all realms the user participates in via TokenOwnerRecords
export async function getUserDAOs(
  walletPubkey: PublicKey
): Promise<DAOInfo[]> {
  const connection = getConnection();
  const results: DAOInfo[] = [];

  try {
    const tokenOwnerRecords = await getTokenOwnerRecordsByOwner(
      connection,
      SPL_GOV_PROGRAM_ID,
      walletPubkey
    );

    const realmPubkeys = [
      ...new Set(tokenOwnerRecords.map((t) => t.account.realm.toBase58())),
    ];

    await pMap(realmPubkeys, async (realmPk) => {
      const realmPubkey = new PublicKey(realmPk);
      const realm = await getRealm(connection, realmPubkey);
      const userRecords = tokenOwnerRecords.filter(
        (t) => t.account.realm.toBase58() === realmPk
      );

      let primaryRecord: ProgramAccount<TokenOwnerRecord> | undefined;
      let maxDeposit = 0;
      let totalVotingPowerNum = 0;
      for (const r of userRecords) {
        const depositAmount = r.account.governingTokenDepositAmount;
        const amt = safeToNumber(depositAmount);
        totalVotingPowerNum += amt;
        if (amt > maxDeposit) {
          maxDeposit = amt;
          primaryRecord = r;
        }
      }

      let activeProposals = 0;
      const activeProposalSummaries: { pubkey: string; name: string }[] = [];
      try {
        const proposals = await getAllProposals(
          connection,
          SPL_GOV_PROGRAM_ID,
          realmPubkey
        );
        for (const batch of proposals) {
          for (const p of batch) {
            if (p.account.state === ProposalState.Voting) {
              activeProposals++;
              activeProposalSummaries.push({
                pubkey: p.pubkey.toBase58(),
                name: p.account.name,
              });
            }
          }
        }
      } catch {
        // skip
      }

      results.push({
        realmPubkey,
        realm,
        votingPower: totalVotingPowerNum,
        activeProposals,
        activeProposalSummaries,
        tokenOwnerRecord: primaryRecord,
      });
    }, 2);
  } catch (err) {
    console.error("Error fetching user DAOs:", err);
  }

  return results;
}


// Get all proposals for a realm
export async function getRealmProposals(
  realmPubkey: PublicKey,
  programId: PublicKey = SPL_GOV_PROGRAM_ID
): Promise<ProposalInfo[]> {
  const connection = getConnection();
  const proposals = await getAllProposals(
    connection,
    programId,
    realmPubkey
  );

  const result: ProposalInfo[] = [];
  for (const batch of proposals) {
    for (const p of batch) {
      result.push({
        pubkey: p.pubkey,
        proposal: p.account,
        governancePubkey: p.account.governance,
      });
    }
  }

  // Sort: active first, then by date
  result.sort((a, b) => {
    const aActive = a.proposal.state === ProposalState.Voting ? 0 : 1;
    const bActive = b.proposal.state === ProposalState.Voting ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    const aTime = a.proposal.votingAt ? safeToNumber(a.proposal.votingAt) : safeToNumber(a.proposal.draftAt);
    const bTime = b.proposal.votingAt ? safeToNumber(b.proposal.votingAt) : safeToNumber(b.proposal.draftAt);
    return bTime - aTime;
  });

  return result;
}

// Get a single proposal
export async function getProposalDetail(proposalPubkey: PublicKey) {
  const connection = getConnection();
  return getProposal(connection, proposalPubkey);
}

// Get governance info
export async function getGovernanceInfo(governancePubkey: PublicKey) {
  const connection = getConnection();
  return getGovernance(connection, governancePubkey);
}

// Get voter's TokenOwnerRecord for a realm
export async function getVoterTokenOwnerRecord(
  realmPubkey: PublicKey,
  governingTokenMint: PublicKey,
  voterPubkey: PublicKey
): Promise<ProgramAccount<TokenOwnerRecord> | null> {
  const connection = getConnection();
  try {
    const record = await getTokenOwnerRecordForRealm(
      connection,
      SPL_GOV_PROGRAM_ID,
      realmPubkey,
      governingTokenMint,
      voterPubkey
    );
    return record;
  } catch {
    return null;
  }
}

// Get realm info
export async function getRealmInfo(realmPubkey: PublicKey) {
  const connection = getConnection();
  return getRealm(connection, realmPubkey);
}

// Get user voting history
export async function getUserVoteRecords(
  walletPubkey: PublicKey
): Promise<ProgramAccount<VoteRecord>[]> {
  const connection = getConnection();
  return getVoteRecordsByVoter(connection, SPL_GOV_PROGRAM_ID, walletPubkey);
}

// Build cast vote transaction instructions
export async function buildCastVoteIx(params: {
  realm: PublicKey;
  governance: PublicKey;
  proposal: PublicKey;
  proposalOwnerRecord: PublicKey;
  voterTokenOwnerRecord: PublicKey;
  governanceAuthority: PublicKey;
  governingTokenMint: PublicKey;
  payer: PublicKey;
  voteType: "approve" | "deny" | "abstain";
}) {
  const instructions: import("@solana/web3.js").TransactionInstruction[] = [];

  let vote: Vote;
  switch (params.voteType) {
    case "approve":
      vote = new Vote({
        voteType: VoteKind.Approve,
        approveChoices: [new VoteChoice({ rank: 0, weightPercentage: 100 })],
        deny: undefined,
        veto: undefined,
      });
      break;
    case "deny":
      vote = new Vote({
        voteType: VoteKind.Deny,
        approveChoices: undefined,
        deny: true,
        veto: undefined,
      });
      break;
    case "abstain":
      vote = new Vote({
        voteType: VoteKind.Abstain,
        approveChoices: undefined,
        deny: undefined,
        veto: undefined,
      });
      break;
  }

  // Use program version 3 (latest)
  await withCastVote(
    instructions,
    SPL_GOV_PROGRAM_ID,
    3,
    params.realm,
    params.governance,
    params.proposal,
    params.proposalOwnerRecord,
    params.voterTokenOwnerRecord,
    params.governanceAuthority,
    params.governingTokenMint,
    vote,
    params.payer
  );

  return instructions;
}

// Allowed hostnames for fetching proposal descriptions (SSRF protection)
const ALLOWED_DESCRIPTION_HOSTS = new Set([
  "ipfs.io",
  "gateway.pinata.cloud",
  "arweave.net",
  "www.arweave.net",
  "raw.githubusercontent.com",
  "gist.githubusercontent.com",
  "shdw-drive.genesysgo.net",
]);

// Fetch proposal description content
export async function fetchProposalDescription(
  descriptionLink: string
): Promise<string> {
  if (!descriptionLink) return "";

  // Direct text (not a URL)
  if (!descriptionLink.startsWith("http") && !descriptionLink.startsWith("ipfs")) {
    return descriptionLink.slice(0, 5000);
  }

  try {
    let url = descriptionLink;
    if (url.startsWith("ipfs://")) {
      url = `https://ipfs.io/ipfs/${url.slice(7)}`;
    }

    // Validate URL and check against allowlist
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return descriptionLink;
    if (!ALLOWED_DESCRIPTION_HOSTS.has(parsed.hostname)) {
      // Allow any HTTPS URL but block private/internal IPs
      if (parsed.hostname === "localhost" || parsed.hostname.startsWith("127.") || parsed.hostname.startsWith("10.") || parsed.hostname.startsWith("192.168.") || parsed.hostname.startsWith("172.") || parsed.hostname === "0.0.0.0") {
        return descriptionLink;
      }
    }

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return descriptionLink;

    // Only accept text content types
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/") && !contentType.includes("application/json") && !contentType.includes("application/octet-stream")) {
      return descriptionLink;
    }

    const text = await res.text();
    return text.slice(0, 5000);
  } catch {
    return descriptionLink;
  }
}

export function getProposalStateLabel(state: ProposalState): string {
  switch (state) {
    case ProposalState.Draft: return "Draft";
    case ProposalState.SigningOff: return "Signing Off";
    case ProposalState.Voting: return "Active";
    case ProposalState.Succeeded: return "Succeeded";
    case ProposalState.Executing: return "Executing";
    case ProposalState.Completed: return "Completed";
    case ProposalState.Cancelled: return "Cancelled";
    case ProposalState.Defeated: return "Defeated";
    case ProposalState.ExecutingWithErrors: return "Executing (Errors)";
    case ProposalState.Vetoed: return "Vetoed";
    default: return "Unknown";
  }
}

export function getProposalStateColor(state: ProposalState): string {
  switch (state) {
    case ProposalState.Voting: return "bg-green-500/20 text-green-400 border-green-500/30";
    case ProposalState.Succeeded: return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case ProposalState.Defeated: return "bg-red-500/20 text-red-400 border-red-500/30";
    case ProposalState.Executing:
    case ProposalState.ExecutingWithErrors: return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case ProposalState.Completed: return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
    case ProposalState.Cancelled:
    case ProposalState.Vetoed: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

export { ProposalState };
export type { ProgramAccount, Realm, Proposal, TokenOwnerRecord, VoteRecord, Governance };
