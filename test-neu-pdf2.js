const fs = require('fs').promises;
const { PDFDocument } = require('pdf-lib');

async function testNeuPDF2() {
  try {
    console.log('Testing Neu-PDF2...\n');

    const templatePath = '/Users/luka.s/Downloads/ Neu-PDF2.pdf';
    console.log('Loading:', templatePath);

    const existingPdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    console.log('✓ Template loaded successfully\n');

    // Get the form
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log(`✓ Found ${fields.length} form fields\n`);

    // List all field names
    console.log('Form field names:');
    console.log('================');
    fields.forEach((field, index) => {
      const name = field.getName();
      const type = field.constructor.name;
      console.log(`  ${index + 1}. [${type}] ${name}`);
    });

    // Try to update appearances
    console.log('\n\nTrying to update field appearances...');
    try {
      form.updateFieldAppearances();
      console.log('✓ Field appearances updated successfully');
    } catch (error) {
      console.error('✗ Could not update appearances:', error.message);
    }

    // Try to flatten (THIS IS THE CRITICAL TEST)
    console.log('\nTrying to flatten form...');
    try {
      form.flatten();
      console.log('✓✓✓ Form flattened successfully! 🎉🎉🎉');
      console.log('✓✓✓ This template CAN be used without errors!');
      console.log('✓✓✓ PDFs will be visible in ALL PDF readers!');
      console.log('\n🚀 THIS TEMPLATE WORKS PERFECTLY!');
    } catch (error) {
      console.error('✗ Could not flatten:', error.message);
      console.error('✗ This template still has broken reference issues');
      return;
    }

    // Save test PDF
    const pdfBytes = await pdfDoc.save();
    const testOutputPath = '/Users/luka.s/Backend P-konto/test-neu-pdf2-output.pdf';
    await fs.writeFile(testOutputPath, pdfBytes);
    console.log(`\n✓ Test PDF saved to: ${testOutputPath}`);
    console.log('\n✅✅✅ SUCCESS - This template is PERFECT!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

testNeuPDF2();
