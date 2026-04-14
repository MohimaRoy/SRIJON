import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false,   // null for combo items
    default: null,
  },
  comboId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Combo',
    default: null,
  },
  isCombo: { type: Boolean, default: false },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,   // null for combo items
    default: null,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  originalPrice: {
    type: Number,
  },
  discountPercentage: {
    type: Number,
    default: 0,
  },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  unit: { type: String, default: '' },
});

const CartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [CartItemSchema],
    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

CartSchema.pre('save', function (next) {
  this.totalAmount = this.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  next();
});

export default mongoose.model('Cart', CartSchema);