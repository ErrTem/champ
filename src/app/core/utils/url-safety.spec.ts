import { coerceSafeHttpUrl, isSafeHttpUrl } from './url-safety';

describe('url-safety', () => {
  describe('isSafeHttpUrl', () => {
    it('allows https', () => {
      expect(isSafeHttpUrl('https://example.com')).toBe(true);
    });

    it('rejects javascript scheme', () => {
      expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    });

    it('rejects data scheme', () => {
      expect(isSafeHttpUrl('data:text/html,<h1>x</h1>')).toBe(false);
    });

    it('rejects scheme-relative urls', () => {
      expect(isSafeHttpUrl('//example.com')).toBe(false);
    });

    it('rejects nested javascript attempts via path', () => {
      expect(isSafeHttpUrl('https://example.com/%0Ajavascript:alert(1)')).toBe(true);
    });
  });

  describe('coerceSafeHttpUrl', () => {
    it('returns normalized https URL', () => {
      expect(coerceSafeHttpUrl(' https://example.com ')).toBe('https://example.com/');
    });

    it('returns null for empty', () => {
      expect(coerceSafeHttpUrl('')).toBeNull();
      expect(coerceSafeHttpUrl('   ')).toBeNull();
      expect(coerceSafeHttpUrl(null)).toBeNull();
      expect(coerceSafeHttpUrl(undefined)).toBeNull();
    });

    it('returns null for unsafe scheme', () => {
      expect(coerceSafeHttpUrl('javascript:alert(1)')).toBeNull();
    });
  });
});

