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
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #EA5530; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .highlight { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
            .button { background-color: #EA5530; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>P-Konto Bescheinigung</h1>
            </div>
            <div class="content">
              <p>Sehr geehrte/r ${fullName},</p>

              <p>vielen Dank für Ihren Auftrag. Ihre P-Konto Bescheinigung nach § 850k ZPO wurde erfolgreich erstellt und beglaubigt.</p>

              <div class="highlight">
                <strong>Ihr monatlicher Freibetrag: ${application.calculatedFreibetrag.amount.toFixed(2)} €</strong>
              </div>

              <p><strong>Nächste Schritte:</strong></p>
              <ol>
                <li>Öffnen Sie die angehängte Bescheinigung${pdfPath.endsWith('.pdf') ? ' (PDF)' : ' (Word-Dokument)'}</li>
                <li>Drucken Sie die Bescheinigung aus</li>
                <li>Legen Sie diese Bescheinigung Ihrer Bank vor (persönlich, per Post oder digital)</li>
                <li>Die Bank wird Ihren erhöhten Freibetrag einrichten</li>
              </ol>

              <p><strong>Wichtige Hinweise:</strong></p>
              <ul>
                <li>Die Bescheinigung ist von ${process.env.LAWYER_TITLE} ${process.env.LAWYER_NAME} beglaubigt</li>
                <li>Die Umwandlung zum P-Konto erfolgt durch Ihre Bank</li>
                <li>Der erhöhte Freibetrag gilt ab Vorlage der Bescheinigung</li>
                <li>Bei einmaligen Sozialleistungen legen Sie bitte zusätzlich den Bewilligungsbescheid vor</li>
              </ul>

              <p>Bei Fragen oder Problemen stehen wir Ihnen gerne zur Verfügung.</p>

              <p>Mit freundlichen Grüßen<br>
              ${process.env.LAWYER_TITLE} ${process.env.LAWYER_NAME}</p>
            </div>
            <div class="footer">
              <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
              <p>&copy; ${new Date().getFullYear()} P-Konto Bescheinigung. Alle Rechte vorbehalten.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Sehr geehrte/r ${fullName},

vielen Dank für Ihren Auftrag. Ihre P-Konto Bescheinigung nach § 850k ZPO wurde erfolgreich erstellt und beglaubigt.

Ihr monatlicher Freibetrag: ${application.calculatedFreibetrag.amount.toFixed(2)} €

Nächste Schritte:
1. Öffnen Sie die angehängte Bescheinigung${pdfPath.endsWith('.pdf') ? ' (PDF)' : ' (Word-Dokument)'}
2. Legen Sie diese Bescheinigung Ihrer Bank vor (persönlich, per Post oder digital)
3. Die Bank wird Ihren erhöhten Freibetrag einrichten

Wichtige Hinweise:
- Die Bescheinigung ist von ${process.env.LAWYER_TITLE} ${process.env.LAWYER_NAME} beglaubigt
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
