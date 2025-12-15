/**
 * Check if the generated PDF has form fields
 */

const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function checkPdfFields() {
  try {
    const pdfPath = './uploads/certificate-test-1765813818683.pdf';

    console.log('===============================================');
    console.log('Checking GENERATED PDF');
    console.log('===============================================\n');

    // Load generated PDF
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the form
    const form = pdfDoc.getForm();

    // Get all fields
    const fields = form.getFields();

    console.log(`Felder im generierten PDF: ${fields.length}\n`);

    if (fields.length === 0) {
      console.log('❌ KEINE Formularfelder gefunden!');
      console.log('   Das PDF wurde möglicherweise "flattened" (Felder wurden zu Text konvertiert).\n');
      return;
    }

    // Check first 10 fields
    console.log('Erste 10 Felder:\n');
    fields.slice(0, 10).forEach((field, index) => {
      const name = field.getName();
      const type = field.constructor.name;

      console.log(`${index + 1}. ${name}`);
      console.log(`   Typ: ${type}`);

      if (type === 'PDFTextField') {
        try {
          const text = field.getText();
          console.log(`   Wert: "${text}"`);
        } catch (e) {
          console.log(`   Wert: (leer)`);
        }
      } else if (type === 'PDFCheckBox') {
        try {
          const isChecked = field.isChecked();
          console.log(`   Status: ${isChecked ? '☑ Aktiviert' : '☐ Deaktiviert'}`);
        } catch (e) {
          console.log(`   Status: (unbekannt)`);
        }
      }

      console.log('');
    });

  } catch (error) {
    console.error('❌ Fehler:', error.message);
  }
}

checkPdfFields();
