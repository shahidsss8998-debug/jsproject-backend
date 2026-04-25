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

    console.log('📧 Initializing email service...');
    console.log('📧 EMAIL_USER:', emailUser);
    console.log('📧 EMAIL_PASS length:', emailPass.length);

    // Create transporter with optimized Gmail settings
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      },
      // Additional Gmail-specific settings for stability
      secure: true,
      pool: true, // Use pooled connections
      maxConnections: 5,
      maxMessages: 100
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

      console.log('🔍 Verifying email transporter connection...');
      const result = await this.transporter.verify();
      console.log('✅ Email transporter verified successfully');
      return true;
    } catch (error) {
      console.error('❌ Email transporter verification failed:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error response:', error.response);
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
        console.error(`❌ Email attempt ${attempt}/${maxRetries} failed:`, error.message);

        // Log detailed error information
        if (error.code) console.error('❌ Error code:', error.code);
        if (error.response) console.error('❌ Error response:', error.response);
        if (error.command) console.error('❌ Error command:', error.command);

        // Don't retry on authentication errors
        if (error.code === 'EAUTH') {
          console.error('❌ Authentication failed - not retrying');
          break;
        }

        // Wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          const delay = attempt * 1000; // 1s, 2s, 3s delays
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    console.error('❌ All email attempts failed');
    return {
      success: false,
      error: lastError.message,
      code: lastError.code,
      response: lastError.response
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