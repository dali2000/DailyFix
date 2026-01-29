const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User.model');
const { protect } = require('../middleware/auth.middleware');
const { sendPasswordResetEmail } = require('../utils/mailer');

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
      user: toUserJson(user)
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
      user: toUserJson(user)
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
      user: toUserJson(user)
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
// @desc    Get current user (inclut height, weight, gender pour conseils personnalisés)
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      user: toUserJson(user)
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

// @route   POST /api/auth/forgot-password
// @desc    Envoie un email avec le lien de réinitialisation du mot de passe
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Email invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const email = (req.body.email || '').toLowerCase().trim();
    const user = await User.findOne({ where: { email, provider: 'local' } });
    // Toujours renvoyer succès pour ne pas révéler si l'email existe
    const message = 'Si un compte existe avec cet email, vous recevrez un lien pour réinitialiser votre mot de passe.';
    if (!user) {
      return res.json({ success: true, message });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
    await user.update({
      resetPasswordToken: token,
      resetPasswordExpires: expires
    });
    const frontendUrl = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:4200').replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, resetUrl, user.fullName);
    return res.json({ success: true, message });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Réinitialise le mot de passe avec le token reçu par email
// @access  Public
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token requis'),
  body('newPassword').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() }
      }
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Lien invalide ou expiré. Veuillez redemander une réinitialisation.'
      });
    }
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save(); // beforeUpdate hook hash le password
    return res.json({ success: true, message: 'Mot de passe mis à jour. Vous pouvez vous connecter.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

function toUserJson(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    provider: user.provider,
    role: user.role || 'user',
    currency: user.currency || 'EUR',
    theme: user.theme || 'light',
    locale: user.locale || 'fr',
    profilePhoto: user.profilePhoto || null,
    height: user.height != null ? Number(user.height) : null,
    weight: user.weight != null ? Number(user.weight) : null,
    gender: user.gender || null
  };
}

const ALLOWED_GENDERS = ['male', 'female', 'other'];

// @route   PATCH /api/auth/me
// @desc    Update current user profile (fullName, profilePhoto, currency, theme, locale, height, weight, gender). Email non modifiable.
// @access  Private
router.patch('/me', protect, [
  body('fullName').optional().trim().isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  body('currency').optional().isIn(ALLOWED_CURRENCIES).withMessage('Devise non supportée'),
  body('theme').optional().isIn(ALLOWED_THEMES).withMessage('Thème non supporté'),
  body('locale').optional().isIn(ALLOWED_LOCALES).withMessage('Langue non supportée'),
  body('profilePhoto').optional(),
  body('height').optional().isFloat({ min: 50, max: 250 }).withMessage('Taille invalide (50–250 cm)'),
  body('weight').optional().isFloat({ min: 20, max: 300 }).withMessage('Poids invalide (20–300 kg)'),
  body('gender').optional().isIn(ALLOWED_GENDERS).withMessage('Genre non supporté')
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
    if (req.body.fullName !== undefined) {
      updates.fullName = req.body.fullName.trim();
    }
    if (req.body.currency !== undefined) {
      updates.currency = req.body.currency;
    }
    if (req.body.theme !== undefined) {
      updates.theme = req.body.theme;
    }
    if (req.body.locale !== undefined) {
      updates.locale = req.body.locale;
    }
    if (req.body.profilePhoto !== undefined) {
      updates.profilePhoto = req.body.profilePhoto || null;
    }
    if (req.body.height !== undefined) {
      updates.height = req.body.height == null || req.body.height === '' ? null : req.body.height;
    }
    if (req.body.weight !== undefined) {
      updates.weight = req.body.weight == null || req.body.weight === '' ? null : req.body.weight;
    }
    if (req.body.gender !== undefined) {
      updates.gender = req.body.gender == null || req.body.gender === '' ? null : req.body.gender;
    }

    if (Object.keys(updates).length > 0) {
      await user.update(updates);
      await user.reload();
    }

    res.json({
      success: true,
      user: toUserJson(user)
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

