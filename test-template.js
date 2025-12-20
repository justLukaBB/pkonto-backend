const fs = require('fs').promises;
const { PDFDocument } = require('pdf-lib');

async function testTemplate() {
  try {
    console.log('Testing new template...');

    // Load the new template
    const templatePath = '/Users/luka.s/Backend P-konto/src/templates/Template Neu/Template final/Template-final 1.pdf';
    console.log('Loading:', templatePath);

    const existingPdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    console.log('✓ Template loaded successfully');

    // Get the form
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log(`✓ Found ${fields.length} form fields`);

    // List all field names
    console.log('\nForm field names:');
    fields.forEach((field, index) => {
      console.log(`  ${index + 1}. ${field.getName()}`);
    });

    // Try to update appearances
    console.log('\nTrying to update field appearances...');
    try {
      form.updateFieldAppearances();
      console.log('✓ Field appearances updated successfully');
    } catch (error) {
      console.error('✗ Could not update appearances:', error.message);
    }

    // Try to flatten
    console.log('\nTrying to flatten form...');
    try {
      form.flatten();
      console.log('✓ Form flattened successfully! 🎉');
      console.log('✓ This template can be used without errors!');
    } catch (error) {
      console.error('✗ Could not flatten:', error.message);
      console.error('✗ This template has the same issue as the old one');
    }

    // Save test PDF
    const pdfBytes = await pdfDoc.save();
    const testOutputPath = '/Users/luka.s/Backend P-konto/test-output.pdf';
    await fs.writeFile(testOutputPath, pdfBytes);
    console.log(`\n✓ Test PDF saved to: ${testOutputPath}`);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testTemplate();
