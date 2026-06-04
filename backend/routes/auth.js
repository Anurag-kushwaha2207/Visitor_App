const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLogin, getMe, sendOTP, verifyOTP, updateProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google-login', googleLogin);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

module.exports = router;
