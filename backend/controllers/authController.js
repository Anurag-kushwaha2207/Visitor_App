const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Helper to sign JWT
const getSignedJwtToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'vpms_super_secret_key_antigravity_2026', {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    console.log('REGISTRATION REQUEST RECEIVED. Headers:', req.headers);
    console.log('REGISTRATION REQUEST RECEIVED. Body keys:', Object.keys(req.body || {}));
    const { name, email, password, phone, role, organization, department } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Check phone unique
    user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }

    // Retrieve profilePhoto Base64 string from request body
    const profilePhoto = req.body.profilePhoto || '';

    // Create user
    user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'visitor',
      organization: organization || 'Default Organization',
      department: department || '',
      profilePhoto
    });

    const token = getSignedJwtToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organization: user.organization,
        department: user.department,
        profilePhoto: user.profilePhoto,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = getSignedJwtToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organization: user.organization,
        department: user.department,
        profilePhoto: user.profilePhoto,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organization: user.organization,
        department: user.department,
        profilePhoto: user.profilePhoto,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send OTP to user for verification (Bonus Challenge)
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP fields on user document
    user.otpCode = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    await user.save();

    console.log(`\n🔑 [OTP SECURITY CODE] Generated for ${user.email}: ${otp}\n`);

    // Compile beautiful HTML email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; border-bottom: 2.5px solid #00c9a7; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #0a1628; margin: 0; font-size: 22px;">VisitorPass Management</h2>
        </div>
        <p style="font-size: 14px; color: #1e293b; line-height: 1.5;">Dear <strong>${user.name}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">You are receiving this email because you requested a security verification code to access your digital visitor panel.</p>
        
        <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin: 25px 0;">
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px;">Verification Code</div>
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 5px; color: #0a1628;">${otp}</span>
        </div>

        <p style="font-size: 13px; color: #f43f5e; font-weight: 500;">Please note that this code is temporary and will expire in 10 minutes.</p>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 15px;">If you did not request this OTP code, please disregard this email or contact corporate administration.</p>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 25px; margin-bottom: 15px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">This is an automated system email. Please do not reply directly.</p>
      </div>
    `;

    // Send real SMTP email
    await sendEmail({
      email: user.email,
      subject: `[VisitorPass] Verification OTP Code: ${otp}`,
      html: emailHtml
    });

    res.status(200).json({
      success: true,
      message: 'Verification OTP has been sent to your email address'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP code
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      otpCode: otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Clear OTP fields
    user.otpCode = null;
    user.otpExpires = null;
    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, phone, floorNo, roomNo, seatNo, profilePhoto } = req.body;

    user.name = name || user.name;
    user.phone = phone || user.phone;
    
    if (floorNo !== undefined) user.floorNo = floorNo;
    if (roomNo !== undefined) user.roomNo = roomNo;
    if (seatNo !== undefined) user.seatNo = seatNo;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organization: user.organization,
        department: user.department,
        floorNo: user.floorNo,
        roomNo: user.roomNo,
        seatNo: user.seatNo,
        profilePhoto: user.profilePhoto,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Google Sign-In or Registration on-the-fly
// @route   POST /api/auth/google-login
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const { name, email, profilePhoto } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email' });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      // Create user on-the-fly as visitor
      user = await User.create({
        name: name || 'Google User',
        email,
        password: 'password123', // temp fallback
        phone: `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`, // temp fallback
        role: 'visitor',
        organization: 'Google Account',
        profilePhoto: profilePhoto || '',
        isVerified: true
      });
    }

    const token = getSignedJwtToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organization: user.organization,
        department: user.department,
        profilePhoto: user.profilePhoto,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
