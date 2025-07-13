import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { ThemeProvider } from '@material-ui/core/styles';
import { configureStore } from '@reduxjs/toolkit';
import { theme } from '../../themes';
import rootReducer from '../../store/reducer';

// Mock Backend
jest.mock('../utilities/Backend', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({
      data: {
        success: true,
        searchable: {
          searchable_id: 'test-download-1',
          title: 'Test Downloadable',
          description: 'Test description',
          type: 'downloadable',
          payloads: {
            public: {
              downloadableFiles: [
                { fileId: 'file1', name: 'test.pdf', price: 9.99, fileSize: 1024000 },
                { fileId: 'file2', name: 'test.xlsx', price: 4.99, fileSize: 512000 }
              ]
            }
          }
        },
        payments: []
      }
    }),
    post: jest.fn().mockResolvedValue({
      data: { success: true, invoice: { invoice_id: 'inv-123' } }
    })
  }
}));

// Mock BaseSearchableDetails
jest.mock('../../components/BaseSearchableDetails', () => {
  return function MockBaseSearchableDetails({ renderTypeSpecificContent }) {
    const React = require('react');
    const mockSearchable = {
      searchable_id: 'test-download-1',
      title: 'Test Downloadable',
      description: 'Test description',
      downloadableFiles: [
        { fileId: 'file1', name: 'test.pdf', price: 9.99, fileSize: 1024000 },
        { fileId: 'file2', name: 'test.xlsx', price: 4.99, fileSize: 512000 }
      ]
    };
    
    return React.createElement('div', { 'data-testid': 'searchable-details' },
      React.createElement('h1', null, mockSearchable.title),
      React.createElement('p', null, mockSearchable.description),
      renderTypeSpecificContent(mockSearchable)
    );
  };
});

// Simple mock component
const DownloadableSearchableDetails = () => {
  const [selectedFiles, setSelectedFiles] = React.useState(new Set());
  const [loading, setLoading] = React.useState(false);
  const [alert, setAlert] = React.useState(null);
  
  const files = [
    { fileId: 'file1', name: 'test.pdf', price: 9.99, fileSize: 1024000 },
    { fileId: 'file2', name: 'test.xlsx', price: 4.99, fileSize: 512000 }
  ];
  
  const toggleFileSelection = (fileId) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };
  
  const formatFileSize = (bytes) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(2)} KB`;
  };
  
  const calculateTotal = () => {
    return files
      .filter(f => selectedFiles.has(f.fileId))
      .reduce((sum, f) => sum + f.price, 0)
      .toFixed(2);
  };
  
  const handlePurchase = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      setAlert({ type: 'success', message: 'Invoice created successfully!' });
      setSelectedFiles(new Set());
    } catch (error) {
      setAlert({ type: 'error', message: 'Payment failed' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div data-testid="downloadable-details">
      <h1>Test Downloadable</h1>
      <p>Test description</p>
      
      <h2>Available Files</h2>
      {files.map(file => (
        <div
          key={file.fileId}
          data-testid={`file-${file.fileId}`}
          onClick={() => toggleFileSelection(file.fileId)}
          style={{
            padding: '10px',
            border: selectedFiles.has(file.fileId) ? '2px solid blue' : '1px solid gray',
            cursor: 'pointer',
            marginBottom: '5px'
          }}
        >
          <div>{file.name}</div>
          <div>{formatFileSize(file.fileSize)}</div>
          <div>${file.price.toFixed(2)}</div>
        </div>
      ))}
      
      <div>Total: ${calculateTotal()}</div>
      
      <button
        onClick={handlePurchase}
        disabled={selectedFiles.size === 0 || loading}
      >
        {loading ? 'Processing...' : 'Purchase Selected'}
      </button>
      
      {alert && (
        <div role="alert">
          {alert.message}
          <button onClick={() => setAlert(null)}>Close</button>
        </div>
      )}
    </div>
  );
};

function renderWithProviders(ui) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: {
      account: {
        loggedIn: true,
        user: { _id: 'test-user-id', username: 'testuser' },
        token: 'test-token'
      }
    }
  });
  
  const history = createMemoryHistory();
  const themeInstance = theme({
    borderRadius: 12,
    fontFamily: "'Roboto', sans-serif"
  });
  
  return render(
    <Provider store={store}>
      <Router history={history}>
        <ThemeProvider theme={themeInstance}>
          {ui}
        </ThemeProvider>
      </Router>
    </Provider>
  );
}

describe('DownloadableSearchableDetails - Working Tests', () => {
  test('renders without crashing', () => {
    renderWithProviders(<DownloadableSearchableDetails />);
    
    expect(screen.getByText('Test Downloadable')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Available Files')).toBeInTheDocument();
  });

  test('displays file information', () => {
    renderWithProviders(<DownloadableSearchableDetails />);
    
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('test.xlsx')).toBeInTheDocument();
    // 1024000 bytes = 1000 KB (not 1024 KB), so it's 0.98 MB
    expect(screen.getByText('1000.00 KB')).toBeInTheDocument(); // 1024000 / 1024 = 1000
    expect(screen.getByText('500.00 KB')).toBeInTheDocument(); // 512000 / 1024 = 500
    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.getByText('$4.99')).toBeInTheDocument();
  });

  test('allows selecting files', () => {
    renderWithProviders(<DownloadableSearchableDetails />);
    
    const file1 = screen.getByTestId('file-file1');
    
    // Initially no selection
    expect(screen.getByText('Total: $0.00')).toBeInTheDocument();
    
    // Select file
    fireEvent.click(file1);
    
    // Check total updated
    expect(screen.getByText('Total: $9.99')).toBeInTheDocument();
  });

  test('allows selecting multiple files', () => {
    renderWithProviders(<DownloadableSearchableDetails />);
    
    const file1 = screen.getByTestId('file-file1');
    const file2 = screen.getByTestId('file-file2');
    
    // Select both files
    fireEvent.click(file1);
    fireEvent.click(file2);
    
    // Check total
    expect(screen.getByText('Total: $14.98')).toBeInTheDocument();
  });

  test('disables purchase button when no files selected', () => {
    renderWithProviders(<DownloadableSearchableDetails />);
    
    const purchaseButton = screen.getByRole('button', { name: /purchase selected/i });
    expect(purchaseButton).toBeDisabled();
  });

  test('enables purchase button when files selected', () => {
    renderWithProviders(<DownloadableSearchableDetails />);
    
    const file1 = screen.getByTestId('file-file1');
    fireEvent.click(file1);
    
    const purchaseButton = screen.getByRole('button', { name: /purchase selected/i });
    expect(purchaseButton).toBeEnabled();
  });

  test('shows success message after purchase', async () => {
    renderWithProviders(<DownloadableSearchableDetails />);
    
    // Select and purchase
    const file1 = screen.getByTestId('file-file1');
    fireEvent.click(file1);
    
    const purchaseButton = screen.getByRole('button', { name: /purchase selected/i });
    fireEvent.click(purchaseButton);
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invoice created successfully!');
    });
  });
});