const nodemailer = require('nodemailer');
const path = require('path');

/**
 * Create email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Send P-Konto certificate via email
 * @param {Object} application - Application document from MongoDB
 * @param {string} pdfPath - Path to generated PDF
 */
const sendCertificateEmail = async (application, pdfPath) => {
  try {
    const transporter = createTransporter();

    const salutationMap = {
      herr: 'Herr',
      frau: 'Frau',
      divers: ''
    };

    const salutation = salutationMap[application.personalData.salutation] || '';
    const fullName = `${salutation} ${application.personalData.firstName} ${application.personalData.lastName}`.trim();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: application.personalData.email,
      subject: 'Ihre P-Konto Bescheinigung nach § 850k ZPO',
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
  <div style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
    <img src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2015/08/Logo-T-Scuric.png" alt="Scuric Logo" style="height: 40px; display: block;">
  </div>

  <div style="padding: 24px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 28px; font-weight: 600; color: #111827; margin: 0 0 12px 0;">Ihre P-Konto Bescheinigung</h1>
      <p style="font-size: 16px; color: #6b7280; margin: 0;">Bescheinigung nach § 850k ZPO erfolgreich erstellt</p>
    </div>

    <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Sehr geehrte/r <strong>${fullName}</strong>,<br><br>
      vielen Dank für Ihren Auftrag. Ihre P-Konto Bescheinigung wurde erfolgreich erstellt.
    </p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <div style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 8px;">💰 Ihr monatlicher Freibetrag</div>
      <div style="font-size: 32px; font-weight: 700; color: #16a34a;">${application.calculatedFreibetrag.amount.toFixed(2).replace('.', ',')} EUR</div>
    </div>

    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 14px; color: #78350f;">
      <strong style="color: #92400e;">Wichtig:</strong> Bitte legen Sie die angehängte Bescheinigung Ihrer Bank vor, damit der erhöhte Freibetrag eingerichtet werden kann.
    </div>

    <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 24px 0 16px 0;">📋 So gehen Sie vor</h2>

    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0;"><table style="width: 100%; background-color: #f9fafb; border-radius: 8px;"><tr><td style="width: 28px; padding: 12px 0 12px 12px; vertical-align: top;"><div style="background-color: #111827; color: #ffffff; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 600; font-size: 14px;">1</div></td><td style="padding: 16px 12px 12px 12px; color: #374151; font-size: 14px; line-height: 1.5;">Öffnen Sie die angehängte PDF-Bescheinigung</td></tr></table></td></tr>
      <tr><td style="padding: 8px 0;"><table style="width: 100%; background-color: #f9fafb; border-radius: 8px;"><tr><td style="width: 28px; padding: 12px 0 12px 12px; vertical-align: top;"><div style="background-color: #111827; color: #ffffff; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 600; font-size: 14px;">2</div></td><td style="padding: 16px 12px 12px 12px; color: #374151; font-size: 14px; line-height: 1.5;">Drucken Sie die Bescheinigung aus oder speichern Sie sie digital</td></tr></table></td></tr>
      <tr><td style="padding: 8px 0;"><table style="width: 100%; background-color: #f9fafb; border-radius: 8px;"><tr><td style="width: 28px; padding: 12px 0 12px 12px; vertical-align: top;"><div style="background-color: #111827; color: #ffffff; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 600; font-size: 14px;">3</div></td><td style="padding: 16px 12px 12px 12px; color: #374151; font-size: 14px; line-height: 1.5;">Legen Sie die Bescheinigung Ihrer Bank vor (persönlich, per Post oder digital)</td></tr></table></td></tr>
      <tr><td style="padding: 8px 0;"><table style="width: 100%; background-color: #f9fafb; border-radius: 8px;"><tr><td style="width: 28px; padding: 12px 0 12px 12px; vertical-align: top;"><div style="background-color: #111827; color: #ffffff; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 600; font-size: 14px;">4</div></td><td style="padding: 16px 12px 12px 12px; color: #374151; font-size: 14px; line-height: 1.5;">Die Bank richtet Ihren erhöhten Freibetrag automatisch ein</td></tr></table></td></tr>
    </table>

    <div style="background-color: #dbeafe; border: 1px solid #93c5fd; border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 14px; color: #1e40af;">
      <strong>Hinweis:</strong> Der erhöhte Freibetrag gilt ab Vorlage der Bescheinigung. Bei einmaligen Sozialleistungen legen Sie bitte zusätzlich den Bewilligungsbescheid vor.
    </div>

    <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">Bei Fragen stehen wir Ihnen selbstverständlich gerne zur Verfügung.</p>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #1a1a1a;">
      <p style="margin: 0 0 12px;"><img src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2015/08/Logo-T-Scuric.png" alt="Thomas Scuric Rechtsanwalt" style="display: block; max-width: 300px; height: auto;"></p>
      <p style="margin: 0 0 4px; color: #961919; font-weight: bold;">Rechtsanwaltskanzlei Thomas Scuric</p>
      <p style="margin: 0 0 8px; color: #1f497d;">Bongardstraße 33<br>44787 Bochum</p>
      <p style="margin: 0 0 12px; color: #1f497d;">Fon: 0234 913 681 0<br>Fax: 0234 913 681 29<br>E-Mail: <a href="mailto:info@ra-scuric.de" style="color: #0563c1; text-decoration: none;">info@ra-scuric.de</a></p>
      <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #a6a6a6;">Der Inhalt dieser E-Mail ist vertraulich und ausschließlich für den bezeichneten Adressaten bestimmt. Wenn Sie nicht der vorgesehene Adressat dieser E-Mail oder dessen Vertreter sein sollten, so beachten Sie bitte, daß jede Form der Kenntnisnahme, Veröffentlichung, Vervielfältigung oder Weitergabe des Inhalts dieser E-Mail unzulässig ist. Wir bitten Sie, sich in diesem Fall mit dem Absender der E-Mail in Verbindung zu setzen.<br><br>Wir weisen Sie auf unsere aktuelle <a href="https://www.schuldnerberatung-anwalt.de/datenschutz/" style="color: #a0191d; text-decoration: underline;" target="_blank">Datenschutzerklärung</a> hin.</p>
    </div>

    <div style="text-align: center; margin-top: 48px; padding-top: 32px; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 13px; color: #6b7280; font-weight: 500; margin: 0 0 20px 0;">Bekannt aus:</p>
      <img src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2019/11/medien.png" alt="Bekannt aus verschiedenen Medien" style="max-width: 100%; height: auto; max-height: 48px; opacity: 0.6;">
    </div>

    <div style="text-align: center; margin-top: 32px; padding-top: 24px;">
      <div style="margin-bottom: 12px;">
        <a href="https://www.schuldnerberatung-anwalt.de/impressum/" style="color: #6b7280; text-decoration: none; font-size: 13px;">Impressum</a>
        <span style="color: #9ca3af; margin: 0 12px;">•</span>
        <a href="https://www.schuldnerberatung-anwalt.de/datenschutz/" style="color: #6b7280; text-decoration: none; font-size: 13px;">Datenschutz</a>
      </div>
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">© ${new Date().getFullYear()} Scuric. Alle Rechte vorbehalten.</p>
    </div>

    <div style="font-size: 11px; color: #9ca3af; margin-top: 24px; padding: 12px; background-color: #f9fafb; border-radius: 6px;">
      📎 Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese Nachricht.
    </div>
  </div>
</div>
      `,
      text: `
Sehr geehrte/r ${fullName},

vielen Dank für Ihren Auftrag. Ihre P-Konto Bescheinigung nach § 850k ZPO wurde erfolgreich erstellt.

Ihr monatlicher Freibetrag: ${application.calculatedFreibetrag.amount.toFixed(2)} €

Nächste Schritte:
1. Öffnen Sie die angehängte Bescheinigung${pdfPath.endsWith('.pdf') ? ' (PDF)' : ' (Word-Dokument)'}
2. Legen Sie diese Bescheinigung Ihrer Bank vor (persönlich, per Post oder digital)
3. Die Bank wird Ihren erhöhten Freibetrag einrichten

Wichtige Hinweise:
- Die Umwandlung zum P-Konto erfolgt durch Ihre Bank
- Der erhöhte Freibetrag gilt ab Vorlage der Bescheinigung
- Bei einmaligen Sozialleistungen legen Sie bitte zusätzlich den Bewilligungsbescheid vor

Bei Fragen oder Problemen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
${process.env.LAWYER_TITLE} ${process.env.LAWYER_NAME}
      `,
      attachments: [
        {
          filename: `P-Konto-Bescheinigung-${application._id}${pdfPath.endsWith('.pdf') ? '.pdf' : '.docx'}`,
          path: pdfPath
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

/**
 * Send confirmation email after form submission
 */
const sendConfirmationEmail = async (application) => {
  try {
    const transporter = createTransporter();

    const salutationMap = {
      herr: 'Herr',
      frau: 'Frau',
      divers: ''
    };

    const salutation = salutationMap[application.personalData.salutation] || '';
    const fullName = `${salutation} ${application.personalData.firstName} ${application.personalData.lastName}`.trim();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: application.personalData.email,
      subject: 'Auftragsbestätigung - P-Konto Bescheinigung',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #EA5530; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Auftragsbestätigung</h1>
            </div>
            <div class="content">
              <p>Sehr geehrte/r ${fullName},</p>

              <p>vielen Dank für Ihren Auftrag zur Erstellung einer P-Konto Bescheinigung nach § 850k ZPO.</p>

              <p><strong>Ihre Auftragsnummer:</strong> ${application._id}</p>

              <p>Sobald die Zahlung eingegangen ist, erstellen wir Ihre Bescheinigung und senden sie Ihnen per E-Mail zu.</p>

              <p>Mit freundlichen Grüßen<br>
              ${process.env.LAWYER_TITLE} ${process.env.LAWYER_NAME}</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} P-Konto Bescheinigung. Alle Rechte vorbehalten.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Confirmation email error:', error);
    throw error;
  }
};

module.exports = {
  sendCertificateEmail,
  sendConfirmationEmail
};
