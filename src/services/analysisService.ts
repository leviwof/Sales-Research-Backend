import { resolveLeadWebsite } from "./searchService";
import { gatherLeadResearch } from "./researchService";
import { buildHeuristicBrief } from "./heuristicAnalyzer";
import { createLlmBrief } from "./llmClient";

interface Lead {
  id: string;
  rawInput: string;
  companyHint: string;
  website: string;
}

interface Brief {
  leadId: string;
  rawInput: string;
  companyName: string;
  website: string;
  companyOverview: string;
  coreProductOrService: string;
  targetCustomerOrAudience: string;
  b2bQualified: boolean;
  b2bQualificationReason: string;
  salesQuestions: string[];
  confidence: string;
  analysisMode: string;
  discoveryMethod?: string;
  searchQuery?: string;
  searchResults?: any[];
  sources?: Array<{
    url: string;
    title: string;
  }>;
  researchedAt: string;
}

export async function analyzeLead(lead: Lead, puterAuthToken?: string): Promise<Brief> {
  const startedAt = new Date().toISOString();
  const resolution = await resolveLeadWebsite(lead);

  if (!resolution.website) {
    return {
      leadId: lead.id,
      rawInput: lead.rawInput,
      website: "",
      companyName: lead.companyHint || lead.rawInput,
      companyOverview: "No reliable company website could be resolved from the provided input.",
      coreProductOrService: "Unknown",
      targetCustomerOrAudience: "Unknown",
      b2bQualified: false,
      b2bQualificationReason: "The system could not find a trustworthy website to analyze.",
      salesQuestions: [
        "Can you confirm the lead's official website before outreach?",
        "What service line or business category do they fall into?",
        "Is there any evidence they sell to other businesses or only to consumers?"
      ],
      confidence: "low",
      analysisMode: "unresolved",
      discoveryMethod: resolution.discoveryMethod,
      searchQuery: resolution.searchQuery,
      searchResults: resolution.searchResults,
      sources: [],
      researchedAt: startedAt
    };
  }

  const research = await gatherLeadResearch(resolution.website);
  let brief = buildHeuristicBrief(lead, research);

  try {
    const llmBrief = await createLlmBrief(lead, research, puterAuthToken);
    if (llmBrief) {
      brief = {
        ...llmBrief,
        leadId: lead.id,
        rawInput: lead.rawInput,
        website: resolution.website,
        researchedAt: startedAt
      } as Brief;
    }
  } catch {
    // Fall back to heuristic - no action needed
  }

  return {
    leadId: lead.id,
    rawInput: lead.rawInput,
    website: resolution.website,
    ...brief,
    discoveryMethod: resolution.discoveryMethod,
    searchQuery: resolution.searchQuery,
    searchResults: resolution.searchResults,
    sources: research.pages.map((page) => ({
      url: page.url,
      title: page.title
    })),
    researchedAt: startedAt
  };
}
