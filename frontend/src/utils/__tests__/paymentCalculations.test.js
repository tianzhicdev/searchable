import {
  calculateAllInOneTotal,
  calculatePaymentFees,
  validatePaymentAmount,
  buildAllInOneSelections,
  calculateSimpleSearchableTotal,
  formatSelectionsForBalancePayment,
  PAYMENT_CONSTANTS
} from '../paymentCalculations';

describe('paymentCalculations', () => {
  describe('calculateAllInOneTotal', () => {
    const mockSearchableItem = {
      payloads: {
        public: {
          type: 'allinone',
          components: {
            downloadable: {
              enabled: true,
              files: [
                { id: '1', name: 'File 1', price: 10.99 },
                { id: '2', name: 'File 2', price: 5.50 }
              ]
            },
            offline: {
              enabled: true,
              items: [
                { id: '3', name: 'Item 1', price: 25.00 },
                { id: '4', name: 'Item 2', price: 15.75 }
              ]
            },
            donation: {
              enabled: true,
              pricingMode: 'flexible'
            }
          }
        }
      }
    };

    it('should calculate total with selected files only', () => {
      const selectedFiles = { '1': true, '2': false };
      const total = calculateAllInOneTotal(mockSearchableItem, selectedFiles, {}, null);
      expect(total).toBe(10.99);
    });

    it('should calculate total with offline items and quantities', () => {
      const selectedOfflineItems = { '3': 2, '4': 1 };
      const total = calculateAllInOneTotal(mockSearchableItem, {}, selectedOfflineItems, null);
      expect(total).toBe(65.75); // (25.00 * 2) + (15.75 * 1)
    });

    it('should calculate total with donation', () => {
      const selectedDonation = 20.00;
      const total = calculateAllInOneTotal(mockSearchableItem, {}, {}, selectedDonation);
      expect(total).toBe(20.00);
    });

    it('should calculate combined total', () => {
      const selectedFiles = { '1': true };
      const selectedOfflineItems = { '3': 1 };
      const selectedDonation = 10.00;
      const total = calculateAllInOneTotal(mockSearchableItem, selectedFiles, selectedOfflineItems, selectedDonation);
      expect(total).toBe(45.99); // 10.99 + 25.00 + 10.00
    });

    it('should return 0 for null searchableItem', () => {
      const total = calculateAllInOneTotal(null, {}, {}, null);
      expect(total).toBe(0);
    });

    it('should return 0 when no components', () => {
      const searchableItem = { payloads: { public: {} } };
      const total = calculateAllInOneTotal(searchableItem, {}, {}, null);
      expect(total).toBe(0);
    });
  });

  describe('calculatePaymentFees', () => {
    it('should calculate stripe payment fees correctly', () => {
      const fees = calculatePaymentFees(100, 'stripe');
      expect(fees.baseAmount).toBe(100);
      expect(fees.platformFee).toBe(0.10); // 0.1% of 100
      expect(fees.processingFee).toBe(3.50); // 3.5% of 100
      expect(fees.totalAmount).toBe(103.50);
      expect(fees.sellerReceives).toBe(99.90); // 100 - 0.10
    });

    it('should return no fees for balance payment', () => {
      const fees = calculatePaymentFees(100, 'balance');
      expect(fees.baseAmount).toBe(100);
      expect(fees.platformFee).toBe(0);
      expect(fees.processingFee).toBe(0);
      expect(fees.totalAmount).toBe(100);
      expect(fees.sellerReceives).toBe(100);
    });

    it('should handle zero amount', () => {
      const fees = calculatePaymentFees(0, 'stripe');
      expect(fees.baseAmount).toBe(0);
      expect(fees.platformFee).toBe(0);
      expect(fees.processingFee).toBe(0);
      expect(fees.totalAmount).toBe(0);
      expect(fees.sellerReceives).toBe(0);
    });
  });

  describe('validatePaymentAmount', () => {
    it('should validate valid general payment amount', () => {
      const result = validatePaymentAmount(10.00);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject non-numeric values', () => {
      const result = validatePaymentAmount('abc');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid number');
    });

    it('should reject amounts below minimum', () => {
      const result = validatePaymentAmount(0.001);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Minimum amount is $0.01');
    });

    it('should reject amounts above maximum', () => {
      const result = validatePaymentAmount(1000000);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Maximum amount is $999999.99');
    });

    it('should enforce minimum donation amount', () => {
      const result = validatePaymentAmount(0.50, 'donation');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Minimum donation is $1.00');
    });

    it('should accept valid donation amount', () => {
      const result = validatePaymentAmount(5.00, 'donation');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('buildAllInOneSelections', () => {
    const mockComponents = {
      downloadable: {
        enabled: true,
        files: [
          { id: '1', name: 'File 1', price: 10.99 },
          { id: '2', name: 'File 2', price: 5.50 }
        ]
      },
      offline: {
        enabled: true,
        items: [
          { id: '3', name: 'Item 1', price: 25.00 }
        ]
      },
      donation: {
        enabled: true
      }
    };

    it('should build selections for downloadable files', () => {
      const selectedFiles = { '1': true, '2': false };
      const selections = buildAllInOneSelections(mockComponents, selectedFiles, {}, null);
      
      expect(selections).toHaveLength(1);
      expect(selections[0]).toEqual({
        id: '1',
        component: 'downloadable',
        count: 1
      });
    });

    it('should build selections for offline items with quantities', () => {
      const selectedOfflineItems = { '3': 2 };
      const selections = buildAllInOneSelections(mockComponents, {}, selectedOfflineItems, null);
      
      expect(selections).toHaveLength(1);
      expect(selections[0]).toEqual({
        id: '3',
        component: 'offline',
        count: 2
      });
    });

    it('should build selections for donation', () => {
      const selections = buildAllInOneSelections(mockComponents, {}, {}, 25.00);
      
      expect(selections).toHaveLength(1);
      expect(selections[0]).toEqual({
        component: 'donation',
        amount: 25.00
      });
    });

    it('should return empty array when nothing selected', () => {
      const selections = buildAllInOneSelections(mockComponents, {}, {}, null);
      expect(selections).toHaveLength(0);
    });
  });

  describe('calculateSimpleSearchableTotal', () => {
    it('should calculate total for downloadable files', () => {
      const publicData = {
        type: 'downloadable',
        downloadableFiles: [
          { fileId: '1', price: 10.99 },
          { fileId: '2', price: 5.50 }
        ]
      };
      const selections = [
        { id: '1' },
        { id: '2' }
      ];
      
      const total = calculateSimpleSearchableTotal(publicData, selections);
      expect(total).toBe(16.49);
    });

    it('should calculate total for offline items with quantities', () => {
      const publicData = {
        type: 'offline',
        offlineItems: [
          { itemId: '1', price: 25.00 },
          { itemId: '2', price: 15.75 }
        ]
      };
      const selections = [
        { id: '1', count: 2 },
        { id: '2', count: 1 }
      ];
      
      const total = calculateSimpleSearchableTotal(publicData, selections);
      expect(total).toBe(65.75);
    });

    it('should calculate total for direct payment', () => {
      const publicData = { type: 'direct' };
      const selections = [
        { amount: 50.00 },
        { amount: 25.00 }
      ];
      
      const total = calculateSimpleSearchableTotal(publicData, selections);
      expect(total).toBe(75.00);
    });

    it('should return 0 for empty selections', () => {
      const publicData = { type: 'downloadable', downloadableFiles: [] };
      const total = calculateSimpleSearchableTotal(publicData, []);
      expect(total).toBe(0);
    });
  });

  describe('formatSelectionsForBalancePayment', () => {
    it('should format allinone selections correctly', () => {
      const searchableData = {
        payloads: {
          public: {
            type: 'allinone',
            components: {
              downloadable: {
                files: [{ id: '1', name: 'Test File', price: 10.99 }]
              },
              offline: {
                items: [{ id: '2', name: 'Test Item', price: 25.00 }]
              }
            }
          }
        }
      };
      
      const selections = [
        { id: '1', component: 'downloadable', count: 1 },
        { id: '2', component: 'offline', count: 2 },
        { component: 'donation', amount: 15.00 }
      ];
      
      const formatted = formatSelectionsForBalancePayment(searchableData, selections);
      
      expect(formatted).toHaveLength(4); // 1 file + 2 items + 1 donation
      expect(formatted[0]).toEqual({
        id: '1',
        name: 'Test File',
        price: 10.99,
        type: 'downloadable'
      });
      expect(formatted[1]).toEqual({
        id: '2',
        name: 'Test Item',
        price: 25.00,
        type: 'offline'
      });
      expect(formatted[2]).toEqual({
        id: '2',
        name: 'Test Item',
        price: 25.00,
        type: 'offline'
      });
      expect(formatted[3]).toEqual({
        id: 'donation',
        name: 'Support Creator',
        price: 15.00,
        type: 'donation'
      });
    });

    it('should handle legacy searchable types', () => {
      const searchableData = {
        payloads: {
          public: {
            type: 'downloadable'
          }
        }
      };
      
      const selections = [
        { id: '1', name: 'Legacy File', price: 10.00 }
      ];
      
      const formatted = formatSelectionsForBalancePayment(searchableData, selections);
      
      expect(formatted).toHaveLength(1);
      expect(formatted[0]).toEqual({
        id: '1',
        name: 'Legacy File',
        price: 10.00,
        type: 'downloadable'
      });
    });
  });

  describe('PAYMENT_CONSTANTS', () => {
    it('should have correct constant values', () => {
      expect(PAYMENT_CONSTANTS.STRIPE_FEE_PERCENTAGE).toBe(0.035);
      expect(PAYMENT_CONSTANTS.PLATFORM_FEE_PERCENTAGE).toBe(0.001);
      expect(PAYMENT_CONSTANTS.MIN_PAYMENT_AMOUNT).toBe(0.01);
      expect(PAYMENT_CONSTANTS.MAX_PAYMENT_AMOUNT).toBe(999999.99);
      expect(PAYMENT_CONSTANTS.MIN_DONATION_AMOUNT).toBe(1.00);
      expect(PAYMENT_CONSTANTS.DEFAULT_DONATION_AMOUNT).toBe(10.00);
    });
  });
});