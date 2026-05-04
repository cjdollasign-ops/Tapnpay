import { describe, it, expect } from 'vitest';
import {
  detectCardBrand,
  validateCardNumber,
  validateExpiryDate,
  formatExpiryDate,
  maskCardNumber,
  parseTrackData,
  getBrandColor,
  getBrandName,
} from './card-utils';

describe('Card Utilities', () => {
  describe('detectCardBrand', () => {
    it('should detect Visa cards', () => {
      expect(detectCardBrand('4532015112830366')).toBe('visa');
      expect(detectCardBrand('4111111111111111')).toBe('visa');
    });

    it('should detect Mastercard', () => {
      expect(detectCardBrand('5555555555554444')).toBe('mastercard');
      expect(detectCardBrand('5105105105105100')).toBe('mastercard');
    });

    it('should detect American Express', () => {
      expect(detectCardBrand('374245455400126')).toBe('amex');
      expect(detectCardBrand('378282246310005')).toBe('amex');
    });

    it('should detect Discover', () => {
      expect(detectCardBrand('6011111111111117')).toBe('discover');
      expect(detectCardBrand('6011000990139424')).toBe('discover');
    });

    it('should return unknown for invalid cards', () => {
      expect(detectCardBrand('1234567890123456')).toBe('unknown');
      expect(detectCardBrand('0000000000000000')).toBe('unknown');
    });
  });

  describe('validateCardNumber', () => {
    it('should validate correct Visa card numbers', () => {
      expect(validateCardNumber('4532015112830366')).toBe(true);
      expect(validateCardNumber('4111111111111111')).toBe(true);
    });

    it('should validate correct Mastercard numbers', () => {
      expect(validateCardNumber('5555555555554444')).toBe(true);
      expect(validateCardNumber('5105105105105100')).toBe(true);
    });

    it('should validate correct Amex numbers', () => {
      expect(validateCardNumber('374245455400126')).toBe(true);
      expect(validateCardNumber('378282246310005')).toBe(true);
    });

    it('should reject invalid card numbers', () => {
      expect(validateCardNumber('1234567890123456')).toBe(false);
      expect(validateCardNumber('4111111111111112')).toBe(false);
    });

    it('should reject cards with invalid length', () => {
      expect(validateCardNumber('411111111')).toBe(false);
      expect(validateCardNumber('41111111111111111111')).toBe(false);
    });
  });

  describe('validateExpiryDate', () => {
    it('should validate future expiry dates', () => {
      const futureYear = new Date().getFullYear() + 1;
      const futureMonth = String(futureYear).slice(-2);
      expect(validateExpiryDate(`12/${futureMonth}`)).toBe(true);
    });

    it('should reject expired dates', () => {
      expect(validateExpiryDate('01/20')).toBe(false);
      expect(validateExpiryDate('12/19')).toBe(false);
    });

    it('should reject invalid months', () => {
      expect(validateExpiryDate('13/25')).toBe(false);
      expect(validateExpiryDate('00/25')).toBe(false);
    });

    it('should reject invalid format', () => {
      expect(validateExpiryDate('1225')).toBe(false);
      expect(validateExpiryDate('12-25')).toBe(false);
    });
  });

  describe('formatExpiryDate', () => {
    it('should format expiry date correctly', () => {
      expect(formatExpiryDate('1225')).toBe('12/25');
      expect(formatExpiryDate('0525')).toBe('05/25');
    });

    it('should handle partial input', () => {
      expect(formatExpiryDate('1')).toBe('1');
      expect(formatExpiryDate('12')).toBe('12/');
    });

    it('should remove non-numeric characters', () => {
      expect(formatExpiryDate('12/25')).toBe('12/25');
      expect(formatExpiryDate('12-25')).toBe('12/25');
    });
  });

  describe('maskCardNumber', () => {
    it('should mask card number showing last 4 digits', () => {
      expect(maskCardNumber('4532015112830366')).toBe('XXXX XXXX XXXX 0366');
      expect(maskCardNumber('5555555555554444')).toBe('XXXX XXXX XXXX 4444');
    });

    it('should handle short card numbers', () => {
      expect(maskCardNumber('1234')).toBe('1234');
      expect(maskCardNumber('123')).toBe('123');
    });

    it('should remove non-numeric characters', () => {
      expect(maskCardNumber('4532-0151-1283-0366')).toBe('XXXX XXXX XXXX 0366');
    });
  });

  describe('parseTrackData', () => {
    it('should parse Track 1 format correctly', () => {
      const futureYear = new Date().getFullYear() + 1;
      const futureYearStr = String(futureYear).slice(-2);
      const trackData = `%B4532015112830366^JOHN DOE^12${futureYearStr}201000000000000000000000?`;
      const result = parseTrackData(trackData);

      expect(result).not.toBeNull();
      expect(result?.cardNumber).toBe('4532015112830366');
      expect(result?.cardholderName).toBe('JOHN DOE');
      expect(result?.expiryDate).toBe(`12/${futureYearStr}`);
      expect(result?.cardBrand).toBe('visa');
    });

    it('should parse Track 2 format correctly', () => {
      const futureYear = new Date().getFullYear() + 1;
      const futureYearStr = String(futureYear).slice(-2);
      const trackData = `;4532015112830366=12${futureYearStr}201000000000000000000000?`;
      const result = parseTrackData(trackData);

      expect(result).not.toBeNull();
      expect(result?.cardNumber).toBe('4532015112830366');
      expect(result?.expiryDate).toBe(`12/${futureYearStr}`);
      expect(result?.cardBrand).toBe('visa');
    });

    it('should return null for invalid track data', () => {
      expect(parseTrackData('invalid data')).toBeNull();
      expect(parseTrackData('')).toBeNull();
      expect(parseTrackData('   ')).toBeNull();
    });

    it('should reject expired cards', () => {
      const trackData = '%B4532015112830366^JOHN DOE^2012201000000000000000?';
      const result = parseTrackData(trackData);

      expect(result).toBeNull();
    });

    it('should reject invalid card numbers', () => {
      const futureYear = new Date().getFullYear() + 1;
      const futureYearStr = String(futureYear).slice(-2);
      const trackData = `%B1234567890123456^JOHN DOE^12${futureYearStr}201000000000000000000000?`;
      const result = parseTrackData(trackData);

      expect(result).toBeNull();
    });
  });

  describe('getBrandColor', () => {
    it('should return correct colors for each brand', () => {
      expect(getBrandColor('visa')).toBe('#1A1F71');
      expect(getBrandColor('mastercard')).toBe('#EB001B');
      expect(getBrandColor('amex')).toBe('#006FCF');
      expect(getBrandColor('discover')).toBe('#FF6000');
      expect(getBrandColor('unknown')).toBe('#687076');
    });
  });

  describe('getBrandName', () => {
    it('should return correct display names for each brand', () => {
      expect(getBrandName('visa')).toBe('Visa');
      expect(getBrandName('mastercard')).toBe('Mastercard');
      expect(getBrandName('amex')).toBe('American Express');
      expect(getBrandName('discover')).toBe('Discover');
      expect(getBrandName('unknown')).toBe('Unknown');
    });
  });
});
