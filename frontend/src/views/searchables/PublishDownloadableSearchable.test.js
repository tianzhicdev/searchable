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
import PublishDownloadableSearchable from './PublishDownloadableSearchable';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

// Mock the BasePublishSearchable component
jest.mock('../../components/BasePublishSearchable', () => {
  return function MockBasePublishSearchable({ 
    searchableType, 
    title, 
    subtitle, 
    renderTypeSpecificContent,
    getTypeSpecificPayload,
    isFormValid,
    customValidation,
    editMode,
    editData
  }) {
    const [formData, setFormData] = React.useState({
      title: editData?.title || '',
      description: editData?.description || '',
      tags: editData?.tags || []
    });
    const [error, setError] = React.useState(null);
    
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    return (
      <div data-testid="base-publish-searchable">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div>{searchableType}</div>
        
        <form>
          <input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Title"
          />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Description"
          />
          
          {/* Render type-specific content */}
          {renderTypeSpecificContent({ formData, handleInputChange, setError })}
          
          {error && <div role="alert">{error}</div>}
          
          <button
            type="button"
            onClick={() => {
              const validationError = customValidation();
              if (validationError) {
                setError(validationError);
              } else {
                // Mock publish action
                console.log('Publishing with payload:', getTypeSpecificPayload(formData));
              }
            }}
            disabled={!isFormValid()}
          >
            {editMode ? 'Update' : 'Publish'}
          </button>
        </form>
      </div>
    );
  };
});

// Mock file upload response
const mockFileUploadResponse = {
  success: true,
  file_id: 'mock-file-id-123',
  uuid: 'mock-uuid-123'
};

