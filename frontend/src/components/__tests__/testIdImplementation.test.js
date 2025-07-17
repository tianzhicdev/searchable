import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';

// Import components to test
import PageHeaderButton from '../Navigation/PageHeaderButton';
import { testIds, isValidTestId } from '../../utils/testIds';

// Create a theme for testing
const testTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
  spacing: (factor) => `${8 * factor}px`,
  breakpoints: {
    down: () => '@media (max-width: 600px)',
  },
});

// Mock store for components that need Redux
const mockStore = createStore(() => ({
  customization: { borderRadius: 8 }
}));

const TestWrapper = ({ children }) => (
  <Provider store={mockStore}>
    <ThemeProvider theme={testTheme}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </ThemeProvider>
  </Provider>
);

describe('Test ID Implementation', () => {
  describe('Test ID Utilities', () => {
    test('generates valid test IDs', () => {
      const buttonId = testIds.button.submit('login');
      const inputId = testIds.input.field('auth', 'email');
      const pageId = testIds.page.container('search');

      expect(buttonId).toBe('button-login-submit');
      expect(inputId).toBe('input-auth-email-field');
      expect(pageId).toBe('page-search-container');

      expect(isValidTestId(buttonId)).toBe(true);
      expect(isValidTestId(inputId)).toBe(true);
      expect(isValidTestId(pageId)).toBe(true);
    });

    test('validates test ID format correctly', () => {
      expect(isValidTestId('button-login-submit')).toBe(true);
      expect(isValidTestId('input-auth-email-field')).toBe(true);
      expect(isValidTestId('page-search-container')).toBe(true);
      
      // Invalid formats
      expect(isValidTestId('invalid')).toBe(false); // Too short
      expect(isValidTestId('invalid--format')).toBe(false); // Double dash
      expect(isValidTestId('')).toBe(false); // Empty
      expect(isValidTestId(null)).toBe(false); // Null
    });
  });

  describe('Component Test IDs', () => {
    test('PageHeaderButton has correct test ID', () => {
      const { container } = render(
        <TestWrapper>
          <PageHeaderButton onClick={() => {}}>Back</PageHeaderButton>
        </TestWrapper>
      );

      const button = container.querySelector('[data-testid="button-nav-back"]');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe('Back');
    });

    test('PageHeaderButton uses custom test ID', () => {
      const customTestId = 'button-custom-test';
      const { container } = render(
        <TestWrapper>
          <PageHeaderButton onClick={() => {}} testId={customTestId}>
            Custom
          </PageHeaderButton>
        </TestWrapper>
      );

      const button = container.querySelector(`[data-testid="${customTestId}"]`);
      expect(button).toBeInTheDocument();
    });
  });

  describe('Test ID Coverage', () => {
    test('common test ID patterns work', () => {
      // Test button patterns
      expect(testIds.button.submit('login')).toBe('button-login-submit');
      expect(testIds.button.cancel('form')).toBe('button-form-cancel');
      expect(testIds.button.nav('back')).toBe('button-nav-back');

      // Test input patterns
      expect(testIds.input.field('auth', 'email')).toBe('input-auth-email-field');
      expect(testIds.input.email()).toBe('input-auth-email-field');
      expect(testIds.input.password()).toBe('input-auth-password-field');

      // Test page patterns
      expect(testIds.page.container('search')).toBe('page-search-container');
      expect(testIds.page.content('results')).toBe('page-results-content');

      // Test dialog patterns
      expect(testIds.dialog.container('confirm')).toBe('dialog-confirm-container');

      // Test list patterns
      expect(testIds.list.container('items')).toBe('list-items-container');
      expect(testIds.list.item('product', 0)).toBe('list-product-item-0');
    });

    test('all pattern functions generate valid IDs', () => {
      const patterns = [
        testIds.button.submit('test'),
        testIds.button.cancel('test'),
        testIds.input.field('test', 'field'),
        testIds.page.container('test'),
        testIds.dialog.container('test'),
        testIds.list.container('test'),
        testIds.nav.menu('test'),
        testIds.card.container('test')
      ];

      patterns.forEach(id => {
        expect(isValidTestId(id)).toBe(true);
      });
    });
  });
});

// Integration test example for future use
describe.skip('Integration Tests (requires running app)', () => {
  test('search flow has all required test IDs', async () => {
    // This would be run with puppeteer or playwright
    // Example structure for actual E2E tests
    /*
    await page.goto('http://localhost:3000');
    await page.type('[data-testid="input-main-search-field"]', 'test query');
    await page.click('[data-testid="button-search-submit"]');
    await page.waitForSelector('[data-testid="list-searchables-container"]');
    */
  });
});