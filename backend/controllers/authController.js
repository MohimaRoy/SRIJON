import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';
import admin from 'firebase-admin';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  }
} catch (error) {
  console.log('Firebase initialized failed/missing config:', error.message);
}

// Generate JWT Token with full role payload
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.roles?.includes('admin') ? 'admin' : 'customer',
      roles: user.roles || ['customer'],
      isVerified: user.isVerified || false
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Send token response — JWT is sent ONLY via HttpOnly cookie (never in body)
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user);

  const isProduction = process.env.NODE_ENV === 'production';

  const options = {
    httpOnly: true,   // JS cannot read this cookie → XSS-safe
    secure: isProduction, // HTTPS-only in production
    sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-origin cookies (Vercel)
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.roles?.includes('admin') ? 'admin' : 'customer',
        roles: user.roles || ['customer'],
        profilePicture: user.profilePicture || '',
        isVerified: user.isVerified || false
      }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please login or use a different email.'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    
    // Set OTP expiration (10 minutes)
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Create user with OTP fields (not verified yet)
    const user = await User.create({
      name,
      email,
      password,
      isVerified: false,
      otpHash,
      otpExpiresAt,
      otpAttempts: 0
    });

    // Send OTP email
    try {
      const { sendOTPEmail } = await import('../utils/emailService.js');
      await sendOTPEmail(user.email, user.name, otp);
      console.log('OTP email sent to:', user.email);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Delete user if email fails
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }

    // Return success WITHOUT token (user must verify OTP first)
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for the verification code.',
      email: user.email
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP'
      });
    }

    // Find user with OTP fields
    const user = await User.findOne({ email }).select('+otpHash +otpExpiresAt +otpAttempts');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified. Please login.'
      });
    }

    // Check if OTP exists
    if (!user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.'
      });
    }

    // Check if OTP has expired
    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Check max attempts
    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, user.otpHash);

    if (!isMatch) {
      // Increment attempts
      user.otpAttempts += 1;
      await user.save({ validateBeforeSave: false });

      return res.status(401).json({
        success: false,
        message: `Invalid OTP. ${5 - user.otpAttempts} attempts remaining.`
      });
    }

    // OTP is valid - verify user
    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = undefined;
    await user.save({ validateBeforeSave: false });

    // Send registration complete email (non-blocking)
    try {
      const { sendRegistrationCompleteEmail } = await import('../utils/emailService.js');
      await sendRegistrationCompleteEmail(user.email, user.name);
      console.log('Registration complete email sent to:', user.email);
    } catch (emailError) {
      console.error('Failed to send registration complete email:', emailError);
      // Don't fail verification if email fails
    }

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
    });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address'
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified. Please login.'
      });
    }

    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    
    // Set OTP expiration (10 minutes)
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Update user with new OTP
    user.otpHash = otpHash;
    user.otpExpiresAt = otpExpiresAt;
    user.otpAttempts = 0; // Reset attempts
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    try {
      const { sendOTPEmail } = await import('../utils/emailService.js');
      await sendOTPEmail(user.email, user.name, otp);
      console.log('New OTP email sent to:', user.email);

      res.status(200).json({
        success: true,
        message: 'New verification code sent to your email'
      });
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP resend'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if email is verified (backward compatibility: undefined/null treated as verified)
    if (user.isVerified === false) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in. Check your inbox for the verification code.'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Public (graceful check)
export const getMe = async (req, res) => {
  try {
    let token;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token || token === 'none') {
      return res.status(200).json({ success: true, user: null });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id || decoded._id);

    if (!user) {
      return res.status(200).json({ success: true, user: null });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role === 'admin' || user.roles?.includes('admin') ? 'admin' : 'customer',
        roles: user.roles || ['customer'],
        profilePicture: user.profilePicture || '',
        isVerified: user.isVerified || false
      }
    });
  } catch (error) {
    // If token is invalid or expired, just return unauthenticated smoothly
    // Console error no longer spammed with 401
    return res.status(200).json({ success: true, user: null });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', 'none', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 10 * 1000 // 10 seconds — effectively clears the cookie
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email address'
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    try {
      // Import email service dynamically
      const { sendPasswordResetEmail } = await import('../utils/emailService.js');
      
      const emailResult = await sendPasswordResetEmail(user.email, resetUrl);

      if (emailResult.success) {
        res.status(200).json({
          success: true,
          message: 'Password reset email sent successfully'
        });
      } else {
        // If email fails, remove reset token
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(500).json({
          success: false,
          message: 'Email could not be sent. Please contact support.'
        });
      }
    } catch (error) {
      console.error('Email error:', error);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email service error. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Hash token to match DB storage
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find the user with matching token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
};

// @desc    Google OAuth Login
// @route   POST /api/auth/google
// @access  Public
export const loginWithGoogle = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(501).json({ success: false, message: 'Google Login not configured on server (Missing GOOGLE_CLIENT_ID).' });
    }
    
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
        authProvider: 'google',
        isVerified: true
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(400).json({ success: false, message: 'Google authentication failed' });
  }
};

// @desc    Phone OTP Login (Firebase Verification)
// @route   POST /api/auth/phone
// @access  Public
export const loginWithPhone = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      return res.status(501).json({ success: false, message: 'Phone Login not configured on server (Missing FIREBASE_SERVICE_ACCOUNT).' });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phone = decodedToken.phone_number;

    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        name: 'New User',
        phone,
        authProvider: 'phone',
        isVerified: true
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Phone auth error:', error);
    res.status(400).json({ success: false, message: 'Phone authentication failed' });
  }
};
