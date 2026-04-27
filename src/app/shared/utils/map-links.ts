export type GymAddressLike = {
  name?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
};

export function formatGymAddress(gym: GymAddressLike): string {
  const parts: string[] = [];
  if (gym.name) parts.push(gym.name);
  parts.push(gym.addressLine1);
  if (gym.addressLine2) parts.push(gym.addressLine2);
  parts.push(`${gym.city}, ${gym.state} ${gym.postalCode}`);
  parts.push(gym.countryCode);

  return parts
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(', ');
}

function normalizeQuery(query: string): string {
  return query.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function buildGoogleMapsSearchUrl(query: string): string {
  const url = new URL('https://www.google.com/maps/search/');
  url.searchParams.set('api', '1');
  url.searchParams.set('query', normalizeQuery(query));
  return url.toString();
}

export function buildAppleMapsUrl(query: string): string {
  const url = new URL('http://maps.apple.com/');
  url.searchParams.set('q', normalizeQuery(query));
  return url.toString();
}

