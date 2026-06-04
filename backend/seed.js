const mongoose = require('mongoose');
const dns = require('node:dns');

// Force Node.js DNS to use public DNS servers to resolve MongoDB Atlas SRV correctly on Windows
dns.setServers(['1.1.1.1', '8.8.8.8']);
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const Pass = require('./models/Pass');
const CheckLog = require('./models/CheckLog');
const jwt = require('jsonwebtoken');

const path = require('path');
// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vpms');
    console.log('Connected to database for seeding...');

    // Clear existing data
    await User.deleteMany();
    await Appointment.deleteMany();
    await Pass.deleteMany();
    await CheckLog.deleteMany();
    console.log('Cleared existing data.');

    // 1. Create Users
    console.log('Seeding users...');
    
    // Passwords are pre-hashed automatically by Pre-save hook, but let's just write raw passwords, User.create will handle hashing
    const admin = await User.create({
      name: 'Suresh Agrawal',
      email: 'admin@visitorpass.com',
      password: 'password123',
      phone: '+91 98765 00001',
      role: 'admin',
      organization: 'VPMS Corporate HQ',
      department: 'Administration',
      isVerified: true
    });

    const security = await User.create({
      name: 'Ravi Guard',
      email: 'security@visitorpass.com',
      password: 'password123',
      phone: '+91 98765 00002',
      role: 'security',
      organization: 'VPMS Corporate HQ',
      department: 'Security Desk',
      isVerified: true
    });

    const host1 = await User.create({
      name: 'Priya Sharma',
      email: 'priya@visitorpass.com',
      password: 'password123',
      phone: '+91 98765 00003',
      role: 'employee',
      organization: 'VPMS Corporate HQ',
      department: 'IT',
      isVerified: true
    });

    const host2 = await User.create({
      name: 'Mohit Gupta',
      email: 'mohit@visitorpass.com',
      password: 'password123',
      phone: '+91 98765 00004',
      role: 'employee',
      organization: 'VPMS Corporate HQ',
      department: 'HR',
      isVerified: true
    });

    const host3 = await User.create({
      name: 'Anjali Shah',
      email: 'anjali@visitorpass.com',
      password: 'password123',
      phone: '+91 98765 00005',
      role: 'employee',
      organization: 'VPMS Corporate HQ',
      department: 'Finance',
      isVerified: true
    });

    const visitor1 = await User.create({
      name: 'Rahul Kumar',
      email: 'anuragkushwaha2207@gmail.com', // standard visitor
      password: 'password123',
      phone: '+91 98765 00006',
      role: 'visitor',
      organization: 'Apex Technical solutions',
      department: '',
      isVerified: true
    });

    const visitor2 = await User.create({
      name: 'Anita Singh',
      email: 'anita@visitorpass.com',
      password: 'password123',
      phone: '+91 98765 00007',
      role: 'visitor',
      organization: 'Future Labs Corp',
      department: '',
      isVerified: true
    });

    const visitor3 = await User.create({
      name: 'Vikas Patel',
      email: 'vikas@visitorpass.com',
      password: 'password123',
      phone: '+91 98765 00008',
      role: 'visitor',
      organization: 'PQR Logistics Ltd',
      department: '',
      isVerified: true
    });

    const visitor4 = await User.create({
      name: 'Neha Mehta',
      email: 'neha@visitorpass.com',
      password: 'password123',
      phone: '+91 98765 00009',
      role: 'visitor',
      organization: 'LMN HR Consultants',
      department: '',
      isVerified: true
    });

    console.log('Seeded Users successfully.');

    // 2. Create Appointments, Passes & Logs
    console.log('Seeding appointments and logs...');

    // Date references
    const today = new Date();
    
    // Setup helper to create appointment + pass + log
    const createCompletedLog = async (visitor, host, purpose, dayOffset, hourOffsetIn, hourOffsetOut, department) => {
      const scheduledTime = new Date(today);
      scheduledTime.setDate(today.getDate() - dayOffset);
      scheduledTime.setHours(hourOffsetIn, 0, 0, 0);

      const app = await Appointment.create({
        visitor: visitor._id,
        host: host._id,
        purpose,
        scheduledTime,
        status: 'approved',
        location: `Floor ${Math.floor(Math.random() * 5) + 1}, Room ${Math.floor(100 + Math.random() * 400)}`
      });

      const passCode = `VP-${Math.floor(100000 + Math.random() * 900000)}`;
      const qrPayload = jwt.sign(
        { appointmentId: app._id, visitorId: visitor._id },
        process.env.JWT_SECRET || 'vpms_super_secret_key_antigravity_2026'
      );

      const validFrom = new Date(scheduledTime);
      const validUntil = new Date(new Date(scheduledTime).setHours(23, 59, 59, 999));

      const pass = await Pass.create({
        appointment: app._id,
        passCode,
        qrCodePayload: qrPayload,
        validFrom,
        validUntil,
        status: 'used'
      });

      const checkInTime = new Date(scheduledTime);
      const checkOutTime = new Date(scheduledTime);
      checkOutTime.setHours(hourOffsetOut);

      await CheckLog.create({
        pass: pass._id,
        visitor: visitor._id,
        securityOfficer: security._id,
        status: 'completed',
        location: 'Main Entrance',
        checkInTime,
        checkOutTime
      });
    };

    // Seed logs for historical charts (weekly data)
    // Adjust offsets to fit in the current week (from Monday onwards)
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
    
    // We want logs distributed throughout this week (or past week if early in the week)
    // Monday
    await createCompletedLog(visitor1, host1, 'Developer Interview', 1, 9, 12, 'IT');
    await createCompletedLog(visitor2, host2, 'Recruitment Meeting', 1, 10, 11, 'HR');
    
    // Tuesday
    await createCompletedLog(visitor3, host3, 'Billing Audit', 0, 11, 13, 'Finance');
    await createCompletedLog(visitor4, host2, 'Consulting Vendor', 0, 14, 16, 'HR');
    
    // Wednesday (if today or past)
    await createCompletedLog(visitor1, host1, 'Contract Discussion', 2, 9, 10, 'IT');

    // Create current active visitor inside today
    const appActive = await Appointment.create({
      visitor: visitor1._id,
      host: host1._id,
      purpose: 'Technical Discussion',
      scheduledTime: new Date(new Date().setHours(9, 30, 0, 0)),
      status: 'approved',
      location: 'Floor 3, IT Lab'
    });

    const passActive = await Pass.create({
      appointment: appActive._id,
      passCode: 'VP-2451',
      qrCodePayload: jwt.sign(
        { appointmentId: appActive._id, visitorId: visitor1._id },
        process.env.JWT_SECRET || 'vpms_super_secret_key_antigravity_2026'
      ),
      validFrom: new Date(new Date().setHours(9, 0, 0, 0)),
      validUntil: new Date(new Date().setHours(18, 0, 0, 0)),
      status: 'active'
    });

    await CheckLog.create({
      pass: passActive._id,
      visitor: visitor1._id,
      securityOfficer: security._id,
      status: 'inside',
      location: 'Gate A',
      checkInTime: new Date(new Date().setHours(9, 30, 0, 0))
    });

    // Create one pending appointment needing action
    await Appointment.create({
      visitor: visitor2._id,
      host: host2._id,
      purpose: 'Final Onboarding Round',
      scheduledTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // tomorrow
      status: 'pending'
    });

    console.log('Seeded database successfully with realistic demo datasets.');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
