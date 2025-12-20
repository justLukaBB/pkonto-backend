const fs = require('fs').promises;
const PizZip = require('pizzip');
const path = require('path');

/**
 * Script to prepare Word template by replacing form fields with placeholders
 * Word documents (.docx) are ZIP files containing XML
 */

async function prepareTemplate() {
  try {
    const inputPath = path.join(__dirname, 'src/templates/pkonto-template-2025.docx');
    const outputPath = path.join(__dirname, 'src/templates/pkonto-template-2025-prepared.docx');

    console.log('Reading Word template...');
    const content = await fs.readFile(inputPath, 'binary');
    const zip = new PizZip(content);

    // Get document.xml (main content)
    let documentXml = zip.file('word/document.xml').asText();

    console.log('\nOriginal document length:', documentXml.length);

    // Define field mappings: what to search for and what placeholder to replace with
    const fieldMappings = [
      // Section I: Issuing entity information
      { search: /(<w:t[^>]*>)\s*(<\/w:t>)/g, placeholder: '<<lawyerName>>', context: 'Name' },

      // Section II: Customer information
      // We'll replace empty text fields with placeholders

      // For now, let's just add placeholders in strategic places
    ];

    console.log('\n⚠️  Manual template preparation required!');
    console.log('\nTo prepare the Word template:');
    console.log('1. Open:', inputPath);
    console.log('2. Replace form fields with these placeholders:');
    console.log('\n=== Section I: Bescheinigend Person/Stelle ===');
    console.log('   Name: <<lawyerName>>');
    console.log('   Straße: <<lawyerStreet>>');
    console.log('   Hausnummer: <<lawyerHouseNumber>>');
    console.log('   Postleitzahl: <<lawyerZipCode>>');
    console.log('   Ort: <<lawyerCity>>');
    console.log('   Ansprechpartner:in: <<lawyerContact>>');

    console.log('\n=== Section II: Kontoinhaber ===');
    console.log('   Kontoinhaber:in: <<fullName>>');
    console.log('   Geburtsdatum: <<birthdate>>');
    console.log('   Anschrift: <<fullAddress>>');
    console.log('   Kreditinstitut: <<bic>>');
    console.log('   Kontonummer oder IBAN: <<iban>>');

    console.log('\n=== Section III: Freibetrag Berechnung ===');
    console.log('   Erhöhungsbetrag erste Person: <<erhöhungErstePerson>>');
    console.log('   Erhöhungsbetrag weitere Personen: <<erhöhungWeiterePers>>');

    console.log('\n=== Section IV: Weitere Geldleistungen ===');
    console.log('   Kindergeld Betrag: <<kindergeldBetrag>>');
    console.log('   Kind 1 Monat/Jahr: <<kind1MonatJahr>>');
    console.log('   Kind 2 Monat/Jahr: <<kind2MonatJahr>>');
    console.log('   Kind 3 Monat/Jahr: <<kind3MonatJahr>>');
    console.log('   Kind 4 Monat/Jahr: <<kind4MonatJahr>>');
    console.log('   Kind 5 Monat/Jahr: <<kind5MonatJahr>>');
    console.log('   Gesundheitsschaden: <<gesundheitsschaden>>');

    console.log('\n=== GESAMT ===');
    console.log('   Monatlicher Gesamtfreibetrag: <<freibetragFormatted>>');

    console.log('\n=== Datum/Unterschrift ===');
    console.log('   Ort, Datum: <<ortDatum>>');

    console.log('\n3. Save as:', outputPath);
    console.log('\n4. Use << >> for all placeholders (docxtemplater syntax)');

  } catch (error) {
    console.error('Error:', error);
  }
}

prepareTemplate();
