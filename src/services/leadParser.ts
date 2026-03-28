import crypto from "crypto";
import { isLikelyUrl, normalizeUrl } from "../lib/url";

interface Lead {
  id: string;
  rawInput: string;
  companyHint: string;
  website: string;
}

function extractUrl(rawInput: string): { raw: string; normalized: string } | null {
  const match = rawInput.match(/https?:\/\/[^\s,]+/i);
  return match
    ? {
        raw: match[0],
        normalized: normalizeUrl(match[0])
      }
    : null;
}

export function parseLeadLines(rawText: string): Lead[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => createLead(line));
}

export function createLead(rawInput: string): Lead {
  const embeddedUrl = extractUrl(rawInput);
  const hasUrl = Boolean(embeddedUrl) || isLikelyUrl(rawInput);

  return {
    id: crypto.createHash("sha1").update(rawInput).digest("hex").slice(0, 12),
    rawInput,
    companyHint: embeddedUrl
      ? rawInput.replace(embeddedUrl.raw, "").replace(/\s+/g, " ").trim()
      : (hasUrl ? "" : rawInput),
    website: embeddedUrl ? embeddedUrl.normalized : (hasUrl ? normalizeUrl(rawInput) : "")
  };
}
