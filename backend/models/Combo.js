import mongoose from 'mongoose';

// Sub-schema: each individual product inside a combo
const ComboItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
  },
  description: {
    type: String,
    default: '',
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  quantity: {
    type: String, // e.g. "1 kg", "5 pcs", "1 hali"
    default: '',
  },
  image: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
});

const ComboSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Combo name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    // Main combo image (Cloudinary URL)
    image: {
      url: { type: String, required: [true, 'Combo image is required'] },
      publicId: { type: String, default: '' },
    },

    // Individual products inside this combo
    items: [ComboItemSchema],

    // Auto-calculated: sum of all item prices (set by pre-save hook)
    totalPrice: {
      type: Number,
      default: 0,
    },

    // Discount
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Auto-calculated discounted price
    discountedPrice: {
      type: Number,
      default: null,
    },

    // Admin who created this combo
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Pre-save: recalculate totalPrice & discountedPrice
ComboSchema.pre('save', function (next) {
  // Sum up all item prices
  if (this.items && this.items.length > 0) {
    this.totalPrice = this.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  } else {
    this.totalPrice = 0;
  }

  // Calculate discounted price
  const pct = Number(this.discountPercentage) || 0;
  if (pct > 0 && pct < 100) {
    this.discountedPrice = Math.round(this.totalPrice * (1 - pct / 100));
  } else {
    this.discountedPrice = null;
  }

  next();
});

// Virtual: final effective price for customer
ComboSchema.virtual('effectivePrice').get(function () {
  return this.discountedPrice !== null ? this.discountedPrice : this.totalPrice;
});

ComboSchema.set('toJSON', { virtuals: true });
ComboSchema.set('toObject', { virtuals: true });

export default mongoose.model('Combo', ComboSchema);
