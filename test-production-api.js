#!/usr/bin/env node

/**
 * Test Production API - Verify Stripe Checkout Session Creation
 */

const BACKEND_URL = 'https://pkonto-backend.onrender.com';

const testData = {
  calculationData: {
    married: false,
    childrenCount: 0,
    children: [],
    socialBenefitsCount: 0,
    healthCompensation: 0
  },
  personalData: {
    salutation: 'herr',  // lowercase!
    firstName: 'Test',
    lastName: 'User',
    street: 'Teststraße',
    houseNumber: '123',
    zipCode: '12345',
    city: 'Berlin',
    birthdate: {
      day: 15,
      month: 6,
      year: 1990
    },
    email: 'test@example.com'
  },
  bankData: {
    iban: 'DE89370400440532013000',
    bic: 'COBADEFFXXX'  // Required!
  },
  calculatedFreibetrag: {
    amount: 1410.64,
    details: ''  // String, not object!
  },
  payment: {
    amount: 29.00
  }
};

async function testCheckoutSession() {
  console.log('🧪 Testing Production API...\n');
  console.log(`📡 Backend URL: ${BACKEND_URL}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣  Health Check...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthResponse.json();
    console.log(`   ✅ ${healthData.message}\n`);

    // Test 2: Stripe Config
    console.log('2️⃣  Stripe Config...');
    const configResponse = await fetch(`${BACKEND_URL}/api/stripe/config`);
    const configData = await configResponse.json();

    if (configData.success && configData.data.publishableKey) {
      console.log(`   ✅ Stripe configured (key: ${configData.data.publishableKey.substring(0, 20)}...)\n`);
    } else {
      console.log(`   ❌ Stripe not configured\n`);
      return;
    }

    // Test 3: Create Checkout Session
    console.log('3️⃣  Create Checkout Session...');
    const checkoutResponse = await fetch(`${BACKEND_URL}/api/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json();
      console.log(`   ❌ Error: ${errorData.message}`);
      console.log(`   Response:`, JSON.stringify(errorData, null, 2));
      return;
    }

    const checkoutData = await checkoutResponse.json();

    if (checkoutData.success && checkoutData.data.checkoutUrl) {
      console.log(`   ✅ Checkout session created!`);
      console.log(`   📝 Application ID: ${checkoutData.data.applicationId}`);
      console.log(`   🔗 Checkout URL: ${checkoutData.data.checkoutUrl}`);
      console.log(`   💳 Session ID: ${checkoutData.data.sessionId}\n`);

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ ALL TESTS PASSED!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      console.log('🎯 Next Steps:');
      console.log('   1. Open the form on https://p-konto-bescheinigung.com');
      console.log('   2. Fill out and submit the form');
      console.log('   3. Complete payment with Stripe test card: 4242 4242 4242 4242');
      console.log('   4. Verify webhook triggers and PDF is generated');
      console.log('   5. Check email delivery\n');

    } else {
      console.log(`   ❌ Unexpected response:`, JSON.stringify(checkoutData, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

testCheckoutSession();
