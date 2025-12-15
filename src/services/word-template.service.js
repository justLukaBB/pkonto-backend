const fs = require('fs').promises;
const path = require('path');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');

/**
 * Generate P-Konto certificate from Word template
 *
 * Your Word template should contain placeholders like:
 * <<firstName>>, <<lastName>>, <<street>>, <<iban>>, <<freibetrag>>, etc.
 *
 * @param {Object} application - Application document from MongoDB
 * @returns {string} - Path to generated DOCX file
 */
const generateFromWordTemplate = async (application) => {
  try {
    const templatePath = path.join(__dirname, '../templates/certificate-template.docx');

    // Use /tmp for Vercel serverless, local uploads otherwise
    const isVercel = process.env.VERCEL === '1';
    const outputDir = isVercel ? '/tmp' : path.join(__dirname, '../../uploads');
    const outputPath = path.join(outputDir, `certificate-${application._id}.docx`);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Read template
    console.log('Loading Word template...');
    const templateContent = await fs.readFile(templatePath, 'binary');

    // Create ZIP from template
    const zip = new PizZip(templateContent);

    // Create docxtemplater instance with << >> delimiters
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: '<<',
        end: '>>'
      }
    });

    // Prepare data for template
    const templateData = prepareTemplateData(application);

    console.log('Filling template with data...');

    // Fill template
    doc.render(templateData);

    // Generate output
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // Save file
    await fs.writeFile(outputPath, buf);

    console.log('Word certificate generated:', outputPath);
    return outputPath;

  } catch (error) {
    console.error('Word template generation error:', error);

    // Log more details for template errors
    if (error.properties && error.properties.errors) {
      console.error('Template errors:', error.properties.errors);
    }

    throw error;
  }
};

/**
 * Prepare application data for Word template
 * Maps MongoDB data to template placeholders
 */
const prepareTemplateData = (application) => {
  const { personalData, calculationData, calculatedFreibetrag, bankData } = application;

  // Format date
  const formatDate = (dateObj) => {
    return `${String(dateObj.day).padStart(2, '0')}.${String(dateObj.month).padStart(2, '0')}.${dateObj.year}`;
  };

  // Salutation mapping
  const salutationMap = {
    herr: 'Herr',
    frau: 'Frau',
    divers: ''
  };

  // Get today's date
  const today = new Date();
  const todayFormatted = today.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Determine if issuing entity is "Person" or "Stelle"
  // Default: Always "geeignete Stelle" (suitable entity) for lawyer/law firm
  const isGeeignetePerson = false; // Set to true if individual person, false for entity/firm
  const isGeeigneteStelle = true;  // Always true for Rechtsanwalt (law firm/office)

  // Base data
  const data = {
    // Personal Information (English names)
    salutation: salutationMap[personalData.salutation] || '',
    firstName: personalData.firstName,
    lastName: personalData.lastName,
    fullName: `${salutationMap[personalData.salutation]} ${personalData.firstName} ${personalData.lastName}`.trim(),
    street: personalData.street,
    houseNumber: personalData.houseNumber,
    fullAddress: `${personalData.street} ${personalData.houseNumber}`,
    zipCode: personalData.zipCode,
    city: personalData.city,
    fullCityLine: `${personalData.zipCode} ${personalData.city}`,
    birthdate: formatDate(personalData.birthdate),
    email: personalData.email,
    phone: personalData.phone || '',

    // Personal Information (German aliases for compatibility)
    vorname: personalData.firstName,
    name: personalData.lastName,
    'G-Datum': formatDate(personalData.birthdate),
    straße: personalData.street,
    hausnummer: personalData.houseNumber,
    plz: personalData.zipCode,
    ort: personalData.city,

    // Bank Information
    iban: bankData.iban,
    bic: bankData.bic,
    bic_swift: bankData.bic,

    // Calculation Data
    married: calculationData.married ? 'Ja' : 'Nein',
    marriedCheck: calculationData.married ? '☑' : '☐',
    notMarriedCheck: !calculationData.married ? '☑' : '☐',
    childrenCount: calculationData.childrenCount,
    socialBenefitsCount: calculationData.socialBenefitsCount,
    healthCompensation: calculationData.healthCompensation.toFixed(2),
    healthCompensationFormatted: new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(calculationData.healthCompensation),

    // Calculated Freibetrag
    freibetrag: calculatedFreibetrag.amount.toFixed(2),
    freibetragFormatted: new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(calculatedFreibetrag.amount),
    freibetragDetails: calculatedFreibetrag.details,

    // Issuing Entity Checkboxes (for "Die Bescheinigung wird erteilt als")
    geeignetePersonCheck: isGeeignetePerson ? '☑' : '☐',
    geeigneteStelleCheck: isGeeigneteStelle ? '☑' : '☐',

    // Additional checkboxes for various fields
    hasHealthCompensationCheck: calculationData.healthCompensation > 0 ? '☑' : '☐',
    noHealthCompensationCheck: calculationData.healthCompensation === 0 ? '☑' : '☐',

    // Lawyer Information
    lawyerTitle: process.env.LAWYER_TITLE || 'Rechtsanwalt',
    lawyerName: process.env.LAWYER_NAME || '',
    lawyerFullName: `${process.env.LAWYER_TITLE} ${process.env.LAWYER_NAME}`,

    // Date
    issueDate: todayFormatted,
    today: todayFormatted,
    currentDate: todayFormatted,

    // Application ID (for reference)
    applicationId: application._id.toString()
  };

  // Add children information
  if (calculationData.children && calculationData.children.length > 0) {
    data.children = calculationData.children.map((child, index) => ({
      number: index + 1,
      birthdate: formatDate(child.birthdate),
      receivesKindergeld: child.receivesKindergeld ? 'Ja' : 'Nein',
      kindergeldCheck: child.receivesKindergeld ? '☑' : '☐',
      noKindergeldCheck: !child.receivesKindergeld ? '☑' : '☐'
    }));

    // Also add individual child fields (for simple templates)
    calculationData.children.forEach((child, index) => {
      const num = index + 1;
      data[`child${num}Birthdate`] = formatDate(child.birthdate);
      data[`child${num}Kindergeld`] = child.receivesKindergeld ? 'Ja' : 'Nein';
    });
  } else {
    data.children = [];
  }

  // Add calculation breakdown
  data.hasMarriedBonus = calculationData.married;
  data.hasChildren = calculationData.childrenCount > 0;
  data.hasSocialBenefits = calculationData.socialBenefitsCount > 0;
  data.hasHealthCompensation = calculationData.healthCompensation > 0;

  return data;
};

module.exports = {
  generateFromWordTemplate,
  prepareTemplateData
};
