import Combo from '../models/Combo.js';
import Order from '../models/Order.js';

// ─── ADMIN: Create Combo ────────────────────────────────────────────────────
// POST /api/combos
export const createCombo = async (req, res, next) => {
  try {
    const { name, description, image, items, discountPercentage, isFeatured } = req.body;

    if (!image || !image.url) {
      return res.status(400).json({ success: false, message: 'Combo image is required' });
    }

    const combo = await Combo.create({
      name,
      description,
      image,
      items: items || [],
      discountPercentage: discountPercentage || 0,
      isFeatured: isFeatured || false,
      createdBy: req.user._id || req.user.id,
    });

    res.status(201).json({ success: true, data: combo });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: Update Combo ────────────────────────────────────────────────────
// PUT /api/combos/:id
export const updateCombo = async (req, res, next) => {
  try {
    const combo = await Combo.findById(req.params.id);
    if (!combo) return res.status(404).json({ success: false, message: 'Combo not found' });

    const fields = ['name', 'description', 'image', 'items', 'discountPercentage', 'isFeatured', 'isActive'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) combo[f] = req.body[f];
    });

    await combo.save(); // pre-save hook recalculates prices

    res.status(200).json({ success: true, data: combo });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: Delete Combo ────────────────────────────────────────────────────
// DELETE /api/combos/:id
export const deleteCombo = async (req, res, next) => {
  try {
    const combo = await Combo.findByIdAndDelete(req.params.id);
    if (!combo) return res.status(404).json({ success: false, message: 'Combo not found' });

    res.status(200).json({ success: true, message: 'Combo deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: Get All Combos (full data) ─────────────────────────────────────
// GET /api/combos/admin
export const getAllCombosAdmin = async (req, res, next) => {
  try {
    const combos = await Combo.find({}).sort('-createdAt').populate('createdBy', 'name email');
    res.status(200).json({ success: true, count: combos.length, data: combos });
  } catch (error) {
    next(error);
  }
};

// ─── PUBLIC: Get All Active Combos (no individual prices exposed) ───────────
// GET /api/combos
export const getPublicCombos = async (req, res, next) => {
  try {
    const combos = await Combo.find({ isActive: true }).sort('-createdAt').select(
      'name description image totalPrice discountPercentage discountedPrice isFeatured createdAt'
    );

    res.status(200).json({ success: true, count: combos.length, data: combos });
  } catch (error) {
    next(error);
  }
};

// ─── PUBLIC: Get Single Combo Detail (items shown, but prices hidden) ───────
// GET /api/combos/:id
export const getComboDetail = async (req, res, next) => {
  try {
    const combo = await Combo.findOne({ _id: req.params.id, isActive: true });
    if (!combo) return res.status(404).json({ success: false, message: 'Combo not found' });

    // Sanitize: return items WITHOUT individual prices
    const sanitizedItems = combo.items.map((item) => ({
      _id: item._id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      image: item.image,
      // price intentionally omitted
    }));

    const data = {
      _id: combo._id,
      name: combo.name,
      description: combo.description,
      image: combo.image,
      totalPrice: combo.totalPrice,
      discountPercentage: combo.discountPercentage,
      discountedPrice: combo.discountedPrice,
      effectivePrice: combo.effectivePrice,
      isFeatured: combo.isFeatured,
      items: sanitizedItems,
      createdAt: combo.createdAt,
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// ─── CHECKOUT GUARD: Check if buyer purchased a combo this month ─────────────
// GET /api/combos/check-monthly-purchase
// Used by checkout flow to enforce the business rule
export const checkMonthlyComboStatus = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    // Start of current month (UTC)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Look for any order placed this month that contains a combo item
    const comboOrder = await Order.findOne({
      buyer: userId,
      createdAt: { $gte: startOfMonth },
      'products.isCombo': true,
    });

    res.status(200).json({
      success: true,
      hasPurchasedComboThisMonth: !!comboOrder,
      data: comboOrder
        ? {
            orderId: comboOrder._id,
            purchasedAt: comboOrder.createdAt,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};
