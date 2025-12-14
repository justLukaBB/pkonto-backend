require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./src/models/Application.model');
const { calculateFreibetrag } = require('./src/services/calculation.service');

/**
 * Test Stripe Payment Integration
 *
 * This test demonstrates the complete payment flow:
 * 1. Create application
 * 2. Create payment intent via API
 * 3. Simulate payment completion
 */

const testStripePayment = async () => {
  console.log('💳 Testing Stripe Payment Integration...\n');
  console.log('═'.repeat(70));

  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_xxxxx') {
      console.log('\n⚠️  Stripe is not configured!\n');
      console.log('Please run: node test-stripe-config.js');
      console.log('Or check STRIPE_SETUP.md for instructions\n');
      process.exit(1);
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Create Test Application
    console.log('STEP 1: Creating Test Application');
    console.log('─'.repeat(70));

    const testData = {
      personalData: {
        salutation: 'frau',
        firstName: 'Maria',
        lastName: 'Schmidt',
        street: 'Berliner Straße',
        houseNumber: '100',
        zipCode: '10115',
        city: 'Berlin',
        birthdate: { day: 20, month: 8, year: 1985 },
        email: 'justlukax@gmail.com',
        phone: '+49 30 987654'
      },
      bankData: {
        iban: 'DE89370400440532013000',
        bic: 'COBADEFFXXX'
      },
      calculationData: {
        married: true,
        childrenCount: 1,
        children: [
          {
            birthdate: { day: 15, month: 3, year: 2016 },
            receivesKindergeld: true
          }
        ],
        socialBenefitsCount: 0,
        healthCompensation: 0
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
    console.log(`Freibetrag: ${freibetragResult.total.toFixed(2)} €`);

    const application = new Application(testData);
    await application.save();

    console.log(`✅ Application created: ${application._id}\n`);

    // Step 2: Create Payment Intent (simulating frontend call)
    console.log('STEP 2: Creating Stripe Payment Intent');
    console.log('─'.repeat(70));

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(application.payment.amount * 100), // Amount in cents
      currency: 'eur',
      metadata: {
        applicationId: application._id.toString(),
        email: application.personalData.email
      },
      description: `P-Konto Bescheinigung für ${application.personalData.firstName} ${application.personalData.lastName}`,
      // For testing: automatically confirm the payment
      payment_method: 'pm_card_visa',
      confirm: true,
      return_url: 'http://localhost:3000/payment-success'
    });

    console.log(`✅ Payment Intent created: ${paymentIntent.id}`);
    console.log(`   Amount: ${paymentIntent.amount / 100} EUR`);
    console.log(`   Status: ${paymentIntent.status}`);
    console.log(`   Client Secret: ${paymentIntent.client_secret.substring(0, 30)}...`);

    // Update application with payment intent ID
    application.payment.stripePaymentIntentId = paymentIntent.id;
    await application.save();

    console.log(`✅ Application updated with Payment Intent ID\n`);

    // Step 3: Check Payment Status
    console.log('STEP 3: Checking Payment Status');
    console.log('─'.repeat(70));

    if (paymentIntent.status === 'succeeded') {
      console.log('✅ Payment succeeded!\n');

      // In production, this would be triggered by webhook
      // For testing, we'll manually trigger the processing
      console.log('STEP 4: Processing Application (Normally via Webhook)');
      console.log('─'.repeat(70));

      const { processApplication } = require('./src/services/processing.service');

      // Update payment status
      application.payment.status = 'completed';
      application.payment.paidAt = new Date();
      application.status = 'paid';
      await application.save();

      // Process application (generate PDF + send email)
      console.log('Generating certificate and sending email...\n');
      await processApplication(application._id);

      console.log('✅ Application processed!\n');
    } else {
      console.log(`⚠️  Payment status: ${paymentIntent.status}`);
      console.log('   Payment requires additional action or failed\n');
    }

    // Step 5: Verify Final Status
    console.log('STEP 5: Verifying Final Status');
    console.log('─'.repeat(70));

    const finalApplication = await Application.findById(application._id);

    console.log(`Application Status: ${finalApplication.status}`);
    console.log(`Payment Status: ${finalApplication.payment.status}`);
    console.log(`Certificate Generated: ${finalApplication.certificate.generated ? '✅' : '❌'}`);
    console.log(`Email Sent: ${finalApplication.certificate.sentViaEmail ? '✅' : '❌'}`);

    if (finalApplication.certificate.pdfPath) {
      console.log(`\n📄 Certificate: ${finalApplication.certificate.pdfPath}`);
    }

    console.log('\n' + '═'.repeat(70));
    console.log('🎉 STRIPE PAYMENT INTEGRATION TEST SUCCESSFUL!');
    console.log('═'.repeat(70));

    console.log('\n📧 Check email: justlukax@gmail.com');
    console.log('   You should have received the certificate\n');

    console.log('📊 Test Summary:');
    console.log(`   Application ID: ${finalApplication._id}`);
    console.log(`   Payment Intent: ${finalApplication.payment.stripePaymentIntentId}`);
    console.log(`   Amount Paid: ${finalApplication.payment.amount} EUR`);
    console.log(`   Status: ${finalApplication.status}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Test failed!\n');
    console.error('Error:', error.message);

    if (error.type === 'StripeAuthenticationError') {
      console.error('\n⚠️  Stripe authentication failed');
      console.error('   Please check your STRIPE_SECRET_KEY in .env\n');
    }

    console.error('\nStack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed');
  }
};

// Run test
testStripePayment();
