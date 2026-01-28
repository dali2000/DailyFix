const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User.model');
const { protect } = require('../middleware/auth.middleware');

// Generate JWT Token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { fullName, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ where: { email: email.toLowerCase() } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password,
      provider: 'local'
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        provider: user.provider,
        role: user.role || 'user',
        currency: user.currency || 'EUR',
        theme: user.theme || 'light',
        locale: user.locale || 'fr'
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    
    // If user was created but token generation failed, we should handle it
    // Check if error is related to JWT_SECRET
    if (error.message && error.message.includes('JWT_SECRET')) {
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET is not configured. Please set JWT_SECRET in your .env file.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user exists and get password
    const user = await User.findOne({ 
      where: { email: email.toLowerCase() },
      attributes: { include: ['password'] }
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is Google user
    if (user.provider === 'google' && !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Please login with Google'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        provider: user.provider,
        role: user.role || 'user',
        currency: user.currency || 'EUR',
        theme: user.theme || 'light',
        locale: user.locale || 'fr'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', error.message);
    
    if (error.message && error.message.includes('JWT_SECRET')) {
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET is not configured. Please set JWT_SECRET in your .env file.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/google
// @desc    Register/Login with Google
// @access  Public
router.post('/google', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('sub').notEmpty().withMessage('Google ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, sub } = req.body;

    // Check if user exists
    let user = await User.findOne({ 
      where: {
        [Op.or]: [
          { email: email.toLowerCase() },
          { googleId: sub }
        ]
      }
    });

    if (user) {
      // Update Google ID and provider if not set
      const updates = {};
      if (!user.googleId) {
        updates.googleId = sub;
      }
      if (user.provider !== 'google') {
        updates.provider = 'google';
      }
      if (Object.keys(updates).length > 0) {
        await user.update(updates);
        await user.reload();
      }
    } else {
      // Create new user
      try {
        user = await User.create({
          fullName: name,
          email: email.toLowerCase(),
          googleId: sub,
          provider: 'google'
        });
      } catch (createError) {
        // If creation fails due to unique constraint, try to find user again
        if (createError.name === 'SequelizeUniqueConstraintError') {
          user = await User.findOne({ 
            where: {
              [Op.or]: [
                { email: email.toLowerCase() },
                { googleId: sub }
              ]
            }
          });
          if (user) {
            // Update if found
            await user.update({ 
              googleId: sub,
              provider: 'google',
              fullName: name 
            });
            await user.reload();
          } else {
            throw createError;
          }
        } else {
          throw createError;
        }
      }
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        provider: user.provider,
        role: user.role || 'user',
        currency: user.currency || 'EUR',
        theme: user.theme || 'light',
        locale: user.locale || 'fr'
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle Sequelize errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email ou Google ID existe déjà',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors.map((e) => ({ field: e.path, message: e.message })),
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    if (error.message && error.message.includes('JWT_SECRET')) {
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET is not configured. Please set JWT_SECRET in your .env file.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during Google authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        provider: user.provider,
        role: user.role || 'user',
        currency: user.currency || 'EUR',
        theme: user.theme || 'light',
        locale: user.locale || 'fr'
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

const ALLOWED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CAD', 'TND'];
const ALLOWED_THEMES = ['light', 'dark', 'blue', 'forest', 'purple'];
const ALLOWED_LOCALES = ['fr', 'en', 'ar'];

// @route   PATCH /api/auth/me
// @desc    Update current user profile (e.g. currency, theme, locale)
// @access  Private
router.patch('/me', protect, [
  body('currency').optional().isIn(ALLOWED_CURRENCIES).withMessage('Devise non supportée'),
  body('theme').optional().isIn(ALLOWED_THEMES).withMessage('Thème non supporté'),
  body('locale').optional().isIn(ALLOWED_LOCALES).withMessage('Langue non supportée')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updates = {};
    if (req.body.currency !== undefined) {
      updates.currency = req.body.currency;
    }
    if (req.body.theme !== undefined) {
      updates.theme = req.body.theme;
    }
    if (req.body.locale !== undefined) {
      updates.locale = req.body.locale;
    }

    if (Object.keys(updates).length > 0) {
      await user.update(updates);
      await user.reload();
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        provider: user.provider,
        role: user.role || 'user',
        currency: user.currency || 'EUR',
        theme: user.theme || 'light',
        locale: user.locale || 'fr'
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

