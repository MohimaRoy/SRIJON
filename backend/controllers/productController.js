import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';

// Seller — নতুন product তৈরি
// POST /api/products
export const createProduct = async (req, res) => {
  try {
    const { name, description, category, subCategory, price, discountPercentage, unit, weightPerUnit, weightUnit, stock, location, images } = req.body;

    const discountPercentageNum = Number(discountPercentage) || 0;
    let computedDiscountPrice = null;

    if (discountPercentageNum > 0 && discountPercentageNum < 100) {
      computedDiscountPrice = Math.round(Number(price) * (1 - discountPercentageNum / 100));
    }

    const product = await Product.create({
      name,
      description,
      category,
      subCategory,
      price: Number(price),
      discountPercentage: discountPercentageNum,
      discountPrice: computedDiscountPrice,
      unit,
      weightPerUnit: Number(weightPerUnit) || 0,
      weightUnit,
      stock: Number(stock),
      images: images || [],
      location,
      seller: req.user._id,
      status: 'approved',
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Seller — নিজের সব products দেখা
// GET /api/products/my-products
export const getMyProducts = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { seller: req.user._id };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Seller — product update
// PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const product = req.product; // requireProductOwner middleware থেকে আসে

    const allowedFields = [
      'name', 'description', 'category', 'subCategory', 'price', 
      'discountPercentage', 'unit', 'weightPerUnit', 'weightUnit', 
      'stock', 'images', 'location'
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    // Re-calculate discountPrice if price or percentage changed
    const priceNum = Number(product.price);
    const pctNum   = Number(product.discountPercentage);
    if (pctNum > 0 && pctNum < 100) {
      product.discountPrice = Math.round(priceNum * (1 - pctNum / 100));
    } else {
      product.discountPrice = null;
    }

    // Admin added/updated products are always approved
    product.status = 'approved';
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Seller — product delete
// DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Authorization
    if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
    }

    // Cloudinary থেকে images delete
    if (product.images?.length > 0) {
      for (const img of product.images) {
        if (img.publicId) {
          await cloudinary.uploader.destroy(img.publicId);
        }
      }
    }

    await product.deleteOne();

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin — সব pending products দেখা
// GET /api/products/admin/pending
export const getPendingProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find({ status: 'pending' })
        .populate('seller', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments({ status: 'pending' }),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin — product approve
// PATCH /api/products/:id/approve
export const approveProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedAt: new Date(), rejectedReason: '' },
      { new: true }
    ).populate('seller', 'name email');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, message: 'Product approved', data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin — product reject
// PATCH /api/products/:id/reject
export const rejectProduct = async (req, res) => {
  try {
    const { reason } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectedReason: reason || 'Does not meet our standards' },
      { new: true }
    ).populate('seller', 'name email');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, message: 'Product rejected', data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Customer/Public — get all approved products with filters
// GET /api/products/public
export const getPublicProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;

    let filter = { status: 'approved' }; // Only fetch approved products

    // Search by name or description
    if (search) {
      filter.$text = { $search: search };
    }

    // Filter by category
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Filter by price
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Sorting
    let sortObj = { createdAt: -1 }; // default newest
    if (sort === 'price_low') sortObj = { price: 1 };
    else if (sort === 'price_high') sortObj = { price: -1 };
    else if (sort === 'popular') sortObj = { totalSold: -1 };

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Customer/Public — get all distinct categories from approved products
// GET /api/products/public/categories
export const getPublicCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { status: 'approved' });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Customer/Public — get product by id
// GET /api/products/public/:id
export const getPublicProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, status: 'approved' })
      .populate('seller', 'name email');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
