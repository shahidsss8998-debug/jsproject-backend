const nodemailer = require('nodemailer');

// Singleton Email Service
class EmailService {
  constructor() {
    this.transporter = null;
    this.isInitialized = false;
  }

  // Initialize transporter (singleton pattern)
  initialize() {
    if (this.isInitialized) {
      return this.transporter;
    }

    // Validate environment variables
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      throw new Error('Missing email credentials: EMAIL_USER and EMAIL_PASS must be set in environment variables');
    }

    // Validate Gmail-specific requirements
    if (!emailUser.includes('@gmail.com')) {
      console.warn('⚠️  WARNING: EMAIL_USER does not appear to be a Gmail address');
      console.warn('⚠️  Gmail App Passwords only work with @gmail.com accounts');
    }

    if (emailPass.length !== 16) {
      console.warn('⚠️  WARNING: EMAIL_PASS length is not 16 characters');
      console.warn('⚠️  Gmail App Passwords are exactly 16 characters long');
    }

    console.log('📧 Initializing Gmail SMTP service...');
    console.log('📧 EMAIL_USER:', emailUser);
    console.log('📧 EMAIL_PASS length:', emailPass.length, 'characters');
    console.log('📧 Using Gmail service with secure connection');

    // Create transporter with Gmail-optimized settings
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      },
      secure: true, // Use TLS
      pool: true, // Connection pooling
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      // Gmail-specific settings
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });

    this.isInitialized = true;
    return this.transporter;
  }

  // Verify transporter connection
  async verify() {
    try {
      if (!this.isInitialized) {
        this.initialize();
      }

      console.log('🔍 Testing Gmail SMTP connection and authentication...');
      const result = await this.transporter.verify();
      console.log('✅ Gmail SMTP connection successful!');
      console.log('✅ Authentication verified - ready to send emails');
      return true;
    } catch (error) {
      console.error('❌ Gmail SMTP verification failed!');
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code || 'Unknown');

      // Gmail-specific error handling
      if (error.code === 'EAUTH') {
        console.error('❌ GMAIL AUTHENTICATION ERROR (EAUTH)');
        console.error('❌ This usually means:');
        console.error('❌ 1. EMAIL_PASS is not a valid Gmail App Password');
        console.error('❌ 2. EMAIL_USER is incorrect');
        console.error('❌ 3. Gmail account has security restrictions');
        console.error('❌ 4. App Password was revoked or expired');
        console.error('❌ SOLUTION: Generate new App Password at https://myaccount.google.com/apppasswords');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('❌ Cannot connect to Gmail SMTP servers');
        console.error('❌ Check internet connection and firewall');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('❌ Connection to Gmail SMTP timed out');
        console.error('❌ Gmail servers may be temporarily unavailable');
      } else if (error.response && error.response.includes('535')) {
        console.error('❌ Gmail rejected authentication (535 error)');
        console.error('❌ EMAIL_USER or EMAIL_PASS is incorrect');
      }

      console.error('❌ Full error details:', error);
      throw error;
    }
  }

  // Send email with retry mechanism
  async sendEmail(to, subject, html, maxRetries = 3) {
    if (!this.isInitialized) {
      this.initialize();
    }

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📧 Email attempt ${attempt}/${maxRetries} to:`, to);
        console.log('📧 Subject:', subject);

        const mailOptions = {
          from: `"Spoonful Restaurant" <${process.env.EMAIL_USER}>`,
          to: Array.isArray(to) ? to.join(',') : to,
          subject: subject,
          html: html
        };

        const result = await this.transporter.sendMail(mailOptions);

        console.log('✅ Email sent successfully:', result.messageId);
        console.log('✅ Accepted recipients:', result.accepted);
        console.log('✅ Rejected recipients:', result.rejected);

        return {
          success: true,
          messageId: result.messageId,
          accepted: result.accepted,
          rejected: result.rejected
        };

      } catch (error) {
        lastError = error;
        console.error('❌ EMAIL ERROR FULL DETAILS:', error);
        console.error(`❌ Email attempt ${attempt}/${maxRetries} failed:`, error.message);

        if (error.code) console.error('❌ Error code:', error.code);
        if (error.response) console.error('❌ Error response:', error.response);
        if (error.command) console.error('❌ Error command:', error.command);

        if (error.code === 'EAUTH') {
          console.error('❌ Gmail authentication failed - not retrying');
          console.error('❌ Check EMAIL_USER and EMAIL_PASS in environment variables');
          console.error('❌ Ensure EMAIL_PASS is a Gmail App Password (16 characters)');
          break;
        }

        if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
          console.error('❌ Gmail SMTP connection error - will retry');
        }

        if (error.response && error.response.includes('550')) {
          console.error('❌ Gmail rejected recipient address (550 error)');
        }

        if (error.response && error.response.includes('421')) {
          console.error('❌ Gmail server temporarily unavailable (421 error)');
        }

        if (attempt < maxRetries) {
          const delay = 500 * attempt; // 500ms, 1000ms, 1500ms
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    console.error('❌ All email attempts failed');
    return {
      success: false,
      error: lastError && lastError.message ? lastError.message : String(lastError),
      code: lastError && lastError.code,
      response: lastError && lastError.response
    };
  }

  // Close transporter (cleanup)
  close() {
    if (this.transporter) {
      this.transporter.close();
      console.log('📧 Email transporter closed');
    }
  }
}

// Export singleton instance
const emailService = new EmailService();

module.exports = emailService;