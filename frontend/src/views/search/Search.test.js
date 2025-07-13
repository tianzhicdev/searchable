import React from 'react';
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
  userEvent,
  waitForLoadingToFinish,
  checkAccessibility,
  mockApiResponse
} from '../../utils/testUtils';
import Search from './Search';

// Mock the API calls
jest.mock('../utilities/Backend', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn()
  }
}));

describe('Search Page', () => {
  describe('Component Rendering', () => {
    test('renders search page with all main elements', async () => {
      const { container } = renderWithProviders(<Search />);
      
      // Check main elements
      expect(screen.getByPlaceholderText(/search for items/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
      
      // Check for accessibility
      await checkAccessibility(container);
    });

    test('displays correct filter options', async () => {
      renderWithProviders(<Search />);
      
      // Open type filter
      const typeSelect = screen.getByLabelText(/type/i);
      fireEvent.mouseDown(typeSelect);
      
      // Check filter options
      await waitFor(() => {
        expect(screen.getByText(/all types/i)).toBeInTheDocument();
        expect(screen.getByText(/downloadable/i)).toBeInTheDocument();
        expect(screen.getByText(/offline/i)).toBeInTheDocument();
        expect(screen.getByText(/donation/i)).toBeInTheDocument();
      });
    });

    test('displays correct sort options', async () => {
      renderWithProviders(<Search />);
      
      // Open sort filter
      const sortSelect = screen.getByLabelText(/sort by/i);
      fireEvent.mouseDown(sortSelect);
      
      // Check sort options
      await waitFor(() => {
        expect(screen.getByText(/relevance/i)).toBeInTheDocument();
        expect(screen.getByText(/newest first/i)).toBeInTheDocument();
        expect(screen.getByText(/price: low to high/i)).toBeInTheDocument();
        expect(screen.getByText(/price: high to low/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    test('performs search when search button is clicked', async () => {
      renderWithProviders(<Search />);
      
      const searchInput = screen.getByPlaceholderText(/search for items/i);
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      // Type search query
      await userEvent.type(searchInput, 'test query');
      
      // Click search
      fireEvent.click(searchButton);
      
      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('Test Downloadable Content')).toBeInTheDocument();
      });
    });

    test('performs search when Enter key is pressed', async () => {
      renderWithProviders(<Search />);
      
      const searchInput = screen.getByPlaceholderText(/search for items/i);
      
      // Type and press Enter
      await userEvent.type(searchInput, 'coffee{enter}');
      
      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('Coffee Shop Menu')).toBeInTheDocument();
      });
    });

    test('shows loading state during search', async () => {
      // Mock a delayed response
      mockApiResponse('/api/v1/search/searchables', 
        { success: true, searchables: [], pagination: { total: 0 } },
        { method: 'post', delay: 1000 }
      );
      
      renderWithProviders(<Search />);
      
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);
      
      // Check for loading indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    test('filters results by type', async () => {
      renderWithProviders(<Search />);
      
      // Perform initial search
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test Downloadable Content')).toBeInTheDocument();
        expect(screen.getByText('Coffee Shop Menu')).toBeInTheDocument();
      });
      
      // Filter by downloadable type
      const typeSelect = screen.getByLabelText(/type/i);
      fireEvent.mouseDown(typeSelect);
      
      const downloadableOption = await screen.findByRole('option', { name: /downloadable/i });
      fireEvent.click(downloadableOption);
      
      // Should only show downloadable items
      await waitFor(() => {
        expect(screen.getByText('Test Downloadable Content')).toBeInTheDocument();
        expect(screen.queryByText('Coffee Shop Menu')).not.toBeInTheDocument();
      });
    });

    test('applies multiple filters simultaneously', async () => {
      renderWithProviders(<Search />);
      
      // Set search query
      const searchInput = screen.getByPlaceholderText(/search for items/i);
      await userEvent.type(searchInput, 'test');
      
      // Set type filter
      const typeSelect = screen.getByLabelText(/type/i);
      fireEvent.mouseDown(typeSelect);
      const downloadableOption = await screen.findByRole('option', { name: /downloadable/i });
      fireEvent.click(downloadableOption);
      
      // Perform search
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);
      
      // Should show filtered results
      await waitFor(() => {
        expect(screen.getByText('Test Downloadable Content')).toBeInTheDocument();
        expect(screen.queryByText('Coffee Shop Menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Search Results Display', () => {
    test('displays search results with correct information', async () => {
      renderWithProviders(<Search />);
      
      // Perform search
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);
      
      // Check first result details
      await waitFor(() => {
        const firstResult = screen.getByText('Test Downloadable Content').closest('[class*=profileCard]');
        expect(firstResult).toBeInTheDocument();
        
        // Check for key elements in the card
        expect(screen.getByText('$29.99')).toBeInTheDocument();
        expect(screen.getByText('seller123')).toBeInTheDocument();
        expect(screen.getByText('4.5')).toBeInTheDocument(); // Rating
      });
    });

    test('displays empty state when no results found', async () => {
      // Mock empty response
      mockApiResponse('/api/v1/search/searchables',
        { success: true, searchables: [], pagination: { total: 0 } },
        { method: 'post' }
      );
      
      renderWithProviders(<Search />);
      
      // Perform search
      const searchInput = screen.getByPlaceholderText(/search for items/i);
      await userEvent.type(searchInput, 'nonexistent');
      
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);
      
      // Check for empty state
      await waitFor(() => {
        expect(screen.getByText(/no items found/i)).toBeInTheDocument();
      });
    });

    test('displays type-specific icons correctly', async () => {
      renderWithProviders(<Search />);
      
      // Perform search
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        // Check for type indicators (icons or text)
        const downloadableCard = screen.getByText('Test Downloadable Content').closest('[class*=profileCard]');
        const offlineCard = screen.getByText('Coffee Shop Menu').closest('[class*=profileCard]');
        
        // Type icons should be visible
        expect(downloadableCard.querySelector('[class*=typeIcon]')).toBeInTheDocument();
        expect(offlineCard.querySelector('[class*=typeIcon]')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    test('navigates to item detail page when result is clicked', async () => {
      const { history } = renderWithProviders(<Search />);
      
      // Perform search
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);
      
      // Wait for results and click on one
      await waitFor(() => {
        const downloadableItem = screen.getByText('Test Downloadable Content').closest('[class*=profileCard]');
        fireEvent.click(downloadableItem);
      });
      
      // Check navigation
      expect(history.location.pathname).toBe('/searchable-item/mock-item-1');
    });

    test('navigates to correct URL based on item type', async () => {
      const { history } = renderWithProviders(<Search />);
      
      // Perform search
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);
      
      // Click on offline item
      await waitFor(() => {
        const offlineItem = screen.getByText('Coffee Shop Menu').closest('[class*=profileCard]');
        fireEvent.click(offlineItem);
      });
      
      // Should navigate to offline-specific URL
      expect(history.location.pathname).toBe('/offline-item/mock-item-2');
    });
  });

  describe('Responsive Design', () => {
    test('adjusts layout for mobile screens', async () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;
      
      renderWithProviders(<Search />);
      
      // Check mobile-specific styles/layout
      const searchContainer = screen.getByPlaceholderText(/search for items/i).parentElement;
      
      // Mobile should have full-width search
      expect(searchContainer).toHaveStyle({ width: '100%' });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when search fails', async () => {
      // Mock error response
      server.use(
        http.post('/api/v1/search/searchables', () => {
          return HttpResponse.json(
            { success: false, error: 'Search service unavailable' },
            { status: 500 }
          );
        })
      );
      
      renderWithProviders(<Search />);
      
      // Perform search
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);
      
      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/search service unavailable/i)).toBeInTheDocument();
      });
    });

    test('retries search after error', async () => {
      // First mock error, then success
      let callCount = 0;
      server.use(
        http.post('/api/v1/search/searchables', () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json(
              { success: false, error: 'Temporary error' },
              { status: 500 }
            );
          }
          return HttpResponse.json({
            success: true,
            searchables: [
              {
                searchable_id: 'mock-item-1',
                title: 'Test Downloadable Content',
                type: 'downloadable',
                price: 29.99
              }
            ],
            pagination: { total: 1 }
          });
        })
      );
      
      renderWithProviders(<Search />);
      
      // First search fails
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByText(/temporary error/i)).toBeInTheDocument();
      });
      
      // Retry search
      fireEvent.click(searchButton);
      
      // Should show results
      await waitFor(() => {
        expect(screen.getByText('Test Downloadable Content')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('supports keyboard navigation', async () => {
      renderWithProviders(<Search />);
      
      const searchInput = screen.getByPlaceholderText(/search for items/i);
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      // Tab to search input
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);
      
      // Tab to search button
      userEvent.tab();
      expect(document.activeElement).toBe(searchButton);
      
      // Enter should trigger search
      fireEvent.keyDown(searchButton, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('Test Downloadable Content')).toBeInTheDocument();
      });
    });

    test('announces search results to screen readers', async () => {
      renderWithProviders(<Search />);
      
      // Perform search
      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);
      
      // Check for aria-live region with results count
      await waitFor(() => {
        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toHaveTextContent(/found \d+ items/i);
      });
    });
  });
});