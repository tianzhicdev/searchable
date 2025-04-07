/**
 * Utility functions for image compression and handling
 */

/**
 * Compresses an image file to a target size in KB
 * @param {File} file - The image file to compress
 * @param {number} maxSizeKB - Maximum size in KB (default: 50)
 * @returns {Promise<Blob>} - Compressed image as a Blob
 */
export const compressImage = async (file, maxSizeKB = 50) => {
  // If file is already smaller than the max size, return it as is
  if (file.size <= maxSizeKB * 1024) {
    return file;
  }

  // Create an image element to load the file
  const img = document.createElement('img');
  
  // Create a canvas to use for compression
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Convert file to data URL for the img element
  const dataURL = await fileToDataURL(file);
  
  // Create a promise to handle the image loading
  return new Promise((resolve, reject) => {
    img.onload = () => {
      // Initialize with original dimensions
      let width = img.width;
      let height = img.height;
      let quality = 0.9; // Start with high quality
      let blob;
      let iteration = 0;
      const MAX_ITERATIONS = 10; // Prevent infinite loops
      
      // Recursive function to try different compression settings
      const compress = () => {
        // If we've tried too many times, use the smallest we got
        if (iteration++ > MAX_ITERATIONS) {
          console.warn(`Could not compress image to ${maxSizeKB}KB. Final size: ${blob.size / 1024}KB`);
          resolve(blob);
          return;
        }
        
        // Adjust canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with current quality
        canvas.toBlob((result) => {
          blob = result;
          
          // Check if we've reached the target size
          if (result.size <= maxSizeKB * 1024) {
            // Create a new Blob with the correct MIME type
            const compressedBlob = new Blob([result], { type: file.type });
            resolve(compressedBlob);
          } else {
            // If still too large, try reducing quality or dimensions
            if (quality > 0.5) {
              // Try reducing quality first
              quality -= 0.1;
            } else {
              // If quality is already low, reduce dimensions
              width *= 0.9;
              height *= 0.9;
            }
            compress(); // Try again with new settings
          }
        }, file.type, quality);
      };
      
      // Start compression
      compress();
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = dataURL;
  });
};

/**
 * Converts a file to a data URL
 * @param {File|Blob} file - The file to convert
 * @returns {Promise<string>} - Data URL representation of the file
 */
export const fileToDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}; 