const express = require('express');
const router = express.Router();
const {
  submitApplication,
  getApplication,
  updatePaymentStatus,
  getAllApplications
} = require('../controllers/application.controller');
const { validateApplication } = require('../middleware/validation');

/**
 * POST /api/applications
 * Submit a new P-Konto application
 */
router.post('/', validateApplication, submitApplication);

/**
 * GET /api/applications
 * Get all applications (admin endpoint)
 */
router.get('/', getAllApplications);

/**
 * GET /api/applications/:id
 * Get application by ID
 */
router.get('/:id', getApplication);

/**
 * PUT /api/applications/:id/payment
 * Update payment status (for Stripe webhooks)
 */
router.put('/:id/payment', updatePaymentStatus);

module.exports = router;
