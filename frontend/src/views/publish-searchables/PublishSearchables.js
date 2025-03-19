import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import './PublishSearchables.css';
import configData from '../../config';

const PublishSearchables = () => {
  console.log("PublishSearchables component is being rendered");
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    category: '',
    price: ''
  });
  
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const account = useSelector((state) => state.account);
  const history = useHistory();
  
  // Get user's location on component mount
  useEffect(() => {
    getUserLocation();
  }, []);
  
  // Update form data when location changes
  useEffect(() => {
    if (location) {
      setFormData(prev => ({
        ...prev,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString()
      }));
    }
  }, [location]);
  
  // Function to get user's geolocation
  const getUserLocation = () => {
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Unable to retrieve your location. Please enable location services.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle image uploads
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const validPreviews = [];
    
    files.forEach(file => {
      // Check file size (200KB = 200 * 1024 bytes)
      if (file.size <= 200 * 1024) {
        validFiles.push(file);
        
        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          validPreviews.push(reader.result);
          if (validPreviews.length === validFiles.length) {
            setPreviewImages([...previewImages, ...validPreviews]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setError(`File "${file.name}" exceeds the 200KB size limit and was not added.`);
      }
    });
    
    setImages([...images, ...validFiles]);
  };
  
  // Remove an image
  const removeImage = (index) => {
    const newImages = [...images];
    const newPreviews = [...previewImages];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setImages(newImages);
    setPreviewImages(newPreviews);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Create JSON data instead of FormData
      const submitData = {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude
      };
      
      if (formData.category) {
        submitData.category = formData.category;
      }
      
      if (formData.price) {
        submitData.price = formData.price;
      }
      
      // Convert images to base64 strings and add to JSON
      if (images.length > 0) {
        submitData.images = previewImages.map(base64String => {
          // Remove the data:image/xxx;base64, prefix
          return base64String.split(',')[1];
        });
      }
      
      // Send the request with JSON data
      const response = await axios.post(
        configData.API_SERVER + 'searchable',
        submitData,
        {
          headers: {
            'Authorization': `${account.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccess(true);
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        address: '',
        latitude: location ? location.latitude.toString() : '',
        longitude: location ? location.longitude.toString() : '',
        category: '',
        price: ''
      });
      setImages([]);
      setPreviewImages([]);
      
      // Redirect to searchables page after a delay
      setTimeout(() => {
        history.push('/searchables');
      }, 2000);
      
    } catch (err) {
      console.error("Error publishing searchable:", err);
      setError(err.response?.data?.message || "An error occurred while publishing. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="publish-searchables-container">
      <div className="publish-header">
        <h1>Publish New Searchable</h1>
        <button className="back-button" onClick={() => history.push('/searchables')}>
          Back to Search
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Successfully published! Redirecting...</div>}
      
      <form onSubmit={handleSubmit} className="publish-form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="address">Address</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="latitude">Latitude *</label>
            <input
              type="text"
              id="latitude"
              name="latitude"
              value={formData.latitude}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="longitude">Longitude *</label>
            <input
              type="text"
              id="longitude"
              name="longitude"
              onChange={handleInputChange}
              value={formData.longitude}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="price">Price</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              min="0"
              step="0.01"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="images">Images (Max 200KB each)</label>
          <input
            type="file"
            id="images"
            name="images"
            onChange={handleImageUpload}
            accept="image/*"
            multiple
          />
          <div className="image-preview-container">
            {previewImages.map((src, index) => (
              <div key={index} className="image-preview">
                <img src={src} alt={`Preview ${index}`} />
                <button 
                  type="button" 
                  className="remove-image" 
                  onClick={() => removeImage(index)}
                >
                  &#215;
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button" 
            onClick={() => history.push('/searchables')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-button" 
            disabled={loading}
          >
            {loading ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PublishSearchables;
