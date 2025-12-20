const { fillPdfForm } = require('./src/services/pdf-form.service');

async function testNewPDFService() {
  try {
    console.log('Testing NEW PDF Service with real data...\n');

    // Create sample application
    const sampleApplication = {
      _id: 'TEST-NEW-PDF-123',
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
        email: 'max.mustermann@example.com'
      },
      bankData: {
        iban: 'DE89370400440532013000',
        bic: 'Sparkasse Musterstadt'
      },
      calculationData: {
        married: true,
        childrenCount: 3,
        children: [
          {
            birthdate: { day: 10, month: 9, year: 2016 },
            receivesKindergeld: true
          },
          {
            birthdate: { day: 7, month: 9, year: 2021 },
            receivesKindergeld: true
          },
          {
            birthdate: { day: 15, month: 3, year: 2024 },
            receivesKindergeld: true
          }
        ],
        healthCompensation: 0
      },
      calculatedFreibetrag: {
        amount: 3063.35, // 1560 (basis) + 585.23 (verheiratet) + 3*326.04 (kinder) = 3123.35
        details: 'Basis + Verheiratet + 3 Kinder'
      }
    };

    console.log('Sample Application:');
    console.log('===================');
    console.log('Name:', sampleApplication.personalData.firstName, sampleApplication.personalData.lastName);
    console.log('Verheiratet:', sampleApplication.calculationData.married ? 'Ja' : 'Nein');
    console.log('Kinder:', sampleApplication.calculationData.childrenCount);
    console.log('Kinder mit Kindergeld:', sampleApplication.calculationData.children.filter(c => c.receivesKindergeld).length);
    console.log('Erwartetes Kindergeld:', sampleApplication.calculationData.children.filter(c => c.receivesKindergeld).length * 255, '€');
    console.log('Freibetrag:', sampleApplication.calculatedFreibetrag.amount.toFixed(2), '€\n');

    console.log('Generating PDF...\n');

    const pdfPath = await fillPdfForm(sampleApplication);

    console.log('\n✅ SUCCESS!');
    console.log('PDF generated at:', pdfPath);
    console.log('\nYou can now open this PDF to verify:');
    console.log('1. All fields are filled correctly');
    console.log('2. Kindergeld shows 255€ for each child');
    console.log('3. Month/Year for each child is correct');
    console.log('4. Kindergeld zusammen = 765€ (3 × 255€)');
    console.log('5. PDF is flattened and visible in all readers');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

testNewPDFService();
