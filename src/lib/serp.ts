export interface SerpResult {
  position: number;
  url: string;
  title: string;
}

export interface SerpProvider {
  readonly name: string;
  search(keyword: string, location: string, domain?: string): Promise<SerpResult[]>;
}

export const serpConfigured =
  Boolean(process.env.SERPAPI_KEY) || process.env.SERP_MOCK === "true";

class SerpApiProvider implements SerpProvider {
  readonly name = "serpapi";

  constructor(private apiKey: string) {}

  async search(keyword: string, location: string): Promise<SerpResult[]> {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google");
    url.searchParams.set("q", keyword);
    url.searchParams.set("location", location);
    url.searchParams.set("num", "100");
    url.searchParams.set("api_key", this.apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`SerpAPI error (HTTP ${res.status})`);
    }

    const data = (await res.json()) as {
      organic_results?: Array<{ position?: number; link?: string; title?: string }>;
    };

    return (data.organic_results ?? []).map((r, i) => ({
      position: r.position ?? i + 1,
      url: r.link ?? "",
      title: r.title ?? "",
    }));
  }
}

class MockProvider implements SerpProvider {
  readonly name = "mock";

  async search(keyword: string, _location: string, domain?: string): Promise<SerpResult[]> {
    const seed = Array.from(keyword).reduce((s, c) => s + c.charCodeAt(0), 0);
    const count = 20;
    const rank = (seed % 25) + 1;
    const host = domain ? normalizeHost(domain) : "";

    return Array.from({ length: count }, (_, i) => {
      const position = i + 1;
      if (host && position === rank) {
        return { position, url: `https://${host}/`, title: `${host} — ${keyword}` };
      }
      return {
        position,
        url: `https://competitor-${(seed + i) % 97}.example/result-${i}`,
        title: `Result ${position} for ${keyword}`,
      };
    });
  }
}

export function getSerpProvider(): SerpProvider | null {
  if (process.env.SERPAPI_KEY) {
    return new SerpApiProvider(process.env.SERPAPI_KEY);
  }
  if (process.env.SERP_MOCK === "true") {
    return new MockProvider();
  }
  return null;
}

export function normalizeHost(input: string): string {
  const url = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
}

export function findPosition(
  results: SerpResult[],
  domain: string
): SerpResult | null {
  const target = normalizeHost(domain);
  return (
    results.find((r) => {
      try {
        return new URL(r.url).hostname.replace(/^www\./i, "").toLowerCase() === target;
      } catch {
        return false;
      }
    }) ?? null
  );
}
