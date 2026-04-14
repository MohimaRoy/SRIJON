import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ✅ PROTECT (updated with cookie support)
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to access this resource'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`[AUTH] Decoded User: ${decoded.email} (${decoded.role})`);
    
    // Attach decoded token directly (Stateless JWT)
    req.user = decoded;
    next();
  } catch (error) {
    console.error(`[AUTH ERROR] ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};



// ✅ Generic REQUIRE ROLE — pass an array of allowed roles
export const requireRole = (...allowedRoles) => async (req, res, next) => {
  try {
    const freshUser = await User.findById(req.user.id || req.user._id).select('role roles sellerStatus');
    if (!freshUser) return res.status(401).json({ success: false, message: 'User not found' });

    const userRole = freshUser.role;
    const userRoles = freshUser.roles || [];
    const hasRole = allowedRoles.some(r => r === userRole || userRoles.includes(r));

    if (!hasRole) {
      return res.status(403).json({ success: false, message: 'Access denied: insufficient permissions' });
    }
    req.user.role = userRole;
    req.user.roles = userRoles;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Verification Error' });
  }
};

// ✅ ADMIN
export const requireAdmin = requireRole('admin');

// ✅ CUSTOMER
export const requireCustomer = requireRole('customer');

// ✅ SELLER (Legacy - mapping to admin for order management in new architecture)
export const requireSeller = requireAdmin;


// ✅ PRODUCT OWNER (Admins can manage any, or their own)
export const requireProductOwner = async (req, res, next) => {
  try {
    const Product = (await import('../models/Product.js')).default;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const isAdmin = req.user.role === 'admin' || req.user.roles?.includes('admin');
    // If not admin, they shouldn't even be here for products, but let's keep it safe
    if (!isAdmin && product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    req.product = product;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};