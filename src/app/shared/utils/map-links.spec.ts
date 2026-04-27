import { buildAppleMapsUrl, buildGoogleMapsSearchUrl, formatGymAddress } from './map-links';

describe('map-links', () => {
  it('formats structured address into single-line query', () => {
    const q = formatGymAddress({
      name: 'Gym & Co.',
      addressLine1: '123 Main St #5',
      addressLine2: '2nd Floor',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      countryCode: 'US',
    });
    expect(q).toContain('Gym & Co.');
    expect(q).toContain('123 Main St #5');
    expect(q).toContain('2nd Floor');
    expect(q).toContain('New York, NY 10001');
  });

  it('builds canonical Google/Apple maps URLs with encoding + scheme safety', () => {
    const query = '123 Main St #5 & 2nd Ave?\nNew York, NY';

    const google = buildGoogleMapsSearchUrl(query);
    expect(google.startsWith('https://www.google.com/maps/search/?')).toBeTrue();
    expect(google).toContain('api=1');
    expect(google).toContain('query=');
    expect(google).not.toContain('\n');
    expect(google).not.toContain('javascript:');
    expect(google).toContain('%23'); // '#'
    expect(google).toContain('%26'); // '&'

    const apple = buildAppleMapsUrl(query);
    expect(apple.startsWith('http://maps.apple.com/?')).toBeTrue();
    expect(apple).toContain('q=');
    expect(apple).not.toContain('\n');
    expect(apple).not.toContain('javascript:');
    expect(apple).toContain('%23');
    expect(apple).toContain('%26');
  });
});

