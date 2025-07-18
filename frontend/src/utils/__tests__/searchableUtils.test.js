import {
  formatUSD,
  formatCurrency,
  formatFileSize,
  validationRules,
  validateItemsArray,
  createSearchablePayload,
  createInvoicePayload,
  generateTempId,
  safeParseFloat,
  debounce
} from '../searchableUtils';

describe('searchableUtils', () => {
  describe('formatUSD', () => {
    it('should format USD amounts correctly', () => {
      expect(formatUSD(100)).toBe('$100.00');
      expect(formatUSD(1234.56)).toBe('$1,234.56');
      expect(formatUSD(0)).toBe('$0.00');
      expect(formatUSD(0.1)).toBe('$0.10');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD by default', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(100, 'USD')).toBe('$100.00');
    });

    it('should handle null/undefined amounts', () => {
      expect(formatCurrency(null)).toBe('$0.00');
      expect(formatCurrency(undefined)).toBe('$0.00');
      expect(formatCurrency(NaN)).toBe('$0.00');
    });

    it('should format BTC correctly', () => {
      expect(formatCurrency(1.23456789, 'BTC')).toBe('1.23456789 BTC');
      expect(formatCurrency(0.00000001, 'BTC')).toBe('0.00000001 BTC');
    });

    it('should format USDT correctly', () => {
      expect(formatCurrency(100.123, 'USDT')).toBe('100.12 USDT');
      expect(formatCurrency(0.1, 'USDT')).toBe('0.10 USDT');
    });

    it('should handle case-insensitive currency codes', () => {
      expect(formatCurrency(100, 'usd')).toBe('$100.00');
      expect(formatCurrency(100, 'btc')).toBe('100.00000000 BTC');
      expect(formatCurrency(100, 'usdt')).toBe('100.00 USDT');
    });

    it('should handle various currency formats', () => {
      // The behavior for unsupported currencies may vary by environment
      const result = formatCurrency(100, 'XYZ');
      // Should either show XYZ format or fallback to USD
      expect(result).toMatch(/(\$100\.00|XYZ\s*100\.00)/);
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(100)).toBe('100 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('validationRules', () => {
    describe('required', () => {
      it('should validate required fields', () => {
        expect(validationRules.required('test', 'Field')).toBeNull();
        expect(validationRules.required('', 'Field')).toBe('Field is required');
        expect(validationRules.required(null, 'Field')).toBe('Field is required');
        expect(validationRules.required('  ', 'Field')).toBe('Field is required');
      });
    });

    describe('minLength', () => {
      it('should validate minimum length', () => {
        expect(validationRules.minLength('test', 3, 'Field')).toBeNull();
        expect(validationRules.minLength('te', 3, 'Field')).toBe('Field must be at least 3 characters');
        // Empty string doesn't trigger minLength validation
        expect(validationRules.minLength('', 1, 'Field')).toBeNull();
        expect(validationRules.minLength('a', 2, 'Field')).toBe('Field must be at least 2 characters');
      });
    });

    describe('positiveNumber', () => {
      it('should validate positive numbers', () => {
        expect(validationRules.positiveNumber('10', 'Price')).toBeNull();
        expect(validationRules.positiveNumber('0.01', 'Price')).toBeNull();
        expect(validationRules.positiveNumber('0', 'Price')).toBe('Price must be a positive number');
        expect(validationRules.positiveNumber('-5', 'Price')).toBe('Price must be a positive number');
        expect(validationRules.positiveNumber('abc', 'Price')).toBe('Price must be a positive number');
      });
    });

    describe('minPrice', () => {
      it('should validate minimum price', () => {
        expect(validationRules.minPrice('1.00')).toBeNull();
        expect(validationRules.minPrice('0.01')).toBeNull();
        expect(validationRules.minPrice('0.001')).toBe('Price must be at least $0.01');
        expect(validationRules.minPrice('5.00', 10)).toBe('Price must be at least $10.00');
      });
    });
  });

  describe('validateItemsArray', () => {
    it('should validate items array', () => {
      expect(validateItemsArray([1, 2, 3])).toBeNull();
      expect(validateItemsArray([])).toBe('Please add at least one items');
      expect(validateItemsArray(null)).toBe('Please add at least one items');
      expect(validateItemsArray([], 'files')).toBe('Please add at least one files');
    });
  });

  describe('createSearchablePayload', () => {
    it('should create proper searchable payload structure', () => {
      const formData = {
        title: 'Test Title',
        description: 'Test Description',
        currency: 'btc'
      };
      const images = ['image1.jpg', 'image2.jpg'];
      const typeSpecificData = {
        downloadableFiles: [{ fileId: '1', name: 'File 1' }]
      };

      const payload = createSearchablePayload(formData, 'downloadable', images, typeSpecificData);

      expect(payload).toEqual({
        payloads: {
          public: {
            title: 'Test Title',
            description: 'Test Description',
            currency: 'btc',
            type: 'downloadable',
            images: ['image1.jpg', 'image2.jpg'],
            visibility: {
              udf: 'always_true',
              data: {}
            },
            downloadableFiles: [{ fileId: '1', name: 'File 1' }]
          }
        }
      });
    });

    it('should default to usd currency', () => {
      const formData = { title: 'Test' };
      const payload = createSearchablePayload(formData, 'direct', []);
      expect(payload.payloads.public.currency).toBe('usd');
    });
  });

  describe('createInvoicePayload', () => {
    it('should create invoice payload with user data', () => {
      const user = {
        address: '123 Main St',
        tel: '555-1234'
      };
      const selections = [{ id: '1', count: 1 }];
      
      const payload = createInvoicePayload(123, selections, 100.00, user);
      
      expect(payload).toEqual({
        searchable_id: 123,
        invoice_type: 'stripe',
        currency: 'usd',
        selections: selections,
        total_price: 100.00,
        success_url: expect.stringContaining(window.location.pathname),
        cancel_url: expect.stringContaining(window.location.pathname),
        address: '123 Main St',
        tel: '555-1234'
      });
    });

    it('should create invoice payload without user data', () => {
      const selections = [{ id: '1', count: 1 }];
      
      const payload = createInvoicePayload('456', selections, 50.00);
      
      expect(payload.searchable_id).toBe(456);
      expect(payload.total_price).toBe(50.00);
      expect(payload.address).toBeUndefined();
      expect(payload.tel).toBeUndefined();
    });
  });

  describe('generateTempId', () => {
    it('should generate timestamp-based IDs', () => {
      const id1 = generateTempId();
      const id2 = generateTempId();
      
      expect(typeof id1).toBe('number');
      expect(typeof id2).toBe('number');
      // IDs should be timestamp-based, so they should be close but might be equal if called quickly
      expect(id1).toBeLessThanOrEqual(id2);
    });
  });

  describe('safeParseFloat', () => {
    it('should parse valid numbers', () => {
      expect(safeParseFloat('123.45')).toBe(123.45);
      expect(safeParseFloat(100)).toBe(100);
      expect(safeParseFloat('0.01')).toBe(0.01);
    });

    it('should return fallback for invalid values', () => {
      expect(safeParseFloat('abc')).toBe(0);
      expect(safeParseFloat(null)).toBe(0);
      expect(safeParseFloat(undefined)).toBe(0);
      expect(safeParseFloat('abc', 10)).toBe(10);
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('call1');
      debouncedFn('call2');
      debouncedFn('call3');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call3');
    });

    it('should handle multiple debounce cycles', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 50);

      debouncedFn('first');
      jest.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledWith('first');

      debouncedFn('second');
      jest.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledWith('second');

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});