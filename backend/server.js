const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const appointmentRoutes = require('./routes/appointments');
const passRoutes = require('./routes/passes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/passes', passRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'Server is healthy' });
});

app.get('/api/info/faq', (req, res) => {
  res.status(200).json({
    success: true,
    faqs: [
      {
        q: "How do I pre-register for a visit?",
        a: "Go to the 'Pre-register' tab in your visitor panel, choose your host employee, scheduled date/time, purpose, and submit. Your host will receive an email and review the request."
      },
      {
        q: "Where can I find my digital pass?",
        a: "Once your host approves your visit request, your pass containing a secure, cryptographic QR code will be generated instantly and shown on your 'Digital Pass' tab. You will also receive a copy via email."
      },
      {
        q: "How do I check-in at the security desk?",
        a: "Open the 'Digital Pass' tab on your phone and present the QR code to the security guard. They will scan it using their dashboard camera to approve your entry. You can also print the downloaded PDF pass badge."
      },
      {
        q: "Do I need to check out when leaving?",
        a: "Yes. Show your QR code pass to the security guard at the exit gate. They will scan it to log your departure time. This helps us maintain an accurate roll of currently inside visitors."
      },
      {
        q: "Why is my pass marked as 'Expired'?",
        a: "Passes are valid only for the day of the scheduled visit. If your visit date has passed or your departure has been checked out, the pass automatically expires to prevent duplicate entries."
      }
    ]
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
