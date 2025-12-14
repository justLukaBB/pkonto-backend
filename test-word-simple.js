require('dotenv').config();
const { generateFromWordTemplate, prepareTemplateData } = require('./src/services/word-template.service');

/**
 * Simple Word Template Test (no MongoDB required)
 */

const testWordSimple = async () => {
  console.log('🔧 Testing Word template generation (simple test)...\n');

  // Mock application data
  const mockApplication = {
    _id: 'TEST123',
    personalData: {
      salutation: 'herr',
      firstName: 'Max',
      lastName: 'Mustermann',
      street: 'Musterstraße',
      houseNumber: '15',
      zipCode: '40210',
      city: 'Düsseldorf',
      birthdate: { day: 11, month: 5, year: 1964 },
      email: 'max@example.com',
      phone: '+49 123 456789'
    },
    bankData: {
      iban: 'DE89370400440532013000',
      bic: 'COBADEFFXXX'
    },
    calculationData: {
      married: true,
      childrenCount: 2,
      children: [
        { birthdate: { day: 15, month: 3, year: 2015 }, receivesKindergeld: true },
        { birthdate: { day: 20, month: 7, year: 2018 }, receivesKindergeld: false }
      ],
      socialBenefitsCount: 0,
      healthCompensation: 0
    },
    calculatedFreibetrag: {
      amount: 3003.00,
      details: 'Ihr monatlicher Freibetrag beträgt 3.003,00 €. Dies beinhaltet den erhöhten Freibetrag für Verheiratete/Lebenspartner. Zusätzlich wurde der Freibetrag für 2 Kinder berücksichtigt.'
    }
  };

  try {
    console.log('📝 Generating Word document from template...\n');

    // Show what data will be used
    const templateData = prepareTemplateData(mockApplication);
    console.log('Template Data (first few fields):');
    console.log(`  fullName: ${templateData.fullName}`);
    console.log(`  fullAddress: ${templateData.fullAddress}`);
    console.log(`  fullCityLine: ${templateData.fullCityLine}`);
    console.log(`  iban: ${templateData.iban}`);
    console.log(`  freibetragFormatted: ${templateData.freibetragFormatted}`);
    console.log(`  lawyerFullName: ${templateData.lawyerFullName}`);
    console.log(`  children: ${templateData.children.length} Kind(er)`);
    console.log('');

    const docPath = await generateFromWordTemplate(mockApplication);

    console.log(`✅ Word document generated!\n`);
    console.log(`📄 File saved at: ${docPath}\n`);

    console.log('🎉 Success!');
    console.log('');
    console.log('Next steps:');
    console.log(`  1. Open the file: open "${docPath}"`);
    console.log('  2. Check if all placeholders are filled correctly');
    console.log('  3. If you see placeholders like <<firstName>>, you need to add them to your Word template');
    console.log('');
    console.log('📋 Available Placeholders (use << >> syntax):');
    console.log('   Personal: <<firstName>>, <<lastName>>, <<fullName>>, <<street>>, <<houseNumber>>');
    console.log('   Address: <<zipCode>>, <<city>>, <<fullAddress>>, <<fullCityLine>>');
    console.log('   Contact: <<email>>, <<phone>>, <<birthdate>>');
    console.log('   Bank: <<iban>>, <<bic>>');
    console.log('   Calculation: <<married>>, <<childrenCount>>, <<freibetrag>>, <<freibetragFormatted>>');
    console.log('   Lawyer: <<lawyerName>>, <<lawyerTitle>>, <<lawyerFullName>>');
    console.log('   Date: <<issueDate>>, <<today>>, <<currentDate>>');
    console.log('   Children: <<child1Birthdate>>, <<child1Kindergeld>>, <<child2Birthdate>>, etc.');
    console.log('');

  } catch (error) {
    console.error('❌ Test failed!\n');
    console.error('Error:', error.message);

    if (error.properties && error.properties.errors) {
      console.error('\n⚠️  Template Errors Found:');
      error.properties.errors.forEach(err => {
        console.error(`  - Missing or invalid tag: <<${err.properties.id}>>`);
      });
      console.error('\n💡 This means your Word template is missing these placeholders.');
      console.error('   Add them to your template in the format: <<placeholder>>');
    }

    console.error('\n' + error.stack);
    process.exit(1);
  }
};

// Run test
testWordSimple();
