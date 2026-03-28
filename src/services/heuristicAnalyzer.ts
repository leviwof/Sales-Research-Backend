interface Lead {
  id: string;
  rawInput: string;
  companyHint: string;
  website: string;
}

interface ResearchResult {
  website: string;
  combinedContent: string;
}

interface HeuristicBrief {
  companyName: string;
  companyOverview: string;
  coreProductOrService: string;
  targetCustomerOrAudience: string;
  b2bQualified: boolean;
  b2bQualificationReason: string;
  salesQuestions: string[];
  confidence: string;
  analysisMode: string;
}

function firstSentence(text: string, fallback: string): string {
  const match = text.replace(/\s+/g, " ").match(/[^.?!]+[.?!]/);
  return match ? match[0].trim() : fallback;
}

function extractAudience(text: string): string {
  const lower = text.toLowerCase();

  if (/commercial|business|property manager|facility|contractor|office|industrial/.test(lower)) {
    return "Commercial customers, property managers, and other businesses that need the service.";
  }

  if (/family|homeowner|residential|pet owner|bakery customer|wedding/.test(lower)) {
    return "Primarily individual consumers and households.";
  }

  return "Audience could not be determined confidently from the scraped content.";
}

function detectB2B(text: string): boolean {
  const lower = text.toLowerCase();
  const positive = /commercial|business|property manager|contractor|office|industrial|wholesale|multi-family/;
  const negative = /bakery|pet treat|birthday cake|wedding cake|residential only|family owned bakery/;

  if (positive.test(lower) && !negative.test(lower)) {
    return true;
  }

  return false;
}

function extractCoreService(text: string): string {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const candidate = lines.find((line) => /service|roof|landscap|plumb|safe|bakery|moving|turf|repair|tree|hvac/i.test(line));
  return candidate || "Core service could not be extracted confidently.";
}

export function buildHeuristicBrief(lead: Lead, research: ResearchResult): HeuristicBrief {
  const text = research.combinedContent || "";
  const b2bQualified = detectB2B(text);
  const companyOverview = firstSentence(
    text,
    `${lead.companyHint || lead.website} appears to be a local service business, but the available content was limited.`
  );
  const audience = extractAudience(text);

  let companyName = lead.companyHint;
  if (!companyName && research.website) {
    try {
      companyName = new URL(research.website).hostname.replace(/^www\./, "");
    } catch {
      companyName = research.website;
    }
  }

  return {
    companyName,
    companyOverview,
    coreProductOrService: extractCoreService(text),
    targetCustomerOrAudience: audience,
    b2bQualified,
    b2bQualificationReason: b2bQualified
      ? "Commercial or business-oriented language appeared in the site content."
      : "The site appears mainly consumer-facing or did not provide enough business-targeting evidence.",
    salesQuestions: [
      "What types of customers or job sizes generate the most revenue today?",
      "How are new leads currently sourced, qualified, and assigned to the team?",
      "Which parts of the sales process still require manual follow-up before a quote is won?"
    ],
    confidence: "low",
    analysisMode: "heuristic-fallback"
  };
}
