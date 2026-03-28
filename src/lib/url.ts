export function isLikelyUrl(value: string): boolean {
  if (!value) {
    return false;
  }

  try {
    const normalized = value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;
    const parsed = new URL(normalized);
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function normalizeUrl(value: string): string {
  if (!value) {
    return "";
  }

  const normalized = value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
  return new URL(normalized).toString();
}
