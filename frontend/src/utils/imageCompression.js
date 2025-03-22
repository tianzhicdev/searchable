/**
 * Utility to compress images that exceed a specified size limit
 * 
 * @param {File} file - The image file to compress
 * @param {number} maxSizeKB - Maximum size in KB (default: 200KB)
 * @param {number} maxWidth - Maximum width to resize to (default: 1200px)
 * @param {number} maxHeight - Maximum height to resize to (default: 1200px)
 * @returns {Promise<File>} - Promise resolving to a compressed File object
 */
export const compressImage = (file, maxSizeKB = 200, maxWidth = 1200, maxHeight = 1200) => {
  return new Promise((resolve, reject) => {
    // If file is already smaller than max size, return it as is
    if (file.size <= maxSizeKB * 1024) {
      resolve(file);
      return;
    }

    // Create a FileReader to read the file
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      // Create an image object from the data URL
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start with high quality
        let quality = 0.9;
        const mime = file.type || 'image/jpeg';
        
        // Function to compress with different quality settings
        const tryCompression = (currentQuality) => {
          canvas.toBlob((blob) => {
            if (blob.size <= maxSizeKB * 1024 || currentQuality <= 0.1) {
              // Create a new file from the blob
              const compressedFile = new File([blob], file.name, {
                type: mime,
                lastModified: new Date().getTime()
              });
              
              resolve(compressedFile);
            } else {
              // Try with lower quality
              tryCompression(currentQuality - 0.1);
            }
          }, mime, currentQuality);
        };
        
        // Start compression attempts
        tryCompression(quality);
      };
      
      img.onerror = (error) => {
        reject(new Error('Error loading image: ' + error));
      };
    };
    
    reader.onerror = (error) => {
      reject(new Error('Error reading file: ' + error));
    };
  });
};

/**
 * Creates a data URL from a file
 * 
 * @param {File} file - The file to read
 * @returns {Promise<string>} - Promise resolving to data URL
 */
export const fileToDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}; 