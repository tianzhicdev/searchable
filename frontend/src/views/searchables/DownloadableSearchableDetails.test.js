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
import DownloadableSearchableDetails from './DownloadableSearchableDetails';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

// Mock the BaseSearchableDetails component
jest.mock('../../components/BaseSearchableDetails', () => {
  return function MockBaseSearchableDetails({ 
    renderTypeSpecificContent,
    showPricing = true
  }) {
    // Mock searchable data
    const mockSearchable = {
      searchable_id: 'test-downloadable-1',
      title: 'Test Downloadable Package',
      description: 'A collection of test files',
      seller: 'TestSeller',
      tags: ['test', 'downloadable'],
      downloadableFiles: [
        {
          fileId: 'file-1',
          name: 'test-document.pdf',
          description: 'Test PDF document',
          price: 9.99,
          fileName: 'test-document.pdf',
          fileSize: 1024000
        },
        {
          fileId: 'file-2',
          name: 'test-spreadsheet.xlsx',
          description: 'Test spreadsheet',
          price: 4.99,
          fileName: 'test-spreadsheet.xlsx',
          fileSize: 512000
        }
      ]
    };
    
    return (
      <div data-testid="base-searchable-details">
        <h1>{mockSearchable.title}</h1>
        <p>{mockSearchable.description}</p>
        <div>Seller: {mockSearchable.seller}</div>
        <div>Tags: {mockSearchable.tags.join(', ')}</div>
        
        {/* Render type-specific content */}
        {renderTypeSpecificContent(mockSearchable)}
      </div>
    );
  };
});

// Mock the hooks
jest.mock('../../hooks/useSearchableDetails', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    SearchableItem: {
      searchable_id: 'test-downloadable-1',
      title: 'Test Downloadable Package',
      downloadableFiles: [
        {
          fileId: 'file-1',
          name: 'test-document.pdf',
          description: 'Test PDF document',
          price: 9.99,
          fileName: 'test-document.pdf',
          fileSize: 1024000
        },
        {
          fileId: 'file-2',
          name: 'test-spreadsheet.xlsx',
          description: 'Test spreadsheet',
          price: 4.99,
          fileName: 'test-spreadsheet.xlsx',
          fileSize: 512000
        }
      ]
    },
    searchableRating: { average: 4.5, count: 10 },
    loadingRatings: false,
    fetchRatings: jest.fn(),
    createInvoice: jest.fn(),
    createBalancePayment: jest.fn(),
    formatCurrency: jest.fn(price => `$${price.toFixed(2)}`),
    id: 'test-downloadable-1'
  }))
}));

// Mock the RatingDisplay component
jest.mock('../../components/Rating/RatingDisplay', () => {
  return function MockRatingDisplay({ rating, count }) {
    return (
      <div data-testid="rating-display">
        <span>{rating} stars</span>
        <span>({count} reviews)</span>
      </div>
    );
  };
});

// Mock InvoiceList
jest.mock('../payments/InvoiceList', () => {
  return function MockInvoiceList({ invoices = [] }) {
    return (
      <div data-testid="invoice-list">
        {invoices.length > 0 ? (
          invoices.map((invoice, index) => (
            <div key={index}>Invoice #{invoice.invoice_id}</div>
          ))
        ) : (
          <div>No invoices</div>
        )}
      </div>
    );
  };
});

