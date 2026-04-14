// ═══════════════════════════════════════════════════════════════════════════
// STEP 1 — Load environment variables FIRST, before anything else.
// dotenv.config() must run before any module reads process.env.*
// ═══════════════════════════════════════════════════════════════════════════
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import profileRoutes from './routes/profile.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import adminRoutes from './routes/admin.js';
import orderRoutes from './routes/order.js';
import reviewRoutes from './routes/review.js';
import comboRoutes from './routes/combo.js';

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2 — Create Express app
// ═══════════════════════════════════════════════════════════════════════════
const app = express();

// Trust Vercel's reverse proxy so Express sees correct protocol for Secure cookies
app.set('trust proxy', 1);

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3 — MongoDB connection (serverless-safe with isConnected guard)
// ═══════════════════════════════════════════════════════════════════════════
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return; // Reuse existing connection (critical for Vercel serverless)
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = db.connections[0].readyState === 1;
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    isConnected = false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 4 — Global Middleware
// ALL middleware must be registered BEFORE any routes.
// ═══════════════════════════════════════════════════════════════════════════

// 4a. CORS — must be first middleware so preflight OPTIONS requests are handled
app.use(cors({
  origin: process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:5173']
    : ['http://localhost:5173'],
  credentials: true,             // Required for HttpOnly cookie cross-origin
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 4b. Body parsers — must exist before any route reads req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4c. Cookie parser — must exist before any route reads req.cookies
app.use(cookieParser());

// Initialize MongoDB connection once at startup
connectDB();

// ═══════════════════════════════════════════════════════════════════════════
// STEP 5 — Root info route
// ═══════════════════════════════════════════════════════════════════════════
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AggriGo Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      upload: '/api/upload/*',
      profile: '/api/profile/*',
      products: '/api/products/*',
      cart: '/api/cart/*',
    },
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// STEP 6 — API Routes
// ALL routes are registered AFTER middleware — in one place, in order.
// cartRoutes is now correctly placed here (was wrongly at top of file before).
// ═══════════════════════════════════════════════════════════════════════════
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/combos', comboRoutes);

// ═══════════════════════════════════════════════════════════════════════════
// STEP 7 — Health check route
// ═══════════════════════════════════════════════════════════════════════════
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AggriGo API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// STEP 8 — Error Handling (must be LAST — after all routes)
// ═══════════════════════════════════════════════════════════════════════════

// Global error handler (catches errors passed via next(err))
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// 404 handler — catches any request that didn't match a route above
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// STEP 9 — Start server (local development only; Vercel uses export default)
// ═══════════════════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 MongoDB: ${process.env.MONGODB_URI ? 'URI loaded ✅' : 'URI MISSING ❌'}`);
    console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your-super-secret-jwt-key-change-this-in-production' ? 'Configured ✅' : 'USING PLACEHOLDER ❌'}`);
  });
}

// Export for Vercel serverless functions
export default app;