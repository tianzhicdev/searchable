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
        
        // Convert to Blob with fixed quality
        let mime = file.type || 'image/jpeg';
        
        // Force JPEG conversion for AVIF and other formats that don't compress well with canvas
        if (mime === 'image/avif' || mime === 'image/webp' || mime === 'image/gif') {
          mime = 'image/jpeg';
        }
        
        // Use a binary search approach to find optimal quality
        let minQuality = 0.1;
        let maxQuality = 1.0;
        let bestQuality = 0.7; // Start with a reasonable default
        let bestBlob = null;
        
        const findOptimalQuality = (attempt = 0, maxAttempts = 5) => {
          if (attempt >= maxAttempts) {
            // Use the best blob we've found so far
            if (bestBlob) {
              const compressedFile = new File([bestBlob], file.name, {
                type: mime,
                lastModified: new Date().getTime()
              });
              resolve(compressedFile);
            } else {
              // Fallback to a low quality if we somehow didn't find any suitable blob
              canvas.toBlob((blob) => {
                const compressedFile = new File([blob], file.name, {
                  type: mime,
                  lastModified: new Date().getTime()
                });
                resolve(compressedFile);
              }, mime, 0.5);
            }
            return;
          }
          
          canvas.toBlob((blob) => {
            console.log(`Attempt ${attempt+1}: Quality ${bestQuality.toFixed(2)}, Size: ${(blob.size / 1024).toFixed(2)}KB`);
            
            if (blob.size <= maxSizeKB * 1024) {
              // This quality works, but we might be able to increase it
              bestBlob = blob;
              minQuality = bestQuality;
              bestQuality = (maxQuality + bestQuality) / 2;
            } else {
              // Too large, decrease quality
              maxQuality = bestQuality;
              bestQuality = (minQuality + bestQuality) / 2;
            }
            
            findOptimalQuality(attempt + 1, maxAttempts);
          }, mime, bestQuality);
        };
        
        findOptimalQuality();
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