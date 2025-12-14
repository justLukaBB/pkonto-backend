const express = require('express');
const router = express.Router();
const {
  handleWooCommerceWebhook,
  testEndpoint
} = require('../controllers/woocommerce.controller');

/**
 * GET /api/woocommerce/test
 * Test endpoint to verify webhook is accessible
 */
router.get('/test', testEndpoint);

/**
 * POST /api/woocommerce/webhook
 * Receives webhook from WooCommerce after order completion
 *
 * This endpoint will be called by WooCommerce when:
 * - Order status changes to 'completed' or 'processing'
 * - Payment has been confirmed
 */
router.post('/webhook', express.json(), handleWooCommerceWebhook);

module.exports = router;
