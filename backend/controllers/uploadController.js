import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
};

// @desc    Upload single file
// @route   POST /api/upload/single
// @access  Private
export const uploadSingle = async (req, res) => {
  try {
    console.log('[UPLOAD] Headers:', req.headers['content-type']);
    console.log('[UPLOAD] req.file:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'MISSING');
    console.log('[UPLOAD] req.body keys:', Object.keys(req.body));

    if (!req.file) {
      console.error('[UPLOAD] No file found. Multer field name expected: "file"');
      return res.status(400).json({
        success: false,
        message: 'No file received. Make sure FormData key is "file".'
      });
    }

    const folder = req.body.folder || 'srijon-products';
    
    const result = await uploadToCloudinary(req.file.buffer, folder);

    res.status(200).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      public_id: result.public_id
    });
  } catch (error) {
    console.error('Upload single error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file'
    });
  }
};

// @desc    Upload multiple files
// @route   POST /api/upload/multiple
// @access  Private
export const uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload files'
      });
    }

    const folder = req.body.folder || 'aggrigo';
    
    const uploadPromises = req.files.map(file => 
      uploadToCloudinary(file.buffer, folder)
    );

    const results = await Promise.all(uploadPromises);

    const urls = results.map(result => ({
      url: result.secure_url,
      publicId: result.public_id,
      public_id: result.public_id
    }));

    res.status(200).json({
      success: true,
      files: urls
    });
  } catch (error) {
    console.error('Upload multiple error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading files'
    });
  }
};
