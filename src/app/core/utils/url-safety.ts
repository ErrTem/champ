export function isSafeHttpUrl(input: string): boolean {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return false;
  }
  return url.protocol === 'https:';
}

export function coerceSafeHttpUrl(input: string | null | undefined): string | null {
  const v = input?.trim();
  if (!v) return null;
  if (!isSafeHttpUrl(v)) return null;
  return new URL(v).toString();
}

