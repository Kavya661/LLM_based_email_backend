const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Register user
router.post('/register', userController.register);

// Login user
router.post('/login', userController.login);

// Send email between users
router.post('/send-email', auth, userController.sendEmail);

// Get user profile
router.get('/profile', auth, userController.getProfile);

// Update user profile
router.put('/profile', auth, userController.updateProfile);

// Change password
router.put('/change-password', userController.changePassword);

// Test route
router.put('/test', (req, res) => {
  res.json({ message: 'Test PUT route works' });
});

// Logout user
router.post('/logout', auth, userController.logout);

// Logout from all devices
router.post('/logout-all', auth, userController.logoutAll);

module.exports = router;