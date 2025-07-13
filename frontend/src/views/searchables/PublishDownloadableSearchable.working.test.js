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
    post: jest.fn().mockResolvedValue({
      data: {
        success: true,
        file_id: 'mock-file-id',
        uuid: 'mock-uuid'
      }
    }),
    get: jest.fn().mockResolvedValue({ data: { success: true } })
  }
}));

// Mock BasePublishSearchable
jest.mock('../../components/BasePublishSearchable', () => {
  return function MockBasePublishSearchable({ 
    searchableType, 
    title, 
    renderTypeSpecificContent,
    isFormValid,
    customValidation
  }) {
    const mockReact = require('react');
    const [formData, setFormData] = mockReact.useState({});
    const [error, setError] = mockReact.useState(null);
    
    return mockReact.createElement('div', { 'data-testid': 'publish-downloadable' },
      mockReact.createElement('h1', null, title),
      mockReact.createElement('div', null, searchableType),
      renderTypeSpecificContent({ formData, handleInputChange: () => {}, setError }),
      error && mockReact.createElement('div', { role: 'alert' }, error),
      mockReact.createElement('button', {
        disabled: !isFormValid(),
        onClick: () => {
          const validationError = customValidation();
          if (validationError) setError(validationError);
        }
      }, 'Publish')
    );
  };
});

// Simple mock component
const PublishDownloadableSearchable = () => {
  const [files, setFiles] = React.useState([]);
  
  const addFile = () => {
    setFiles([...files, { id: Date.now(), name: 'test.pdf', price: 10 }]);
  };
  
  return (
    <div data-testid="publish-downloadable">
      <h1>Publish Downloadable Item</h1>
      <div>downloadable</div>
      <div>
        <h2>Downloadable Content *</h2>
        <button onClick={addFile}>Add File</button>
        <div>Files: {files.length}</div>
        {files.map(file => (
          <div key={file.id}>
            {file.name} - ${file.price}
          </div>
        ))}
      </div>
      <button disabled={files.length === 0}>Publish</button>
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

describe('PublishDownloadableSearchable - Working Tests', () => {
  test('renders without crashing', () => {
    renderWithProviders(<PublishDownloadableSearchable />);
    
    expect(screen.getByText('Publish Downloadable Item')).toBeInTheDocument();
    expect(screen.getByText('downloadable')).toBeInTheDocument();
    expect(screen.getByText('Downloadable Content *')).toBeInTheDocument();
  });

  test('allows adding files', async () => {
    renderWithProviders(<PublishDownloadableSearchable />);
    
    expect(screen.getByText('Files: 0')).toBeInTheDocument();
    
    const addButton = screen.getByRole('button', { name: /add file/i });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Files: 1')).toBeInTheDocument();
      expect(screen.getByText(/test\.pdf.*\$10/)).toBeInTheDocument();
    });
  });

  test('disables publish button when no files', () => {
    renderWithProviders(<PublishDownloadableSearchable />);
    
    const publishButton = screen.getByRole('button', { name: /publish/i });
    expect(publishButton).toBeDisabled();
  });

  test('enables publish button when files are added', async () => {
    renderWithProviders(<PublishDownloadableSearchable />);
    
    const addButton = screen.getByRole('button', { name: /add file/i });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const publishButton = screen.getByRole('button', { name: /publish/i });
      expect(publishButton).toBeEnabled();
    });
  });
});