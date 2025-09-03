# Supabase Email Templates Setup Guide - StatJam

## 🎨 **BEAUTIFUL EMAIL TEMPLATES FOR STATJAM**

This guide provides step-by-step instructions for customizing Supabase email templates to match StatJam's branding and provide a professional user experience.

---

## 📧 **EMAIL TYPES TO CUSTOMIZE**

### 1. **Email Confirmation** (Sign Up)
- **When**: Sent when users sign up
- **Purpose**: Verify email address before account activation
- **Template Name**: `Confirm signup`

### 2. **Password Reset**
- **When**: Sent when users request password reset
- **Purpose**: Secure password change link
- **Template Name**: `Reset password`

### 3. **Magic Link** (Optional)
- **When**: Passwordless login (if implemented later)
- **Purpose**: One-click login
- **Template Name**: `Magic link`

---

## 🛠️ **SETUP INSTRUCTIONS**

### **Step 1: Access Email Templates**

1. **Go to Supabase Dashboard**
   - Navigate to your StatJam project
   - Click **Authentication** in the left sidebar
   - Click **Email Templates** tab

2. **Select Template Type**
   - Choose the template you want to customize
   - Start with **"Confirm signup"** for email verification

### **Step 2: StatJam Email Confirmation Template**

Replace the default template with this custom StatJam-branded version:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your StatJam Account</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #fef7ed 0%, #fff7ed 50%, #fef2f2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .email-card {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(251, 146, 60, 0.2);
        }
        .logo {
            text-align: center;
            margin-bottom: 32px;
        }
        .logo h1 {
            font-size: 36px;
            font-weight: 700;
            background: linear-gradient(to right, #fb923c, #ef4444);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0;
        }
        .logo p {
            color: #6b7280;
            font-size: 16px;
            margin: 8px 0 0 0;
        }
        .content {
            text-align: center;
            margin-bottom: 32px;
        }
        .content h2 {
            font-size: 24px;
            font-weight: 600;
            color: #374151;
            margin: 0 0 16px 0;
        }
        .content p {
            font-size: 16px;
            color: #6b7280;
            line-height: 1.6;
            margin: 0 0 24px 0;
        }
        .cta-button {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(to right, #fb923c, #ef4444);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .cta-button:hover {
            background: linear-gradient(to right, #ea580c, #dc2626);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(251, 146, 60, 0.4);
        }
        .footer {
            text-align: center;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid rgba(251, 146, 60, 0.1);
        }
        .footer p {
            font-size: 14px;
            color: #9ca3af;
            margin: 8px 0;
        }
        .footer a {
            color: #f97316;
            text-decoration: none;
        }
        .security-note {
            background: rgba(251, 146, 60, 0.05);
            border: 1px solid rgba(251, 146, 60, 0.1);
            border-radius: 12px;
            padding: 16px;
            margin: 24px 0;
            text-align: left;
        }
        .security-note h4 {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin: 0 0 8px 0;
        }
        .security-note p {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-card">
            <div class="logo">
                <h1>🏀 StatJam</h1>
                <p>Your Courtside Command Center</p>
            </div>
            
            <div class="content">
                <h2>Welcome to StatJam!</h2>
                <p>
                    Thanks for signing up! You're just one click away from accessing your 
                    personalized basketball statistics dashboard.
                </p>
                <p>
                    Click the button below to confirm your email address and activate your account:
                </p>
                
                <a href="{{ .ConfirmationURL }}" class="cta-button">
                    ✅ Confirm My Account
                </a>
            </div>
            
            <div class="security-note">
                <h4>🔒 Security Note</h4>
                <p>
                    This confirmation link will expire in 24 hours for your security. 
                    If you didn't create a StatJam account, you can safely ignore this email.
                </p>
            </div>
            
            <div class="footer">
                <p>
                    Having trouble? Copy and paste this link into your browser:<br>
                    <a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a>
                </p>
                <p>
                    Questions? Contact us at <a href="mailto:support@statjam.com">support@statjam.com</a>
                </p>
                <p>© 2025 StatJam. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
```

### **Step 3: Password Reset Template**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your StatJam Password</title>
    <style>
        /* Same CSS as above */
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #fef7ed 0%, #fff7ed 50%, #fef2f2 100%);
            min-height: 100vh;
        }
        /* ... (copy all styles from above) ... */
    </style>
</head>
<body>
    <div class="container">
        <div class="email-card">
            <div class="logo">
                <h1>🏀 StatJam</h1>
                <p>Your Courtside Command Center</p>
            </div>
            
            <div class="content">
                <h2>Reset Your Password</h2>
                <p>
                    We received a request to reset your StatJam password. 
                    Click the button below to create a new password:
                </p>
                
                <a href="{{ .ConfirmationURL }}" class="cta-button">
                    🔑 Reset My Password
                </a>
            </div>
            
            <div class="security-note">
                <h4>🔒 Security Note</h4>
                <p>
                    This password reset link will expire in 1 hour for your security. 
                    If you didn't request a password reset, you can safely ignore this email.
                </p>
            </div>
            
            <div class="footer">
                <p>
                    Having trouble? Copy and paste this link into your browser:<br>
                    <a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a>
                </p>
                <p>
                    Questions? Contact us at <a href="mailto:support@statjam.com">support@statjam.com</a>
                </p>
                <p>© 2025 StatJam. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
```

---

## ⚙️ **CONFIGURATION SETTINGS**

### **Email Settings to Update**

1. **Sender Information**
   - **From Email**: `noreply@statjam.com` (or your domain)
   - **From Name**: `StatJam Team`

2. **Redirect URLs**
   - **Site URL**: `https://your-domain.com`
   - **Redirect URLs**: Add your production and development URLs
     - `https://your-domain.com/**`
     - `http://localhost:3000/**`

3. **Email Rate Limiting**
   - **Enable rate limiting**: Yes
   - **Max emails per hour**: 30 (adjust based on needs)

---

## 🎨 **CUSTOMIZATION OPTIONS**

### **Brand Colors Used**
- **Primary Orange**: `#fb923c`
- **Primary Red**: `#ef4444`
- **Hover Orange**: `#ea580c`
- **Hover Red**: `#dc2626`
- **Background**: `linear-gradient(135deg, #fef7ed 0%, #fff7ed 50%, #fef2f2 100%)`

### **Typography**
- **Font Family**: System fonts for maximum compatibility
- **Headings**: Bold, gradient text for brand consistency
- **Body Text**: Clean, readable gray tones

### **Interactive Elements**
- **Buttons**: Gradient backgrounds with hover effects
- **Links**: Orange accent color
- **Cards**: Rounded corners with subtle shadows

---

## 📱 **MOBILE RESPONSIVENESS**

The templates are designed to be mobile-responsive with:
- **Flexible layouts** that adapt to screen sizes
- **Touch-friendly buttons** (minimum 44px height)
- **Readable text** at all screen sizes
- **Proper viewport settings**

---

## 🧪 **TESTING YOUR TEMPLATES**

### **Test Email Delivery**

1. **Send Test Emails**
   - Use Supabase's test email feature
   - Sign up with a test account
   - Verify emails arrive and display correctly

2. **Cross-Platform Testing**
   - Test on Gmail, Outlook, Apple Mail
   - Check mobile and desktop versions
   - Verify all links work correctly

3. **Spam Testing**
   - Check spam folders
   - Use tools like Mail Tester to check deliverability
   - Ensure proper SPF/DKIM records (if using custom domain)

---

## 🚀 **DEPLOYMENT CHECKLIST**

- [ ] Email confirmation template updated
- [ ] Password reset template updated
- [ ] Sender information configured
- [ ] Redirect URLs added
- [ ] Rate limiting configured
- [ ] Test emails sent and verified
- [ ] Mobile responsiveness checked
- [ ] Spam testing completed
- [ ] Production domain configured

---

## 💡 **ADVANCED FEATURES**

### **Custom Variables**
You can add custom variables to templates:
- `{{ .Email }}` - User's email address
- `{{ .ConfirmationURL }}` - Confirmation/reset link
- `{{ .SiteURL }}` - Your site URL
- `{{ .TokenHash }}` - Token for verification

### **Conditional Content**
Use Go template syntax for conditional content:
```html
{{ if .UserMetadata.firstName }}
    <p>Hi {{ .UserMetadata.firstName }}!</p>
{{ else }}
    <p>Hi there!</p>
{{ end }}
```

---

## 📞 **SUPPORT**

If you need help with email template setup:
1. Check Supabase documentation
2. Test with development emails first
3. Monitor email delivery rates
4. Contact Supabase support for delivery issues

**The templates above provide a professional, branded experience that matches StatJam's design system and enhances user trust and engagement! 🏀✨**
