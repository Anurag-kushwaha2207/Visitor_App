const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Pass = require('../models/Pass');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// @desc    Create a new appointment / pre-registration
// @route   POST /api/appointments
// @access  Private (Visitor or Employee/Admin)
exports.createAppointment = async (req, res) => {
  try {
    const { hostId, purpose, scheduledTime, location } = req.body;

    // Validate host exists and is an employee/admin
    const hostUser = await User.findById(hostId);
    if (!hostUser || (hostUser.role !== 'employee' && hostUser.role !== 'admin')) {
      return res.status(400).json({ success: false, message: 'Invalid host selected' });
    }

    // Set visitor based on authenticated user
    let visitorId = req.user.id;
    
    // Admins or employees can set a different visitor by passing visitorId
    if ((req.user.role === 'admin' || req.user.role === 'employee') && req.body.visitorId) {
      visitorId = req.body.visitorId;
    }

    // Create appointment
    const appointment = await Appointment.create({
      visitor: visitorId,
      host: hostId,
      purpose,
      scheduledTime,
      location: location || hostUser.department || '',
      status: req.user.role === 'employee' && req.user.id === hostId ? 'approved' : 'pending'
    });

    // If auto-approved (created by host for themselves), generate pass
    if (appointment.status === 'approved') {
      const passCode = `VP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const qrPayload = jwt.sign(
        { appointmentId: appointment._id, visitorId },
        process.env.JWT_SECRET || 'vpms_super_secret_key_antigravity_2026'
      );
      
      const validFrom = new Date(scheduledTime);
      const validUntil = new Date(new Date(scheduledTime).setHours(23, 59, 59, 999)); // valid till end of day
      
      await Pass.create({
        appointment: appointment._id,
        passCode,
        qrCodePayload: qrPayload,
        validFrom,
        validUntil,
        status: 'active'
      });
    }

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('visitor', 'name email phone profilePhoto organization')
      .populate('host', 'name email department');

    res.status(201).json({
      success: true,
      appointment: populatedAppointment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get appointments based on user role
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res) => {
  try {
    let query = {};

    // Role-based filtering
    if (req.user.role === 'employee') {
      query.host = req.user.id;
    } else if (req.user.role === 'visitor') {
      query.visitor = req.user.id;
    }

    // Admin & Security see all appointments
    const appointments = await Appointment.find(query)
      .populate('visitor', 'name email phone profilePhoto organization')
      .populate('host', 'name email department')
      .sort({ scheduledTime: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve/Deny appointment
// @route   PUT /api/appointments/:id/status
// @access  Private (Employee or Admin)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'declined'
    
    if (!['approved', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const appointment = await Appointment.findById(req.id || req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check permissions: only the assigned host or an admin can update
    if (req.user.role !== 'admin' && appointment.host.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this appointment' });
    }

    appointment.status = status;
    await appointment.save();

    // If approved, generate digital pass
    if (status === 'approved') {
      // Check if pass already exists for this appointment
      let pass = await Pass.findOne({ appointment: appointment._id });
      
      if (!pass) {
        const passCode = `VP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        const qrPayload = jwt.sign(
          { appointmentId: appointment._id, visitorId: appointment.visitor },
          process.env.JWT_SECRET || 'vpms_super_secret_key_antigravity_2026'
        );
        
        const validFrom = new Date(appointment.scheduledTime);
        const validUntil = new Date(new Date(appointment.scheduledTime).setHours(23, 59, 59, 999));
        
        pass = await Pass.create({
          appointment: appointment._id,
          passCode,
          qrCodePayload: qrPayload,
          validFrom,
          validUntil,
          status: 'active'
        });

        // Send real email notification with pass details
        const visitorUser = await User.findById(appointment.visitor);
        if (visitorUser) {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <div style="text-align: center; border-bottom: 2.5px solid #00c9a7; padding-bottom: 15px; margin-bottom: 20px;">
                <h2 style="color: #0a1628; margin: 0; font-size: 22px;">Digital Visitor Pass Approved</h2>
              </div>
              <p style="font-size: 14px; color: #1e293b; line-height: 1.5;">Dear <strong>${visitorUser.name}</strong>,</p>
              <p style="font-size: 14px; color: #475569; line-height: 1.5;">Your pre-registered appointment request has been approved by your host. Below are your pass details:</p>
              
              <div style="background: #0a1628; border-radius: 8px; padding: 18px; color: #ffffff; margin: 25px 0;">
                <div style="text-transform: uppercase; font-size: 10px; color: #00c9a7; letter-spacing: 1px; font-weight: bold; margin-bottom: 8px;">Visitor Pass</div>
                <div style="font-size: 20px; font-weight: bold; margin: 5px 0;">${visitorUser.name}</div>
                <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 10px 0;" />
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #cbd5e1;">
                  <tr>
                    <td style="padding: 4px 0; font-weight: bold; width: 80px;">Pass Code:</td>
                    <td style="padding: 4px 0; color: #fff; font-family: monospace;">${passCode}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-weight: bold;">Host:</td>
                    <td style="padding: 4px 0; color: #fff;">${req.user.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-weight: bold;">Date:</td>
                    <td style="padding: 4px 0; color: #fff;">${validFrom.toLocaleDateString()}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 25px 0;">
                <a href="http://localhost:5000/api/passes/${pass._id}/pdf" style="background: #00c9a7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Download PDF Pass Badge</a>
              </div>
              
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 25px; margin-bottom: 15px;" />
              <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Show the QR code on your mobile dashboard or print this badge for quick scan check-in.</p>
            </div>
          `;

          await sendEmail({
            email: visitorUser.email,
            subject: `[VisitorPass] Approved: Your digital pass for ${validFrom.toLocaleDateString()}`,
            html: emailHtml
          }).catch(err => console.error("Error sending approved pass email:", err.message));
        }
      }
    }

    res.status(200).json({
      success: true,
      appointment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all employees / hosts for dropdowns
// @route   GET /api/appointments/hosts
// @access  Private
exports.getHosts = async (req, res) => {
  try {
    const hosts = await User.find({ role: { $in: ['employee', 'admin'] } }).select('name email department');
    res.status(200).json({
      success: true,
      hosts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
