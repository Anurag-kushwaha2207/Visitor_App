const https = require('https');

/**
 * Sends an email via Resend HTTP API.
 * @param {Object} options - Email options (email, subject, html)
 */
const sendEmail = async (options) => {
  const apiKey = process.env.RESEND_API_KEY || 're_YwfEQT4L_BMQKf3y5s1iYrxQcH3ZztWKR';

  console.log(`\n===================================`);
  console.log(`[RESEND EMAIL SENDING] To: ${options.email}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`===================================\n`);

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      from: 'onboarding@resend.dev',
      to: options.email,
      subject: options.subject,
      html: options.html
    });

    const reqOptions = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(body);
            console.log(`[RESEND SUCCESS] Sent successfully! ID: ${parsed.id}`);
            resolve(parsed);
          } catch (e) {
            resolve({ id: 'success-unknown-body' });
          }
        } else {
          console.error(`[RESEND ERROR] Status ${res.statusCode}: ${body}`);
          reject(new Error(`Resend API returned status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error(`[RESEND REQUEST ERROR]: ${err.message}`);
      reject(err);
    });

    req.write(data);
    req.end();
  });
};

module.exports = sendEmail;

