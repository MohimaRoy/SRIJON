import Review from '../models/Review.js';
import Order from '../models/Order.js';

// @desc    Create a review for a product
// @route   POST /api/reviews
// @access  Private (Buyer)
export const createReview = async (req, res, next) => {
  try {
    const { product, seller, rating, comment } = req.body;
    const buyerId = req.user._id;

    // 1. Check if the buyer has purchased this product and it is delivered
    const hasBought = await Order.findOne({
      buyer: buyerId,
      'products.product': product,
      orderStatus: 'delivered',
    });

    if (!hasBought) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products from orders that have been delivered to you.',
      });
    }

    // 2. Check if already reviewed
    const existingReview = await Review.findOne({ buyer: buyerId, product });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
      });
    }

    const review = await Review.create({
      buyer: buyerId,
      product,
      seller,
      rating: Number(rating),
      comment,
      adminApproved: false, // Must be approved by admin
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted and is waiting for admin approval',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all approved reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      product: req.params.productId,
      adminApproved: true,
    })
      .populate('buyer', 'name profilePicture')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews (for Admin moderation)
// @route   GET /api/reviews/admin
// @access  Private (Admin)
export const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('buyer', 'name')
      .populate('product', 'name')
      .populate('seller', 'name')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject a review
// @route   PATCH /api/reviews/:id/moderate
// @access  Private (Admin)
export const moderateReview = async (req, res, next) => {
  try {
    const { adminApproved } = req.body;
    
    // adminApproved can be true or false (or we delete if rejected completely)
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.adminApproved = adminApproved;
    await review.save();

    res.status(200).json({
      success: true,
      message: `Review ${adminApproved ? 'approved' : 'rejected'}`,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (Admin)
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review deleted',
    });
  } catch (error) {
    next(error);
  }
};
