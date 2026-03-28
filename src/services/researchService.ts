import { extractLinksFromHtml, extractTextFromHtml, ExtractedLink } from "./contentCleaner";

const PAGE_HINTS = [
  "about",
  "service",
  "services",
  "product",
  "company",
  "who-we-serve",
  "industries",
  "commercial",
  "solutions",
  "contact"
];

const PAGE_LIMIT = 4;
const CHAR_LIMIT = 15000;

function sameHost(baseUrl: string, candidateUrl: string): boolean {
  try {
    return new URL(baseUrl).hostname === new URL(candidateUrl).hostname;
  } catch {
    return false;
  }
}

function scoreLink(link: ExtractedLink): number {
  const text = `${link.url} ${link.label}`.toLowerCase();
  let score = 0;

  for (const hint of PAGE_HINTS) {
    if (text.includes(hint)) {
      score += 2;
    }
  }

  if (text.includes("blog") || text.includes("news") || text.includes("careers")) {
    score -= 2;
  }

  return score;
}

interface FetchedPage {
  url: string;
  title: string;
  text: string;
  html?: string;
  fetchError?: string;
}

async function fetchPage(url: string): Promise<FetchedPage> {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "Sales-Intelligence-Automator/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const html = await response.text();
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  return {
    url,
    title: titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : url,
    html,
    text: extractTextFromHtml(html, CHAR_LIMIT)
  };
}

interface ResearchResult {
  website: string;
  pages: Array<{
    url: string;
    title: string;
    textPreview: string;
    fetchError: string;
  }>;
  combinedContent: string;
}

export async function gatherLeadResearch(website: string): Promise<ResearchResult> {
  const homePage = await fetchPage(website);
  const links = extractLinksFromHtml(homePage.html || "", homePage.url)
    .filter((link) => sameHost(homePage.url, link.url))
    .map((link) => ({ ...link, score: scoreLink(link) }))
    .sort((left, right) => right.score - left.score);

  const pages: FetchedPage[] = [homePage];
  const seen = new Set([homePage.url]);

  for (const link of links) {
    if (pages.length >= PAGE_LIMIT) {
      break;
    }

    if (seen.has(link.url) || link.score < 1) {
      continue;
    }

    seen.add(link.url);
    try {
      const page = await fetchPage(link.url);
      if (page.text.length > 200) {
        pages.push(page);
      }
    } catch (error) {
      pages.push({
        url: link.url,
        title: link.label || link.url,
        text: "",
        fetchError: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  const combinedContent = pages
    .filter((page) => page.text)
    .map((page) => `URL: ${page.url}\nTITLE: ${page.title}\n${page.text}`)
    .join("\n\n---\n\n")
    .slice(0, CHAR_LIMIT);

  return {
    website,
    pages: pages.map((page) => ({
      url: page.url,
      title: page.title,
      textPreview: page.text.slice(0, 1200),
      fetchError: page.fetchError || ""
    })),
    combinedContent
  };
}
