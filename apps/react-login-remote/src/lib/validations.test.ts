import { describe, it, expect } from 'vitest';
import { validateCNPJ, validateCPF, maskCpfCnpj } from './validations';

describe('Validations', () => {
  describe('validateCNPJ', () => {
    it('should validate a correct CNPJ', () => {
      // Valid CNPJ: Itaú Unibanco S.A.
      expect(validateCNPJ('60.701.190/0001-04')).toBe(true);
      expect(validateCNPJ('60701190000104')).toBe(true);
    });

    it('should reject an invalid CNPJ', () => {
      expect(validateCNPJ('12.345.678/0001-90')).toBe(false);
      expect(validateCNPJ('00.000.000/0000-00')).toBe(false);
      expect(validateCNPJ('11111111111111')).toBe(false);
    });
  });

  describe('validateCPF', () => {
    it('should validate a correct CPF', () => {
      // Use a known valid CPF (from public generators or demo)
      expect(validateCPF('111.444.777-35')).toBe(true);
    });

    it('should reject an invalid CPF', () => {
      expect(validateCPF('123.456.789-01')).toBe(false);
      expect(validateCPF('000.000.000-00')).toBe(false);
    });
  });

  describe('maskCpfCnpj', () => {
    it('should apply CPF mask', () => {
      expect(maskCpfCnpj('12345678901')).toBe('123.456.789-01');
    });

    it('should apply CNPJ mask', () => {
      expect(maskCpfCnpj('12345678000190')).toBe('12.345.678/0001-90');
    });

    it('should handle partial input', () => {
      expect(maskCpfCnpj('123')).toBe('123');
      expect(maskCpfCnpj('123456')).toBe('123.456');
    });
  });
});
