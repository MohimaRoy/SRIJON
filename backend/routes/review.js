import express from 'express';
import {
  createReview,
  getProductReviews,
  getAllReviewsAdmin,
  moderateReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected Buyer routes
router.post('/', protect, createReview);

// Protected Admin routes
router.get('/admin', protect, requireAdmin, getAllReviewsAdmin);
router.patch('/:id/moderate', protect, requireAdmin, moderateReview);
router.delete('/:id', protect, requireAdmin, deleteReview);

export default router;
