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
    // Use the new 2025 P-Konto template
    const templatePath = path.join(__dirname, '../templates/pkonto-template-2025.docx');

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

  // Format currency in German format
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' €';
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

  // Calculate P-Konto specific amounts
  const totalChildren = calculationData.childrenCount || 0;
  const hasFirstPerson = calculationData.married || totalChildren > 0;

  // First person logic (spouse or first child)
  const erhöhungErstePerson = hasFirstPerson ? '585,23' : '';

  // Additional persons (weitere Personen)
  let additionalPersons = 0;
  if (calculationData.married) {
    additionalPersons = totalChildren; // All children
  } else if (totalChildren > 0) {
    additionalPersons = totalChildren - 1; // First child already counted
  }

  const erhöhungWeiterePers = additionalPersons > 0 ? formatCurrency(additionalPersons * 326.04) : '';

  // Kindergeld calculation
  let kindergeldBetrag = '';
  let kind1MonatJahr = '';
  let kind2MonatJahr = '';
  let kind3MonatJahr = '';
  let kind4MonatJahr = '';
  let kind5MonatJahr = '';

  if (calculationData.children && calculationData.children.length > 0) {
    const kindergeldCount = calculationData.children.filter(child => child.receivesKindergeld).length;
    if (kindergeldCount > 0) {
      kindergeldBetrag = formatCurrency(kindergeldCount * 255);
    }

    // Format individual child birthdates as "MM/YYYY"
    calculationData.children.forEach((child, index) => {
      if (child.receivesKindergeld) {
        const birthdate = child.birthdate;
        const formatted = `${String(birthdate.month).padStart(2, '0')}/${birthdate.year}`;

        if (index === 0) kind1MonatJahr = formatted;
        else if (index === 1) kind2MonatJahr = formatted;
        else if (index === 2) kind3MonatJahr = formatted;
        else if (index === 3) kind4MonatJahr = formatted;
        else if (index === 4) kind5MonatJahr = formatted;
      }
    });
  }

  // Lawyer/Issuing entity information
  const lawyerName = process.env.LAWYER_NAME || 'Thomas Scuric';
  const lawyerTitle = process.env.LAWYER_TITLE || 'Rechtsanwalt';
  const lawyerPhone = process.env.LAWYER_PHONE || '0234 913 68 10';
  const lawyerEmail = process.env.LAWYER_EMAIL || 'info@ra-scuric.de';

  // Base data
  const data = {
    // ===== SECTION I: Issuing Entity (Lawyer/Law Firm) =====
    lawyerName: `${lawyerTitle} ${lawyerName}`,
    lawyerStreet: 'Bongardstraße',
    lawyerHouseNumber: '33',
    lawyerZipCode: '44787',
    lawyerCity: 'Bochum',
    lawyerContact: `${lawyerTitle} ${lawyerName}; Tel: ${lawyerPhone}; E-mail: ${lawyerEmail}`,

    // Checkboxes for entity type
    geeignetePersonCheck: '☐',
    geeigneteStelleCheck: '☐', // Law firm doesn't check these boxes

    // ===== SECTION II: Customer Information =====
    fullName: `${salutationMap[personalData.salutation]} ${personalData.firstName} ${personalData.lastName}`.trim(),
    birthdate: formatDate(personalData.birthdate),
    fullAddress: `${personalData.street} ${personalData.houseNumber}, ${personalData.zipCode} ${personalData.city}`,
    bic: bankData.bic, // Kreditinstitut
    iban: bankData.iban,

    // ===== SECTION III: Freibetrag Calculation =====
    // Base amount is always 1.560,00 EUR (automatically in template)
    erhöhungErstePerson: erhöhungErstePerson,
    erhöhungWeiterePers: erhöhungWeiterePers,

    // Checkboxes for number of additional persons
    einePersonCheck: additionalPersons === 1 ? '☑' : '☐',
    zweiPersonenCheck: additionalPersons === 2 ? '☑' : '☐',
    dreiPersonenCheck: additionalPersons === 3 ? '☑' : '☐',
    vierPersonenCheck: additionalPersons >= 4 ? '☑' : '☐',

    // ===== SECTION IV: Additional Monthly Benefits =====
    kindergeldBetrag: kindergeldBetrag,
    kind1MonatJahr: kind1MonatJahr,
    kind2MonatJahr: kind2MonatJahr,
    kind3MonatJahr: kind3MonatJahr,
    kind4MonatJahr: kind4MonatJahr,
    kind5MonatJahr: kind5MonatJahr,

    // Health compensation (Gesundheitsschaden)
    gesundheitsschaden: calculationData.healthCompensation > 0 ? formatCurrency(calculationData.healthCompensation) : '',

    // ===== TOTAL FREIBETRAG =====
    freibetragFormatted: formatCurrency(calculatedFreibetrag.amount),

    // ===== Date and Signature =====
    ortDatum: `Bochum, ${todayFormatted}`,

    // ===== Additional fields for compatibility =====
    firstName: personalData.firstName,
    lastName: personalData.lastName,
    street: personalData.street,
    houseNumber: personalData.houseNumber,
    zipCode: personalData.zipCode,
    city: personalData.city,
    email: personalData.email,
    phone: personalData.phone || '',

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
