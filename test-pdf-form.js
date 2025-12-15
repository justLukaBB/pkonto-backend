/**
 * Test script for PDF form generation
 * Usage: node test-pdf-form.js [applicationId]
 *
 * If no applicationId provided, uses test data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./src/models/Application.model');
const { fillPdfForm } = require('./src/services/pdf-form.service');

async function testPdfForm() {
  try {
    console.log('===============================================');
    console.log('PDF Form Test');
    console.log('===============================================\n');

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    let application;

    // Check if applicationId was provided
    const applicationId = process.argv[2];

    if (applicationId) {
      // Load existing application
      console.log(`Loading application: ${applicationId}`);
      application = await Application.findById(applicationId);

      if (!application) {
        throw new Error(`Application ${applicationId} not found`);
      }

      console.log('✓ Application loaded\n');
    } else {
      // Create test application
      console.log('No applicationId provided, creating test data...\n');

      application = {
        _id: 'test-' + Date.now(),
        personalData: {
          salutation: 'herr',
          firstName: 'Max',
          lastName: 'Mustermann',
          street: 'Teststraße',
          houseNumber: '123',
          zipCode: '12345',
          city: 'Berlin',
          birthdate: {
            day: 15,
            month: 3,
            year: 1990
          },
          email: 'max.mustermann@test.de'
        },
        bankData: {
          iban: 'DE89370400440532013000',
          bic: 'COBADEFFXXX'
        },
        calculationData: {
          married: true,
          childrenCount: 2,
          children: [
            {
              birthdate: { day: 10, month: 5, year: 2015 },
              receivesKindergeld: true
            },
            {
              birthdate: { day: 20, month: 8, year: 2018 },
              receivesKindergeld: true
            }
          ],
          socialBenefitsCount: 0,
          healthCompensation: 150.00
        },
        calculatedFreibetrag: {
          amount: 2797.31, // Base 1560 + married 585.23 + 2 children 652.08 + health 150
          details: 'Test calculation'
        }
      };

      console.log('✓ Test data created\n');
    }

    // Display application data
    console.log('Application Data:');
    console.log('---------------------------------------------------');
    console.log(`Name: ${application.personalData.firstName} ${application.personalData.lastName}`);
    console.log(`IBAN: ${application.bankData.iban}`);
    console.log(`Married: ${application.calculationData.married ? 'Yes' : 'No'}`);
    console.log(`Children: ${application.calculationData.childrenCount}`);
    console.log(`Health Compensation: ${application.calculationData.healthCompensation.toFixed(2)} EUR`);
    console.log(`Calculated Freibetrag: ${application.calculatedFreibetrag.amount.toFixed(2)} EUR`);
    console.log('---------------------------------------------------\n');

    // Generate PDF
    console.log('Generating PDF form...');
    const pdfPath = await fillPdfForm(application);

    console.log('\n===============================================');
    console.log('✅ SUCCESS!');
    console.log('===============================================');
    console.log(`PDF generated at: ${pdfPath}`);
    console.log('\nOpening PDF...\n');

    // Open PDF on Mac
    const { exec } = require('child_process');
    exec(`open "${pdfPath}"`);

  } catch (error) {
    console.error('\n===============================================');
    console.error('❌ ERROR!');
    console.error('===============================================');
    console.error(error);
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the test
testPdfForm();
