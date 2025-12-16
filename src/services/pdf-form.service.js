const fs = require('fs').promises;
const path = require('path');
const { PDFDocument } = require('pdf-lib');

/**
 * Fill PDF form fields with application data
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

    console.log('Loading PDF form template...');

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
        console.log(`  ✓ ${fieldName}: ${checked ? '☑' : '☐'}`);
      } catch (error) {
        console.warn(`  ⚠️  Checkbox "${fieldName}" not found`);
      }
    };

    // Format helpers
    const formatDate = (dateObj) => {
      return `${String(dateObj.day).padStart(2, '0')}.${String(dateObj.month).padStart(2, '0')}.${dateObj.year}`;
    };

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

    setTextField('Name', `${lawyerTitle} ${lawyerName}`);
    setTextField('Straße', 'Bongardstraße');
    setTextField('Hausnummer', '33');
    setTextField('Postleitzahl', '44787');
    setTextField('Ort', 'Bochum');
    setTextField('Ansprechpartnerin', `${lawyerTitle} ${lawyerName}; Tel: ${lawyerPhone}; E-mail: ${lawyerEmail}`);

    // Checkboxes: Law firm is "geeignete Stelle" but we don't check it here
    setCheckBox('geeignete Person gemäß  305 Abs 1 Nr 1 InsO', false);
    setCheckBox('geeignete Stelle gemäß  305 Abs 1 Nr 1 InsO', false);

    // ============================================================
    // SECTION II: Customer Information
    // ============================================================
    const fullName = `${salutationMap[personalData.salutation]} ${personalData.firstName} ${personalData.lastName}`.trim();
    const fullAddress = `${personalData.street} ${personalData.houseNumber}, ${personalData.zipCode} ${personalData.city}`;

    setTextField('Kontoinhaber', fullName);
    setTextField('Geburtsdatum', formatDate(personalData.birthdate));
    setTextField('Anschrift', fullAddress);

    // Bank data
    setTextField('bic', bankData.bic);
    setTextField('iban', bankData.iban);

    // ============================================================
    // SECTION III: Freibetrag Calculation
    // ============================================================

    // Base Freibetrag (always 1560.00 EUR as of 2025) - Always check this checkbox
    const baseFreibetrag = '1.560,00';
    setCheckBox('Grundfreibetrag des Schuldners  Kontoinhaber derzeit', true);

    // First person (married/partnership)
    const erhöhungErsteerson = calculationData.married ? '585,23' : '';
    setTextField('Erhöhungsbetrag für die erste Person derzeit1 in Höhe von 58523 € in Höhe von', erhöhungErsteerson);

    // Check "a) aufgrund gesetzlicher Verpflichtung" if married
    if (calculationData.married) {
      setCheckBox('a der aufgrund gesetzlicher Verpflichtung Unterhalt gewährt wird oder', true);
    }

    // Additional persons checkboxes
    const additionalPersons = calculationData.childrenCount;
    setCheckBox('eine', additionalPersons === 1);
    setCheckBox('zwei', additionalPersons === 2);
    setCheckBox('drei', additionalPersons === 3);
    setCheckBox('vier', additionalPersons >= 4);

    // Children amount
    const childrenAmount = additionalPersons > 0 ? formatCurrency(additionalPersons * 326.04) : '';
    setTextField('Erhöhungsbetrag für eine zwei drei vier weitere Personen derzeit1 iHv von je 32604 € in Höhe von', childrenAmount);

    // Check "a) aufgrund gesetzlicher Verpflichtung" if children exist
    if (additionalPersons > 0) {
      setCheckBox('a der aufgrund gesetzlicher Verpflichtung Unterhalt gewährt wird oder_2', true);
    }

    // Calculate total number of dependents (Unterhaltspflichtige Personen)
    const totalDependents = (calculationData.married ? 1 : 0) + additionalPersons;

    // Set checkboxes for number of dependents
    // If 1 person: check only first box
    // If 2+ persons: check BOTH boxes
    setCheckBox('Kontrollkästchen 1. Person Unterhalt', totalDependents >= 1);
    setCheckBox('Kontrollkästchen 2. Person Unterhalt', totalDependents >= 2);

    // ============================================================
    // SECTION IV: Additional Monthly Benefits
    // ============================================================

    // Kindergeld section
    if (calculationData.children && calculationData.children.length > 0) {
      // Check if any child receives Kindergeld
      const hasKindergeld = calculationData.children.some(child => child.receivesKindergeld);

      // Set main Kindergeld checkbox if any child receives Kindergeld
      if (hasKindergeld) {
        setCheckBox('Kindergeld für  902 Satz 1 Nr 5 ZPO2', true);
      }

      calculationData.children.forEach((child, index) => {
        if (index < 5) { // Only first 5 children have fields
          const childNum = index + 1;
          const birthdate = formatDate(child.birthdate);

          // Set checkbox for "Kind X geboren im Monat/Jahr"
          if (child.receivesKindergeld) {
            setCheckBox(`Kind ${childNum} geboren im MonatJahr`, true);
          }

          // Set birthdate text field
          setTextField(`Kind ${childNum} Geburtstag`, birthdate);
        }
      });

      // If more than 5 children
      if (calculationData.children.length > 5) {
        setTextField('weitere Kinder3 Anzahl', String(calculationData.children.length - 5));
      }
    }

    // Other child-related financial benefits (e.g., Kinderzuschlag, Unterhaltsvorschuss, Betreuungsgeld)
    // § 902 Satz 1 Nr 5 ZPO
    const hasOtherChildBenefits = calculationData.healthCompensation > 0;
    if (hasOtherChildBenefits) {
      setCheckBox('Andere gesetzliche Geldleistungen für Kinder  z B Kinderzuschlag und vergleichbare', true);
      setTextField('Rentenbestandteile  902 Satz 1 Nr 5 ZPO in Höhe von', formatCurrency(calculationData.healthCompensation));
    }

    // ============================================================
    // TOTAL FREIBETRAG
    // ============================================================
    setTextField('Monatlicher Gesamtfreibetrag', formatCurrency(calculatedFreibetrag.amount));

    // ============================================================
    // SECTION V: Entity Type (Arbeitgeber, Sozialleistungsträger, etc.)
    // ============================================================
    // Leave all unchecked - law firm issues the certificate
    setCheckBox('Arbeitgeber', false);
    setCheckBox('Sozialleistungsträger', false);
    setCheckBox('sonstiger Leistungsträger  902 ZPO', false);
    setCheckBox('Familienkasse', false);

    // ============================================================
    // Date and Signature
    // ============================================================
    setTextField('Ort Datum', `Bochum, ${today}`);

    // Signature/stamp field - leave empty (will be signed manually)
    // setTextField('Unterschrift  Stempel der bescheinigenden Person oder Stelle', '');

    // Footer note about annual adjustment
    setTextField('die Freibeträge werden jährlich zum 0107 angepasst',
      '¹ die Freibeträge werden jährlich zum 01.07. angepasst');

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
    // Note: Flattening disabled due to Adobe PDF compatibility issues
    // The fields will remain editable but visible
    // console.log('Flattening form (converting to static content)...');
    // form.flatten();
    // console.log('✓ Form flattened');

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
