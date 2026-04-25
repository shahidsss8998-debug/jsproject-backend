# Spoonful Backend - Email Configuration Guide

## ✅ Email Setup Status: WORKING

The Gmail authentication has been successfully configured and tested. Email sending is now working reliably in both development and production environments.

## 🔧 Configuration Summary

### Environment Variables (Required)
```env
EMAIL_USER=shahidsss8998@gmail.com
EMAIL_PASS=urhiuidvvfbuxdqz  # Gmail App Password (16 characters)
```

### Gmail App Password Setup (CRITICAL)
1. **Enable 2FA** on your Gmail account at https://myaccount.google.com/security
2. **Generate App Password** at https://myaccount.google.com/apppasswords
3. **Use the 16-character App Password** as `EMAIL_PASS` (not your regular password)

## 🚀 Features Implemented

### ✅ Singleton Email Service
- Single transporter instance prevents connection issues
- Automatic initialization and connection pooling
- Proper cleanup on app shutdown

### ✅ Comprehensive Error Handling
- Gmail-specific error messages and solutions
- Retry mechanism (3 attempts with backoff)
- Detailed logging for debugging

### ✅ Production-Ready Configuration
- Environment variable validation on startup
- No dotenv override in production
- Secure credential handling

### ✅ Testing & Verification
- `npm run test-email` - Test email functionality
- Automatic transporter verification on startup
- Clear success/failure logging

## 📧 API Endpoints

### Test Email
```
GET /api/order/test
```
Tests backend connectivity and returns available routes.

### Send Order (Admin Notification)
```
POST /api/order/send-order
```
Sends order details to admin email with approve/reject buttons.

### Approve Order
```
GET /api/order/approve?emails=user@example.com&name=John&date=2024-01-01&time=19:00&place=Table 5
```
Approves order and notifies customer.

### Reject Order
```
GET /api/order/reject?emails=user@example.com&name=John&date=2024-01-01&time=19:00
```
Rejects order and notifies customer.

## 🔍 Troubleshooting

### EAUTH Error (Authentication Failed)
```
❌ GMAIL AUTHENTICATION ERROR (EAUTH)
```
**Solutions:**
1. Verify `EMAIL_USER` is correct Gmail address
2. Ensure `EMAIL_PASS` is a 16-character App Password
3. Regenerate App Password if expired
4. Check Gmail account security settings

### Environment Variables Not Updating on Render
1. **Redeploy** after updating environment variables
2. **Check Render logs** for the correct variable values
3. **Verify** no `.env` file in production (dotenv only loads in development)

### Connection Issues
- Check internet connectivity
- Verify Gmail SMTP servers are accessible
- Ensure no firewall blocking SMTP (port 465/587)

## 🛠️ Development Commands

```bash
# Test email functionality
npm run test-email

# Start development server
npm run dev

# Start production server
npm start
```

## 📋 Deployment Checklist

### Before Deploying to Render:
- [ ] Set `EMAIL_USER` environment variable
- [ ] Set `EMAIL_PASS` environment variable (Gmail App Password)
- [ ] Set `MONGODB_URI` environment variable
- [ ] Set `BASE_URL` environment variable
- [ ] Set `NODE_ENV=production`
- [ ] Remove `.env` file from repository (if committed)

### After Deployment:
- [ ] Check Render logs for email verification success
- [ ] Test email functionality via `/api/order/test` endpoint
- [ ] Verify admin receives order emails
- [ ] Test approve/reject functionality

## 🔒 Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use Gmail App Passwords** instead of regular passwords
3. **Enable 2FA** on Gmail accounts
4. **Rotate App Passwords** periodically
5. **Monitor email logs** for unauthorized access attempts

## 📊 Email Service Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────┐
│   Express App   │───▶│  Email Service   │───▶│   Gmail SMTP │
│                 │    │  (Singleton)     │    │             │
│ - Order Routes  │    │ - Transporter    │    │ - smtp.gmail│
│ - Validation    │    │ - Retry Logic    │    │   .com:465  │
└─────────────────┘    └──────────────────┘    └─────────────┘
```

## 🎯 Success Indicators

When properly configured, you should see these logs on startup:
```
🔧 EMAIL_USER: shahidsss8998@gmail.com (length: 22)
🔧 EMAIL_PASS: Set (length: 16)
🔍 Testing Gmail SMTP connection and authentication...
✅ Gmail SMTP connection successful!
✅ Authentication verified - ready to send emails
```

## 📞 Support

If emails still fail after following this guide:
1. Run `npm run test-email` locally
2. Check Render deployment logs
3. Verify all environment variables are set correctly
4. Ensure Gmail App Password is valid and current