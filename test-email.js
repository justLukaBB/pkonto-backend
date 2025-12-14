require('dotenv').config();
const nodemailer = require('nodemailer');

/**
 * Test Email Configuration
 * Run with: node test-email.js <your-test-email@example.com>
 */

const testEmail = async () => {
  // Get test email from command line argument
  const testRecipient = process.argv[2] || 'justlukax@gmail.com';

  console.log('🔧 Testing email configuration...\n');
  console.log('Settings:');
  console.log(`  Host: ${process.env.EMAIL_HOST}`);
  console.log(`  Port: ${process.env.EMAIL_PORT}`);
  console.log(`  User: ${process.env.EMAIL_USER}`);
  console.log(`  From: ${process.env.EMAIL_FROM}`);
  console.log(`  To: ${testRecipient}\n`);

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Verify connection
    console.log('📡 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: testRecipient,
      subject: 'Test: P-Konto Backend Email-Konfiguration',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #EA5530; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 30px 20px; background-color: #f9f9f9; border-radius: 5px; margin-top: 20px; }
            .success { background-color: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Email-Konfiguration erfolgreich!</h1>
            </div>
            <div class="content">
              <h2>Test erfolgreich</h2>
              <p>Deine Email-Konfiguration für das P-Konto Backend funktioniert einwandfrei!</p>

              <div class="success">
                <strong>✓ SMTP-Verbindung hergestellt</strong><br>
                <strong>✓ Email erfolgreich versendet</strong><br>
                <strong>✓ System ist bereit für Produktions-Emails</strong>
              </div>

              <h3>Konfiguration:</h3>
              <ul>
                <li><strong>SMTP Host:</strong> ${process.env.EMAIL_HOST}</li>
                <li><strong>SMTP Port:</strong> ${process.env.EMAIL_PORT}</li>
                <li><strong>Absender:</strong> ${process.env.EMAIL_FROM}</li>
                <li><strong>Via:</strong> ${process.env.EMAIL_USER}</li>
              </ul>

              <p><strong>Nächste Schritte:</strong></p>
              <ol>
                <li>MongoDB konfigurieren</li>
                <li>PDF-Template und Stamp hinzufügen</li>
                <li>Backend starten: <code>npm run dev</code></li>
                <li>API-Endpoints testen</li>
              </ol>

              <p>Bei Fragen siehe <strong>README.md</strong> oder <strong>QUICKSTART.md</strong></p>
            </div>
            <div class="footer">
              <p>P-Konto Backend - Automated Test Email</p>
              <p>Zeit: ${new Date().toLocaleString('de-DE')}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
✅ Email-Konfiguration erfolgreich!

Deine Email-Konfiguration für das P-Konto Backend funktioniert einwandfrei!

Konfiguration:
- SMTP Host: ${process.env.EMAIL_HOST}
- SMTP Port: ${process.env.EMAIL_PORT}
- Absender: ${process.env.EMAIL_FROM}
- Via: ${process.env.EMAIL_USER}

Nächste Schritte:
1. MongoDB konfigurieren
2. PDF-Template und Stamp hinzufügen
3. Backend starten: npm run dev
4. API-Endpoints testen

Bei Fragen siehe README.md oder QUICKSTART.md

---
P-Konto Backend - Automated Test Email
Zeit: ${new Date().toLocaleString('de-DE')}
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log(`📬 Message ID: ${info.messageId}\n`);
    console.log('🎉 Email configuration is working perfectly!');
    console.log(`📧 Check your inbox at: ${testRecipient}\n`);

  } catch (error) {
    console.error('❌ Email test failed!\n');
    console.error('Error:', error.message);
    console.error('\nCommon issues:');
    console.error('  - Wrong Gmail password (must be App Password, not regular password)');
    console.error('  - 2FA not enabled on Google account');
    console.error('  - App Password not generated yet');
    console.error('  - Firewall blocking port 587');
    console.error('\nSee README.md for detailed setup instructions.');
    process.exit(1);
  }
};

// Run test
testEmail();
