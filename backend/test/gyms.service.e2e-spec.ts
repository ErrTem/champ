import { IANAZone } from 'luxon';
import { GymsService } from '../src/gyms/gyms.service';

describe('GymsService (Timezone validation) — e2e', () => {
  it('GYM-VAL-01: accepts valid IANA zones; rejects invalid', () => {
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

