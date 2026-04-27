import { IANAZone } from 'luxon';
import { GymsService } from './gyms.service';

describe('GymsService', () => {
  it('validates IANA timezones', () => {
    // Sanity: Luxon itself understands IANA zones
    expect(IANAZone.isValidZone('America/Los_Angeles')).toBe(true);
    expect(IANAZone.isValidZone('America/New_York')).toBe(true);

    const svc = new GymsService({} as never);

    expect(() => svc.assertValidTimezone('America/Los_Angeles')).not.toThrow();
    expect(() => svc.assertValidTimezone('America/New_York')).not.toThrow();

    expect(() => svc.assertValidTimezone('GMT+3')).toThrow();
    expect(() => svc.assertValidTimezone('Mars/OlympusMons')).toThrow();
    expect(() => svc.assertValidTimezone('')).toThrow();
    expect(() => svc.assertValidTimezone('   ')).toThrow();
  });
});

