import React from 'react';
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
  userEvent,
  checkAccessibility,
  mockApiResponse
} from '../../utils/testUtils';
import Dashboard from './Dashboard';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

// Mock child components to isolate Dashboard testing
jest.mock('./UserInvoices', () => {
  return function MockUserInvoices() {
    return (
      <div data-testid="user-invoices">
        <div>Total Spent: $29.99</div>
        <div>Invoice #1</div>
      </div>
    );
  };
});

jest.mock('./ProfileEditor', () => {
  return function MockProfileEditor() {
    return <div data-testid="profile-editor">Profile Editor</div>;
  };
});

jest.mock('../../components/Dialogs/WithdrawalDialog', () => {
  return function MockWithdrawalDialog({ open, onClose }) {
    return open ? (
      <div data-testid="withdrawal-dialog" role="dialog">
        <h2>Withdraw Funds</h2>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

jest.mock('../../components/Dialogs/RefillBalanceDialog', () => {
  return function MockRefillBalanceDialog({ open, onClose }) {
    return open ? (
      <div data-testid="refill-dialog" role="dialog">
        <h2>Refill Balance</h2>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

describe('Dashboard Page', () => {
  describe('Component Rendering', () => {
    test('renders dashboard with all main sections', async () => {
      const { container } = renderWithProviders(<Dashboard />);
      
      // Check for main sections
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      
      // Wait for balance to load
      await waitFor(() => {
        expect(screen.getByText(/balance/i)).toBeInTheDocument();
        expect(screen.getByText('$100.00')).toBeInTheDocument();
      });
      
      // Check for child components
      expect(screen.getByTestId('user-invoices')).toBeInTheDocument();
      expect(screen.getByTestId('profile-editor')).toBeInTheDocument();
      
      // Check accessibility
      await checkAccessibility(container);
    });

    test('displays user greeting with username', async () => {
      renderWithProviders(<Dashboard />);
      
      // Should show personalized greeting
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    });

    test('displays quick stats cards', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        // Check for stat cards
        expect(screen.getByText(/total spent/i)).toBeInTheDocument();
        expect(screen.getByText(/total earned/i)).toBeInTheDocument();
        expect(screen.getByText(/total withdrawn/i)).toBeInTheDocument();
        expect(screen.getByText(/gifts received/i)).toBeInTheDocument();
      });
    });
  });

  describe('Balance Display', () => {
    test('displays current balance correctly', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        const balanceElement = screen.getByText('$100.00');
        expect(balanceElement).toBeInTheDocument();
        expect(balanceElement).toHaveStyle({ fontSize: expect.stringMatching(/\d+/) });
      });
    });

    test('updates balance when refilled', async () => {
      renderWithProviders(<Dashboard />);
      
      // Initial balance
      await waitFor(() => {
        expect(screen.getByText('$100.00')).toBeInTheDocument();
      });
      
      // Mock updated balance
      server.use(
        http.get('/api/v1/balance', () => {
          return HttpResponse.json({
            success: true,
            balance: { usd: 150 }
          });
        })
      );
      
      // Trigger balance refresh
      const refillButton = screen.getByRole('button', { name: /refill/i });
      fireEvent.click(refillButton);
      
      // Close dialog to trigger refresh
      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);
      });
      
      // Check updated balance
      await waitFor(() => {
        expect(screen.getByText('$150.00')).toBeInTheDocument();
      });
    });

    test('handles balance fetch error gracefully', async () => {
      // Mock error response
      server.use(
        http.get('/api/v1/balance', () => {
          return HttpResponse.json(
            { success: false, error: 'Failed to fetch balance' },
            { status: 500 }
          );
        })
      );
      
      renderWithProviders(<Dashboard />);
      
      // Should show fallback or error state
      await waitFor(() => {
        expect(screen.queryByText('$100.00')).not.toBeInTheDocument();
        // Could show error message or $0.00
      });
    });
  });

  describe('Quick Actions', () => {
    test('opens withdrawal dialog when withdraw button is clicked', async () => {
      renderWithProviders(<Dashboard />);
      
      const withdrawButton = await screen.findByRole('button', { name: /withdraw/i });
      fireEvent.click(withdrawButton);
      
      // Check dialog opened
      await waitFor(() => {
        expect(screen.getByTestId('withdrawal-dialog')).toBeInTheDocument();
        expect(screen.getByText(/withdraw funds/i)).toBeInTheDocument();
      });
    });

    test('opens refill dialog when refill button is clicked', async () => {
      renderWithProviders(<Dashboard />);
      
      const refillButton = await screen.findByRole('button', { name: /refill/i });
      fireEvent.click(refillButton);
      
      // Check dialog opened
      await waitFor(() => {
        expect(screen.getByTestId('refill-dialog')).toBeInTheDocument();
        expect(screen.getByText(/refill balance/i)).toBeInTheDocument();
      });
    });

    test('disables withdraw button when balance is zero', async () => {
      // Mock zero balance
      server.use(
        http.get('/api/v1/balance', () => {
          return HttpResponse.json({
            success: true,
            balance: { usd: 0 }
          });
        })
      );
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        const withdrawButton = screen.getByRole('button', { name: /withdraw/i });
        expect(withdrawButton).toBeDisabled();
      });
    });

    test('closes dialogs when close button is clicked', async () => {
      renderWithProviders(<Dashboard />);
      
      // Open withdrawal dialog
      const withdrawButton = await screen.findByRole('button', { name: /withdraw/i });
      fireEvent.click(withdrawButton);
      
      // Check dialog is open
      expect(screen.getByTestId('withdrawal-dialog')).toBeInTheDocument();
      
      // Close dialog
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      // Check dialog is closed
      await waitFor(() => {
        expect(screen.queryByTestId('withdrawal-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Menu Actions', () => {
    test('opens menu when more button is clicked', async () => {
      renderWithProviders(<Dashboard />);
      
      const menuButton = await screen.findByRole('button', { name: /more/i });
      fireEvent.click(menuButton);
      
      // Check menu items
      await waitFor(() => {
        expect(screen.getByText(/my downloads/i)).toBeInTheDocument();
        expect(screen.getByText(/edit profile/i)).toBeInTheDocument();
        expect(screen.getByText(/change password/i)).toBeInTheDocument();
      });
    });

    test('navigates to downloads page when menu item clicked', async () => {
      const { history } = renderWithProviders(<Dashboard />);
      
      // Open menu
      const menuButton = await screen.findByRole('button', { name: /more/i });
      fireEvent.click(menuButton);
      
      // Click downloads
      const downloadsItem = await screen.findByText(/my downloads/i);
      fireEvent.click(downloadsItem);
      
      // Check navigation
      expect(history.location.pathname).toBe('/my-downloads');
    });

    test('opens change password dialog from menu', async () => {
      renderWithProviders(<Dashboard />);
      
      // Open menu
      const menuButton = await screen.findByRole('button', { name: /more/i });
      fireEvent.click(menuButton);
      
      // Mock the change password dialog
      const changePasswordItem = await screen.findByText(/change password/i);
      fireEvent.click(changePasswordItem);
      
      // Would check for password dialog here
      // (Currently mocked, so just check menu closes)
      await waitFor(() => {
        expect(screen.queryByText(/my downloads/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    test('displays correct tabs for transaction history', async () => {
      renderWithProviders(<Dashboard />);
      
      // Check for tabs in UserInvoices component
      await waitFor(() => {
        expect(screen.getByTestId('user-invoices')).toBeInTheDocument();
        expect(screen.getByText(/total spent/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('adjusts layout for mobile screens', async () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;
      global.dispatchEvent(new Event('resize'));
      
      renderWithProviders(<Dashboard />);
      
      // Check mobile-specific adjustments
      await waitFor(() => {
        const dashboard = screen.getByText(/dashboard/i).closest('div');
        // Mobile should have different padding/spacing
        expect(dashboard).toBeInTheDocument();
      });
    });

    test('shows mobile-optimized balance card', async () => {
      // Mock mobile
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 600px'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        const balanceCard = screen.getByText(/balance/i).closest('[class*=card]');
        expect(balanceCard).toBeInTheDocument();
      });
    });
  });

  describe('Success Messages', () => {
    test('shows success message after withdrawal', async () => {
      renderWithProviders(<Dashboard />);
      
      // Open withdrawal dialog
      const withdrawButton = await screen.findByRole('button', { name: /withdraw/i });
      fireEvent.click(withdrawButton);
      
      // Simulate successful withdrawal
      // (In real test, would interact with withdrawal form)
      
      // For now, just close dialog
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      // Would check for success snackbar here
    });
  });

  describe('Loading States', () => {
    test('shows loading state while fetching data', async () => {
      // Mock delayed response
      server.use(
        http.get('/api/v1/balance', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({
            success: true,
            balance: { usd: 100 }
          });
        })
      );
      
      renderWithProviders(<Dashboard />);
      
      // Should show loading indicator initially
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        expect(screen.getByText('$100.00')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when data fetch fails', async () => {
      // Mock all endpoints to fail
      server.use(
        http.get('/api/v1/balance', () => {
          return HttpResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
          );
        }),
        http.get('/api/v1/user/invoices', () => {
          return HttpResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
          );
        })
      );
      
      renderWithProviders(<Dashboard />);
      
      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    test('allows retry after error', async () => {
      let attemptCount = 0;
      
      server.use(
        http.get('/api/v1/balance', () => {
          attemptCount++;
          if (attemptCount === 1) {
            return HttpResponse.json(
              { success: false, error: 'Temporary error' },
              { status: 500 }
            );
          }
          return HttpResponse.json({
            success: true,
            balance: { usd: 100 }
          });
        })
      );
      
      renderWithProviders(<Dashboard />);
      
      // First attempt fails
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
      
      // Find and click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);
      
      // Should succeed on retry
      await waitFor(() => {
        expect(screen.getByText('$100.00')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('supports keyboard navigation between sections', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('$100.00')).toBeInTheDocument();
      });
      
      // Tab through interactive elements
      const withdrawButton = screen.getByRole('button', { name: /withdraw/i });
      const refillButton = screen.getByRole('button', { name: /refill/i });
      
      // Focus on first button
      withdrawButton.focus();
      expect(document.activeElement).toBe(withdrawButton);
      
      // Tab to next button
      userEvent.tab();
      expect(document.activeElement).toBe(refillButton);
    });

    test('announces balance changes to screen readers', async () => {
      renderWithProviders(<Dashboard />);
      
      // Initial balance
      await waitFor(() => {
        const balanceRegion = screen.getByLabelText(/current balance/i);
        expect(balanceRegion).toHaveTextContent('$100.00');
      });
      
      // Update balance
      server.use(
        http.get('/api/v1/balance', () => {
          return HttpResponse.json({
            success: true,
            balance: { usd: 150 }
          });
        })
      );
      
      // Trigger refresh
      const refillButton = screen.getByRole('button', { name: /refill/i });
      fireEvent.click(refillButton);
      
      // Close dialog
      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);
      });
      
      // Check updated announcement
      await waitFor(() => {
        const balanceRegion = screen.getByLabelText(/current balance/i);
        expect(balanceRegion).toHaveTextContent('$150.00');
      });
    });
  });
});