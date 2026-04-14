import express from 'express';
import {
  createOrder,
  getMyOrders,
  getSellerOrders,
  updateOrderStatus,
  verifyPayment
} from '../controllers/orderController.js';
import { protect, requireSeller } from '../middleware/auth.js';

const router = express.Router();

// All order routes require authentication
router.use(protect);

// @route   POST /api/orders
// @desc    Create new order
router.route('/').post(createOrder);

// @route   GET /api/orders/my-orders
// @desc    Get logged in user orders
router.route('/my-orders').get(getMyOrders);

// @route   GET /api/orders/seller
// @desc    Get seller orders
// @access  Private/Seller
router.route('/seller').get(requireSeller, getSellerOrders);

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private/Seller
router.route('/:id/status').put(requireSeller, updateOrderStatus);

// @route   POST /api/orders/verify-payment
// @desc    Verify payment
router.route('/verify-payment').post(verifyPayment);

export default router;
