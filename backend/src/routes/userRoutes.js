const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// @route   POST /api/users/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  userController.registerUser
);

// @route   POST /api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  userController.loginUser
);

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, userController.getUserProfile);

// @route   PUT /api/users/me
// @desc    Update user profile
// @access  Private
router.put(
  '/me',
  [
    auth,
    [
      check('name', 'Name is required').optional(),
      check('email', 'Please include a valid email').optional().isEmail(),
      check('password', 'Please enter a password with 6 or more characters').optional().isLength({ min: 6 })
    ]
  ],
  userController.updateUserProfile
);

module.exports = router; 