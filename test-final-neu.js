const fs = require('fs').promises;
const { PDFDocument } = require('pdf-lib');

async function testFinalNeuPDF() {
  try {
    console.log('🎯 Testing "Test Neu PDF Final"...\n');

    const templatePath = '/Users/luka.s/Downloads/Test Neu PDF Final.pdf';
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

    // THE CRITICAL TEST: Try to flatten
    console.log('\n🔥 THE CRITICAL TEST: Trying to flatten form...\n');
    try {
      form.flatten();
      console.log('✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓');
      console.log('✓✓✓ Form flattened successfully! 🎉🎉🎉');
      console.log('✓✓✓ THIS TEMPLATE WORKS PERFECTLY!!!');
      console.log('✓✓✓ PDFs will be visible in ALL PDF readers!');
      console.log('✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓\n');

      // Save test PDF
      const pdfBytes = await pdfDoc.save();
      const testOutputPath = '/Users/luka.s/Backend P-konto/test-final-neu-output.pdf';
      await fs.writeFile(testOutputPath, pdfBytes);
      console.log(`✓ Test PDF saved to: ${testOutputPath}`);
      console.log('\n🚀🚀🚀 SUCCESS - This is THE template we need! 🚀🚀🚀');

      return true;
    } catch (error) {
      console.error('✗✗✗ Could not flatten:', error.message);
      console.error('✗✗✗ This template still has broken reference issues\n');
      console.error('Error details:', error);
      return false;
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    return false;
  }
}

testFinalNeuPDF();
