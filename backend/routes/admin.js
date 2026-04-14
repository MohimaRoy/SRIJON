import express from 'express';
import { protect, requireAdmin } from '../middleware/auth.js';
import { getAllUsers, verifyUser, getAllOrders, updateOrderStatusAdmin, toggleUserSuspension, getAnalytics } from '../controllers/adminController.js';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(protect, requireAdmin);

// GET /api/admin/analytics
router.get('/analytics', getAnalytics);

// GET /api/admin/users
router.get('/users', getAllUsers);

// PATCH /api/admin/users/:id/approve
router.patch('/users/:id/approve', verifyUser);

// PATCH /api/admin/users/:id/suspend
router.patch('/users/:id/suspend', toggleUserSuspension);

// GET /api/admin/orders
router.get('/orders', getAllOrders);

// PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', updateOrderStatusAdmin);

export default router;
