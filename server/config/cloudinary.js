import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables 
dotenv.config({ path: path.resolve('.', '.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Uploads an image to Cloudinary
 * @param {string} filePath - Path to the local file
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise} - Cloudinary upload response
 */
export const uploadImage = async (filePath, options = {}) => {
  try {
    const defaultOptions = {
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      folder: 'leetroom/profile-pictures',
      transformation: [
        { width: 400, height: 400, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" }
      ]
    };

    // Merge default options with any provided options
    const uploadOptions = { ...defaultOptions, ...options };

    // Upload the image
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Deletes an image from Cloudinary
 * @param {string} publicId - Cloudinary public ID of the image
 * @returns {Promise} - Cloudinary delete response
 */
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary deletion failed: ${error.message}`);
  }
};

export default cloudinary;
