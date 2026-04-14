import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';
import User from '../models/User.js';

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { width: 500, height: 500, crop: 'limit' },
          { quality: 'auto' }
        ]
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

// @desc    Upload profile picture
// @route   POST /api/profile/picture
// @access  Private
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      'aggrigo/profile-pictures'
    );

    // Add to user's profilePictures array
    const user = await User.findById(req.user.id);
    
    user.profilePictures.push({
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date()
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePicture: {
        url: result.secure_url,
        publicId: result.public_id
      }
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading profile picture'
    });
  }
};

// @desc    Update/Replace profile picture
// @route   PUT /api/profile/picture
// @access  Private
export const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    // Upload new picture to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      'aggrigo/profile-pictures'
    );

    // Add new picture to history (keeps all old pictures)
    const user = await User.findById(req.user.id);
    
    user.profilePictures.push({
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date()
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      profilePicture: {
        url: result.secure_url,
        publicId: result.public_id
      }
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile picture'
    });
  }
};

// @desc    Delete current profile picture
// @route   DELETE /api/profile/picture
// @access  Private
export const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.profilePictures || user.profilePictures.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No profile picture to delete'
      });
    }

    // Remove the latest picture from the array (but keep in Cloudinary)
    user.profilePictures.pop();
    await user.save();

    // Get the new current picture (if any remain)
    const currentPicture = user.profilePictures.length > 0
      ? user.profilePictures[user.profilePictures.length - 1]
      : null;

    res.status(200).json({
      success: true,
      message: 'Profile picture removed successfully',
      profilePicture: currentPicture
    });
  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting profile picture'
    });
  }
};

// @desc    Get current profile picture
// @route   GET /api/profile/picture
// @access  Private
export const getCurrentProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const currentPicture = user.profilePictures && user.profilePictures.length > 0
      ? user.profilePictures[user.profilePictures.length - 1]
      : null;

    res.status(200).json({
      success: true,
      profilePicture: currentPicture
    });
  } catch (error) {
    console.error('Get profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile picture'
    });
  }
};
