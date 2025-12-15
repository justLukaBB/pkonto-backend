const express = require('express');
const router = express.Router();
const { createPayment, handleWebhook, getPaymentStatus, getPaymentMethods } = require('../controllers/mollie.controller');

// Get available payment methods
router.get('/methods', getPaymentMethods);

// Create Mollie Payment
router.post('/create-payment', createPayment);

// Mollie Webhook (called by Mollie when payment status changes)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Get payment status
router.get('/payment/:paymentId', getPaymentStatus);

module.exports = router;
