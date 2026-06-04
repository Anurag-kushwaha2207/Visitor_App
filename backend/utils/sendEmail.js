const nodemailer = require('nodemailer');

/**
 * Sends a real SMTP email.
 * @param {Object} options - Email options (email, subject, html)
 */
const sendEmail = async (options) => {
  let transporter;

  // Check if user set custom SMTP credentials in .env
  if (
    process.env.SMTP_USER && 
    process.env.SMTP_USER !== 'mock_smtp_user' && 
    process.env.SMTP_USER !== ''
  ) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '2525'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Zero-config developer fallback: auto-create ethereal email credentials on the fly
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (err) {
      console.error('Failed to create Ethereal SMTP account, using offline console logger:', err.message);
      // Offline fallback logger
      console.log(`\n===================================`);
      console.log(`[SMTP OFFLINE LOG] To: ${options.email}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Content:\n${options.html}`);
      console.log(`===================================\n`);
      return { messageId: 'offline-mock' };
    }
  }

  const message = {
    from: `"${process.env.SMTP_FROM_NAME || 'VisitorPass System'}" <${process.env.SMTP_FROM || 'noreply@visitorpass.com'}>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  const info = await transporter.sendMail(message);

  console.log(`\n===================================`);
  console.log(`[REAL SMTP SENT] Message ID: ${info.messageId}`);
  console.log(`Recipient: ${options.email}`);
  console.log(`Subject: ${options.subject}`);
  
  // Ethereal developer preview helper link
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`\n📬 CLICK THE LINK BELOW TO VIEW THE REAL RENDERED EMAIL:`);
    console.log(`👉 ${previewUrl}`);
    console.log(`===================================\n`);
  } else {
    console.log(`===================================\n`);
  }

  return info;
};

module.exports = sendEmail;
