export type RegistryDAO = {
  realmId: string;
  symbol: string;
  displayName: string;
  ogImage?: string;
  category?: string;
  shortDescription?: string;
  website?: string;
  twitter?: string;
  discord?: string;
  programId: string;
};

// In-memory cache for the client session (avoids refetching on navigation)
let cache: RegistryDAO[] | null = null;
let inflight: Promise<RegistryDAO[]> | null = null;

export async function getRegistry(): Promise<RegistryDAO[]> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = fetch("/api/registry")
    .then((res) => {
      if (!res.ok) throw new Error(`Registry fetch failed: ${res.status}`);
      return res.json() as Promise<RegistryDAO[]>;
    })
    .then((data) => {
      cache = data;
      return data;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export async function getRegistryMap(): Promise<Map<string, RegistryDAO>> {
  const registry = await getRegistry();
  const map = new Map<string, RegistryDAO>();
  for (const dao of registry) {
    map.set(dao.realmId, dao);
  }
  return map;
}
