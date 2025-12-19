const fs = require('fs').promises;
const path = require('path');
const { PDFDocument } = require('pdf-lib');

/**
 * Fill PDF form fields with application data (NEW TEMPLATE 2025)
 *
 * @param {Object} application - Application document from MongoDB
 * @returns {string} - Path to generated filled PDF file
 */
const fillPdfForm = async (application) => {
  try {
    const templatePath = path.join(__dirname, '../templates/certificate-template-form.pdf');

    // Use /tmp for Vercel serverless, local uploads otherwise
    const isVercel = process.env.VERCEL === '1';
    const outputDir = isVercel ? '/tmp' : path.join(__dirname, '../../uploads');
    const outputPath = path.join(outputDir, `certificate-${application._id}.pdf`);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    console.log('Loading NEW PDF form template...');

    // Load PDF template
    const existingPdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Get the form
    const form = pdfDoc.getForm();

    console.log('Filling PDF form fields...');

    // Prepare data
    const { personalData, calculationData, calculatedFreibetrag, bankData } = application;

    // Helper function to safely set text field
    const setTextField = (fieldName, value) => {
      try {
        const field = form.getTextField(fieldName);
        field.setText(String(value || ''));
        console.log(`  ✓ ${fieldName}: ${value}`);
      } catch (error) {
        console.warn(`  ⚠️  Field "${fieldName}" not found or cannot be set`);
      }
    };

    // Helper function to safely set checkbox
    const setCheckBox = (fieldName, checked) => {
      try {
        const field = form.getCheckBox(fieldName);
        if (checked) {
          field.check();
        } else {
          field.uncheck();
        }
        console.log(`  ✓ ${fieldName}: ${checked ? '☑' : '☐'}`);;
      } catch (error) {
        console.warn(`  ⚠️  Checkbox "${fieldName}" not found`);
      }
    };

    // Format helpers
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    };

    const salutationMap = {
      herr: 'Herr',
      frau: 'Frau',
      divers: ''
    };

    // Today's date
    const today = new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // ============================================================
    // SECTION I: Lawyer Information
    // ============================================================
    const lawyerName = process.env.LAWYER_NAME || 'Thomas Scuric';
    const lawyerTitle = process.env.LAWYER_TITLE || 'Rechtsanwalt';
    const lawyerPhone = process.env.LAWYER_PHONE || '0234 913 68 10';
    const lawyerEmail = process.env.LAWYER_EMAIL || 'info@ra-scuric.de';

    setTextField('Name - Anwalt', `${lawyerTitle} ${lawyerName}`);
    setTextField('Straße', 'Bongardstraße');
    setTextField('Hausnummer', '33');
    setTextField('PLZ', '44787');
    setTextField('Ort', 'Bochum');
    setTextField('Ansprechpartner', `${lawyerTitle} ${lawyerName}; Tel: ${lawyerPhone}; E-mail: ${lawyerEmail}`);

    // Checkbox: Geeignete Person (law firm doesn't check this)
    setCheckBox('Kontrollkästchen Geignette Person', false);

    // ============================================================
    // SECTION II: Customer Information
    // ============================================================
    const fullName = `${salutationMap[personalData.salutation]} ${personalData.firstName} ${personalData.lastName}`.trim();
    const fullAddress = `${personalData.street} ${personalData.houseNumber}, ${personalData.zipCode} ${personalData.city}`;
    const birthdate = `${String(personalData.birthdate.day).padStart(2, '0')}.${String(personalData.birthdate.month).padStart(2, '0')}.${personalData.birthdate.year}`;

    setTextField('Kontoinhaber', fullName);
    setTextField('Geburtsdatum', birthdate);
    setTextField('Anschrift', fullAddress);

    // Bank data
    setTextField('Kreditinsitut', bankData.bic); // Note: Field name has typo "Kreditinsitut"
    setTextField('IBAN', bankData.iban);

    // ============================================================
    // SECTION III: Freibetrag Calculation
    // ============================================================

    // First person logic:
    // - If married: spouse is first person (585,23 EUR)
    // - If not married but has children: first child is first person (585,23 EUR)
    const totalChildren = calculationData.childrenCount || 0;
    const hasFirstPerson = calculationData.married || totalChildren > 0;
    const erhöhungErstePerson = hasFirstPerson ? '585,23' : '';

    setTextField('Erhöhun 1. Person', erhöhungErstePerson); // Note: Field name has typo "Erhöhun"

    // Check "Erhöhungsbetrag Erste Person" if first person exists
    setCheckBox('Kontrollkästchen Erhöhungsbetrag Erste Person', hasFirstPerson);

    // Additional persons (weitere Personen):
    // - If married: ALL children are additional persons
    // - If not married: remaining children (total - 1) are additional persons
    let additionalPersons = 0;
    if (calculationData.married) {
      additionalPersons = totalChildren; // All children
    } else if (totalChildren > 0) {
      additionalPersons = totalChildren - 1; // First child already counted as "erste Person"
    }

    // Calculate amount for additional persons
    const erhöhungWeiterePers = additionalPersons > 0 ? formatCurrency(additionalPersons * 326.04) : '';
    setTextField('Erhöhun 2. Person', erhöhungWeiterePers); // Note: Field name has typo

    // Checkboxes for number of additional persons
    if (additionalPersons > 0) {
      setCheckBox('Kontrollkästchen Erhöhungsbetrag mehrere Person', true);
      setCheckBox('Kontrollkästchen Erhöhungsbetrag mehrere Person / 1. Person', additionalPersons >= 1);
      setCheckBox('Kontrollkästchen Erhöhungsbetrag mehrere Person / 2. Person', additionalPersons >= 2);
      setCheckBox('Kontrollkästchen Erhöhungsbetrag mehrere Person / 3. Person', additionalPersons >= 3);
      setCheckBox('Kontrollkästchen Erhöhungsbetrag mehrere Person / 4. Person', additionalPersons >= 4);
    }

    // ============================================================
    // SECTION IV: Kindergeld (NEW LOGIC!)
    // ============================================================
    let totalKindergeld = 0;
    let kindergeldCount = 0;

    if (calculationData.children && calculationData.children.length > 0) {
      // Process first 5 children
      calculationData.children.forEach((child, index) => {
        if (index < 5) { // Only first 5 children have dedicated fields
          const childNum = index + 1;

          if (child.receivesKindergeld) {
            kindergeldCount++;
            totalKindergeld += 255;

            // Set 255 EUR for this child
            setTextField(`Kindergeld 255 ${childNum}. Person`, '255,00');

            // Set Monat and Jahr
            const month = String(child.birthdate.month).padStart(2, '0');
            const year = child.birthdate.year;
            setTextField(`${childNum}. Kind Monat`, month);
            setTextField(`${childNum}. Kind Jahr`, String(year));

            // Check the checkbox for this child
            setCheckBox(`Kontrollkästchen Kindergeld mehrere Person / ${childNum}. Person`, true);
          }
        }
      });

      // Handle more than 5 children
      if (calculationData.children.length > 5) {
        const additionalChildren = calculationData.children.slice(5);
        const additionalKindergeldCount = additionalChildren.filter(child => child.receivesKindergeld).length;

        if (additionalKindergeldCount > 0) {
          kindergeldCount += additionalKindergeldCount;
          totalKindergeld += additionalKindergeldCount * 255;

          // Set anzahl and betrag for additional children
          setTextField('Kindergeld weitere Kinder Anzahl', String(additionalKindergeldCount));
          setTextField('Kindergeld weitere Kinder Anzahl (Betrag)', formatCurrency(additionalKindergeldCount * 255));

          // Check the "weitere Person" checkbox
          setCheckBox('Kontrollkästchen Kindergeld mehrere Person / weitere Person', true);
        }
      }

      // Set total Kindergeld
      if (kindergeldCount > 0) {
        setTextField('Kindergeld zusammen', formatCurrency(totalKindergeld));
        setCheckBox('Kontrollkästchen Kindergeld mehrere Person', true);
        setCheckBox('Kontrollkästchen Kindergeld mehrere Person / 1. Person', true);
      }
    }

    // ============================================================
    // TOTAL FREIBETRAG
    // ============================================================
    setTextField('Gesamtbetrag', formatCurrency(calculatedFreibetrag.amount));

    // ============================================================
    // Date and Signature
    // ============================================================
    setTextField('Ort, Datum', `Bochum, ${today}`);

    // ============================================================
    // Update field appearances (CRITICAL!)
    // ============================================================
    console.log('\nUpdating field appearances...');
    try {
      form.updateFieldAppearances();
      console.log('✓ Field appearances updated');
    } catch (error) {
      console.warn('⚠️  Could not update appearances:', error.message);
    }

    // ============================================================
    // Flatten form (make fields read-only and visible)
    // ============================================================
    console.log('\nAttempting to flatten form (converting to static content)...');
    try {
      form.flatten();
      console.log('✓ Form flattened - fields are now permanent and visible in all PDF readers');
    } catch (error) {
      console.warn('⚠️  Could not flatten form (template has broken references):', error.message);
      console.warn('⚠️  PDF will be saved with form fields intact. Field appearances have been updated.');
      console.warn('⚠️  Note: Some PDF readers may not display form field values correctly.');
    }

    console.log('\nSaving filled PDF...');

    // Save filled PDF
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);

    console.log('PDF form filled successfully:', outputPath);
    return outputPath;

  } catch (error) {
    console.error('PDF form filling error:', error);
    throw error;
  }
};

module.exports = {
  fillPdfForm
};
