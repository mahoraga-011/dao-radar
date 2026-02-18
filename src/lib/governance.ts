import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_URL } from "./rpc";
import { safeToNumber } from "./utils";
import {
  getRealm,
  getRealms,
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

let _connection: Connection | null = null;
export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(RPC_URL, "confirmed");
  }
  return _connection;
}

// Well-known DAOs for browse mode (verified mainnet pubkeys)
export const FEATURED_REALMS: { name: string; pubkey: string }[] = [
  { name: "Jupiter Aggregator", pubkey: "2Z5BXuRCJPqYUCBGyQTwAXHeJoFAnbtvoXja19aZFLKY" },
  { name: "Drift Protocol", pubkey: "9nUyxzVL2FUMuWUiVZG66gwK15CJiM3PoLkfrnGfkvt6" },
  { name: "Marinade.Finance", pubkey: "3gmcbygQUUDgmtDtx41R7xSf3K4oFXrH9icPNijyq9pS" },
  { name: "Pyth DAO", pubkey: "WQa9YVA3SVspDUjmnjMj4uygJpxR814mD931FhLxLvx" },
  { name: "Helium", pubkey: "6qGHqcZY4zLCWFvvBKfr8tHQfkD8arz8mAQPt4TDvTy5" },
  { name: "Mango DAO", pubkey: "DPiH3H3c7t47BMxqTxLsuPQpEC6Kne8GA9VXbxpnZxFE" },
  { name: "Bonk DAO", pubkey: "84pGFuy1Y27ApK67ApethaPvexeDWA66zNV8gm38TVeQ" },
  { name: "Tensor DAO", pubkey: "4sgAydAiSvnpT73rALCcnYGhi5K2LrB9pJFAEbLMfrXt" },
  { name: "Metaplex Grants", pubkey: "ConzwGtFktKLA2M7451S6jmW1tB3tRD9augz9zFA46Yr" },
  { name: "Kamino Finance", pubkey: "53pMaU2DXieGxwXZLMN1rgDECwFrxuYw5u9QgEFCx4Rd" },
  { name: "MonkeDAO", pubkey: "m8BR9yA89AJ9f2u3KeAFasJSuXDnd3xYDJJkBvQ2iw6" },
  { name: "marginfi", pubkey: "FoVoUr6dFeXYDw2vKr76tZLkjJ8zFeVsjMruWNghtoXJ" },
  { name: "Parcl", pubkey: "8msNFq5VBectsGAv66zYx5QRve1p3m6ZEz49xaWX3tbd" },
  { name: "Solend", pubkey: "5EuXAPZCpzZnqpzVRX5Ytizh9BFVtbz3H8Xk9H5onxHD" },
  { name: "Raydium DAO", pubkey: "GDBJ3qv4tJXiCbz5ASkSMYq6Xfb35MdXsMzgVaMnr9Q7" },
  { name: "Grape", pubkey: "By2sVGZXwfQq6rAiAM3rNPJ9iQfb5e2QhnF4YjJ4Bip" },
  { name: "UXD Protocol", pubkey: "DkSvNgykZPPFczhJVh8HDkhz25ByrDoPcB32q75AYu9k" },
  { name: "Magic Eden", pubkey: "9MwbgfEkV8ZaeycfciBqytcxwfdYHqD2NYjsTZkH4GxA" },
];

export type DAOInfo = {
  realmPubkey: PublicKey;
  realm: ProgramAccount<Realm>;
  votingPower?: number;
  activeProposals: number;
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

    const realmPromises = realmPubkeys.map(async (realmPk) => {
      try {
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
          tokenOwnerRecord: primaryRecord,
        });
      } catch {
        // skip failed realms
      }
    });

    await Promise.allSettled(realmPromises);
  } catch (err) {
    console.error("Error fetching user DAOs:", err);
  }

  return results;
}

// Fetch featured realms for browse mode (with 5-min localStorage cache)
export async function getFeaturedRealms(): Promise<DAOInfo[]> {
  // Check localStorage cache
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("featured_realms_cache");
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          // Rehydrate from cached minimal data
          return data.map((d: { realmPubkey: string; name: string; activeProposals: number }) => ({
            realmPubkey: new PublicKey(d.realmPubkey),
            realm: {
              pubkey: new PublicKey(d.realmPubkey),
              account: {
                name: d.name,
              },
            } as ProgramAccount<Realm>,
            activeProposals: d.activeProposals,
          }));
        }
      }
    } catch {
      // ignore cache errors
    }
  }

  const connection = getConnection();
  const results: DAOInfo[] = [];

  const promises = FEATURED_REALMS.map(async ({ pubkey }) => {
    try {
      const realmPubkey = new PublicKey(pubkey);
      const realm = await getRealm(connection, realmPubkey);

      let activeProposals = 0;
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
            }
          }
        }
      } catch {
        // skip
      }

      results.push({
        realmPubkey,
        realm,
        activeProposals,
      });
    } catch {
      // skip
    }
  });

  await Promise.allSettled(promises);

  // Cache to localStorage
  if (typeof window !== "undefined" && results.length > 0) {
    try {
      const cacheData = results.map((d) => ({
        realmPubkey: d.realmPubkey.toBase58(),
        name: d.realm.account.name,
        activeProposals: d.activeProposals,
      }));
      localStorage.setItem("featured_realms_cache", JSON.stringify({ data: cacheData, timestamp: Date.now() }));
    } catch {
      // ignore
    }
  }

  return results;
}

// Get all proposals for a realm
export async function getRealmProposals(
  realmPubkey: PublicKey
): Promise<ProposalInfo[]> {
  const connection = getConnection();
  const proposals = await getAllProposals(
    connection,
    SPL_GOV_PROGRAM_ID,
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

// Fetch proposal description content
export async function fetchProposalDescription(
  descriptionLink: string
): Promise<string> {
  if (!descriptionLink) return "";

  // Direct text (not a URL)
  if (!descriptionLink.startsWith("http") && !descriptionLink.startsWith("ipfs")) {
    return descriptionLink;
  }

  try {
    let url = descriptionLink;
    if (url.startsWith("ipfs://")) {
      url = `https://ipfs.io/ipfs/${url.slice(7)}`;
    }

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return descriptionLink;
    const text = await res.text();
    return text.slice(0, 5000); // Limit size
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
