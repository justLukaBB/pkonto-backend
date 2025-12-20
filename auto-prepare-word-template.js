const fs = require('fs').promises;
const PizZip = require('pizzip');
const path = require('path');

/**
 * Automatically prepare Word template by inserting placeholders
 * This script modifies the document.xml inside the Word file (which is a ZIP)
 */

async function autoPrepareTemplate() {
  try {
    const inputPath = path.join(__dirname, 'src/templates/pkonto-template-2025.docx');
    const outputPath = path.join(__dirname, 'src/templates/pkonto-template-2025-with-placeholders.docx');

    console.log('Reading Word template...');
    const content = await fs.readFile(inputPath, 'binary');
    const zip = new PizZip(content);

    // Get document.xml (main content)
    let documentXml = zip.file('word/document.xml').asText();

    console.log('Original document length:', documentXml.length);

    // Replace specific patterns in the XML
    // Word uses <w:t> tags for text content
    // We need to replace empty form fields with our placeholders

    // Section I: Lawyer/Issuing entity info
    documentXml = insertPlaceholderAfter(documentXml, 'Name', '<<lawyerName>>');
    documentXml = insertPlaceholderAfter(documentXml, 'Straße', '<<lawyerStreet>>');
    documentXml = insertPlaceholderAfter(documentXml, 'Hausnummer', '<<lawyerHouseNumber>>');
    documentXml = insertPlaceholderAfter(documentXml, 'Postleitzahl', '<<lawyerZipCode>>');
    documentXml = insertPlaceholderAfter(documentXml, 'Ort', '<<lawyerCity>>');
    documentXml = insertPlaceholderAfter(documentXml, 'Ansprechpartner:in', '<<lawyerContact>>');

    // Section II: Customer info
    documentXml = insertPlaceholderAfter(documentXml, 'Kontoinhaber:in', '<<fullName>>');
    documentXml = insertPlaceholderAfter(documentXml, 'Geburtsdatum', '<<birthdate>>');
    documentXml = insertPlaceholderAfter(documentXml, 'Anschrift', '<<fullAddress>>');
    documentXml = insertPlaceholderAfter(documentXml, 'Kreditinstitut', '<<bic>>');
    documentXml = insertPlaceholderAfter(documentXml, 'Kontonummer oder IBAN', '<<iban>>');

    // Section III: Amounts
    documentXml = insertPlaceholderInAmountField(documentXml, 'Erhöhungsbetrag für die erste Person', '<<erhöhungErstePerson>>');
    documentXml = insertPlaceholderInAmountField(documentXml, 'Erhöhungsbetrag für.*weitere Person', '<<erhöhungWeiterePers>>');

    // Section IV: Additional benefits
    documentXml = insertPlaceholderInAmountField(documentXml, 'Kindergeld für', '<<kindergeldBetrag>>');
    documentXml = insertPlaceholderAfter(documentXml, 'Kind 1.*geboren im Monat/Jahr', '<<kind1MonatJahr>>');
    documentXml = insertPlaceholderAfter(documentXml, 'Kind 2.*geboren im Monat/Jahr', '<<kind2MonatJahr>>');
    documentXml = insertPlaceholderAfter(documentXml, 'Kind 3.*geboren im Monat/Jahr', '<<kind3MonatJahr>>');
    documentXml = insertPlaceholderAfter(documentXml, 'Kind 4.*geboren im Monat/Jahr', '<<kind4MonatJahr>>');
    documentXml = insertPlaceholderAfter(documentXml, 'Kind 5.*geboren im Monat/Jahr', '<<kind5MonatJahr>>');

    // Total amount
    documentXml = insertPlaceholderAfter(documentXml, 'Monatlicher Gesamtfreibetrag', '<<freibetragFormatted>>');

    // Date
    documentXml = insertPlaceholderBefore(documentXml, 'Unterschrift/ Stempel', '<<ortDatum>>');

    console.log('Modified document length:', documentXml.length);

    // Update the ZIP with modified XML
    zip.file('word/document.xml', documentXml);

    // Generate new Word file
    const newContent = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    await fs.writeFile(outputPath, newContent);

    console.log('\n✅ Template prepared successfully!');
    console.log('Output:', outputPath);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

/**
 * Insert placeholder after a label in the XML
 */
function insertPlaceholderAfter(xml, label, placeholder) {
  // This is a simplified approach - we'll look for the label and insert placeholder nearby
  // In Word XML, text is in <w:t> tags

  // Create a simple text run with the placeholder
  const placeholderXml = `<w:r><w:t>${placeholder}</w:t></w:r>`;

  // Try to find the label and insert after it
  const labelRegex = new RegExp(`(<w:t[^>]*>${label}[^<]*</w:t>)`, 'i');

  if (xml.match(labelRegex)) {
    xml = xml.replace(labelRegex, `$1${placeholderXml}`);
    console.log(`  ✓ Inserted ${placeholder} after "${label}"`);
  }

  return xml;
}

/**
 * Insert placeholder before a label
 */
function insertPlaceholderBefore(xml, label, placeholder) {
  const placeholderXml = `<w:r><w:t>${placeholder}</w:t></w:r>`;
  const labelRegex = new RegExp(`(<w:t[^>]*>${label}[^<]*</w:t>)`, 'i');

  if (xml.match(labelRegex)) {
    xml = xml.replace(labelRegex, `${placeholderXml}$1`);
    console.log(`  ✓ Inserted ${placeholder} before "${label}"`);
  }

  return xml;
}

/**
 * Insert placeholder in amount field (after "in Höhe von")
 */
function insertPlaceholderInAmountField(xml, sectionLabel, placeholder) {
  // Find "in Höhe von" after the section label
  const placeholderXml = `<w:r><w:t>${placeholder}</w:t></w:r>`;

  // This is tricky - we need to find the right "in Höhe von" field
  // For now, just use the same logic
  const labelRegex = new RegExp(`(${sectionLabel}.*?in Höhe von)`, 'is');

  if (xml.match(labelRegex)) {
    xml = xml.replace(labelRegex, `$1 ${placeholderXml}`);
    console.log(`  ✓ Inserted ${placeholder} in amount field for "${sectionLabel}"`);
  }

  return xml;
}

autoPrepareTemplate();
