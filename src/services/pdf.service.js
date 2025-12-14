const fs = require('fs').promises;
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const Application = require('../models/Application.model');
const { generateFromWordTemplate } = require('./word-template.service');
const libre = require('libreoffice-convert');
libre.convertAsync = require('util').promisify(libre.convert);

/**
 * Convert DOCX to PDF using LibreOffice
 *
 * @param {string} docxPath - Path to DOCX file
 * @returns {string} - Path to generated PDF file
 */
const convertToPdf = async (docxPath) => {
  try {
    // Check if running on Vercel (serverless)
    const isVercel = process.env.VERCEL === '1';

    if (isVercel) {
      console.warn('⚠️  Running on Vercel - LibreOffice not available. Skipping PDF conversion.');
      throw new Error('PDF conversion not available on Vercel serverless. Sending DOCX instead.');
    }

    console.log('Converting DOCX to PDF...');

    // Set LibreOffice binary path for Render/Linux
    // Common LibreOffice paths on Linux
    const possiblePaths = [
      '/usr/bin/soffice',           // Debian/Ubuntu via apt
      '/usr/local/bin/soffice',     // Custom install
      '/opt/libreoffice/program/soffice',  // Official package
      '/snap/bin/soffice',          // Snap install
    ];

    // Find which path exists
    const { execSync } = require('child_process');
    let libreOfficePath = null;

    for (const binPath of possiblePaths) {
      try {
        execSync(`test -f ${binPath}`, { stdio: 'ignore' });
        libreOfficePath = binPath;
        console.log(`Found LibreOffice at: ${binPath}`);
        break;
      } catch (e) {
        // Path doesn't exist, try next
      }
    }

    // If still not found, try which command
    if (!libreOfficePath) {
      try {
        libreOfficePath = execSync('which soffice', { encoding: 'utf8' }).trim();
        console.log(`Found LibreOffice via which: ${libreOfficePath}`);
      } catch (e) {
        console.error('Could not locate soffice binary in any standard location');
      }
    }

    // Read DOCX file
    const docxBuffer = await fs.readFile(docxPath);

    // Convert to PDF - pass the binary path if found
    const convertOptions = libreOfficePath ? { soffice: libreOfficePath } : undefined;
    const pdfBuffer = await libre.convertAsync(docxBuffer, '.pdf', convertOptions);

    // Generate PDF path
    const pdfPath = docxPath.replace('.docx', '.pdf');

    // Save PDF
    await fs.writeFile(pdfPath, pdfBuffer);

    console.log('PDF generated:', pdfPath);
    return pdfPath;

  } catch (error) {
    console.error('PDF conversion error:', error);
    throw error;
  }
};

/**
 * Generate P-Konto certificate
 * Uses Word template to generate certificate and converts to PDF
 *
 * @param {Object} application - Application document from MongoDB
 * @param {Object} options - Generation options
 * @param {boolean} options.convertToPdf - Whether to convert to PDF (default: true)
 * @param {boolean} options.keepDocx - Whether to keep DOCX file after conversion (default: false)
 * @returns {string} - Path to generated document (PDF or DOCX)
 */
const generateCertificate = async (application, options = {}) => {
  try {
    const {
      convertToPdf: shouldConvertToPdf = true,
      keepDocx = false
    } = options;

    console.log('Generating certificate using Word template...');

    // Use Word template service to generate document
    const docxPath = await generateFromWordTemplate(application);

    console.log('Certificate generated (DOCX):', docxPath);

    // Convert to PDF if requested
    if (shouldConvertToPdf) {
      try {
        const pdfPath = await convertToPdf(docxPath);

        // Delete DOCX file if not needed
        if (!keepDocx) {
          await fs.unlink(docxPath);
          console.log('DOCX file removed (PDF created)');
        }

        return pdfPath;
      } catch (pdfError) {
        console.warn('PDF conversion failed, returning DOCX instead:', pdfError.message);
        return docxPath;
      }
    }

    return docxPath;

  } catch (error) {
    console.error('Certificate generation error:', error);
    throw error;
  }
};

/**
 * Fill form fields in PDF template
 */
const fillFormFields = (form, application) => {
  const { personalData, calculationData, calculatedFreibetrag, bankData } = application;

  // Helper to safely fill text field
  const fillTextField = (fieldName, value) => {
    try {
      const field = form.getTextField(fieldName);
      field.setText(String(value));
    } catch (error) {
      console.warn(`Field ${fieldName} not found in template`);
    }
  };

  // Personal Data
  fillTextField('firstName', personalData.firstName);
  fillTextField('lastName', personalData.lastName);
  fillTextField('street', personalData.street);
  fillTextField('houseNumber', personalData.houseNumber);
  fillTextField('zipCode', personalData.zipCode);
  fillTextField('city', personalData.city);
  fillTextField('birthdate', `${personalData.birthdate.day}.${personalData.birthdate.month}.${personalData.birthdate.year}`);
  fillTextField('email', personalData.email);

  // Bank Data
  fillTextField('iban', bankData.iban);
  fillTextField('bic', bankData.bic);

  // Calculation Data
  fillTextField('married', calculationData.married ? 'Ja' : 'Nein');
  fillTextField('childrenCount', calculationData.childrenCount);
  fillTextField('socialBenefitsCount', calculationData.socialBenefitsCount);
  fillTextField('healthCompensation', calculationData.healthCompensation.toFixed(2));

  // Calculated Freibetrag
  fillTextField('freibetrag', calculatedFreibetrag.amount.toFixed(2));

  // Children details
  calculationData.children.forEach((child, index) => {
    fillTextField(`child${index + 1}Birthdate`, `${child.birthdate.day}.${child.birthdate.month}.${child.birthdate.year}`);
    fillTextField(`child${index + 1}Kindergeld`, child.receivesKindergeld ? 'Ja' : 'Nein');
  });

  // Lawyer information
  fillTextField('lawyerName', process.env.LAWYER_NAME);
  fillTextField('lawyerTitle', process.env.LAWYER_TITLE);

  // Date of issue
  const today = new Date();
  fillTextField('issueDate', today.toLocaleDateString('de-DE'));
};