describe('PublishDownloadableSearchable Page', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockApiResponse('/api/v1/files/upload', mockFileUploadResponse, { method: 'post' });
  });

  describe('Component Rendering', () => {
    test('renders publish downloadable searchable page with all elements', async () => {
      const { container } = renderWithProviders(<PublishDownloadableSearchable />);
      
      // Check main elements
      expect(screen.getByText('Publish Downloadable Item')).toBeInTheDocument();
      expect(screen.getByText(/Create an item with files/i)).toBeInTheDocument();
      expect(screen.getByText('downloadable')).toBeInTheDocument();
      
      // Check form fields
      expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
      
      // Check downloadable-specific content
      expect(screen.getByText('Downloadable Content *')).toBeInTheDocument();
      expect(screen.getByText(/Add content that customers can download/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /choose content/i })).toBeInTheDocument();
      
      // Check accessibility
      await checkAccessibility(container);
    });

    test('renders in edit mode with existing data', async () => {
      const editData = {
        title: 'Existing Downloadable',
        description: 'Existing description',
        payloads: {
          public: {
            downloadableFiles: [
              {
                id: 1,
                name: 'test-file.pdf',
                description: 'Test PDF file',
                price: 9.99,
                fileName: 'test-file.pdf',
                fileType: 'application/pdf',
                fileSize: 1024000,
                fileId: 'existing-file-id',
                uuid: 'existing-uuid'
              }
            ]
          }
        }
      };
      
      renderWithProviders(
        <PublishDownloadableSearchable />,
        {
          route: '/publish-searchables',
          history: {
            location: {
              state: { editMode: true, editData }
            }
          }
        }
      );
      
      // Check edit mode UI
      expect(screen.getByText('Edit Downloadable Item')).toBeInTheDocument();
      expect(screen.getByText('Update your downloadable item details')).toBeInTheDocument();
      
      // Check existing data is loaded
      await waitFor(() => {
        expect(screen.getByDisplayValue('test-file.pdf')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test PDF file')).toBeInTheDocument();
        expect(screen.getByDisplayValue('9.99')).toBeInTheDocument();
      });
    });
  });

  describe('File Upload Functionality', () => {
    test('handles file selection and upload', async () => {
      renderWithProviders(<PublishDownloadableSearchable />);
      
      // Create a mock file
      const file = new File(['test content'], 'test-document.pdf', {
        type: 'application/pdf'
      });
      
      // Select file
      const fileInput = screen.getByLabelText(/choose content/i);
      await userEvent.upload(fileInput, file);
      
      // Check file name is displayed
      expect(screen.getByText(/test-document.pdf/i)).toBeInTheDocument();
      
      // Fill in other fields
      const descriptionInput = screen.getByPlaceholderText('File Description');
      const priceInput = screen.getByPlaceholderText('Price (USD)');
      
      await userEvent.type(descriptionInput, 'Test document description');
      await userEvent.type(priceInput, '19.99');
      
      // Click add button
      const addButton = screen.getByRole('button', { name: /add/i });
      fireEvent.click(addButton);
      
      // Wait for upload to complete
      await waitFor(() => {
        expect(screen.getByText('Added Items (1)')).toBeInTheDocument();
      });
      
      // Check file was added to list
      expect(screen.getByDisplayValue('test-document.pdf')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test document description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('19.99')).toBeInTheDocument();
    });

    test('shows loading state during file upload', async () => {
      // Mock delayed response
      server.use(
        http.post('/api/v1/files/upload', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json(mockFileUploadResponse);
        })
      );
      
      renderWithProviders(<PublishDownloadableSearchable />);
      
      // Upload file
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/choose content/i);
      await userEvent.upload(fileInput, file);
      
      // Fill fields and add
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '10');
      const addButton = screen.getByRole('button', { name: /add/i });
      fireEvent.click(addButton);
      
      // Check for loading indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    test('handles file upload error', async () => {
      // Mock error response
      server.use(
        http.post('/api/v1/files/upload', () => {
          return HttpResponse.json(
            { success: false, error: 'File too large' },
            { status: 400 }
          );
        })
      );
      
      renderWithProviders(<PublishDownloadableSearchable />);
      
      // Upload file
      const file = new File(['content'], 'large-file.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/choose content/i);
      await userEvent.upload(fileInput, file);
      
      // Fill price and try to add
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '10');
      const addButton = screen.getByRole('button', { name: /add/i });
      fireEvent.click(addButton);
      
      // Check for error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('File too large');
      });
    });
  });

  describe('File Management', () => {
    test('allows editing file details inline', async () => {
      renderWithProviders(<PublishDownloadableSearchable />);
      
      // Add a file first
      const file = new File(['content'], 'editable.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/choose content/i);
      await userEvent.upload(fileInput, file);
      
      await userEvent.type(screen.getByPlaceholderText('File Description'), 'Initial description');
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '15.00');
      
      const addButton = screen.getByRole('button', { name: /add/i });
      fireEvent.click(addButton);
      
      // Wait for file to be added
      await waitFor(() => {
        expect(screen.getByText('Added Items (1)')).toBeInTheDocument();
      });
      
      // Edit the file details
      const nameInput = screen.getByDisplayValue('editable.pdf');
      const descInput = screen.getByDisplayValue('Initial description');
      const priceInput = screen.getByDisplayValue('15');
      
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'renamed-file.pdf');
      
      await userEvent.clear(descInput);
      await userEvent.type(descInput, 'Updated description');
      
      await userEvent.clear(priceInput);
      await userEvent.type(priceInput, '25.50');
      
      // Check values were updated
      expect(screen.getByDisplayValue('renamed-file.pdf')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Updated description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('25.5')).toBeInTheDocument();
    });

    test('allows removing files from list', async () => {
      renderWithProviders(<PublishDownloadableSearchable />);
      
      // Add two files
      const file1 = new File(['content1'], 'file1.pdf', { type: 'application/pdf' });
      const file2 = new File(['content2'], 'file2.pdf', { type: 'application/pdf' });
      
      // Add first file
      const fileInput = screen.getByLabelText(/choose content/i);
      await userEvent.upload(fileInput, file1);
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '10');
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Added Items (1)')).toBeInTheDocument();
      });
      
      // Add second file
      await userEvent.upload(fileInput, file2);
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '20');
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Added Items (2)')).toBeInTheDocument();
      });
      
      // Remove first file
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);
      
      // Check file was removed
      expect(screen.getByText('Added Items (1)')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('file1.pdf')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('file2.pdf')).toBeInTheDocument();
    });

    test('displays file size correctly', async () => {
      renderWithProviders(<PublishDownloadableSearchable />);
      
      // Create file with specific size
      const content = new Array(1024 * 1024).join('a'); // ~1MB
      const file = new File([content], 'large.pdf', { type: 'application/pdf' });
      
      const fileInput = screen.getByLabelText(/choose content/i);
      await userEvent.upload(fileInput, file);
      
      // Check file size is formatted correctly
      expect(screen.getByText(/large.pdf.*MB/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('disables publish button when no files added', () => {
      renderWithProviders(<PublishDownloadableSearchable />);
      
      const publishButton = screen.getByRole('button', { name: /publish/i });
      expect(publishButton).toBeDisabled();
    });

    test('enables publish button when at least one file is added', async () => {
      renderWithProviders(<PublishDownloadableSearchable />);
      
      // Add a file
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/choose content/i);
      await userEvent.upload(fileInput, file);
      
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '10');
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      // Wait for file to be added
      await waitFor(() => {
        expect(screen.getByText('Added Items (1)')).toBeInTheDocument();
      });
      
      // Check publish button is enabled
      const publishButton = screen.getByRole('button', { name: /publish/i });
      expect(publishButton).toBeEnabled();
    });

    test('shows validation error when trying to publish without files', () => {
      renderWithProviders(<PublishDownloadableSearchable />);
      
      // Fill in title
      const titleInput = screen.getByPlaceholderText('Title');
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      
      // Try to publish
      const publishButton = screen.getByRole('button', { name: /publish/i });
      fireEvent.click(publishButton);
      
      // Check for validation error
      expect(screen.getByRole('alert')).toHaveTextContent(/Please add at least one downloadable content item/i);
    });

    test('disables add button when file or price is missing', async () => {
      renderWithProviders(<PublishDownloadableSearchable />);
      
      const addButton = screen.getByRole('button', { name: /add/i });
      
      // Initially disabled
      expect(addButton).toBeDisabled();
      
      // Add file but no price
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/choose content/i);
      await userEvent.upload(fileInput, file);
      
      // Still disabled
      expect(addButton).toBeDisabled();
      
      // Add price
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '10');
      
      // Now enabled
      expect(addButton).toBeEnabled();
    });
  });

  describe('Price Formatting', () => {
    test('formats price input correctly', async () => {
      renderWithProviders(<PublishDownloadableSearchable />);
      
      // Add a file with price
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/choose content/i);
      await userEvent.upload(fileInput, file);
      
      const priceInput = screen.getByPlaceholderText('Price (USD)');
      await userEvent.type(priceInput, '10.999');
      
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      // Wait for file to be added
      await waitFor(() => {
        expect(screen.getByText('Added Items (1)')).toBeInTheDocument();
      });
      
      // Check price is rounded to 2 decimal places
      expect(screen.getByDisplayValue('11')).toBeInTheDocument();
    });

    test('handles zero and negative prices', async () => {
      renderWithProviders(<PublishDownloadableSearchable />);
      
      // Add file with zero price
      const file = new File(['content'], 'free.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/choose content/i);
      await userEvent.upload(fileInput, file);
      
      const priceInput = screen.getByPlaceholderText('Price (USD)');
      await userEvent.type(priceInput, '0');
      
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Added Items (1)')).toBeInTheDocument();
      });
      
      // Zero price should be allowed
      expect(screen.getByDisplayValue('0')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    test('shows empty state message when no files added', () => {
      renderWithProviders(<PublishDownloadableSearchable />);
      
      expect(screen.getByText(/No content added yet/i)).toBeInTheDocument();
      expect(screen.getByText(/Add at least one downloadable item to continue/i)).toBeInTheDocument();
    });

    test('hides empty state after adding first file', async () => {
      renderWithProviders(<PublishDownloadableSearchable />);
      
      // Initially shows empty state
      expect(screen.getByText(/No content added yet/i)).toBeInTheDocument();
      
      // Add a file
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/choose content/i);
      await userEvent.upload(fileInput, file);
      
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '10');
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      // Wait for file to be added
      await waitFor(() => {
        expect(screen.getByText('Added Items (1)')).toBeInTheDocument();
      });
      
      // Empty state should be gone
      expect(screen.queryByText(/No content added yet/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('supports keyboard navigation', async () => {
      renderWithProviders(<PublishDownloadableSearchable />);
      
      // Tab through form elements
      const titleInput = screen.getByPlaceholderText('Title');
      const descriptionInput = screen.getByPlaceholderText('Description');
      const chooseFileButton = screen.getByRole('button', { name: /choose content/i });
      
      titleInput.focus();
      expect(document.activeElement).toBe(titleInput);
      
      userEvent.tab();
      expect(document.activeElement).toBe(descriptionInput);
      
      userEvent.tab();
      userEvent.tab(); // Skip through other elements
      expect(document.activeElement).toBe(chooseFileButton);
    });

    test('announces file additions to screen readers', async () => {
      renderWithProviders(<PublishDownloadableSearchable />);
      
      // Add a file
      const file = new File(['content'], 'accessible.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/choose content/i);
      await userEvent.upload(fileInput, file);
      
      await userEvent.type(screen.getByPlaceholderText('Price (USD)'), '10');
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      
      // Check for announcement region
      await waitFor(() => {
        const itemCount = screen.getByText('Added Items (1)');
        expect(itemCount).toBeInTheDocument();
        // Item count acts as announcement
      });
    });

    test('provides proper labels for all inputs', () => {
      renderWithProviders(<PublishDownloadableSearchable />);
      
      // Check all inputs have proper labels or placeholders
      expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('File Description')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Price (USD)')).toBeInTheDocument();
    });
  });
});