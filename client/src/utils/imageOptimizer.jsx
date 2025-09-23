import imageCompression from 'browser-image-compression';

export const optimizeImage = async (imageFile, maxSizeMB = 5, maxWidthOrHeight = 4000) => {
  try {
    // For print quality, preserve original files when possible
    const options = {
      maxSizeMB, // Increased to 5MB for maximum quality retention
      maxWidthOrHeight, // Increased to 4000px for ultra print quality
      useWebWorker: true,
      fileType: 'image/png', // PNG for lossless quality
      initialQuality: 1.0 // Maximum quality setting
    };

    // Only compress if file is significantly larger than maxSizeMB
    if (imageFile.size <= maxSizeMB * 1024 * 1024) {
      // File is within size limit, return original without any processing
      console.log('Image within size limit, preserving original quality');
      return imageFile;
    }

    console.log('Image larger than limit, applying minimal compression');
    // Very minimal compression only when absolutely necessary
    const compressedFile = await imageCompression(imageFile, options);
    return compressedFile;
  } catch (error) {
    console.error('Error optimizing image:', error);
    // If compression fails, return original file
    return imageFile;
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
