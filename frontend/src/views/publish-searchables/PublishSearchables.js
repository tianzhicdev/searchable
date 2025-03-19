import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import './PublishSearchables.css';
import configData from '../../config';

// Fix for default icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: icon,
  iconUrl: icon,
  shadowUrl: iconShadow
});

// This component handles map recenter when userLocation changes
const MapUpdater = ({ userLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    if (userLocation) {
      console.log("Updating map view to user location:", userLocation);
      map.setView([userLocation.latitude, userLocation.longitude], 13);
    }
  }, [userLocation, map]);
  
  return null;
};

const PublishSearchables = () => {
  console.log("PublishSearchables component is being rendered");
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    meetupLocation: '',
    latitude: '',
    longitude: '',
    price: ''
  });
  
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  
  const account = useSelector((state) => state.account);
  const history = useHistory();
  
  // Get user's location on component mount
  useEffect(() => {
    console.log("Requesting user location...");
    getUserLocation();
  }, []);
  
  // Function to get user's geolocation
  const getUserLocation = () => {
    setError(null);
    setMapLoading(true);
    
    if (navigator.geolocation) {
      console.log("Browser supports geolocation, requesting position...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          console.log("User's current location received:", newLocation);
          setUserLocation(newLocation);
          setSelectedLocation(newLocation);
          setMapLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Unable to retrieve your location. Using default location for map.");
          // Set a default location if user refuses
          const defaultLocation = {
            latitude: 51.505,
            longitude: -0.09
          };
          setUserLocation(defaultLocation);
          setSelectedLocation(defaultLocation);
          setMapLoading(false);
        },
        // Adding options to get a faster response
        { 
          enableHighAccuracy: false, 
          timeout: 5000, 
          maximumAge: 10000 
        }
      );
    } else {
      console.error("Geolocation not supported");
      setError("Geolocation is not supported by your browser. Using default location for map.");
      // Set a default location if geolocation is not supported
      const defaultLocation = {
        latitude: 51.505,
        longitude: -0.09
      };
      setUserLocation(defaultLocation);
      setSelectedLocation(defaultLocation);
      setMapLoading(false);
    }
  };
  
  // Update form data when selectedLocation changes
  useEffect(() => {
    if (selectedLocation) {
      setFormData(prev => ({
        ...prev,
        latitude: selectedLocation.latitude.toString(),
        longitude: selectedLocation.longitude.toString()
      }));
      
      // Get address for the selected location
      getAddressFromCoordinates(selectedLocation.latitude, selectedLocation.longitude);
    }
  }, [selectedLocation]);
  
  // Function to perform reverse geocoding and get address from coordinates
  const getAddressFromCoordinates = async (lat, lng) => {
    setGeocodingLoading(true);
    try {
      // Using OpenStreetMap's Nominatim API for reverse geocoding
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en', // Get results in English
            'User-Agent': 'Searchable App' // Required by Nominatim's usage policy
          }
        }
      );
      
      if (response.data && response.data.display_name) {
        // Update the meetupLocation field with the human-readable address
        setFormData(prev => ({
          ...prev,
          meetupLocation: response.data.display_name
        }));
        
        console.log("Address found:", response.data.display_name);
      } else {
        console.log("No address found for these coordinates");
      }
    } catch (error) {
      console.error("Error getting address from coordinates:", error);
    } finally {
      setGeocodingLoading(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Update selectedLocation if latitude or longitude inputs change
    if (name === 'latitude' || name === 'longitude') {
      setSelectedLocation(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
        longitude: formData.longitude,
        meetupLocation: formData.meetupLocation
      };
      
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
        meetupLocation: '',
        latitude: selectedLocation ? selectedLocation.latitude.toString() : '',
        longitude: selectedLocation ? selectedLocation.longitude.toString() : '',
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

  // Component to handle map click events
  const LocationMarker = () => {
    const map = useMapEvents({
      click(e) {
        console.log("Map clicked at:", e.latlng);
        // Update only the selected location, not the user's actual location
        setSelectedLocation({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        });
        map.flyTo(e.latlng, map.getZoom());
      }
    });

    return selectedLocation === null ? null : (
      <Marker position={[selectedLocation.latitude, selectedLocation.longitude]} />
    );
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
        
        <div className="form-row">
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
          <label htmlFor="meetupLocation">Meet-up Location</label>
          <div className="input-with-status">
            <input
              type="text"
              id="meetupLocation"
              name="meetupLocation"
              value={formData.meetupLocation}
              onChange={handleInputChange}
              placeholder="Select a location on the map or enter manually"
            />
            {geocodingLoading && <span className="loading-indicator">Finding address...</span>}
          </div>
          <small className="form-help-text">This will be suggested as the meeting point for exchanges</small>
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

        <div className="form-group">
          <label>Select Location on Map</label>
          <p className="map-instruction">Your current location is shown on the map. Click anywhere to select a meeting location for your item.</p>
          
          {mapLoading ? (
            <div className="map-loading">Loading map with your location...</div>
          ) : (
            <MapContainer 
              center={userLocation ? [userLocation.latitude, userLocation.longitude] : [51.505, -0.09]} 
              zoom={13} 
              style={{ height: "400px", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker />
              <MapUpdater userLocation={userLocation} />
            </MapContainer>
          )}
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
