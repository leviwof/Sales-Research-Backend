const BLOCK_TAGS = /<\/?(p|div|section|article|main|li|h1|h2|h3|h4|h5|h6|br|tr|td|th|ul|ol)[^>]*>/gi;

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripNoise(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<template[\s\S]*?<\/template>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    .replace(/<form[\s\S]*?<\/form>/gi, " ");
}

function removeBoilerplate(lines: string[]): string[] {
  const counts = new Map<string, number>();
  for (const line of lines) {
    counts.set(line, (counts.get(line) || 0) + 1);
  }

  return lines.filter((line) => {
    if (line.length < 25) {
      return false;
    }
    if ((counts.get(line) || 0) > 1) {
      return false;
    }
    if (/privacy|cookie|copyright|all rights reserved|call now|skip to content/i.test(line)) {
      return false;
    }
    return true;
  });
}

export function extractTextFromHtml(html: string, charLimit: number): string {
  const stripped = stripNoise(html)
    .replace(BLOCK_TAGS, "\n")
    .replace(/<[^>]+>/g, " ");

  const decoded = decodeHtmlEntities(stripped)
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n");

  const lines = decoded
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return removeBoilerplate(lines).join("\n").slice(0, charLimit);
}

export interface ExtractedLink {
  url: string;
  label: string;
}

export function extractLinksFromHtml(html: string, baseUrl: string): ExtractedLink[] {
  const links = new Map<string, ExtractedLink>();
  const candidates = [...html.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];

  for (const match of candidates) {
    const href = match[1]?.trim();
    const label = match[2]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";

    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      continue;
    }

    try {
      const url = new URL(href, baseUrl).toString();
      links.set(url, { url, label });
    } catch {
      continue;
    }
  }

  return [...links.values()];
}
