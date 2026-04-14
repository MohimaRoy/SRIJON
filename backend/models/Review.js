import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    adminApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent user from reviewing the same product twice
ReviewSchema.index({ buyer: 1, product: 1 }, { unique: true });

export default mongoose.model('Review', ReviewSchema);
