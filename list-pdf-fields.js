/**
 * Script to list all form fields in the PDF template
 * This helps us see what field names you've created in Adobe Acrobat
 */

const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function listPdfFields() {
  try {
    const pdfPath = './src/templates/certificate-template-form.pdf';

    console.log('===============================================');
    console.log('PDF Formularfelder Analyse');
    console.log('===============================================');
    console.log(`Datei: ${pdfPath}\n`);

    // Load PDF
    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Get the form
    const form = pdfDoc.getForm();

    // Get all fields
    const fields = form.getFields();

    console.log(`Gefundene Felder: ${fields.length}\n`);
    console.log('===============================================');

    if (fields.length === 0) {
      console.log('⚠️  KEINE Formularfelder gefunden!');
      console.log('   Stelle sicher, dass du in Adobe Acrobat Formularfelder');
      console.log('   erstellt hast (nicht nur Text).\n');
      return;
    }

    // List all fields with details
    fields.forEach((field, index) => {
      const name = field.getName();
      const type = field.constructor.name;

      console.log(`${index + 1}. ${name}`);
      console.log(`   Typ: ${type}`);

      // Show additional info based on field type
      if (type === 'PDFTextField') {
        try {
          const text = field.getText();
          if (text) console.log(`   Aktueller Wert: "${text}"`);
        } catch (e) {
          // Field might not have text yet
        }
      } else if (type === 'PDFCheckBox') {
        try {
          const isChecked = field.isChecked();
          console.log(`   Status: ${isChecked ? '☑ Aktiviert' : '☐ Deaktiviert'}`);
        } catch (e) {
          // Might not have state
        }
      } else if (type === 'PDFRadioGroup') {
        try {
          const options = field.getOptions();
          console.log(`   Optionen: ${options.join(', ')}`);
        } catch (e) {
          // Might not have options
        }
      } else if (type === 'PDFDropdown') {
        try {
          const options = field.getOptions();
          console.log(`   Optionen: ${options.join(', ')}`);
        } catch (e) {
          // Might not have options
        }
      }

      console.log('');
    });

    console.log('===============================================');
    console.log('\n✅ Analyse abgeschlossen!\n');

    // Generate mapping template
    console.log('📋 Beispiel-Mapping für pdf.service.js:\n');
    console.log('const fieldMapping = {');

    fields.forEach(field => {
      const name = field.getName();
      const type = field.constructor.name;

      if (type === 'PDFTextField') {
        console.log(`  '${name}': application.personalData.firstName, // Beispiel`);
      } else if (type === 'PDFCheckBox') {
        console.log(`  '${name}': true, // oder false`);
      }
    });

    console.log('};\n');

  } catch (error) {
    console.error('❌ Fehler beim Lesen der PDF-Felder:', error.message);
    console.error('\nStelle sicher, dass:');
    console.error('1. Die Datei src/templates/certificate-template-form.pdf existiert');
    console.error('2. Das PDF Formularfelder enthält');
    console.error('3. pdf-lib installiert ist (npm install pdf-lib)');
  }
}

// Run the script
listPdfFields();
