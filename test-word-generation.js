const { generateFromWordTemplate } = require('./src/services/word-template.service');

/**
 * Test Word template generation with sample data
 */

async function testWordGeneration() {
  try {
    console.log('Testing Word template generation...\n');

    // Create sample application data
    const sampleApplication = {
      _id: 'TEST123456',
      personalData: {
        salutation: 'herr',
        firstName: 'Max',
        lastName: 'Mustermann',
        street: 'Musterstraße',
        houseNumber: '42',
        zipCode: '12345',
        city: 'Musterstadt',
        birthdate: {
          day: 15,
          month: 6,
          year: 1985
        },
        email: 'max.mustermann@example.com',
        phone: '0123 456789'
      },
      bankData: {
        iban: 'DE89370400440532013000',
        bic: 'Sparkasse Musterstadt'
      },
      calculationData: {
        married: true,
        childrenCount: 2,
        children: [
          {
            birthdate: { day: 10, month: 9, year: 2016 },
            receivesKindergeld: true
          },
          {
            birthdate: { day: 7, month: 9, year: 2021 },
            receivesKindergeld: true
          }
        ],
        healthCompensation: 150.50
      },
      calculatedFreibetrag: {
        amount: 2947.81,
        details: 'Basis + Verheiratet + 2 Kinder + Gesundheitsschaden'
      }
    };

    console.log('Sample Application Data:');
    console.log('========================');
    console.log('Name:', sampleApplication.personalData.firstName, sampleApplication.personalData.lastName);
    console.log('Verheiratet:', sampleApplication.calculationData.married ? 'Ja' : 'Nein');
    console.log('Kinder:', sampleApplication.calculationData.childrenCount);
    console.log('Freibetrag:', sampleApplication.calculatedFreibetrag.amount.toFixed(2), '€');
    console.log('\nGenerating Word document...\n');

    // Generate Word document
    const docxPath = await generateFromWordTemplate(sampleApplication);

    console.log('\n✅ SUCCESS!');
    console.log('Word document generated at:', docxPath);
    console.log('\nYou can now open this file in Microsoft Word or LibreOffice to review it.');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

testWordGeneration();
