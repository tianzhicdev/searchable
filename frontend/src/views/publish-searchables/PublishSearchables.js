import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import configData from '../../config';
import useComponentStyles from '../../themes/componentStyles';
import { 
  Grid, Typography, Button, Paper, Box, TextField, 
  CircularProgress, Divider, IconButton
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import DeleteIcon from '@material-ui/icons/Delete';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import { setLocation, setLocationError, setLocationLoading } from '../../store/locationReducer';

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
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      console.log("Updating map view to user location:", userLocation);
      map.setView([userLocation.latitude, userLocation.longitude], 13);
    }
  }, [userLocation, map]);
  
  return null;
};

const PublishSearchables = () => {
  console.log("PublishSearchables component is being rendered");
  const classes = useComponentStyles();
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meetupLocation: '',
    latitude: '',
    longitude: '',
    price: ''
  });
  
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  
  const account = useSelector((state) => state.account);
  const location = useSelector((state) => state.location);
  const history = useHistory();
  const fileInputRef = useRef(null);
  
  // Get user's location on component mount
  useEffect(() => {
    console.log("Requesting user location...");
    getUserLocation();
  }, []);
  
  // Function to get user's geolocation
  const getUserLocation = () => {
    dispatch(setLocationError(null));
    dispatch(setLocationLoading(true));
    
    if (navigator.geolocation) {
      console.log("Browser supports geolocation, requesting position...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          console.log("User's current location received:", newLocation);
          dispatch(setLocation(
            position.coords.latitude,
            position.coords.longitude
          ));
          setSelectedLocation(newLocation);
          setMapLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          dispatch(setLocationError("Unable to retrieve your location. Using existing location for map."));
          // Don't override existing location, just finish loading the map
          setMapLoading(false);
          
          // If we don't have a selected location yet, use the current Redux state
          if (!selectedLocation && location.latitude && location.longitude) {
            setSelectedLocation({
              latitude: location.latitude,
              longitude: location.longitude
            });
          }
          // If we still don't have a location, use default as fallback only
          else if (!selectedLocation) {
            const defaultLocation = {
              latitude: 51.505,
              longitude: -0.09
            };
            setSelectedLocation(defaultLocation);
          }
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
      dispatch(setLocationError("Geolocation is not supported by your browser. Using existing location for map."));
      // Don't override existing location, just finish loading the map
      setMapLoading(false);
      
      // If we don't have a selected location yet, use the current Redux state
      if (!selectedLocation && location.latitude && location.longitude) {
        setSelectedLocation({
          latitude: location.latitude,
          longitude: location.longitude
        });
      }
      // If we still don't have a location, use default as fallback only
      else if (!selectedLocation) {
        const defaultLocation = {
          latitude: 51.505,
          longitude: -0.09
        };
        setSelectedLocation(defaultLocation);
      }
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
    <Grid container className={classes.container}>
      <Grid item xs={12} className={classes.header}>
        <Button 
          variant="contained" 
          className={classes.iconButton} 
          onClick={() => history.push('/searchables')}
        >
          <ArrowBackIcon />
        </Button>
      </Grid>
      
      {error && (
        <Grid item xs={12}>
          <Box className={classes.errorMessage}>
            <Typography variant="body1">{error}</Typography>
          </Box>
        </Grid>
      )}
      
      {success && (
        <Grid item xs={12}>
          <Box className={classes.successMessage}>
            <Typography variant="body1">Successfully published! Redirecting...</Typography>
          </Box>
        </Grid>
      )}
      
      <Grid item xs={12}>
        <Paper elevation={3} >
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} className={classes.formGroup}>
                <Typography variant="subtitle1" className={classes.formLabel}>
                  Title *
                </Typography>
                <TextField
                  fullWidth
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                  required
                  className={classes.textInput}
                />
              </Grid>
              
              <Grid item xs={12} className={classes.formGroup}>
                <Typography variant="subtitle1" className={classes.formLabel}>
                  Description
                </Typography>
                <TextField
                  fullWidth
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  variant="outlined"
                  multiline
                  rows={4}
                  className={classes.textInput}
                />
              </Grid>
              
              <Grid item xs={12} md={6} className={classes.formGroup}>
                <Typography variant="subtitle1" className={classes.formLabel}>
                  Price in Sats
                </Typography>
                <TextField
                  fullWidth
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  size="small"
                  type="number"
                />
              </Grid>
              
              <Grid item xs={12} className={classes.formGroup}>
                <Typography variant="subtitle1" className={classes.formLabel}>
                  Meet-up Location
                </Typography>
                <Box className={classes.inputWithStatus}>
                  <TextField
                    fullWidth
                    id="meetupLocation"
                    name="meetupLocation"
                    value={formData.meetupLocation}
                    onChange={handleInputChange}
                    variant="outlined"
                    size="small"
                    placeholder="Select a location on the map or enter manually"
                    className={classes.textInput}
                  />
                </Box>
                <Typography variant="caption" className={classes.formHelp}>
                  This will be suggested as the meeting point for exchanges
                </Typography>
              </Grid>
              
              <Grid item xs={12} className={classes.formGroup}>
                <Typography variant="subtitle1" className={classes.formLabel}>
                  Images (Max 200KB each)
                </Typography>
                <input
                  type="file"
                  id="images"
                  name="images"
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  className={classes.fileInput}
                />
                <label htmlFor="images" className={classes.fileInputLabel}>
                  Choose Files
                </label>
                <Box className={classes.imagePreviewContainer}>
                  {previewImages.map((src, index) => (
                    <Box key={index} className={classes.imagePreview}>
                      <img src={src} alt={`Preview ${index}`} className={classes.previewImage} />
                      <IconButton 
                        size="small"
                        className={classes.removeImageButton} 
                        onClick={() => removeImage(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12} className={classes.formGroup}>
                <Typography variant="subtitle1" className={classes.formLabel}>
                  Select Location on Map
                </Typography>
                <Typography variant="body2" className={classes.mapInstruction}>
                  <LocationOnIcon fontSize="small" style={{ verticalAlign: 'middle', marginRight: 8 }} />
                  Your current location is shown on the map. Click anywhere to select a meeting location for your item.
                </Typography>
                
                {mapLoading ? (
                  <Box className={classes.mapLoading}>
                    <CircularProgress size={24} style={{ marginRight: 16 }} />
                    <Typography variant="body2">Loading map with your location...</Typography>
                  </Box>
                ) : (
                  <Box className={classes.mapContainer}>
                    <MapContainer 
                      center={location.latitude && location.longitude ? 
                             [location.latitude, location.longitude] : 
                             [51.505, -0.09]} 
                      zoom={13} 
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <LocationMarker />
                      <MapUpdater userLocation={location} />
                    </MapContainer>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Box className={classes.formActions}>
                  <Button 
                    type="button" 
                    variant="outlined"
                    className={classes.button} 
                    onClick={() => history.push('/searchables')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    className={classes.button}
                    disabled={loading}
                  >
                    Publish
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default PublishSearchables;
