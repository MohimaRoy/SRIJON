import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { createBkashPayment, executeBkashPayment } from '../utils/bkash.js';
import { createNagadPayment, verifyNagadPayment } from '../utils/nagad.js';
import { createRocketPayment, verifyRocketPayment } from '../utils/rocket.js';

// @desc    Create new orders from cart
// @route   POST /api/orders
// @access  Private (Buyer)
export const createOrder = async (req, res, next) => {
  try {
    const { paymentMethod, deliveryAddress } = req.body;
    const buyerId = req.user._id;

    // 1. Get user's cart
    const cart = await Cart.findOne({ user: buyerId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // 1.1 Check stock for all items first (skip combo items)
    for (const item of cart.items) {
      if (item.isCombo) continue; // combo items don't have individual stock attached directly to the cart item right now
      
      if (!item.product) {
        return res.status(404).json({ success: false, message: `Product ${item.name} not found` });
      }
      if (item.product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}, Requested: ${item.quantity}` 
        });
      }
    }

    // 2. Group cart items by seller (Combos have no seller, we group them into a 'combo' bucket or 'admin' bucket)
    // Actually, our Order schema requires a `seller` reference. Since Admin creates combos, we must pass either an Admin ID or modify the grouping.
    // For simplicity, we can fetch an admin to assign combo orders to, or use a system ID. Let's find an admin user.
    let adminUser = null;
    if (cart.items.some(item => item.isCombo)) {
      const AdminModels = await import('../models/User.js');
      adminUser = await AdminModels.default.findOne({ role: 'admin' });
    }

    const itemsBySeller = {};
    cart.items.forEach((item) => {
      let sellerId = item.seller ? item.seller.toString() : null;
      
      if (item.isCombo && !sellerId && adminUser) {
          sellerId = adminUser._id.toString(); 
      }

      if (!sellerId) return; // Parachute

      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = {
          items: [],
          totalAmount: 0,
        };
      }
      itemsBySeller[sellerId].items.push({
        product: item.product ? item.product._id : null,
        comboId: item.comboId ? item.comboId._id : null,
        isCombo: item.isCombo,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit,
      });
      itemsBySeller[sellerId].totalAmount += item.price * item.quantity;
    });

    const createdOrders = [];

    // 3. Create an order for each seller
    for (const sellerId in itemsBySeller) {
      const sellerData = itemsBySeller[sellerId];
      
      const orderData = {
        buyer: buyerId,
        seller: sellerId,
        products: sellerData.items,
        totalAmount: sellerData.totalAmount,
        paymentMethod,
        deliveryAddress,
      };

      if (paymentMethod === 'cod') {
        orderData.paymentStatus = 'pending';
        orderData.orderStatus = 'confirmed'; // COD is auto-confirmed
      } else {
        orderData.paymentStatus = 'pending';
        orderData.orderStatus = 'pending'; // Waiting for payment
      }

      const newOrder = await Order.create(orderData);
      createdOrders.push(newOrder);
    }

    // 4. Handle Payment Gateway Init for non-COD (We combine the total for the gateway)
    let paymentGatewayUrl = null;
    if (paymentMethod !== 'cod') {
        // Find single generic order or use order group ID strategy
        // Simplified for this phase: we return the first order ID as reference or combined
        const combinedTotal = cart.totalAmount;
        const mainOrderId = createdOrders.map(o => o._id.toString()).join(',');

        if (paymentMethod === 'bkash') {
            const bkashRes = await createBkashPayment(combinedTotal, mainOrderId);
            paymentGatewayUrl = bkashRes.bkashURL;
        } else if (paymentMethod === 'nagad') {
            const nagadRes = await createNagadPayment(combinedTotal, mainOrderId);
            paymentGatewayUrl = nagadRes.callBackUrl;
        } else if (paymentMethod === 'rocket') {
            const rocketRes = await createRocketPayment(combinedTotal, mainOrderId);
            paymentGatewayUrl = rocketRes.callBackUrl;
        }
    }

    // 5. Reduce stock for each product immediately on order placement (Skip combos)
    for (const item of cart.items) {
      if (item.isCombo) continue;
      
      if (item.product && item.product._id) {
        await Product.findByIdAndUpdate(item.product._id, {
          $inc: { stock: -item.quantity, totalSold: item.quantity }
        });
      }
    }

    // 6. Clear cart after successful order creation
    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Orders created successfully',
      orders: createdOrders,
      paymentGatewayUrl,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders (Buyer)
// @route   GET /api/orders/my-orders
// @access  Private (Buyer)
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('seller', 'name email address')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (for Admin/Seller)
// @route   GET /api/orders/seller
// @access  Private (Seller/Admin)
export const getSellerOrders = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.roles?.includes('admin');
    
    // Admins see everything, others only their own (if any legacy sellers exist)
    const filter = isAdmin ? {} : { seller: req.user._id };

    const orders = await Order.find(filter)
      .populate('buyer', 'name email phone')
      .populate('seller', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Seller/Admin)
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    
    // Validate order status
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(orderStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Ensure seller owns the order
    if (order.seller.toString() !== req.user._id.toString() && !req.user.roles.includes('admin')) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    // If order was cancelled, return stock back
    if (orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
        for (const item of order.products) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity, totalSold: -item.quantity }
            });
        }
    }

    order.orderStatus = orderStatus;
    
    // Automatically set payment status to completed if delivered and COD
    if (orderStatus === 'delivered' && order.paymentMethod === 'cod') {
        order.paymentStatus = 'completed';
    }

    await order.save();

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify mock payment (for dev/demo purposes)
// @route   POST /api/orders/verify-payment
// @access  Private
export const verifyPayment = async (req, res, next) => {
    try {
        const { orderIds, transactionId, paymentMethod } = req.body; // orderIds could be comma separated
        
        let txId = transactionId || `TX-${Date.now()}`;
        
        if (paymentMethod === 'bkash') {
           const resMock = await executeBkashPayment(txId);
           txId = resMock.trxID;
        } else if (paymentMethod === 'nagad') {
           const resMock = await verifyNagadPayment(txId);
           txId = resMock.issuerPaymentRefNo;
        } else if (paymentMethod === 'rocket') {
           const resMock = await verifyRocketPayment(txId);
           txId = resMock.issuerPaymentRefNo;
        }

        const idsArray = orderIds.split(',');

        await Order.updateMany(
            { _id: { $in: idsArray } },
            { 
                $set: { 
                    paymentStatus: 'completed', 
                    orderStatus: 'confirmed',
                    transactionId: txId
                } 
            }
        );

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully'
        });

    } catch(error) {
        next(error);
    }
}
