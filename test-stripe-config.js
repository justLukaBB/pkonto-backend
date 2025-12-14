require('dotenv').config();

/**
 * Test Stripe Configuration
 * This script verifies that Stripe is properly configured
 */

const testStripeConfig = () => {
  console.log('🔍 Testing Stripe Configuration...\n');
  console.log('═'.repeat(70));

  // Check environment variables
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('\n📋 Environment Variables:');
  console.log('─'.repeat(70));

  // Secret Key
  if (secretKey && secretKey !== 'sk_test_xxxxx') {
    if (secretKey.startsWith('sk_test_')) {
      console.log('✅ STRIPE_SECRET_KEY: Configured (Test Mode)');
    } else if (secretKey.startsWith('sk_live_')) {
      console.log('⚠️  STRIPE_SECRET_KEY: Configured (LIVE Mode - Be Careful!)');
    } else {
      console.log('❌ STRIPE_SECRET_KEY: Invalid format');
    }
  } else {
    console.log('❌ STRIPE_SECRET_KEY: Not configured or using placeholder');
  }

  // Publishable Key
  if (publishableKey && publishableKey !== 'pk_test_xxxxx') {
    if (publishableKey.startsWith('pk_test_')) {
      console.log('✅ STRIPE_PUBLISHABLE_KEY: Configured (Test Mode)');
    } else if (publishableKey.startsWith('pk_live_')) {
      console.log('⚠️  STRIPE_PUBLISHABLE_KEY: Configured (LIVE Mode - Be Careful!)');
    } else {
      console.log('❌ STRIPE_PUBLISHABLE_KEY: Invalid format');
    }
  } else {
    console.log('❌ STRIPE_PUBLISHABLE_KEY: Not configured or using placeholder');
  }

  // Webhook Secret
  if (webhookSecret && webhookSecret !== 'whsec_xxxxx') {
    if (webhookSecret.startsWith('whsec_')) {
      console.log('✅ STRIPE_WEBHOOK_SECRET: Configured');
    } else {
      console.log('❌ STRIPE_WEBHOOK_SECRET: Invalid format');
    }
  } else {
    console.log('❌ STRIPE_WEBHOOK_SECRET: Not configured or using placeholder');
  }

  console.log('\n' + '═'.repeat(70));

  // Check if all keys are configured
  const allConfigured =
    secretKey && secretKey !== 'sk_test_xxxxx' &&
    publishableKey && publishableKey !== 'pk_test_xxxxx' &&
    webhookSecret && webhookSecret !== 'whsec_xxxxx';

  if (allConfigured) {
    console.log('\n✅ All Stripe keys are configured!\n');
    console.log('Next steps:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Test payment creation with test-stripe-payment.js\n');

    // Try to initialize Stripe
    try {
      const stripe = require('stripe')(secretKey);
      console.log('✅ Stripe SDK initialized successfully\n');
      console.log('🚀 You can now test Stripe integration!\n');

      return true;
    } catch (error) {
      console.log('❌ Error initializing Stripe:', error.message, '\n');
      return false;
    }
  } else {
    console.log('\n⚠️  Stripe is not fully configured\n');
    console.log('📖 Please follow the setup instructions in STRIPE_SETUP.md\n');
    console.log('Quick steps:');
    console.log('  1. Go to https://dashboard.stripe.com/test/apikeys');
    console.log('  2. Copy your API keys');
    console.log('  3. Update the .env file:');
    console.log('     - STRIPE_SECRET_KEY=sk_test_...');
    console.log('     - STRIPE_PUBLISHABLE_KEY=pk_test_...');
    console.log('  4. For webhooks, run: stripe listen --forward-to localhost:3000/api/stripe/webhook');
    console.log('  5. Copy the webhook secret to .env\n');

    return false;
  }
};

// Run the test
const success = testStripeConfig();
process.exit(success ? 0 : 1);
