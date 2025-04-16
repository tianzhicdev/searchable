import React, { useState } from 'react';
import backend from '../../views/utilities/Backend';
import { useHistory } from 'react-router-dom';
import useComponentStyles from '../../themes/componentStyles';

const FigyuaPage = () => {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const history = useHistory();
  const classes = useComponentStyles();

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text || !image) {
      setMessage('Please provide both text and an image.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('image', image);

      const response = await backend.post('v1/figyua/create', formData);
      const data = response.data;
      
      // Redirect to the renderer page with all UUIDs
      if (data.uuids && data.uuids.length > 0) {
        // Join all UUIDs with a comma and encode them for the URL
        const uuidsParam = encodeURIComponent(data.uuids.join(','));
        history.push(`/figyua-renderer?uuids=${uuidsParam}`);
      } else {
        setMessage('Created successfully, but no UUIDs were returned.');
        setText('');
        setImage(null);
        document.getElementById('image-upload').value = '';
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Failed to submit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="figyua-container">
      <h1>Create Figyua</h1>
      <p>Upload an image and add text to create a new Figyua.</p>

      <form onSubmit={handleSubmit} className="figyua-form">
        <div className={classes.formGroup}>
          <label htmlFor="text-input" className={classes.formLabel}>Enter your text:</label>
          <textarea
            id="text-input"
            value={text}
            onChange={handleTextChange}
            placeholder="Enter your text here..."
            rows="4"
            className="text-field"
          />
        </div>

        <div className={classes.formGroup}>
          <label htmlFor="image-upload" className={classes.formLabel}>Upload an image:</label>
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={handleImageChange}
            className={classes.fileInput}
          />
          <label htmlFor="image-upload" className={classes.fileInputLabel}>
            Choose File
          </label>
          {image && (
            <div className={classes.imagePreviewContainer}>
              <div className={classes.imagePreview}>
                <img 
                  src={URL.createObjectURL(image)} 
                  alt="Preview" 
                  className={classes.previewImage} 
                />
              </div>
              <p>Selected: {image.name}</p>
            </div>
          )}
        </div>

        <div className={classes.formActions}>
          <button 
            type="submit" 
            disabled={isLoading} 
            className="submit-button"
          >
            {isLoading ? 'Processing...' : 'Submit'}
          </button>
        </div>

        {message && <div className={message.includes('Failed') ? classes.errorMessage : classes.successMessage}>{message}</div>}
      </form>
    </div>
  );
};

export default FigyuaPage;
