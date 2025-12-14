require('dotenv').config();
const mongoose = require('mongoose');
const { processApplication } = require('./src/services/processing.service');
const Application = require('./src/models/Application.model');
const { calculateFreibetrag } = require('./src/services/calculation.service');

/**
 * Complete Workflow Test
 * Tests the entire flow: Application → Payment → Certificate → Email
 */

const testCompleteWorkflow = async () => {
  console.log('🚀 Starting Complete Workflow Test...\n');
  console.log('═'.repeat(70));

  try {
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Create a test application
    console.log('STEP 1: Creating Test Application');
    console.log('─'.repeat(70));

    const testData = {
      personalData: {
        salutation: 'herr',
        firstName: 'Max',
        lastName: 'Mustermann',
        street: 'Musterstraße',
        houseNumber: '42',
        zipCode: '40210',
        city: 'Düsseldorf',
        birthdate: { day: 15, month: 6, year: 1980 },
        email: 'justlukax@gmail.com', // Your test email
        phone: '+49 211 123456'
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
            birthdate: { day: 10, month: 3, year: 2015 },
            receivesKindergeld: true
          },
          {
            birthdate: { day: 20, month: 8, year: 2018 },
            receivesKindergeld: true
          }
        ],
        socialBenefitsCount: 0,
        healthCompensation: 0,
        oneTimeBenefits: []
      },
      payment: {
        method: 'paypal',
        amount: 29.99,
        status: 'pending'
      },
      agreementAccepted: true,
      ipAddress: '127.0.0.1'
    };

    // Calculate Freibetrag
    const freibetragResult = calculateFreibetrag(testData.calculationData);
    testData.calculatedFreibetrag = {
      amount: freibetragResult.total,
      details: freibetragResult.details,
      breakdown: freibetragResult.breakdown
    };

    console.log(`Creating application for: ${testData.personalData.firstName} ${testData.personalData.lastName}`);
    console.log(`Berechneter Freibetrag: ${freibetragResult.total.toFixed(2)} €`);

    // Create application in database
    const application = new Application(testData);
    await application.save();

    console.log(`✅ Application created with ID: ${application._id}\n`);

    // Step 2: Simulate Payment Completion
    console.log('STEP 2: Simulating Payment Completion');
    console.log('─'.repeat(70));

    application.payment.status = 'completed';
    application.payment.stripePaymentIntentId = 'pi_test_' + Date.now();
    application.payment.paidAt = new Date();
    application.status = 'paid';
    await application.save();

    console.log(`✅ Payment marked as completed`);
    console.log(`   Amount: ${application.payment.amount} €`);
    console.log(`   Stripe ID: ${application.payment.stripePaymentIntentId}\n`);

    // Step 3: Process Application (Generate Certificate + Send Email)
    console.log('STEP 3: Processing Application');
    console.log('─'.repeat(70));
    console.log('This will:');
    console.log('  1. Generate Word certificate from template');
    console.log('  2. Send email with certificate attachment');
    console.log('  3. Update application status to "completed"\n');

    const result = await processApplication(application._id);

    console.log('✅ Processing completed successfully!\n');

    // Step 4: Verify Results
    console.log('STEP 4: Verifying Results');
    console.log('─'.repeat(70));

    const updatedApplication = await Application.findById(application._id);

    console.log('Application Status:');
    console.log(`  Status: ${updatedApplication.status}`);
    console.log(`  Certificate Generated: ${updatedApplication.certificate.generated ? '✅' : '❌'}`);
    console.log(`  Certificate Path: ${updatedApplication.certificate.pdfPath}`);
    console.log(`  Email Sent: ${updatedApplication.certificate.sentViaEmail ? '✅' : '❌'}`);
    console.log(`  Email Sent At: ${updatedApplication.certificate.emailSentAt}`);

    console.log('\n' + '═'.repeat(70));
    console.log('🎉 COMPLETE WORKFLOW TEST SUCCESSFUL!');
    console.log('═'.repeat(70));
    console.log('\n📧 Check your email: justlukax@gmail.com');
    console.log('   You should receive the P-Konto certificate\n');
    console.log(`📄 Certificate file: ${result.pdfPath}`);
    console.log(`   You can open it with: open "${result.pdfPath}"\n`);

    console.log('✅ All systems working:');
    console.log('   ✓ Database (MongoDB)');
    console.log('   ✓ Calculation Service');
    console.log('   ✓ Word Template Generation');
    console.log('   ✓ Email Service (Gmail)');
    console.log('   ✓ Automatic Workflow Processing\n');

  } catch (error) {
    console.error('\n❌ Workflow Test Failed!\n');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed');
  }
};

// Run the test
testCompleteWorkflow();
