import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getCart,
  addToCart,
  addComboToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cartController.js';

const router = express.Router();

router.use(protect);

router.get('/', getCart);
router.post('/add', addToCart);
router.post('/combo', addComboToCart);       // ← combo packages
router.put('/update/:itemId', updateCartItem);
router.delete('/remove/:itemId', removeFromCart);
router.delete('/clear', clearCart);

export default router;