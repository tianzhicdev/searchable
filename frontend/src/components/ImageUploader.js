import React, { useState } from 'react';
import { 
  Box, Typography, IconButton
} from '@material-ui/core';
import { Delete as DeleteIcon, AddPhotoAlternate as AddPhotoAlternateIcon } from '@material-ui/icons';
import Backend from '../views/utilities/Backend';
import ZoomableImage from './ZoomableImage';

const ImageUploader = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 10, 
  title = "Additional Images",
  description = "Add up to 10 additional images to showcase",
  imageSize = 100,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [inputId] = useState(() => `image-uploader-input-${Math.random().toString(36).substr(2, 9)}`);

  // Function to upload image to media endpoint immediately
  const uploadImageToMedia = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await Backend.post('v1/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        return {
          media_uri: response.data.media_uri,
          media_id: response.data.media_id
        };
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image to media:', error);
      throw error;
    }
  };

  const handleImagesChange = async (e) => {
    const files = Array.from(e.target.files);
    const newImageData = [];
    
    setLoading(true);
    
    for (const file of files) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        if (onError) onError('Image file size must be less than 5MB');
        continue;
      }

      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        if (onError) onError('Please select valid image files (PNG, JPG, JPEG, GIF, or WEBP)');
        continue;
      }

      try {
        // Upload image immediately to media endpoint
        const uploadResult = await uploadImageToMedia(file);

        // Create preview for immediate display
        const reader = new FileReader();
        const preview = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newImageData.push({
          uri: uploadResult.media_uri,
          preview: preview,
          media_id: uploadResult.media_id
        });
      } catch (error) {
        if (onError) onError('Failed to upload one or more images. Please try again.');
        console.error('Image upload error:', error);
      }
    }

    if (newImageData.length > 0) {
      const updatedImages = [...images, ...newImageData];
      onImagesChange(updatedImages);
    }
    
    setLoading(false);
    
    // Clear the file input
    e.target.value = '';
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  return (
    <Box mt={3}>
      <Typography variant="subtitle1" gutterBottom>
        {title}
      </Typography>
      <Typography variant="caption" color="textSecondary" gutterBottom>
        {description.replace('10', maxImages.toString())}
      </Typography>
      
      <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
        {images.map((imageData, index) => (
          <Box key={index} position="relative">
            <ZoomableImage 
              src={imageData.preview || imageData.uri} 
              alt={`Image ${index + 1}`}
              style={{ width: imageSize, height: imageSize, objectFit: 'cover' }}
            />
            <IconButton
              size="small"
              onClick={() => removeImage(index)}
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
        
        {images.length < maxImages && (
          <Box>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id={inputId}
              type="file"
              multiple
              onChange={handleImagesChange}
              disabled={loading}
            />
            <label htmlFor={inputId}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                style={{
                  width: imageSize,
                  height: imageSize,
                  border: '2px dashed #ccc',
                  borderRadius: 4,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1
                }}
              >
                <IconButton component="span" disabled={loading}>
                  <AddPhotoAlternateIcon />
                </IconButton>
              </Box>
            </label>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ImageUploader;