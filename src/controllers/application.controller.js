const Application = require('../models/Application.model');
const { calculateFreibetrag } = require('../services/calculation.service');

/**
 * Submit a new P-Konto application
 * POST /api/applications
 */
const submitApplication = async (req, res) => {
  try {
    const { calculationData, personalData, bankData, payment, agreementAccepted } = req.body;

    // Calculate Freibetrag
    const freibetragResult = calculateFreibetrag(calculationData);

    // Determine payment amount based on payment method
    let paymentAmount = parseFloat(process.env.CERTIFICATE_PRICE) || 29.00;
    if (payment.method === 'nachnahme') {
      paymentAmount += 5.00; // Additional fee for Nachnahme
    }

    // Create application
    const application = new Application({
      calculationData,
      personalData,
      bankData,
      calculatedFreibetrag: {
        amount: freibetragResult.total,
        details: freibetragResult.details
      },
      payment: {
        method: payment.method,
        amount: paymentAmount,
        status: 'pending'
      },
      agreementAccepted,
      ipAddress: req.ip || req.connection.remoteAddress,
      status: 'payment_pending'
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Antrag erfolgreich eingereicht',
      data: {
        applicationId: application._id,
        freibetrag: freibetragResult.total,
        paymentAmount: paymentAmount,
        paymentMethod: payment.method
      }
    });
  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Einreichen des Antrags',
      error: error.message
    });
  }
};

/**
 * Get application by ID
 * GET /api/applications/:id
 */
const getApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Antrag nicht gefunden'
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen des Antrags',
      error: error.message
    });
  }
};

/**
 * Update payment status (called by Stripe webhook)
 * PUT /api/applications/:id/payment
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentIntentId } = req.body;

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Antrag nicht gefunden'
      });
    }

    application.payment.status = status;
    application.payment.stripePaymentIntentId = paymentIntentId;

    if (status === 'completed') {
      application.payment.paidAt = new Date();
      application.status = 'paid';
    }

    await application.save();

    // If payment is completed, trigger PDF generation
    if (status === 'completed') {
      // TODO: Trigger PDF generation and email sending
      // This will be implemented in the next step
    }

    res.json({
      success: true,
      message: 'Zahlungsstatus aktualisiert',
      data: application
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren des Zahlungsstatus',
      error: error.message
    });
  }
};

/**
 * Get all applications (admin endpoint - add authentication later)
 * GET /api/applications
 */
const getAllApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = status ? { status } : {};
    const skip = (page - 1) * limit;

    const applications = await Application.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Anträge',
      error: error.message
    });
  }
};

module.exports = {
  submitApplication,
  getApplication,
  updatePaymentStatus,
  getAllApplications
};
