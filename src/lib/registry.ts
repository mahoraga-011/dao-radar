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

// In-memory cache with 1-hour TTL
let cache: RegistryDAO[] | null = null;
let cacheTime = 0;
let cachedMap: Map<string, RegistryDAO> | null = null;
let inflight: Promise<RegistryDAO[]> | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function getRegistry(): Promise<RegistryDAO[]> {
  if (cache && Date.now() - cacheTime < CACHE_TTL) return cache;
  if (inflight) return inflight;

  inflight = fetch("/api/registry")
    .then((res) => {
      if (!res.ok) throw new Error(`Registry fetch failed: ${res.status}`);
      return res.json() as Promise<RegistryDAO[]>;
    })
    .then((data) => {
      cache = data;
      cacheTime = Date.now();
      cachedMap = null; // invalidate map cache
      return data;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export async function getRegistryMap(): Promise<Map<string, RegistryDAO>> {
  const registry = await getRegistry();
  if (cachedMap) return cachedMap;
  const map = new Map<string, RegistryDAO>();
  for (const dao of registry) {
    map.set(dao.realmId, dao);
  }
  cachedMap = map;
  return map;
}
