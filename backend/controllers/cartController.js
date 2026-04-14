import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Combo from '../models/Combo.js';

// ─── Add COMBO to Cart ────────────────────────────────────────────────────────
// POST /api/cart/combo
export const addComboToCart = async (req, res) => {
  try {
    const { comboId, quantity = 1 } = req.body;

    // Verify combo exists and is active
    const combo = await Combo.findOne({ _id: comboId, isActive: true });
    if (!combo) {
      return res.status(404).json({ success: false, message: 'Combo not found or unavailable' });
    }

    const price = combo.discountedPrice ?? combo.totalPrice;

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: [{
          comboId: combo._id,
          isCombo: true,
          product: null,
          seller: null,
          quantity,
          price,
          originalPrice: combo.totalPrice,
          discountPercentage: combo.discountPercentage || 0,
          name: combo.name,
          image: combo.image?.url || '',
          unit: 'combo',
        }],
      });
    } else {
      // Check if this combo is already in cart
      const existing = cart.items.find(
        (item) => item.comboId && item.comboId.toString() === comboId
      );

      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.items.push({
          comboId: combo._id,
          isCombo: true,
          product: null,
          seller: null,
          quantity,
          price,
          originalPrice: combo.totalPrice,
          discountPercentage: combo.discountPercentage || 0,
          name: combo.name,
          image: combo.image?.url || '',
          unit: 'combo',
        });
      }
    }

    await cart.save();
    res.status(200).json({ success: true, message: 'Combo added to cart', data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── Cart দেখা ───────────────────────────────────────────────────
// GET /api/cart
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name images price discountPrice discountPercentage stock status unit')
      .populate('items.seller', 'name')
      .populate('items.comboId', 'name image items');

    if (!cart) {
      return res.status(200).json({ success: true, data: { items: [], totalAmount: 0 } });
    }

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Cart এ product add করা ──────────────────────────────────────
// POST /api/cart/add
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Product exist করে কিনা ও approved কিনা check
    const product = await Product.findOne({ _id: productId, status: 'approved' });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or not available' });
    }

    // Stock check
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} ${product.unit} available in stock`,
      });
    }

    // Effective price (discount থাকলে সেটা)
    const price = product.discountPrice || product.price;

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      // নতুন cart তৈরি
      cart = new Cart({
        user: req.user._id,
        items: [{
          product: product._id,
          seller: product.seller,
          quantity,
          price,
          originalPrice: product.price,
          discountPercentage: product.discountPercentage || 0,
          name: product.name,
          image: product.images?.[0]?.url || '',
          unit: product.unit || '',
        }],
      });
    } else {
      // Existing cart এ product আছে কিনা check
      const existingItem = cart.items.find(
        (item) => item.product && item.product.toString() === productId
      );

      if (existingItem) {
        // আছে — quantity বাড়াও
        const newQty = existingItem.quantity + quantity;
        if (newQty > product.stock) {
          return res.status(400).json({
            success: false,
            message: `Cannot add more. Only ${product.stock} ${product.unit} in stock`,
          });
        }
        existingItem.quantity = newQty;
      } else {
        // নেই — নতুন item add করো
        cart.items.push({
          product: product._id,
          seller: product.seller,
          quantity,
          price,
          originalPrice: product.price,
          discountPercentage: product.discountPercentage || 0,
          name: product.name,
          image: product.images?.[0]?.url || '',
          unit: product.unit || '',
        });
      }
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Product added to cart',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Cart item এর quantity update ───────────────────────────────
// PUT /api/cart/update/:itemId
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    // Stock check
    const product = await Product.findById(item.product);
    if (product && quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} ${product.unit} available`,
      });
    }

    item.quantity = quantity;
    await cart.save();

    res.status(200).json({ success: true, message: 'Cart updated', data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Cart থেকে item remove ───────────────────────────────────────
// DELETE /api/cart/remove/:itemId
export const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== req.params.itemId
    );

    await cart.save();

    res.status(200).json({ success: true, message: 'Item removed from cart', data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Cart clear (order place এর পরে) ────────────────────────────
// DELETE /api/cart/clear
export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
