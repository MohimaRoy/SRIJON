import Product from '../models/Product.js';

// ─── Public — সব approved products ──────────────────────────────
// GET /api/products/public
export const getPublicProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12,
      sort = 'newest',
    } = req.query;

    const filter = { status: 'approved' };

    // Search by name
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Sort options
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_low: { price: 1 },
      price_high: { price: -1 },
      popular: { totalSold: -1 },
    };

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'name')
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(Number(limit))
        .select('name price discountPrice images category unit stock seller location averageRating totalReviews isFeatured'),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Public — একটা product এর detail ────────────────────────────
// GET /api/products/public/:id
export const getPublicProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      status: 'approved',
    }).populate('seller', 'name phone address');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Public — Featured products (homepage এর জন্য) ───────────────
// GET /api/products/public/featured
export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: 'approved', isFeatured: true })
      .populate('seller', 'name')
      .limit(8)
      .select('name price discountPrice images category unit stock seller averageRating');

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
