const express = require('express');
const router = express.Router();
const { calculate } = require('../controllers/calculation.controller');
const { validateCalculation } = require('../middleware/validation');

/**
 * POST /api/calculate
 * Calculate Freibetrag based on user input
 */
router.post('/', validateCalculation, calculate);

module.exports = router;
