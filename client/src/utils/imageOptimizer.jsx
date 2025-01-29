import imageCompression from 'browser-image-compression';

export const optimizeImage = async (imageFile, maxSizeMB = 1, maxWidthOrHeight = 1920) => {
  try {
    // Compression options
    const options = {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      fileType: 'image/webp' // Convert to WebP format
    };

    // Compress the image
    const compressedFile = await imageCompression(imageFile, options);
    return compressedFile;
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw error;
  }
};

export const createImageThumbnail = async (imageFile, maxWidthOrHeight = 300) => {
  try {
    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight,
      useWebWorker: true,
      fileType: 'image/webp'
    };

    const thumbnailFile = await imageCompression(imageFile, options);
    return thumbnailFile;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    throw error;
  }
};
