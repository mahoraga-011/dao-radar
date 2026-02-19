"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getUserDAOs, type DAOInfo } from "@/lib/governance";
import { getRegistryMap, type RegistryDAO } from "@/lib/registry";

interface GovernanceContextValue {
  userDAOs: DAOInfo[];
  registryMap: Map<string, RegistryDAO>;
  loading: boolean;
  refresh: () => Promise<void>;
}

const GovernanceContext = createContext<GovernanceContextValue>({
  userDAOs: [],
  registryMap: new Map(),
  loading: false,
  refresh: async () => {},
});

export function useGovernance() {
  return useContext(GovernanceContext);
}

export function GovernanceProvider({ children }: { children: ReactNode }) {
  const { publicKey, connected } = useWallet();
  const [userDAOs, setUserDAOs] = useState<DAOInfo[]>([]);
  const [registryMap, setRegistryMap] = useState<Map<string, RegistryDAO>>(new Map());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!publicKey || !connected) {
      setUserDAOs([]);
      return;
    }

    setLoading(true);
    try {
      const [daos, regMap] = await Promise.all([
        getUserDAOs(publicKey),
        getRegistryMap(),
      ]);
      setUserDAOs(daos);
      setRegistryMap(regMap);
    } catch (err) {
      console.error("GovernanceContext: failed to load", err);
      setUserDAOs([]);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected]);

  useEffect(() => {
    if (connected && publicKey) {
      refresh();
    } else {
      setUserDAOs([]);
    }
  }, [connected, publicKey, refresh]);

  // Pre-load registry map even when disconnected (for browse mode)
  useEffect(() => {
    if (!connected) {
      getRegistryMap().then(setRegistryMap).catch(() => {});
    }
  }, [connected]);

  return (
    <GovernanceContext.Provider value={{ userDAOs, registryMap, loading, refresh }}>
      {children}
    </GovernanceContext.Provider>
  );
}
