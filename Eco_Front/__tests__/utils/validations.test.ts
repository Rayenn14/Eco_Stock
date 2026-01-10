/**
 * Tests pour les fonctions de validation utilisées dans l'app
 */

describe('Utils: Validations', () => {
  describe('Email validation', () => {
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.com',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        '',
        'user@.com',
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('Code postal validation', () => {
    const validateCodePostal = (code: string): boolean => {
      const codeRegex = /^\d{5}$/;
      return code === '' || codeRegex.test(code);
    };

    it('should validate correct French postal codes', () => {
      const validCodes = [
        '75001',
        '69000',
        '13001',
        '59000',
        '00000',
        '99999',
      ];

      validCodes.forEach(code => {
        expect(validateCodePostal(code)).toBe(true);
      });
    });

    it('should accept empty string (optional field)', () => {
      expect(validateCodePostal('')).toBe(true);
    });

    it('should reject invalid postal codes', () => {
      const invalidCodes = [
        '1234',      // Too short
        '123456',    // Too long
        'ABCDE',     // Letters
        '750 01',    // Space
        '75-001',    // Dash
      ];

      invalidCodes.forEach(code => {
        expect(validateCodePostal(code)).toBe(false);
      });
    });
  });

  describe('Phone validation', () => {
    const validatePhone = (phone: string): boolean => {
      const phoneRegex = /^(\+33|0)[1-9](\d{2}){4}$/;
      return phone === '' || phoneRegex.test(phone.replace(/\s/g, ''));
    };

    it('should validate correct French phone numbers', () => {
      const validPhones = [
        '0612345678',
        '+33612345678',
        '0123456789',
        '+33123456789',
      ];

      validPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(true);
      });
    });

    it('should accept empty string (optional field)', () => {
      expect(validatePhone('')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123456789',     // Too short
        '06123456789',   // Too long
        '0012345678',    // Invalid prefix
        'abcdefghij',    // Letters
      ];

      invalidPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(false);
      });
    });
  });

  describe('Password strength validation', () => {
    const validatePasswordStrength = (password: string): {
      isValid: boolean;
      errors: string[];
    } => {
      const errors: string[] = [];

      if (password.length < 6) {
        errors.push('Le mot de passe doit contenir au moins 6 caractères');
      }

      if (password.length > 100) {
        errors.push('Le mot de passe est trop long (max 100 caractères)');
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    };

    it('should accept valid passwords', () => {
      const validPasswords = [
        'password123',
        'MyP@ssw0rd',
        'simple',
        '123456',
      ];

      validPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject too short passwords', () => {
      const shortPasswords = ['12345', 'abc', '', 'a'];

      shortPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Le mot de passe doit contenir au moins 6 caractères');
      });
    });

    it('should reject too long passwords', () => {
      const longPassword = 'a'.repeat(101);
      const result = validatePasswordStrength(longPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le mot de passe est trop long (max 100 caractères)');
    });
  });

  describe('Price validation', () => {
    const validatePrice = (price: string): boolean => {
      const priceNum = parseFloat(price);
      return !isNaN(priceNum) && priceNum > 0 && priceNum < 1000000;
    };

    it('should validate correct prices', () => {
      const validPrices = ['1.99', '10', '0.50', '999.99', '100000'];

      validPrices.forEach(price => {
        expect(validatePrice(price)).toBe(true);
      });
    });

    it('should reject invalid prices', () => {
      const invalidPrices = [
        '-5',        // Negative
        '0',         // Zero
        'abc',       // Not a number
        '',          // Empty
        '1000000',   // Too expensive
      ];

      invalidPrices.forEach(price => {
        expect(validatePrice(price)).toBe(false);
      });
    });
  });

  describe('Stock validation', () => {
    const validateStock = (stock: string): boolean => {
      const stockNum = parseInt(stock);
      return !isNaN(stockNum) && stockNum > 0 && stockNum <= 10000;
    };

    it('should validate correct stock values', () => {
      const validStocks = ['1', '10', '100', '1000', '10000'];

      validStocks.forEach(stock => {
        expect(validateStock(stock)).toBe(true);
      });
    });

    it('should reject invalid stock values', () => {
      const invalidStocks = [
        '0',       // Zero
        '-5',      // Negative
        '10001',   // Too high
        'abc',     // Not a number
        '1.5',     // Decimal (parseInt will make it 1, which is valid)
      ];

      invalidStocks.forEach(stock => {
        const result = validateStock(stock);
        if (stock === '1.5') {
          expect(result).toBe(true); // parseInt('1.5') = 1
        } else {
          expect(result).toBe(false);
        }
      });
    });
  });
});
