import express from 'express';
import { protect, requireAdmin, requireProductOwner } from '../middleware/auth.js';
import {
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getPublicProducts,
  getPublicCategories,
  getPublicProductById,
} from '../controllers/productController.js';

const router = express.Router();

// Public route (Must be before dynamic /:id routes)
router.get('/public/categories', getPublicCategories);
router.get('/public', getPublicProducts);
router.get('/public/:id', getPublicProductById);

// Admin static routes (Must be before dynamic /:id routes)
router.get('/admin/pending', protect, requireAdmin, getPendingProducts);

// Admin routes
router.post('/', protect, requireAdmin, createProduct);
router.get('/my-products', protect, requireAdmin, getMyProducts);
router.put('/:id', protect, requireAdmin, requireProductOwner, updateProduct);
router.delete('/:id', protect, requireAdmin, deleteProduct);

// Admin dynamic routes
router.patch('/:id/approve', protect, requireAdmin, approveProduct);
router.patch('/:id/reject', protect, requireAdmin, rejectProduct);

// Admin — featured toggle
router.patch('/:id/featured', protect, requireAdmin, async (req, res) => {
  try {
    const Product = (await import('../models/Product.js')).default;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.isFeatured = !product.isFeatured;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product ${product.isFeatured ? 'featured' : 'unfeatured'}`,
      data: { isFeatured: product.isFeatured },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
