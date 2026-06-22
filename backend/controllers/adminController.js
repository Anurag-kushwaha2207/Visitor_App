const User = require('../models/User');
const Appointment = require('../models/Appointment');
const CheckLog = require('../models/CheckLog');
const Pass = require('../models/Pass');

// @desc    Get Admin dashboard analytics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Core KPIs
    const totalVisitors = await User.countDocuments({ role: 'visitor' });
    
    // Active today: checked in today and status is 'inside'
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const activeToday = await CheckLog.countDocuments({
      checkInTime: { $gte: startOfToday },
      status: 'inside'
    });

    const pendingApproval = await Appointment.countDocuments({ status: 'pending' });
    
    // Unique departments count
    const departments = await User.distinct('department', { department: { $ne: '' } });
    const totalDepartments = departments.length || 4; // fallback to 4 departments minimum

    // 2. Weekly visitor logs chart data (Monday-Sunday checkins)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const startOfWeek = new Date(today);
    // Adjust to Monday
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(today.getDate() + distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyLogs = await CheckLog.find({
      checkInTime: { $gte: startOfWeek }
    });

    // Group logs by day of week
    const weeklyData = [
      { day: 'Mon', count: 0 },
      { day: 'Tue', count: 0 },
      { day: 'Wed', count: 0 },
      { day: 'Thu', count: 0 },
      { day: 'Fri', count: 0 },
      { day: 'Sat', count: 0 },
      { day: 'Sun', count: 0 }
    ];

    weeklyLogs.forEach(log => {
      const logDay = new Date(log.checkInTime).getDay(); // 0-6
      // Map 0 -> Sun (index 6), 1 -> Mon (index 0), 2 -> Tue (index 1), etc.
      const index = logDay === 0 ? 6 : logDay - 1;
      if (weeklyData[index]) {
        weeklyData[index].count++;
      }
    });

    // 3. Department distribution percentages
    // Get all appointments grouped by host department
    const appointments = await Appointment.find().populate('host', 'department');
    const deptCounts = {};
    let totalAppointmentsWithDept = 0;

    appointments.forEach(app => {
      if (app.host && app.host.department) {
        const dept = app.host.department;
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        totalAppointmentsWithDept++;
      }
    });

    // Format department distribution
    let byDepartment = Object.keys(deptCounts).map(dept => {
      const count = deptCounts[dept];
      const percentage = totalAppointmentsWithDept > 0 ? Math.round((count / totalAppointmentsWithDept) * 100) : 0;
      return { department: dept, percentage };
    });

    // Fallback static mock details if DB is empty to make it visually aesthetic on start
    if (byDepartment.length === 0) {
      byDepartment = [
        { department: 'IT', percentage: 72 },
        { department: 'HR', percentage: 58 },
        { department: 'Finance', percentage: 45 },
        { department: 'Legal', percentage: 33 }
      ];
    }

    res.status(200).json({
      success: true,
      stats: {
        totalVisitors,
        activeToday,
        pendingApproval,
        totalDepartments
      },
      weeklyData,
      byDepartment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get list of all users (for Admin dashboard)
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a user account directly (Admin privilege)
// @route   POST /api/admin/users
// @access  Private (Admin only)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, organization, department } = req.body;

    // Enforce that employees can ONLY register visitors
    if (req.user.role === 'employee' && role !== 'visitor') {
      return res.status(403).json({ success: false, message: 'Employees can only register visitors' });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      // If the email is already registered as a visitor, return that user instead of failing
      if (emailExists.role === 'visitor') {
        return res.status(200).json({
          success: true,
          user: emailExists
        });
      }
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      organization: organization || 'Default Organization',
      department: department || '',
      isVerified: true
    });

    res.status(201).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all check-in/out logs
// @route   GET /api/admin/logs
// @access  Private (Admin or Security)
exports.getAllLogs = async (req, res) => {
  try {
    const logs = await CheckLog.find({})
      .populate('visitor', 'name email phone organization')
      .populate('securityOfficer', 'name')
      .populate({
        path: 'pass',
        populate: {
          path: 'appointment',
          populate: { path: 'host', select: 'name department' }
        }
      })
      .sort({ checkInTime: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a user details (Admin privilege)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, organization, department } = req.body;
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.role = role || user.role;
    user.organization = organization || user.organization;
    user.department = department || user.department;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a user account (Admin privilege)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Clean up associated appointments, passes, and logs
    const appointments = await Appointment.find({ $or: [{ visitor: user._id }, { host: user._id }] });
    const appointmentIds = appointments.map(app => app._id);

    await Pass.deleteMany({ appointment: { $in: appointmentIds } });
    await CheckLog.deleteMany({ visitor: user._id });
    await Appointment.deleteMany({ _id: { $in: appointmentIds } });
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User and all related records deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset database, keep only 4 core users
// @route   POST /api/admin/reset-database
// @access  Private (Admin only)
exports.resetDatabase = async (req, res) => {
  try {
    // 1. Delete all check logs, passes, and appointments
    await CheckLog.deleteMany({});
    await Pass.deleteMany({});
    await Appointment.deleteMany({});

    // 2. Delete all users
    await User.deleteMany({});

    // 3. Create the 4 core users
    const coreUsers = [
      {
        name: 'Suresh Agrawal',
        email: 'admin@visitorpass.com',
        password: 'password123',
        phone: '+91 98765 00001',
        role: 'admin',
        organization: 'VPMS Corporate HQ',
        department: 'Administration',
        isVerified: true
      },
      {
        name: 'Ravi Guard',
        email: 'security@visitorpass.com',
        password: 'password123',
        phone: '+91 98765 00002',
        role: 'security',
        organization: 'VPMS Corporate HQ',
        department: 'Security Desk',
        isVerified: true
      },
      {
        name: 'Priya Sharma',
        email: 'priya@visitorpass.com',
        password: 'password123',
        phone: '+91 98765 00003',
        role: 'employee',
        organization: 'VPMS Corporate HQ',
        department: 'IT',
        isVerified: true
      },
      {
        name: 'Rahul Kumar',
        email: 'anuragkushwaha2207@gmail.com',
        password: 'password123',
        phone: '+91 98765 00006',
        role: 'visitor',
        organization: 'Apex Technical solutions',
        department: '',
        isVerified: true
      }
    ];

    for (const u of coreUsers) {
      await User.create(u);
    }

    res.status(200).json({
      success: true,
      message: 'Database reset successfully. Kept only the 4 core accounts.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
