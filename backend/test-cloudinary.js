import cloudinary from './config/cloudinary.js';
import dotenv from 'dotenv';
dotenv.config();

const testCloudinary = async () => {
  try {
    console.log('Testing Cloudinary with keys:');
    console.log('Cloud Name:', process.env.CLOUDINARY_NAME);
    
    // Test a dummy upload (using a base64 or public URL)
    const result = await cloudinary.uploader.upload('https://via.placeholder.com/150', {
      folder: 'test'
    });
    
    console.log('Upload Success!');
    console.log('URL:', result.secure_url);
    process.exit(0);
  } catch (err) {
    console.error('Cloudinary test failed:', err);
    process.exit(1);
  }
};

testCloudinary();
