const Application = require('../models/Application.model');
const { processApplication } = require('../services/processing.service');

// Only initialize Mollie if API key is provided
let mollieClient = null;
if (process.env.MOLLIE_API_KEY) {
  const { createMollieClient } = require('@mollie/api-client');
  mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
}

/**
 * Create Mollie Payment
 * POST /api/mollie/create-payment
 */
const createPayment = async (req, res) => {
  try {
    if (!mollieClient) {
      return res.status(503).json({
        success: false,
        message: 'Mollie ist nicht konfiguriert. Bitte nutzen Sie WooCommerce zur Zahlung.'
      });
    }

    const { calculationData, personalData, bankData, calculatedFreibetrag, payment } = req.body;

    // Validate required data
    if (!personalData || !bankData || !calculatedFreibetrag) {
      return res.status(400).json({
        success: false,
        message: 'Fehlende Formulardaten'
      });
    }

    // Create Application in MongoDB with status "payment_pending"
    const application = new Application({
      calculationData: calculationData || {},
      personalData,
      bankData,
      calculatedFreibetrag,
      payment: {
        method: payment?.method || 'mollie',
        amount: payment?.amount || 29.00,
        status: 'pending'
      },
      status: 'payment_pending',
      agreementAccepted: true, // User accepted in Step 4
      ipAddress: req.ip || req.connection.remoteAddress
    });

    await application.save();

    console.log(`Created application ${application._id} for Mollie payment`);

    // Create Mollie Payment
    const paymentData = {
      amount: {
        currency: 'EUR',
        value: (payment?.amount || 29.00).toFixed(2) // Mollie requires string format like "29.00"
      },
      description: `P-Konto Bescheinigung - Freibetrag: ${calculatedFreibetrag.amount.toFixed(2)} EUR`,
      redirectUrl: `${process.env.FRONTEND_URL || 'https://p-konto-bescheinigung.com'}/?payment=success&application_id=${application._id}`,
      webhookUrl: `${process.env.BACKEND_URL || 'https://pkonto-backend-1.onrender.com'}/api/mollie/webhook`,
      metadata: {
        applicationId: application._id.toString(),
        email: personalData.email,
        name: `${personalData.firstName} ${personalData.lastName}`
      }
    };

    // Include payment method if specified by user
    if (payment?.method) {
      paymentData.method = payment.method;
      console.log(`Using payment method: ${payment.method}`);
    }

    let molliePayment;
    try {
      molliePayment = await mollieClient.payments.create(paymentData);
    } catch (methodError) {
      // If specific method is not active in profile, retry without method
      if (methodError.statusCode === 422 && methodError.field === 'method' && paymentData.method) {
        console.warn(`Payment method ${paymentData.method} not active in profile, retrying without method`);
        delete paymentData.method;
        molliePayment = await mollieClient.payments.create(paymentData);
      } else {
        throw methodError;
      }
    }

    // Save Mollie Payment ID to Application
    application.payment.molliePaymentId = molliePayment.id;
    await application.save();

    console.log(`Created Mollie payment ${molliePayment.id} for application ${application._id}`);

    res.json({
      success: true,
      data: {
        checkoutUrl: molliePayment.getCheckoutUrl(),
        paymentId: molliePayment.id,
        applicationId: application._id
      }
    });
  } catch (error) {
    console.error('Create Mollie payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen der Zahlung',
      error: error.message
    });
  }
};

/**
 * Handle Mollie Webhooks
 * POST /api/mollie/webhook
 */
const handleWebhook = async (req, res) => {
  if (!mollieClient) {
    return res.status(503).json({
      success: false,
      message: 'Mollie ist nicht konfiguriert'
    });
  }

  try {
    const paymentId = req.body.id;

    if (!paymentId) {
      return res.status(400).send('Missing payment ID');
    }

    // Get payment details from Mollie
    const molliePayment = await mollieClient.payments.get(paymentId);

    console.log(`Mollie webhook received for payment ${paymentId}, status: ${molliePayment.status}`);

    // Find application by Mollie payment ID
    const application = await Application.findOne({
      'payment.molliePaymentId': paymentId
    });

    if (!application) {
      console.error('Application not found for Mollie payment:', paymentId);
      return res.status(404).send('Application not found');
    }

    // Handle different payment statuses
    switch (molliePayment.status) {
      case 'paid':
        await handlePaymentSuccess(application, molliePayment);
        break;

      case 'failed':
      case 'canceled':
      case 'expired':
        await handlePaymentFailure(application, molliePayment);
        break;

      case 'pending':
      case 'open':
        console.log(`Payment ${paymentId} is still ${molliePayment.status}`);
        break;

      default:
        console.log(`Unhandled Mollie payment status: ${molliePayment.status}`);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Mollie webhook error:', error);
    res.status(500).send('Webhook error');
  }
};

/**
 * Handle successful payment
 */
const handlePaymentSuccess = async (application, molliePayment) => {
  try {
    console.log(`Payment succeeded for application ${application._id}`);

    // Update payment status
    application.payment.status = 'completed';
    application.payment.paidAt = new Date();
    application.payment.molliePaymentId = molliePayment.id;
    application.status = 'paid';
    await application.save();

    console.log(`Application ${application._id} marked as paid`);

    // Trigger PDF generation and email sending
    await processApplication(application._id);

    console.log(`Application ${application._id} processed successfully`);
  } catch (error) {
    console.error('Error handling Mollie payment success:', error);
  }
};

/**
 * Handle failed payment
 */
const handlePaymentFailure = async (application, molliePayment) => {
  try {
    console.log(`Payment failed for application ${application._id}, status: ${molliePayment.status}`);

    application.payment.status = 'failed';
    await application.save();

    // TODO: Send failure notification email to customer
  } catch (error) {
    console.error('Error handling Mollie payment failure:', error);
  }
};

/**
 * Check payment status
 * GET /api/mollie/payment/:paymentId
 */
const getPaymentStatus = async (req, res) => {
  try {
    if (!mollieClient) {
      return res.status(503).json({
        success: false,
        message: 'Mollie ist nicht konfiguriert'
      });
    }

    const { paymentId } = req.params;

    const molliePayment = await mollieClient.payments.get(paymentId);

    res.json({
      success: true,
      data: {
        status: molliePayment.status,
        amount: molliePayment.amount,
        paidAt: molliePayment.paidAt
      }
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen des Zahlungsstatus',
      error: error.message
    });
  }
};

/**
 * Get available payment methods
 * GET /api/mollie/methods
 */
const getPaymentMethods = async (req, res) => {
  try {
    if (!mollieClient) {
      return res.status(503).json({
        success: false,
        message: 'Mollie ist nicht konfiguriert'
      });
    }

    const { amount } = req.query;

    // Get all available payment methods
    const methods = await mollieClient.methods.list({
      amount: {
        value: amount || '29.00',
        currency: 'EUR'
      },
      locale: 'de_DE',
      resource: 'payments'
    });

    console.log('Available payment methods:', methods);

    // Filter out methods that might not be fully activated
    // Apple Pay and other wallet methods often require special activation
    const filteredMethods = methods.filter(method => {
      // Exclude wallet methods that commonly cause activation issues
      const walletMethods = ['applepay'];
      return !walletMethods.includes(method.id);
    });

    console.log(`Filtered methods: ${filteredMethods.length} of ${methods.length}`);

    res.json({
      success: true,
      data: filteredMethods
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Zahlungsmethoden',
      error: error.message
    });
  }
};

module.exports = {
  createPayment,
  handleWebhook,
  getPaymentStatus,
  getPaymentMethods
};
