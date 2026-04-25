// Load environment variables only in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const emailService = require('./services/emailService');

async function testEmail() {
  try {
    console.log('🧪 Testing email service...');

    // Verify transporter first
    await emailService.verify();

    // Send test email
    const result = await emailService.sendEmail(
      process.env.EMAIL_USER,
      'Test Email from Spoonful Backend',
      '<h1>✅ Email Test Successful!</h1><p>Your Gmail configuration is working correctly.</p><p>Timestamp: ' + new Date().toISOString() + '</p>'
    );

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('✅ Message ID:', result.messageId);
    } else {
      console.log('❌ Test email failed:', result.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    process.exit(1);
  }
}

testEmail();
