/**
 * Test ID Validation Script
 * Validates that components have proper test IDs for Puppeteer testing
 */

import { testIds, isValidTestId, extractTestIds } from '../src/utils/testIds';

describe('Test ID Validation', () => {
  describe('Test ID Utility Functions', () => {
    test('generateTestId creates valid IDs', () => {
      const testId = testIds.button.submit('login');
      expect(testId).toBe('button-login-submit');
      expect(isValidTestId(testId)).toBe(true);
    });

    test('isValidTestId validates correctly', () => {
      expect(isValidTestId('button-login-submit')).toBe(true);
      expect(isValidTestId('page-search-container')).toBe(true);
      expect(isValidTestId('invalid--format')).toBe(false);
      expect(isValidTestId('tooshort')).toBe(false);
      expect(isValidTestId('')).toBe(false);
      expect(isValidTestId(null)).toBe(false);
    });

    test('common test IDs are valid', () => {
      Object.values(testIds.button).forEach(buttonFactory => {
        const id = buttonFactory('test');
        expect(isValidTestId(id)).toBe(true);
      });

      Object.values(testIds.input).forEach(inputFactory => {
        const id = inputFactory('test');
        expect(isValidTestId(id)).toBe(true);
      });
    });
  });

  describe('Component Test ID Coverage', () => {
    // This test would need to be run in a browser environment
    // to actually check the DOM for test IDs
    test.skip('all interactive elements have test IDs', () => {
      // Would scan the DOM for buttons, inputs, etc.
      // and verify they have data-testid attributes
    });
  });
});

// Browser-based validation that can be run in development
if (typeof window !== 'undefined') {
  window.validateTestIds = () => {
    const results = {
      buttons: [],
      inputs: [],
      missing: [],
      duplicates: []
    };

    // Find all buttons
    const buttons = document.querySelectorAll('button, [role="button"]');
    buttons.forEach((button, index) => {
      const testId = button.getAttribute('data-testid');
      if (testId) {
        results.buttons.push(testId);
        if (!isValidTestId(testId)) {
          results.missing.push(`Invalid button test ID: ${testId}`);
        }
      } else {
        const text = button.textContent?.trim() || `button-${index}`;
        results.missing.push(`Button missing test ID: "${text}"`);
      }
    });

    // Find all inputs
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input, index) => {
      const testId = input.getAttribute('data-testid') || 
                    input.closest('[data-testid]')?.getAttribute('data-testid');
      if (testId) {
        results.inputs.push(testId);
        if (!isValidTestId(testId)) {
          results.missing.push(`Invalid input test ID: ${testId}`);
        }
      } else {
        const label = input.getAttribute('aria-label') || 
                     input.getAttribute('placeholder') || 
                     input.getAttribute('name') || 
                     `input-${index}`;
        results.missing.push(`Input missing test ID: "${label}"`);
      }
    });

    // Check for duplicates
    const allTestIds = [...results.buttons, ...results.inputs];
    const seen = new Set();
    allTestIds.forEach(id => {
      if (seen.has(id)) {
        results.duplicates.push(id);
      } else {
        seen.add(id);
      }
    });

    // Log results
    console.group('🔍 Test ID Validation Results');
    console.log(`✅ Buttons with test IDs: ${results.buttons.length}`);
    console.log(`✅ Inputs with test IDs: ${results.inputs.length}`);
    
    if (results.missing.length > 0) {
      console.group('❌ Missing or invalid test IDs:');
      results.missing.forEach(issue => console.log(issue));
      console.groupEnd();
    }
    
    if (results.duplicates.length > 0) {
      console.group('⚠️  Duplicate test IDs:');
      results.duplicates.forEach(id => console.log(id));
      console.groupEnd();
    }

    if (results.missing.length === 0 && results.duplicates.length === 0) {
      console.log('🎉 All components have valid test IDs!');
    }
    
    console.groupEnd();
    
    return results;
  };

  // Auto-run validation in development
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      console.log('🔍 Running automatic test ID validation...');
      window.validateTestIds();
    }, 2000);
  }
}

export default {
  testIds,
  isValidTestId,
  extractTestIds
};