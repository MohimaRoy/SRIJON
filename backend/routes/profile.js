import express from 'express';
import {
  uploadProfilePicture,
  updateProfilePicture,
  deleteProfilePicture,
  getCurrentProfilePicture
} from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Profile picture routes
router.route('/picture')
  .get(getCurrentProfilePicture)
  .post(upload.single('profilePicture'), uploadProfilePicture)
  .put(upload.single('profilePicture'), updateProfilePicture)
  .delete(deleteProfilePicture);

export default router;
