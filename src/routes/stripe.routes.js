const express = require('express');
const router = express.Router();
const {
  createCheckoutSession,
  createPaymentIntent,
  handleWebhook,
  getConfig
} = require('../controllers/stripe.controller');

/**
 * GET /api/stripe/config
 * Get Stripe public key configuration
 */
router.get('/config', getConfig);

/**
 * POST /api/stripe/create-checkout-session
 * Create a new Stripe Checkout Session (redirects to Stripe payment page)
 */
router.post('/create-checkout-session', createCheckoutSession);

/**
 * POST /api/stripe/create-payment-intent
 * Create a new payment intent for an application
 */
router.post('/create-payment-intent', createPaymentIntent);

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhooks
 * Note: This route needs raw body, so it should use express.raw() middleware
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

module.exports = router;
