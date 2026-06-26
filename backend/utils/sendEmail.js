const https = require('https');

const sendEmail = async (options) => {
  const emailjsServiceId = process.env.EMAILJS_SERVICE_ID;
  const emailjsTemplateId = process.env.EMAILJS_TEMPLATE_ID;
  const emailjsPublicKey = process.env.EMAILJS_PUBLIC_KEY;
  const emailjsPrivateKey = process.env.EMAILJS_PRIVATE_KEY;
  const brevoKey = process.env.BREVO_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  if (emailjsServiceId && emailjsTemplateId && emailjsPublicKey) {
    console.log(`Sending EmailJS email to: ${options.email}`);

    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        service_id: emailjsServiceId,
        template_id: emailjsTemplateId,
        user_id: emailjsPublicKey,
        accessToken: emailjsPrivateKey || undefined,
        template_params: {
          to_email: options.email,
          email_subject: options.subject,
          email_html: options.html
        }
      });

      const reqOptions = {
        hostname: 'api.emailjs.com',
        port: 443,
        path: '/api/v1.0/email/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      const req = https.request(reqOptions, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('EmailJS success');
            resolve({ success: true, body });
          } else {
            console.error(`EmailJS status ${res.statusCode}: ${body}`);
            reject(new Error(`EmailJS failed: ${body}`));
          }
        });
      });

      req.on('error', (err) => {
        console.error(`EmailJS error: ${err.message}`);
        reject(err);
      });

      req.write(data);
      req.end();
    });
  } else if (brevoKey) {
    console.log(`Sending Brevo email to: ${options.email}`);

    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        sender: { 
          name: process.env.SMTP_FROM_NAME || 'VisitorPass System', 
          email: process.env.SMTP_FROM || 'anuragkushwaha2207@gmail.com' 
        },
        to: [{ email: options.email }],
        subject: options.subject,
        htmlContent: options.html
      });

      const reqOptions = {
        hostname: 'api.brevo.com',
        port: 443,
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoKey,
          'content-type': 'application/json',
          'content-length': data.length
        }
      };

      const req = https.request(reqOptions, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(body);
              console.log(`Brevo success: ${parsed.messageId}`);
              resolve(parsed);
            } catch (e) {
              resolve({ id: 'success-unknown-body' });
            }
          } else {
            console.error(`Brevo status ${res.statusCode}: ${body}`);
            reject(new Error(`Brevo failed: ${body}`));
          }
        });
      });

      req.on('error', (err) => {
        console.error(`Brevo error: ${err.message}`);
        reject(err);
      });

      req.write(data);
      req.end();
    });
  } else {
    console.log(`Sending Resend email to: ${options.email}`);

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
          'Authorization': `Bearer ${resendKey}`,
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
              console.log(`Resend success: ${parsed.id}`);
              resolve(parsed);
            } catch (e) {
              resolve({ id: 'success-unknown-body' });
            }
          } else {
            console.error(`Resend status ${res.statusCode}: ${body}`);
            reject(new Error(`Resend failed: ${body}`));
          }
        });
      });

      req.on('error', (err) => {
        console.error(`Resend error: ${err.message}`);
        reject(err);
      });

      req.write(data);
      req.end();
    });
  }
};

module.exports = sendEmail;
