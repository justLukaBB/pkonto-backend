require('dotenv').config();
const { generateFromWordTemplate } = require('./src/services/word-template.service');
const { convertToPdf } = require('./src/services/pdf.service');
const fs = require('fs');

/**
 * Test PDF Conversion
 */

const testPdfConversion = async () => {
  console.log('🔧 Testing PDF Conversion...\n');

  // Mock application data
  const mockApplication = {
    _id: 'PDF-TEST-' + Date.now(),
    personalData: {
      salutation: 'frau',
      firstName: 'Anna',
      lastName: 'Schmidt',
      street: 'Hauptstraße',
      houseNumber: '123',
      zipCode: '10115',
      city: 'Berlin',
      birthdate: { day: 25, month: 12, year: 1985 },
      email: 'anna.schmidt@example.com',
      phone: '+49 30 123456'
    },
    bankData: {
      iban: 'DE89370400440532013000',
      bic: 'COBADEFFXXX'
    },
    calculationData: {
      married: false,
      childrenCount: 1,
      children: [
        { birthdate: { day: 10, month: 5, year: 2018 }, receivesKindergeld: true }
      ],
      socialBenefitsCount: 0,
      healthCompensation: 0
    },
    calculatedFreibetrag: {
      amount: 1941.00,
      details: 'Basisfreibetrag mit 1 Kind'
    }
  };

  try {
    console.log('📝 Step 1: Generate Word document from template...');
    const docxPath = await generateFromWordTemplate(mockApplication);
    console.log(`✅ DOCX created: ${docxPath}\n`);

    // Check if file exists
    if (!fs.existsSync(docxPath)) {
      throw new Error('DOCX file was not created!');
    }

    const docxSize = fs.statSync(docxPath).size;
    console.log(`📊 DOCX file size: ${(docxSize / 1024).toFixed(2)} KB\n`);

    console.log('📄 Step 2: Convert DOCX to PDF...');
    const pdfPath = await convertToPdf(docxPath);
    console.log(`✅ PDF created: ${pdfPath}\n`);

    // Check if PDF exists
    if (!fs.existsSync(pdfPath)) {
      throw new Error('PDF file was not created!');
    }

    const pdfSize = fs.statSync(pdfPath).size;
    console.log(`📊 PDF file size: ${(pdfSize / 1024).toFixed(2)} KB\n`);

    console.log('═'.repeat(70));
    console.log('🎉 PDF CONVERSION SUCCESSFUL!');
    console.log('═'.repeat(70));
    console.log('');
    console.log('Files created:');
    console.log(`  📄 Word: ${docxPath}`);
    console.log(`  📄 PDF:  ${pdfPath}`);
    console.log('');
    console.log('Open files:');
    console.log(`  open "${docxPath}"`);
    console.log(`  open "${pdfPath}"`);
    console.log('');

  } catch (error) {
    console.error('❌ Test failed!\n');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
};

testPdfConversion();
