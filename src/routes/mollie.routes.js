const express = require('express');
const router = express.Router();
const { createPayment, handleWebhook, getPaymentStatus, debugPaymentMethods } = require('../controllers/mollie.controller');

// Create Mollie Payment
router.post('/create-payment', createPayment);

// Mollie Webhook (called by Mollie when payment status changes)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Get payment status
router.get('/payment/:paymentId', getPaymentStatus);

// Debug: List available payment methods
router.get('/debug/methods', debugPaymentMethods);

module.exports = router;
