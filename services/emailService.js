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
      throw new Error('Missing email credentials');
    }

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
      await this.transporter.verify();
      return true;
    } catch (error) {
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
        const mailOptions = {
          from: `"Spoonful Restaurant" <${process.env.EMAIL_USER}>`,
          to: Array.isArray(to) ? to.join(',') : to,
          subject: subject,
          html: html
        };

        const result = await this.transporter.sendMail(mailOptions);

        return {
          success: true,
          messageId: result.messageId,
          accepted: result.accepted,
          rejected: result.rejected
        };

      } catch (error) {
        lastError = error;
        if (error.code === 'EAUTH') {
          break;
        }

        if (attempt < maxRetries) {
          const delay = 500 * attempt;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

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
    }
  }
}

// Export singleton instance
const emailService = new EmailService();

module.exports = emailService;