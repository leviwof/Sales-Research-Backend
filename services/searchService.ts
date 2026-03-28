import { normalizeUrl } from "../lib/url";

interface Lead {
  id: string;
  rawInput: string;
  companyHint: string;
  website: string;
}

interface SearchResult {
  url: string;
  score: number;
}

interface ResolutionResult {
  website: string;
  discoveryMethod: string;
  searchQuery: string;
  searchResults: SearchResult[];
}

function decodeDuckDuckGoUrl(candidate: string): string {
  try {
    const parsed = new URL(candidate, "https://duckduckgo.com");
    const uddg = parsed.searchParams.get("uddg");
    return uddg ? decodeURIComponent(uddg) : candidate;
  } catch {
    return candidate;
  }
}

function scoreUrl(url: string, companyHint: string): number {
  const text = `${url} ${companyHint}`.toLowerCase();
  let score = 0;

  if (text.includes("yelp") || text.includes("facebook") || text.includes("linkedin")) {
    score -= 4;
  }

  const tokens = companyHint
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);

  for (const token of tokens) {
    if (text.includes(token)) {
      score += 1;
    }
  }

  if (text.includes("service") || text.includes("roof") || text.includes("plumb")) {
    score += 1;
  }

  return score;
}

export async function resolveLeadWebsite(lead: Lead): Promise<ResolutionResult> {
  if (lead.website) {
    return {
      website: lead.website,
      discoveryMethod: "provided",
      searchQuery: "",
      searchResults: []
    };
  }

  const query = `${lead.companyHint} official website`;
  const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(searchUrl, {
    headers: {
      "User-Agent": "Sales-Intelligence-Automator/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Search lookup failed with status ${response.status}`);
  }

  const html = await response.text();
  const matches = [...html.matchAll(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"/gi)];
  const searchResults = matches
    .map((match) => decodeDuckDuckGoUrl(match[1]))
    .filter(Boolean)
    .filter((url) => /^https?:\/\//i.test(url))
    .filter((url) => !url.includes("duckduckgo.com"))
    .map((url) => ({
      url,
      score: scoreUrl(url, lead.companyHint)
    }))
    .sort((left, right) => right.score - left.score);

  const best = searchResults[0];
  return {
    website: best ? normalizeUrl(best.url) : "",
    discoveryMethod: best ? "search" : "unresolved",
    searchQuery: query,
    searchResults: searchResults.slice(0, 5)
  };
}
