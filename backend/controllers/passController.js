const Pass = require('../models/Pass');
const CheckLog = require('../models/CheckLog');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const sendEmail = require('../utils/sendEmail');
const axios = require('axios');

// @desc    Get active pass for current logged-in visitor
// @route   GET /api/passes/my-pass
// @access  Private (Visitor only)
exports.getMyPass = async (req, res) => {
  try {
    // Find appointments for visitor
    const appointments = await Appointment.find({ visitor: req.user.id, status: 'approved' })
      .sort({ scheduledTime: -1 });

    if (appointments.length === 0) {
      return res.status(404).json({ success: false, message: 'No approved appointments found' });
    }

    // Get pass for the latest approved appointment
    const pass = await Pass.findOne({ appointment: appointments[0]._id })
      .populate({
        path: 'appointment',
        populate: [
          { path: 'visitor', select: 'name email phone profilePhoto organization' },
          { path: 'host', select: 'name email department' }
        ]
      });

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Pass not generated for this appointment yet' });
    }

    res.status(200).json({
      success: true,
      pass
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify QR Code or manual Pass Code scan
// @route   POST /api/passes/verify
// @access  Private (Security only)
exports.verifyScan = async (req, res) => {
  try {
    const { passCode, qrCodePayload } = req.body;
    let query = {};
    const payload = qrCodePayload || passCode;

    if (payload) {
      if (typeof payload === 'string' && payload.split('.').length === 3) {
        try {
          const decoded = jwt.verify(payload, process.env.JWT_SECRET || 'vpms_super_secret_key_antigravity_2026');
          query.appointment = decoded.appointmentId;
        } catch (err) {
          return res.status(400).json({ success: false, message: 'Invalid QR signature or expired token' });
        }
      } else {
        if (typeof payload === 'string' && payload.match(/^[0-9a-fA-F]{24}$/)) {
          query._id = payload;
        } else {
          query.passCode = payload;
        }
      }
    } else {
      return res.status(400).json({ success: false, message: 'Please scan a QR code or enter a pass ID' });
    }

    const pass = await Pass.findOne(query).populate({
      path: 'appointment',
      populate: [
        { path: 'visitor', select: 'name email phone profilePhoto organization' },
        { path: 'host', select: 'name email department' }
      ]
    });

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Visitor Pass not found in system' });
    }

    // Check pass status
    if (pass.status === 'revoked') {
      return res.status(400).json({ success: false, message: 'This pass has been revoked by administration' });
    }

    const now = new Date();
    if (now < pass.validFrom) {
      return res.status(400).json({ success: false, message: `Pass is not active yet. Valid from: ${pass.validFrom.toLocaleString()}` });
    }
    if (now > pass.validUntil) {
      pass.status = 'expired';
      await pass.save();
      return res.status(400).json({ success: false, message: 'This pass has expired' });
    }

    const visitor = pass.appointment.visitor;
    const host = pass.appointment.host;

    // Check check-log status (check-in vs check-out toggle)
    const activeLog = await CheckLog.findOne({
      pass: pass._id,
      visitor: visitor._id,
      status: 'inside'
    });

    let action = '';
    let logMessage = '';

    if (!activeLog) {
      // Perform Check-In
      const newLog = await CheckLog.create({
        pass: pass._id,
        visitor: visitor._id,
        securityOfficer: req.user.id,
        status: 'inside',
        checkInTime: new Date()
      });

      // Update pass status to used
      pass.status = 'used';
      await pass.save();

      action = 'checkin';
      logMessage = `${visitor.name} has been successfully checked in.`;
      
      // Send real email alert to host
      const emailHtmlIn = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="text-align: center; border-bottom: 2.5px solid #00c9a7; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="color: #0a1628; margin: 0; font-size: 20px;">Visitor Checked In</h2>
          </div>
          <p style="font-size: 14px; color: #1e293b; line-height: 1.5;">Dear <strong>${host.name}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.5;">Your scheduled visitor has arrived and checked in at the security desk.</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 20px 0;">
            <div style="font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Visitor Details</div>
            <div style="font-size: 15px; font-weight: bold; color: #0a1628; margin-top: 4px;">${visitor.name}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">Company: ${visitor.organization || 'Independent'}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">Check-in Time: ${new Date().toLocaleTimeString()}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">Pass ID: ${pass.passCode}</div>
          </div>
        </div>
      `;
      sendEmail({
        email: host.email,
        subject: `[Arrival Alert] ${visitor.name} has checked in`,
        html: emailHtmlIn
      }).catch(err => console.error("Error sending checkin alert email:", err.message));

      sendEmail({
        email: 'anuragkushwaha2207@gmail.com',
        subject: `[Arrival Alert] ${visitor.name} has entered the campus`,
        html: emailHtmlIn.replace(`Dear <strong>${host.name}</strong>`, `Dear <strong>Administrator</strong>`)
      }).catch(err => console.error("Error sending checkin alert copy:", err.message));

      sendEmail({
        email: visitor.email,
        subject: `[Check-In Confirmation] You have checked in at the security gate`,
        html: emailHtmlIn.replace(`Dear <strong>${host.name}</strong>`, `Dear <strong>${visitor.name}</strong>`)
                         .replace(`Your scheduled visitor has arrived and checked in at the security desk.`, `You have successfully checked in at the security desk.`)
      }).catch(err => console.error("Error sending checkin confirmation to visitor:", err.message));
    } else {
      // Perform Check-Out
      activeLog.checkOutTime = new Date();
      activeLog.status = 'completed';
      await activeLog.save();

      action = 'checkout';
      logMessage = `${visitor.name} has been successfully checked out.`;
      
      // Send real email alert to host
      const emailHtmlOut = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="text-align: center; border-bottom: 2.5px solid #f43f5e; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="color: #0a1628; margin: 0; font-size: 20px;">Visitor Checked Out</h2>
          </div>
          <p style="font-size: 14px; color: #1e293b; line-height: 1.5;">Dear <strong>${host.name}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.5;">Your visitor has checked out at the security desk and departed the facility.</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 20px 0;">
            <div style="font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Visitor Details</div>
            <div style="font-size: 15px; font-weight: bold; color: #0a1628; margin-top: 4px;">${visitor.name}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">Check-out Time: ${new Date().toLocaleTimeString()}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">Pass ID: ${pass.passCode}</div>
          </div>
        </div>
      `;
      sendEmail({
        email: host.email,
        subject: `[Departure Alert] ${visitor.name} has checked out`,
        html: emailHtmlOut
      }).catch(err => console.error("Error sending checkout alert email:", err.message));

      sendEmail({
        email: 'anuragkushwaha2207@gmail.com',
        subject: `[Departure Alert] ${visitor.name} has checked out from the campus`,
        html: emailHtmlOut.replace(`Dear <strong>${host.name}</strong>`, `Dear <strong>Administrator</strong>`)
      }).catch(err => console.error("Error sending checkout alert copy:", err.message));

      sendEmail({
        email: visitor.email,
        subject: `[Check-Out Confirmation] You have checked out`,
        html: emailHtmlOut.replace(`Dear <strong>${host.name}</strong>`, `Dear <strong>${visitor.name}</strong>`)
                          .replace(`Your visitor has checked out at the security desk and departed the facility.`, `You have successfully checked out at the security desk.`)
      }).catch(err => console.error("Error sending checkout confirmation to visitor:", err.message));
    }

    res.status(200).json({
      success: true,
      action,
      message: logMessage,
      visitor: {
        id: visitor._id,
        name: visitor.name,
        email: visitor.email,
        phone: visitor.phone,
        organization: visitor.organization,
        profilePhoto: visitor.profilePhoto
      },
      host: {
        name: host.name,
        department: host.department
      },
      passCode: pass.passCode,
      time: new Date().toLocaleTimeString()
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate a PDF badge for downloading/printing
// @route   GET /api/passes/:id/pdf
// @access  Private
exports.generatePassPDF = async (req, res) => {
  try {
    const idOrCode = req.params.id;
    let query = {};
    if (idOrCode.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = idOrCode;
    } else {
      query.passCode = idOrCode;
    }

    const pass = await Pass.findOne(query).populate({
      path: 'appointment',
      populate: [
        { path: 'visitor', select: 'name email phone organization profilePhoto' },
        { path: 'host', select: 'name email phone department floorNo roomNo seatNo profilePhoto' }
      ]
    });

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    const doc = new PDFDocument({ size: [280, 430], margin: 15 });

    // Stream PDF directly to client response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=pass_${pass.passCode}.pdf`);
    doc.pipe(res);

    // Draw background elements
    doc.rect(0, 0, 280, 75).fill('#0a1628'); // Header background
    doc.rect(0, 410, 280, 20).fill('#00c9a7'); // Footer background

    // Branded Header Title
    doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text('VISITOR PASS', 15, 20);
    doc.fillColor('#00c9a7').fontSize(9).font('Helvetica').text('VisitorPass Management System', 15, 38);

    // Pass ID Label
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text(pass.passCode, 180, 25, { width: 85, align: 'right' });

    // Card content
    const visitor = pass.appointment.visitor;
    const host = pass.appointment.host;

    // Visitor Photo Frame (Real Base64 image rendering if present)
    if (visitor.profilePhoto && visitor.profilePhoto.startsWith('data:image')) {
      try {
        const base64Data = visitor.profilePhoto.replace(/^data:image\/\w+;base64,/, "");
        const imgBuffer = Buffer.from(base64Data, 'base64');
        doc.image(imgBuffer, 95, 90, { width: 90, height: 90 });
      } catch (pdfImgErr) {
        console.error("Error drawing visitor base64 photo in PDF pass:", pdfImgErr.message);
        doc.rect(95, 90, 90, 90).lineWidth(1.5).stroke('#e2e8f0');
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('PHOTO', 95, 130, { width: 90, align: 'center' });
      }
    } else {
      doc.rect(95, 90, 90, 90).lineWidth(1.5).stroke('#e2e8f0');
      doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('PHOTO', 95, 130, { width: 90, align: 'center' });
    }

    // Visitor Details
    doc.fillColor('#0a1628').fontSize(13).font('Helvetica-Bold').text(visitor.name, 15, 195, { align: 'center', width: 250 });
    doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(visitor.organization || 'Independent', 15, 210, { align: 'center', width: 250 });

    // Divider Line
    doc.moveTo(20, 225).lineTo(260, 225).lineWidth(1).stroke('#e2e8f0');

    // Details Grid
    doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('HOST DETAILS', 25, 232);
    doc.fillColor('#0a1628').fontSize(9).font('Helvetica').text(`${host.name}`, 25, 241);
    doc.fontSize(7).text(`Email: ${host.email || 'N/A'}`, 25, 252, { width: 110 });
    doc.text(`Phone: ${host.phone || 'N/A'}`, 25, 262, { width: 110 });

    // Host Profile Photo Thumbnail if present in PDF card
    if (host.profilePhoto && host.profilePhoto.startsWith('data:image')) {
      try {
        const base64Host = host.profilePhoto.replace(/^data:image\/\w+;base64,/, "");
        const hostImgBuffer = Buffer.from(base64Host, 'base64');
        doc.image(hostImgBuffer, 110, 232, { width: 22, height: 22 });
      } catch (hostImgErr) {
        console.error("Error drawing host photo in PDF:", hostImgErr.message);
      }
    }

    doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('VALID UNTIL', 150, 232);
    doc.fillColor('#0a1628').fontSize(9).font('Helvetica').text(new Date(pass.validUntil).toLocaleDateString(), 150, 241);
    doc.fontSize(8).text(new Date(pass.validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 150, 252);

    doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('OFFICE LOCATION', 150, 265);
    const locStr = `Floor ${host.floorNo || 'N/A'} | Room ${host.roomNo || 'N/A'} | Seat ${host.seatNo || 'N/A'}`;
    doc.fillColor('#0a1628').fontSize(7.5).font('Helvetica').text(locStr, 150, 274, { width: 110 });

    doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('PURPOSE', 25, 275);
    doc.fillColor('#0a1628').fontSize(8.5).font('Helvetica').text(pass.appointment.purpose, 25, 284, { width: 110 });

    // Fetch and render real QR code image inside the PDF
    try {
      const response = await axios.get(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pass.passCode)}`, { responseType: 'arraybuffer' });
      const qrImageBuffer = Buffer.from(response.data, 'binary');
      doc.image(qrImageBuffer, 100, 315, { width: 80 });
    } catch (qrErr) {
      console.error("Failed to render QR in PDF:", qrErr.message);
      // Fallback placeholder
      doc.rect(100, 315, 80, 80).dash(3, { space: 3 }).stroke('#94a3b8');
      doc.fillColor('#94a3b8').fontSize(7).text('DIGITAL SECURE', 100, 345, { width: 80, align: 'center' });
      doc.text('QR SECURITY', 100, 355, { width: 80, align: 'center' });
    }

    // End Document
    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
