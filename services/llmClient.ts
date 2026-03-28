// import { init } from "@heyputer/puter.js/src/init.cjs";

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

interface LlmBrief {
  companyName: string;
  companyOverview: string;
  coreProductOrService: string;
  targetCustomerOrAudience: string;
  b2bQualified: boolean;
  b2bQualificationReason: string;
  salesQuestions: string[];
  confidence: string;
  analysisMode: string;
  leadId?: string;
  rawInput?: string;
  website?: string;
  researchedAt?: string;
}

// Note: Puter SDK initialization - will be handled server-side
let puterClient: any = null;

function getPuterClient(authToken: string) {
  if (!authToken) {
    return null;
  }

  // In a real implementation, this would initialize the Puter client
  // For now, we'll work with the heuristic fallback
  return puterClient;
}

function extractJson(text: string): string {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced) {
    return fenced[1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  return text.trim();
}

export async function createLlmBrief(
  _lead: Lead, 
  _research: ResearchResult,
  _puterAuthToken?: string
): Promise<LlmBrief | null> {
  const puter = getPuterClient(_puterAuthToken || "");

  if (!puter) {
    return null;
  }

  // This would be the LLM call in production with Puter
  // For now, return null to fall back to heuristic
  return null;

  /*
  const prompt = [
    "You are a strict sales research analyst.",
    "Use the supplied website extracts as the primary evidence and use web search only as a light verification tool.",
    "Do not invent products, locations, or target markets.",
    "If evidence is weak, say that directly and lower confidence.",
    "Set b2bQualified to true only when there is evidence the lead serves businesses, commercial buyers, property managers, contractors, or another B2B audience.",
    "If the company seems mainly consumer-facing, set b2bQualified to false.",
    "Return only valid JSON with this exact shape:",
    '{"companyName":"string","companyOverview":"string","coreProductOrService":"string","targetCustomerOrAudience":"string","b2bQualified":true,"b2bQualificationReason":"string","salesQuestions":["q1","q2","q3"],"confidence":"low|medium|high"}'
  ].join(" ");

  const response = await puter.ai.chat([
    { role: "system", content: prompt },
    {
      role: "user",
      content: [
        `Lead input: ${lead.rawInput}`,
        `Known website: ${research.website}`,
        "Website extracts:",
        research.combinedContent
      ].join("\n\n")
    }
  ], {
    model: "openai/gpt-5.2-chat",
    tools: [{ type: "web_search" }]
  });

  const content = response?.message?.content || String(response || "");

  if (!content) {
    throw new Error("Puter returned an empty response.");
  }

  const parsed = JSON.parse(extractJson(content));

  return {
    companyName: String(parsed.companyName || lead.companyHint || research.website),
    companyOverview: String(parsed.companyOverview || "Unknown"),
    coreProductOrService: String(parsed.coreProductOrService || "Unknown"),
    targetCustomerOrAudience: String(parsed.targetCustomerOrAudience || "Unknown"),
    b2bQualified: Boolean(parsed.b2bQualified),
    b2bQualificationReason: String(parsed.b2bQualificationReason || "Unknown"),
    salesQuestions: Array.isArray(parsed.salesQuestions) ? parsed.salesQuestions.slice(0, 3).map(String) : [],
    confidence: ["low", "medium", "high"].includes(parsed.confidence) ? parsed.confidence : "low",
    analysisMode: "puter-llm"
  };
  */
}