/**
 * Create certificate PDF from scratch if no template exists
 */
const createCertificateFromScratch = async (application) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let yPosition = height - 50;
  const leftMargin = 50;
  const lineHeight = 20;

  const { personalData, calculationData, calculatedFreibetrag, bankData } = application;

  // Header
  page.drawText('Bescheinigung nach § 850k Abs. 4 ZPO', {
    x: leftMargin,
    y: yPosition,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  yPosition -= lineHeight * 2;

  page.drawText('zur Erhöhung des Pfändungsfreibetrages', {
    x: leftMargin,
    y: yPosition,
    size: 14,
    font: boldFont
  });
  yPosition -= lineHeight * 2;

  // Personal Information
  page.drawText('Angaben zum Kontoinhaber:', {
    x: leftMargin,
    y: yPosition,
    size: 12,
    font: boldFont
  });
  yPosition -= lineHeight;

  const salutationMap = { herr: 'Herr', frau: 'Frau', divers: '' };
  const fullName = `${salutationMap[personalData.salutation]} ${personalData.firstName} ${personalData.lastName}`;

  page.drawText(`Name: ${fullName}`, { x: leftMargin, y: yPosition, size: 11, font });
  yPosition -= lineHeight;

  page.drawText(`Adresse: ${personalData.street} ${personalData.houseNumber}, ${personalData.zipCode} ${personalData.city}`, {
    x: leftMargin, y: yPosition, size: 11, font
  });
  yPosition -= lineHeight;

  page.drawText(`Geburtsdatum: ${personalData.birthdate.day}.${personalData.birthdate.month}.${personalData.birthdate.year}`, {
    x: leftMargin, y: yPosition, size: 11, font
  });
  yPosition -= lineHeight * 2;

  // Bank Information
  page.drawText('Bankverbindung:', { x: leftMargin, y: yPosition, size: 12, font: boldFont });
  yPosition -= lineHeight;

  page.drawText(`IBAN: ${bankData.iban}`, { x: leftMargin, y: yPosition, size: 11, font });
  yPosition -= lineHeight;

  page.drawText(`BIC: ${bankData.bic}`, { x: leftMargin, y: yPosition, size: 11, font });
  yPosition -= lineHeight * 2;

  // Freibetrag Calculation
  page.drawText('Berechneter Freibetrag:', { x: leftMargin, y: yPosition, size: 12, font: boldFont });
  yPosition -= lineHeight * 1.5;

  page.drawText(`${calculatedFreibetrag.amount.toFixed(2)} EUR monatlich`, {
    x: leftMargin,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: rgb(0.9, 0.3, 0.2)
  });
  yPosition -= lineHeight * 2;

  // Calculation Details
  page.drawText('Zusammensetzung:', { x: leftMargin, y: yPosition, size: 11, font: boldFont });
  yPosition -= lineHeight;

  if (calculationData.married) {
    page.drawText('✓ Verheiratet/Lebenspartnerschaft', { x: leftMargin + 10, y: yPosition, size: 10, font });
    yPosition -= lineHeight * 0.8;
  }

  if (calculationData.childrenCount > 0) {
    page.drawText(`✓ ${calculationData.childrenCount} unterhaltsberechtigte${calculationData.childrenCount > 1 ? '' : 's'} Kind${calculationData.childrenCount > 1 ? 'er' : ''}`, {
      x: leftMargin + 10, y: yPosition, size: 10, font
    });
    yPosition -= lineHeight * 0.8;
  }

  if (calculationData.socialBenefitsCount > 0) {
    page.drawText(`✓ ${calculationData.socialBenefitsCount} weitere Person${calculationData.socialBenefitsCount > 1 ? 'en' : ''} mit Sozialleistungen`, {
      x: leftMargin + 10, y: yPosition, size: 10, font
    });
    yPosition -= lineHeight * 0.8;
  }

  if (calculationData.healthCompensation > 0) {
    page.drawText(`✓ Gesundheitsschäden: ${calculationData.healthCompensation.toFixed(2)} EUR`, {
      x: leftMargin + 10, y: yPosition, size: 10, font
    });
    yPosition -= lineHeight * 0.8;
  }

  yPosition -= lineHeight;

  // Legal Text
  page.drawText('Hiermit wird bescheinigt, dass die oben genannte Person berechtigt ist, den', {
    x: leftMargin, y: yPosition, size: 10, font
  });
  yPosition -= lineHeight * 0.8;

  page.drawText('Pfändungsfreibetrag auf ihrem Pfändungsschutzkonto (P-Konto) auf den oben', {
    x: leftMargin, y: yPosition, size: 10, font
  });
  yPosition -= lineHeight * 0.8;

  page.drawText('angegebenen Betrag erhöhen zu lassen.', {
    x: leftMargin, y: yPosition, size: 10, font
  });
  yPosition -= lineHeight * 2;

  // Footer - Lawyer Signature
  const today = new Date().toLocaleDateString('de-DE');
  page.drawText(`Ausgestellt am: ${today}`, { x: leftMargin, y: 150, size: 10, font });
  page.drawText(`${process.env.LAWYER_TITLE} ${process.env.LAWYER_NAME}`, {
    x: leftMargin, y: 120, size: 11, font: boldFont
  });

  return pdfDoc;
};

module.exports = {
  generateCertificate,
  convertToPdf
};
