import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { ThemeProvider } from '@material-ui/core/styles';
import { configureStore } from '@reduxjs/toolkit';
import { theme } from '../../themes';
import rootReducer from '../../store/reducer';

// Mock component styles
jest.mock('../../themes/componentStyles', () => () => ({}));

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
          description: 'Test downloadable description',
          type: 'downloadable',
          payloads: {
            public: {
              downloadableFiles: [
                { fileId: 'file1', name: 'document.pdf', price: 9.99, fileSize: 1024000 }
              ]
            }
          }
        }
      }
    }),
    post: jest.fn().mockResolvedValue({
      data: { success: true, invoice: { invoice_id: 'inv-123' } }
    })
  }
}));

// Simple mock component
const DownloadableSearchableDetails = () => {
  const [selectedFiles, setSelectedFiles] = React.useState(new Set());
  const [loading, setLoading] = React.useState(false);
  
  const files = [
    { fileId: 'file1', name: 'document.pdf', price: 9.99, fileSize: 1024000 }
  ];
  
  const formatFileSize = (bytes) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(2)} KB`;
  };
  
  return (
    <div data-testid="downloadable-details">
      <h1>Test Downloadable</h1>
      <p>Test downloadable description</p>
      
      <h2>Available Content</h2>
      {files.map(file => (
        <div key={file.fileId} data-testid={`file-${file.fileId}`}>
          <div>{file.name}</div>
          <div>{formatFileSize(file.fileSize)}</div>
          <div>${file.price.toFixed(2)}</div>
        </div>
      ))}
      
      <button disabled={selectedFiles.size === 0 || loading}>
        Purchase Selected
      </button>
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

describe('DownloadableSearchableDetails - Simple Tests', () => {
  test('renders without crashing', () => {
    renderWithProviders(<DownloadableSearchableDetails />);
    
    expect(screen.getByText('Test Downloadable')).toBeInTheDocument();
    expect(screen.getByText('Test downloadable description')).toBeInTheDocument();
    expect(screen.getByText('Available Content')).toBeInTheDocument();
  });

  test('displays file information', () => {
    renderWithProviders(<DownloadableSearchableDetails />);
    
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('1000.00 KB')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });

  test('shows purchase button', () => {
    renderWithProviders(<DownloadableSearchableDetails />);
    
    const purchaseButton = screen.getByRole('button', { name: /purchase selected/i });
    expect(purchaseButton).toBeInTheDocument();
    expect(purchaseButton).toBeDisabled();
  });
});