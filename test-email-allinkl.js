// Force reload .env by clearing environment first
delete process.env.EMAIL_HOST;
delete process.env.EMAIL_PORT;
delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASSWORD;
delete process.env.EMAIL_FROM;

require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmail = async () => {
  const testRecipient = process.argv[2] || 'justlukax@gmail.com';

  console.log('🔧 Testing ALL-INKL email configuration...\n');
  console.log('Settings:');
  console.log(`  Host: ${process.env.EMAIL_HOST}`);
  console.log(`  Port: ${process.env.EMAIL_PORT}`);
  console.log(`  User: ${process.env.EMAIL_USER}`);
  console.log(`  From: ${process.env.EMAIL_FROM}`);
  console.log(`  To: ${testRecipient}\n`);

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    console.log('📡 Verifying SMTP connection to ALL-INKL...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: testRecipient,
      subject: 'Test: P-Konto ALL-INKL Email-Konfiguration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #EA5530; color: white; padding: 20px; text-align: center; border-radius: 5px;">
            <h1>✅ ALL-INKL Email erfolgreich!</h1>
          </div>
          <div style="padding: 30px 20px; background-color: #f9f9f9; border-radius: 5px; margin-top: 20px;">
            <h2>Test erfolgreich</h2>
            <p>Die Email-Konfiguration mit ALL-INKL funktioniert einwandfrei!</p>
            <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <strong>✓ SMTP-Verbindung zu ALL-INKL hergestellt</strong><br>
              <strong>✓ Email von noreply@p-konto-bescheinigung.com versendet</strong><br>
              <strong>✓ System ist bereit!</strong>
            </div>
            <h3>Konfiguration:</h3>
            <ul>
              <li><strong>SMTP Host:</strong> ${process.env.EMAIL_HOST}</li>
              <li><strong>SMTP Port:</strong> ${process.env.EMAIL_PORT}</li>
              <li><strong>Absender:</strong> ${process.env.EMAIL_FROM}</li>
              <li><strong>Via:</strong> ${process.env.EMAIL_USER}</li>
            </ul>
          </div>
          <div style="padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>P-Konto Backend - ALL-INKL Test</p>
            <p>${new Date().toLocaleString('de-DE')}</p>
          </div>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log(`📬 Message ID: ${info.messageId}\n`);
    console.log('🎉 ALL-INKL Email configuration is working!');
    console.log(`📧 Check your inbox at: ${testRecipient}\n`);

  } catch (error) {
    console.error('❌ Email test failed!\n');
    console.error('Error:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  }
};

testEmail();
