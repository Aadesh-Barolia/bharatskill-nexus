# Nodemailer OTP email setup

Nexus now sends OTP messages through Nodemailer using your SMTP account. Resend's HTTP API and RESEND_API_KEY are no longer used. Nodemailer is the sending library; Gmail or another SMTP provider delivers the message.

## Gmail setup

1. Choose the Gmail account that will send codes. It can be one of your admin addresses, but the sender account and admin access list are separate settings.
2. Enable Google 2-Step Verification and create an App Password at https://myaccount.google.com/apppasswords . Availability depends on account/security policies. Use the App Password, not your normal Google password.
3. Fill the root `.env` locally:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-sending-account@gmail.com
SMTP_PASS=your-google-app-password
EMAIL_FROM="BharatSkill Nexus <your-sending-account@gmail.com>"
```

Enter the App Password without its display spaces. Keep it private and out of source control. Use the same Gmail address in SMTP_USER and EMAIL_FROM. A custom sending domain is not required when using Gmail as the sender. Gmail applies its own sending limits and may restrict automated sending; SMTP acceptance does not guarantee inbox placement.

4. Restart the local server. For Vercel, add these same server-only variables in project settings and redeploy. Keep existing MongoDB, origin, JWT, AI and ADMIN_EMAILS settings.
5. Request an OTP for an address you control, check inbox/spam, and verify the received code on the site. A real inbox test is still needed after SMTP credentials are supplied.

## Other SMTP services

Set the host, username, password and authorized sender from your provider. Port 587 uses STARTTLS (`SMTP_SECURE=false`) and requires the TLS upgrade. Port 465 uses implicit TLS (`SMTP_SECURE=true`). Certificate verification stays enabled; TLS 1.2 is the minimum. The complete send operation has a 12-second deadline and connections are closed afterward. Provider errors are not exposed to users or logged with message content.

## Existing protections

Codes expire after 10 minutes, are single use, allow five verification attempts and enforce a 60-second resend cooldown. SMTP failure clears the pending challenge so the user can retry. A partially configured SMTP account fails closed with a setup error; it never falls back to displaying real sign-in codes. When SMTP_HOST, SMTP_USER and SMTP_PASS are all absent, only local non-production demo mode may show labeled preview codes. Those preview codes cannot grant admin access. Production never exposes codes. SMTP-delivered codes preserve the email-OTP admin checks for the configured three-owner list.

Verified with mocked Nodemailer delivery and a MongoDB-backed Vercel adapter test. No real OTP email has been sent as part of this migration.

References: https://nodemailer.com/smtp and https://support.google.com/accounts/answer/185833