describe('DownloadableSearchableDetails Page', () => {
  beforeEach(() => {
    // Mock API responses
    mockApiResponse('/api/v1/searchable-payments', {
      success: true,
      payments: []
    });
  });

  describe('Component Rendering', () => {
    test('renders downloadable details page with all elements', async () => {
      const { container } = renderWithProviders(<DownloadableSearchableDetails />);
      
      // Check main elements
      expect(screen.getByText('Test Downloadable Package')).toBeInTheDocument();
      expect(screen.getByText('A collection of test files')).toBeInTheDocument();
      expect(screen.getByText('Seller: TestSeller')).toBeInTheDocument();
      
      // Check file list
      expect(screen.getByText('Available Files')).toBeInTheDocument();
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
      expect(screen.getByText('test-spreadsheet.xlsx')).toBeInTheDocument();
      
      // Check prices
      expect(screen.getByText('$9.99')).toBeInTheDocument();
      expect(screen.getByText('$4.99')).toBeInTheDocument();
      
      // Check action buttons
      expect(screen.getByRole('button', { name: /purchase selected/i })).toBeInTheDocument();
      
      // Check accessibility
      await checkAccessibility(container);
    });

    test('displays file descriptions', () => {
      renderWithProviders(<DownloadableSearchableDetails />);
      
      expect(screen.getByText('Test PDF document')).toBeInTheDocument();
      expect(screen.getByText('Test spreadsheet')).toBeInTheDocument();
    });

    test('displays file sizes correctly', () => {
      renderWithProviders(<DownloadableSearchableDetails />);
      
      // Should format file sizes
      expect(screen.getByText(/1\.00 MB/i)).toBeInTheDocument();
      expect(screen.getByText(/500\.00 KB/i)).toBeInTheDocument();
    });

    test('displays rating information', () => {
      renderWithProviders(<DownloadableSearchableDetails />);
      
      expect(screen.getByTestId('rating-display')).toBeInTheDocument();
      expect(screen.getByText('4.5 stars')).toBeInTheDocument();
      expect(screen.getByText('(10 reviews)')).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    test('allows selecting individual files', async () => {
      renderWithProviders(<DownloadableSearchableDetails />);
      
      // Click on first file
      const firstFile = screen.getByText('test-document.pdf').closest('[class*=fileItem]');
      fireEvent.click(firstFile);
      
      // Check file is selected
      expect(firstFile).toHaveClass('fileItemSelected');
      
      // Check total price updated
      expect(screen.getByText('Total: $9.99')).toBeInTheDocument();
    });

    test('allows selecting multiple files', async () => {
      renderWithProviders(<DownloadableSearchableDetails />);
      
      // Click on both files
      const firstFile = screen.getByText('test-document.pdf').closest('[class*=fileItem]');
      const secondFile = screen.getByText('test-spreadsheet.xlsx').closest('[class*=fileItem]');
      
      fireEvent.click(firstFile);
      fireEvent.click(secondFile);
      
      // Check both are selected
      expect(firstFile).toHaveClass('fileItemSelected');
      expect(secondFile).toHaveClass('fileItemSelected');
      
      // Check total price
      expect(screen.getByText('Total: $14.98')).toBeInTheDocument();
    });

    test('toggles file selection on click', async () => {
      renderWithProviders(<DownloadableSearchableDetails />);
      
      const firstFile = screen.getByText('test-document.pdf').closest('[class*=fileItem]');
      
      // Select
      fireEvent.click(firstFile);
      expect(firstFile).toHaveClass('fileItemSelected');
      
      // Deselect
      fireEvent.click(firstFile);
      expect(firstFile).not.toHaveClass('fileItemSelected');
      
      // Total should be zero
      expect(screen.getByText('Total: $0.00')).toBeInTheDocument();
    });

    test('disables purchase button when no files selected', () => {
      renderWithProviders(<DownloadableSearchableDetails />);
      
      const purchaseButton = screen.getByRole('button', { name: /purchase selected/i });
      expect(purchaseButton).toBeDisabled();
    });

    test('enables purchase button when files are selected', async () => {
      renderWithProviders(<DownloadableSearchableDetails />);
      
      // Select a file
      const firstFile = screen.getByText('test-document.pdf').closest('[class*=fileItem]');
      fireEvent.click(firstFile);
      
      const purchaseButton = screen.getByRole('button', { name: /purchase selected/i });
      expect(purchaseButton).toBeEnabled();
    });
  });

  describe('Purchase Flow', () => {
    test('creates invoice when purchase button clicked', async () => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      const mockCreateInvoice = jest.fn().mockResolvedValue({
        success: true,
        invoice: { invoice_id: 'inv-123', amount: 9.99 }
      });
      
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        createInvoice: mockCreateInvoice
      });
      
      renderWithProviders(<DownloadableSearchableDetails />);
      
      // Select a file
      const firstFile = screen.getByText('test-document.pdf').closest('[class*=fileItem]');
      fireEvent.click(firstFile);
      
      // Click purchase
      const purchaseButton = screen.getByRole('button', { name: /purchase selected/i });
      fireEvent.click(purchaseButton);
      
      await waitFor(() => {
        expect(mockCreateInvoice).toHaveBeenCalledWith(
          'test-downloadable-1',
          expect.objectContaining({
            files: ['file-1']
          })
        );
      });
    });

    test('shows success message after purchase', async () => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      const mockCreateInvoice = jest.fn().mockResolvedValue({
        success: true,
        invoice: { invoice_id: 'inv-123' }
      });
      
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        createInvoice: mockCreateInvoice
      });
      
      renderWithProviders(<DownloadableSearchableDetails />);
      
      // Select and purchase
      const firstFile = screen.getByText('test-document.pdf').closest('[class*=fileItem]');
      fireEvent.click(firstFile);
      
      const purchaseButton = screen.getByRole('button', { name: /purchase selected/i });
      fireEvent.click(purchaseButton);
      
      // Check for success alert
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Invoice created successfully/i);
      });
    });

    test('handles purchase error', async () => {
      const useSearchableDetails = require('../../hooks/useSearchableDetails').default;
      const mockCreateInvoice = jest.fn().mockRejectedValue(new Error('Payment failed'));
      
      useSearchableDetails.mockReturnValue({
        ...useSearchableDetails(),
        createInvoice: mockCreateInvoice
      });
      
      renderWithProviders(<DownloadableSearchableDetails />);
      
      // Select and try to purchase
      const firstFile = screen.getByText('test-document.pdf').closest('[class*=fileItem]');
      fireEvent.click(firstFile);
      
      const purchaseButton = screen.getByRole('button', { name: /purchase selected/i });
      fireEvent.click(purchaseButton);
      
      // Check for error alert
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Payment failed/i);
      });
    });
  });

  describe('File Download', () => {
    test('shows download button for paid files', async () => {
      // Mock that user has paid for file-1
      mockApiResponse('/api/v1/searchable-payments', {
        success: true,
        payments: [
          {
            invoice_id: 'inv-123',
            item_ids: ['file-1']
          }
        ]
      });
      
      renderWithProviders(<DownloadableSearchableDetails />);
      
      // Wait for payments to load
      await waitFor(() => {
        const firstFile = screen.getByText('test-document.pdf').closest('[class*=fileItem]');
        expect(firstFile).toHaveClass('fileItemPaid');
      });
      
      // Should show download button
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    });

    test('downloads file when download button clicked', async () => {
      // Mock paid file
      mockApiResponse('/api/v1/searchable-payments', {
        success: true,
        payments: [{ invoice_id: 'inv-123', item_ids: ['file-1'] }]
      });
      
      // Mock download response
      mockApiResponse('/api/v1/files/download/file-1', 
        new Blob(['file content'], { type: 'application/pdf' }),
        { method: 'get' }
      );
      
      renderWithProviders(<DownloadableSearchableDetails />);
      
      // Wait for payments to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
      });
      
      // Click download
      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);
      
      // Should show downloading state
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      // Wait for download to complete
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    test('handles download error', async () => {
      // Mock paid file
      mockApiResponse('/api/v1/searchable-payments', {
        success: true,
        payments: [{ invoice_id: 'inv-123', item_ids: ['file-1'] }]
      });
      
      // Mock download error
      server.use(
        http.get('/api/v1/files/download/file-1', () => {
          return HttpResponse.json(
            { success: false, error: 'Download failed' },
            { status: 500 }
          );
        })
      );
      
      renderWithProviders(<DownloadableSearchableDetails />);
      
      // Wait for payments to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
      });
      
      // Click download
      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);
      
      // Check for error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Failed to download/i);
      });
    });
  });

  describe('Invoice History', () => {
    test('shows invoice history section', () => {
      renderWithProviders(<DownloadableSearchableDetails />);
      
      // Check for invoice accordion
      expect(screen.getByText(/purchase history/i)).toBeInTheDocument();
    });

    test('expands invoice history accordion', async () => {
      renderWithProviders(<DownloadableSearchableDetails />);
      
      // Click to expand
      const accordionButton = screen.getByRole('button', { name: /purchase history/i });
      fireEvent.click(accordionButton);
      
      // Should show invoice list
      await waitFor(() => {
        expect(screen.getByTestId('invoice-list')).toBeInTheDocument();
      });
    });
  });

  describe('Alert Messages', () => {
    test('shows and dismisses alerts', async () => {
      renderWithProviders(<DownloadableSearchableDetails />);
      
      // Trigger an action that shows alert (e.g., purchase)
      const firstFile = screen.getByText('test-document.pdf').closest('[class*=fileItem]');
      fireEvent.click(firstFile);
      
      const purchaseButton = screen.getByRole('button', { name: /purchase selected/i });
      fireEvent.click(purchaseButton);
      
      // Wait for alert
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      
      // Dismiss alert
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      // Alert should be gone
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading state while fetching payments', () => {
      // Mock delayed response
      server.use(
        http.get('/api/v1/searchable-payments', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({ success: true, payments: [] });
        })
      );
      
      renderWithProviders(<DownloadableSearchableDetails />);
      
      // Should show loading indicator initially
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('supports keyboard navigation for file selection', async () => {
      renderWithProviders(<DownloadableSearchableDetails />);
      
      const firstFile = screen.getByText('test-document.pdf').closest('[class*=fileItem]');
      const secondFile = screen.getByText('test-spreadsheet.xlsx').closest('[class*=fileItem]');
      
      // Tab to first file
      firstFile.focus();
      expect(document.activeElement).toBe(firstFile);
      
      // Press Enter to select
      fireEvent.keyDown(firstFile, { key: 'Enter' });
      expect(firstFile).toHaveClass('fileItemSelected');
      
      // Tab to next file
      userEvent.tab();
      expect(document.activeElement).toBe(secondFile);
    });

    test('announces file selection to screen readers', async () => {
      renderWithProviders(<DownloadableSearchableDetails />);
      
      const firstFile = screen.getByText('test-document.pdf').closest('[class*=fileItem]');
      
      // File should have proper ARIA attributes
      expect(firstFile).toHaveAttribute('role', 'checkbox');
      expect(firstFile).toHaveAttribute('aria-checked', 'false');
      
      // Select file
      fireEvent.click(firstFile);
      
      // ARIA state should update
      expect(firstFile).toHaveAttribute('aria-checked', 'true');
    });

    test('provides proper labels for all interactive elements', () => {
      renderWithProviders(<DownloadableSearchableDetails />);
      
      // Check button labels
      expect(screen.getByRole('button', { name: /purchase selected/i })).toBeInTheDocument();
      
      // Check file items have labels
      const files = screen.getAllByRole('checkbox');
      files.forEach(file => {
        expect(file).toHaveAttribute('aria-label');
      });
    });
  });
});