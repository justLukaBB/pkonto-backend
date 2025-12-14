const Application = require('../models/Application.model');
const { processApplication } = require('../services/processing.service');

// Only initialize Stripe if API key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

/**
 * Create Stripe Payment Intent
 * POST /api/stripe/create-payment-intent
 */
const createPaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe ist nicht konfiguriert. Bitte nutzen Sie WooCommerce zur Zahlung.'
      });
    }

    const { applicationId } = req.body;

    // Find application
    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Antrag nicht gefunden'
      });
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(application.payment.amount * 100), // Amount in cents
      currency: 'eur',
      metadata: {
        applicationId: application._id.toString(),
        email: application.personalData.email
      },
      description: `P-Konto Bescheinigung für ${application.personalData.firstName} ${application.personalData.lastName}`
    });

    // Update application with payment intent ID
    application.payment.stripePaymentIntentId = paymentIntent.id;
    await application.save();

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen der Zahlung',
      error: error.message
    });
  }
};

/**
 * Handle Stripe Webhooks
 * POST /api/stripe/webhook
 */
const handleWebhook = async (req, res) => {
  if (!stripe) {
    return res.status(503).json({
      success: false,
      message: 'Stripe ist nicht konfiguriert'
    });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

/**
 * Handle successful payment
 */
const handlePaymentSuccess = async (paymentIntent) => {
  try {
    const applicationId = paymentIntent.metadata.applicationId;

    console.log(`Payment succeeded for application ${applicationId}`);

    // Find and update application
    const application = await Application.findById(applicationId);

    if (!application) {
      console.error('Application not found:', applicationId);
      return;
    }

    // Update payment status
    application.payment.status = 'completed';
    application.payment.paidAt = new Date();
    application.status = 'paid';
    await application.save();

    console.log(`Application ${applicationId} marked as paid`);

    // Trigger PDF generation and email sending
    await processApplication(applicationId);

    console.log(`Application ${applicationId} processed successfully`);
  } catch (error) {
    console.error('Error handling payment success:', error);
    // Note: In production, you might want to implement retry logic or alert admins
  }
};

/**
 * Handle failed payment
 */
const handlePaymentFailure = async (paymentIntent) => {
  try {
    const applicationId = paymentIntent.metadata.applicationId;

    console.log(`Payment failed for application ${applicationId}`);

    const application = await Application.findById(applicationId);

    if (!application) {
      console.error('Application not found:', applicationId);
      return;
    }

    application.payment.status = 'failed';
    await application.save();

    // TODO: Send failure notification email to customer
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
};

/**
 * Get Stripe public key for frontend
 * GET /api/stripe/config
 */
const getConfig = (req, res) => {
  if (!stripe) {
    return res.status(503).json({
      success: false,
      message: 'Stripe ist nicht konfiguriert. Bitte nutzen Sie WooCommerce zur Zahlung.'
    });
  }

  res.json({
    success: true,
    data: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    }
  });
};

module.exports = {
  createPaymentIntent,
  handleWebhook,
  getConfig
};
