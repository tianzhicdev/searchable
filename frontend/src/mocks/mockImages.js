// Import mock images and convert to base64
import mockImage1 from '../assets/mock/mock.png';
import mockImage2 from '../assets/mock/mock1.png';

// Function to convert image URL to base64
export const convertImageToBase64 = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove the data:image/png;base64, prefix
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

// Export mock images
export const mockImages = [mockImage1, mockImage2];