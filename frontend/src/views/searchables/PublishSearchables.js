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
  CircularProgress, Divider, IconButton, MenuItem, Switch
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import DeleteIcon from '@material-ui/icons/Delete';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import { setLocation, setLocationError, setLocationLoading } from '../../store/locationReducer';
import { compressImage, fileToDataURL } from '../../utils/imageCompression';
import backend from '../utilities/Backend';

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
    price: '',
    businessType: 'personal'
  });
  
  // Add new state for selectables
  const [selectables, setSelectables] = useState([]);
  const [newSelectable, setNewSelectable] = useState({ name: '', price: '' });
  // Add pricing mode state
  const [pricingMode, setPricingMode] = useState('single'); // 'single' or 'variations'
  
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  
  // Add new state variables for USD conversion
  const [usdPrice, setUsdPrice] = useState(null);
  const [btcPrice, setBtcPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  
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
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const validPreviews = [];
    setError(null); // Clear previous errors
    
    try {
      for (const file of files) {
        // Only process image files
        if (!file.type.startsWith('image/')) {
          setError(`File "${file.name}" is not an image.`);
          continue;
        }
        
        // Compress image to maximum 50KB
        const processedFile = await compressImage(file, 50); // Passing 50 as max size in KB
        validFiles.push(processedFile);
        
        // Create preview URL
        const dataUrl = await fileToDataURL(processedFile);
        validPreviews.push(dataUrl);
      }
      
      setImages([...images, ...validFiles]);
      setPreviewImages([...previewImages, ...validPreviews]);
      
    } catch (error) {
      console.error("Error processing images:", error);
      setError("An error occurred while processing images. Please try again.");
    }
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
  
  // Add handler for selectables
  const handleSelectableChange = (e) => {
    const { name, value } = e.target;
    setNewSelectable({
      ...newSelectable,
      [name]: value
    });
  };
  
  // Add selectable to the list
  const addSelectable = () => {
    if (newSelectable.name.trim() && newSelectable.price) {
      setSelectables([
        ...selectables,
        { 
          id: Date.now(), // temporary id for frontend tracking
          name: newSelectable.name,
          price: parseInt(newSelectable.price)
        }
      ]);
      // Reset the input fields
      setNewSelectable({ name: '', price: '' });
    }
  };
  
  // Remove selectable from the list
  const removeSelectable = (id) => {
    setSelectables(selectables.filter(item => item.id !== id));
  };
  
  // Add handler for pricing mode change
  const handlePricingModeChange = (event) => {
    setPricingMode(event.target.checked ? 'variations' : 'single');
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // For online business, set default values for location
      const submissionData = {...formData};
      if (submissionData.businessType === 'online') {
        submissionData.latitude = null;
        submissionData.longitude = null;
      }
      
      // Create searchable data following the Terminal/Searchable paradigm
      const searchableData = {
        payloads: {
          "public": {
            "title": submissionData.title,
            "description": submissionData.description,
            "meetupLocation": submissionData.meetupLocation,
            "latitude": submissionData.latitude,
            "longitude": submissionData.longitude,
            "price": pricingMode === 'single' ? submissionData.price ? submissionData.price : null : null,
            "businessType": submissionData.businessType,
            "use_location": submissionData.businessType === 'online' ? false : true,
            "images": previewImages.map(base64String => {
              // Remove the data:image/xxx;base64, prefix
              return base64String.split(',')[1];
            }),
            "selectables": pricingMode === 'variations' ? selectables : [],
            "pricingMode": pricingMode,
            "visibility": {
              "udf": "always_true",
              "data": {}
            }
          }
        }
      };
      
      // Send the request with JSON data
      const response = await backend.post(
        'v1/searchable/create',
        searchableData
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
        price: '',
        businessType: 'personal'
      });
      setImages([]);
      setPreviewImages([]);
      setSelectables([]); // Reset selectables too
      
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
  
  // Add effect to fetch BTC price when component mounts
  useEffect(() => {
    fetchBtcPrice();
  }, []);
  
  // Add effect to update USD price when price or BTC rate changes
  useEffect(() => {
    if (formData.price && btcPrice) {
      // Convert satoshis to USD (1 BTC = 100,000,000 sats)
      const usdValue = (parseFloat(formData.price) / 100000000) * btcPrice;
      setUsdPrice(usdValue);
    } else {
      setUsdPrice(null);
    }
  }, [formData.price, btcPrice]);
  
  // Function to fetch current BTC price
  const fetchBtcPrice = async () => {
    setPriceLoading(true);
    try {
      const response = await backend.get(
        'v1/get-btc-price'
      );
      if (response.data && response.data.bitcoin && response.data.bitcoin.usd) {
        setBtcPrice(response.data.bitcoin.usd);
      }
    } catch (error) {
      console.error("Error fetching BTC price:", error);
    } finally {
      setPriceLoading(false);
    }
  };
  
  // Function to format USD price
  const formatUSD = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
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
            <Grid container spacing={1}>
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
                  Business Type *
                </Typography>
                <TextField
                  select
                  fullWidth
                  id="businessType"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                  required
                  className={classes.textInput}
                >
                  <MenuItem value="personal">Personal</MenuItem>
                  <MenuItem value="online">Online Business</MenuItem>
                  <MenuItem value="local">Local Business</MenuItem>
                </TextField>
                <Typography variant="caption" className={classes.formHelp}>
                  Select the type of listing you are creating
                </Typography>
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
              
              <Grid item xs={12} className={classes.formGroup}>
                <Typography variant="subtitle1" className={classes.formLabel}>
                  Pricing
                </Typography>
                <Box display="flex" alignItems="center" mb={2}>
                  {/* <Typography variant="body2">Single Price</Typography> */}
                  <Box mx={1}>
                    <Switch
                      checked={pricingMode === 'variations'}
                      onChange={handlePricingModeChange}
                      // color="primary"
                    />
                  </Box>
                  <Typography variant="body2">Product Variations</Typography>
                </Box>
              </Grid>
              
              {pricingMode === 'single' && (
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
                  {usdPrice !== null && (
                    <Typography variant="caption" className={classes.formHelp} style={{ marginTop: 4 }}>
                      {priceLoading ? (
                        <CircularProgress size={12} style={{ marginRight: 8 }} />
                      ) : (
                        `≈ ${formatUSD(usdPrice)} USD`
                      )}
                    </Typography>
                  )}
                </Grid>
              )}
              
              {pricingMode === 'variations' && (
                <Grid item xs={12} className={classes.formGroup}>
                  <Typography variant="subtitle1" className={classes.formLabel}>
                    Product Variations
                  </Typography>
                  <Typography variant="caption" className={classes.formHelp}>
                    Add different options for your product (size, color, etc.) with individual prices
                  </Typography>
                  
                  <Box mt={2}>
                    <TextField
                      placeholder="Option Description"
                      // variant="outlined"
                      size="small"
                      name="name"
                      value={newSelectable.name}
                      onChange={handleSelectableChange}
                      fullWidth
                    />
                    <Box mt={1} display="flex" alignItems="center">
                      <TextField
                        placeholder="Price (Sats)"
                        // variant="outlined"
                        type="number"
                        size="small"
                        name="price"
                        value={newSelectable.price}
                        onChange={handleSelectableChange}
                        style={{ marginRight: 16, flex: 1 }}
                      />
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={addSelectable}
                      >
                        Add
                      </Button>
                    </Box>
                  </Box>
                  
                  {/* List of added selectables */}
                  <Box mt={2}>
                    {selectables.length > 0 ? (
                      selectables.map((item) => (
                        <Box 
                          key={item.id} 
                          display="flex" 
                          alignItems="center" 
                          p={1} 
                          mb={1}
                          border="1px solid #ff3c00"
                          // borderRadius="4px"
                        >
                          <Typography variant="body2" style={{ flex: 2 }}>
                            {item.name}
                          </Typography>
                          <Typography variant="body2" style={{ flex: 1 }}>
                            {item.price} sats
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => removeSelectable(item.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No variations added yet.
                      </Typography>
                    )}
                  </Box>
                </Grid>
              )}
              
              <Grid item xs={12} className={classes.formGroup}>
                <Typography variant="subtitle1" className={classes.formLabel}>
                  Images
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

              {formData.businessType !== 'online' && (
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
              )}

              {formData.businessType !== 'online' && (
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
              )}
              
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
