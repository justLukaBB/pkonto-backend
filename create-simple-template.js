const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs').promises;

/**
 * Create a simple Word template with placeholders for P-Konto certificate
 * This creates a minimal template that can be expanded later
 */

async function createSimpleTemplate() {
  try {
    // Create minimal Word document XML
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>Bescheinigung nach § 850k Abs. 4 ZPO</w:t></w:r></w:p>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>P-Konto Freibetrag</w:t></w:r></w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>

    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>I. Bescheinigende Person/Stelle</w:t></w:r></w:p>
    <w:p><w:r><w:t>Name: <<lawyerName>></w:t></w:r></w:p>
    <w:p><w:r><w:t>Straße: <<lawyerStreet>>  Hausnummer: <<lawyerHouseNumber>></w:t></w:r></w:p>
    <w:p><w:r><w:t>PLZ: <<lawyerZipCode>>  Ort: <<lawyerCity>></w:t></w:r></w:p>
    <w:p><w:r><w:t>Ansprechpartner: <<lawyerContact>></w:t></w:r></w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>

    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>II. Kontoinhaber</w:t></w:r></w:p>
    <w:p><w:r><w:t>Name: <<fullName>></w:t></w:r></w:p>
    <w:p><w:r><w:t>Geburtsdatum: <<birthdate>></w:t></w:r></w:p>
    <w:p><w:r><w:t>Anschrift: <<fullAddress>></w:t></w:r></w:p>
    <w:p><w:r><w:t>Kreditinstitut: <<bic>></w:t></w:r></w:p>
    <w:p><w:r><w:t>IBAN: <<iban>></w:t></w:r></w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>

    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>III. Berechnung des Freibetrages</w:t></w:r></w:p>
    <w:p><w:r><w:t>Grundfreibetrag: 1.560,00 €</w:t></w:r></w:p>
    <w:p><w:r><w:t>Erhöhung erste Person: <<erhöhungErstePerson>></w:t></w:r></w:p>
    <w:p><w:r><w:t>Erhöhung weitere Personen: <<erhöhungWeiterePers>></w:t></w:r></w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>

    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>IV. Weitere monatliche Geldleistungen</w:t></w:r></w:p>
    <w:p><w:r><w:t>Kindergeld: <<kindergeldBetrag>></w:t></w:r></w:p>
    <w:p><w:r><w:t>  Kind 1: <<kind1MonatJahr>></w:t></w:r></w:p>
    <w:p><w:r><w:t>  Kind 2: <<kind2MonatJahr>></w:t></w:r></w:p>
    <w:p><w:r><w:t>  Kind 3: <<kind3MonatJahr>></w:t></w:r></w:p>
    <w:p><w:r><w:t>Gesundheitsschaden: <<gesundheitsschaden>></w:t></w:r></w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>

    <w:p><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>Monatlicher Gesamtfreibetrag: <<freibetragFormatted>></w:t></w:r></w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p><w:r><w:t><<ortDatum>></w:t></w:r></w:p>
  </w:body>
</w:document>`;

    // Create minimal Word package structure
    const zip = new PizZip();

    // Add required files
    zip.file('word/document.xml', documentXml);
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

    // Generate DOCX
    const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });

    // Save
    const outputPath = './src/templates/pkonto-template-2025.docx';
    await fs.writeFile(outputPath, buffer);

    console.log('✅ Simple Word template created:', outputPath);
    console.log('\nPlaceholders included:');
    console.log('- <<lawyerName>>');
    console.log('- <<fullName>>');
    console.log('- <<birthdate>>');
    console.log('- <<iban>>');
    console.log('- <<freibetragFormatted>>');
    console.log('- ... and more');

  } catch (error) {
    console.error('Error:', error);
  }
}

createSimpleTemplate();
