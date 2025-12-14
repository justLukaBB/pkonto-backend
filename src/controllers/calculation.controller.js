const { calculateFreibetrag, formatCurrency } = require('../services/calculation.service');

/**
 * Calculate Freibetrag based on user input
 * POST /api/calculate
 */
const calculate = async (req, res) => {
  try {
    const calculationData = req.body;

    // Perform calculation
    const result = calculateFreibetrag(calculationData);

    res.json({
      success: true,
      data: {
        freibetrag: result.total,
        freibetragFormatted: formatCurrency(result.total),
        breakdown: result.breakdown,
        details: result.details
      }
    });
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler bei der Berechnung des Freibetrags',
      error: error.message
    });
  }
};

module.exports = {
  calculate
};
