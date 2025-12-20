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
    const { calculationData, personalData, bankData, calculatedFreibetrag, payment } = req.body;

    // Validate required data
    if (!personalData || !bankData || !calculatedFreibetrag) {
      return res.status(400).json({
        success: false,
        message: 'Fehlende Formulardaten'
      });
    }

    // Check if this is a Mandant (existing client) request
    if (payment?.method === 'mandant-code') {
      console.log('Mandant request detected - bypassing Mollie payment');

      // Create Application in MongoDB with status "paid" (no payment required)
      const application = new Application({
        calculationData: calculationData || {},
        personalData,
        bankData,
        calculatedFreibetrag,
        payment: {
          method: 'mandant-code',
          amount: 0.00, // No payment required for existing clients
          status: 'completed'
        },
        status: 'paid',
        agreementAccepted: true,
        ipAddress: req.ip || req.connection.remoteAddress
      });

      await application.save();
      console.log(`Created mandant application ${application._id}`);

      // Process application immediately (generate PDF and send email)
      await processApplication(application._id);
      console.log(`Mandant application ${application._id} processed successfully`);

      return res.json({
        success: true,
        data: {
          applicationId: application._id,
          message: 'Mandanten-Anfrage erfolgreich bearbeitet'
        }
      });
    }

    // Regular Mollie payment flow
    if (!mollieClient) {
      return res.status(503).json({
        success: false,
        message: 'Mollie ist nicht konfiguriert. Bitte nutzen Sie WooCommerce zur Zahlung.'
      });
    }

    // Create Application in MongoDB with status "payment_pending"
    const application = new Application({
      calculationData: calculationData || {},
      personalData,
      bankData,
      calculatedFreibetrag,
      payment: {
        method: 'mollie',
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
    const molliePayment = await mollieClient.payments.create({
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
    });

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
    const id = req.body.id;

    if (!id) {
      return res.status(400).send('Missing ID');
    }

    // Check if this is an Event webhook (event_xxx format)
    // Mollie sends both Event webhooks and Payment webhooks
    // We only process Payment webhooks (tr_xxx, ord_xxx format)
    if (id.startsWith('event_')) {
      console.log(`Received Mollie Event webhook ${id} - ignoring (we only process Payment webhooks)`);
      return res.status(200).send('OK');
    }

    const paymentId = id;

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
 * Debug: List available payment methods
 * GET /api/mollie/debug/methods
 */
const debugPaymentMethods = async (req, res) => {
  try {
    if (!mollieClient) {
      return res.status(503).json({
        success: false,
        message: 'Mollie ist nicht konfiguriert'
      });
    }

    // Get all available payment methods
    const methods = await mollieClient.methods.list({
      amount: {
        currency: 'EUR',
        value: '29.00'
      }
    });

    // Get profile info
    const profile = await mollieClient.profiles.getCurrent();

    console.log('Available Mollie payment methods:', methods);
    console.log('Current Mollie profile:', profile);

    res.json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          name: profile.name,
          status: profile.status,
          mode: profile.mode
        },
        availableMethods: methods.map(m => ({
          id: m.id,
          description: m.description,
          minimumAmount: m.minimumAmount,
          maximumAmount: m.maximumAmount
        })),
        count: methods.length
      }
    });
  } catch (error) {
    console.error('Debug payment methods error:', error);
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
  debugPaymentMethods
};
