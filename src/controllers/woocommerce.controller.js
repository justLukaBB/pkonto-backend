const crypto = require('crypto');
const Application = require('../models/Application.model');
const { calculateFreibetrag } = require('../services/calculation.service');
const { processApplication } = require('../services/processing.service');

/**
 * Handle WooCommerce Webhook
 * POST /api/woocommerce/webhook
 *
 * This endpoint receives order data from WooCommerce after successful payment
 */
const handleWooCommerceWebhook = async (req, res) => {
  try {
    console.log('WooCommerce Webhook received');
    console.log('Headers:', req.headers);

    // Verify webhook signature (optional but recommended)
    const signature = req.headers['x-wc-webhook-signature'];
    const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const calculatedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('base64');

      if (signature !== calculatedSignature) {
        console.error('Invalid WooCommerce webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const orderData = req.body;
    console.log('Order ID:', orderData.id);
    console.log('Order Status:', orderData.status);

    // Only process completed/processing orders
    if (orderData.status !== 'completed' && orderData.status !== 'processing') {
      console.log('Order not completed yet, skipping...');
      return res.status(200).json({ message: 'Order not completed yet' });
    }

    // Extract form data from order meta data
    const metaData = orderData.meta_data || [];
    const formData = extractFormData(metaData);

    if (!formData) {
      console.error('No form data found in order meta');
      return res.status(400).json({ error: 'No form data found' });
    }

    console.log('Extracted form data:', formData);

    // Calculate Freibetrag
    const calculationData = {
      married: formData.married === 'yes',
      childrenCount: parseInt(formData.childrenCount) || 0,
      children: formData.children || [],
      socialBenefitsCount: parseInt(formData.socialBenefitsCount) || 0,
      healthCompensation: parseFloat(formData.healthCompensation) || 0
    };

    const freibetragResult = calculateFreibetrag(calculationData);

    // Create Application in MongoDB
    const applicationData = {
      personalData: {
        salutation: formData.salutation || 'herr',
        firstName: formData.firstName,
        lastName: formData.lastName,
        street: formData.street,
        houseNumber: formData.houseNumber,
        zipCode: formData.zipCode,
        city: formData.city,
        birthdate: {
          day: parseInt(formData.birthdateDay),
          month: parseInt(formData.birthdateMonth),
          year: parseInt(formData.birthdateYear)
        },
        email: orderData.billing?.email || formData.email,
        phone: orderData.billing?.phone || formData.phone || ''
      },
      bankData: {
        iban: formData.iban,
        bic: formData.bic
      },
      calculationData: calculationData,
      calculatedFreibetrag: {
        amount: freibetragResult.total,
        details: freibetragResult.details,
        breakdown: freibetragResult.breakdown
      },
      payment: {
        method: orderData.payment_method || 'woocommerce',
        amount: parseFloat(orderData.total) || 29.99,
        status: 'completed',
        paidAt: new Date(),
        woocommerceOrderId: orderData.id.toString()
      },
      agreementAccepted: true,
      ipAddress: orderData.customer_ip_address || '',
      status: 'paid'
    };

    // Check if application already exists for this order
    const existingApplication = await Application.findOne({
      'payment.woocommerceOrderId': orderData.id.toString()
    });

    if (existingApplication) {
      console.log('Application already exists for this order:', existingApplication._id);
      return res.status(200).json({
        message: 'Application already processed',
        applicationId: existingApplication._id
      });
    }

    // Create new application
    const application = new Application(applicationData);
    await application.save();

    console.log('Application created:', application._id);

    // Process application (generate PDF + send email)
    console.log('Starting certificate generation and email sending...');
    await processApplication(application._id);

    console.log('WooCommerce order processed successfully');

    res.status(200).json({
      success: true,
      message: 'Order processed successfully',
      applicationId: application._id
    });

  } catch (error) {
    console.error('WooCommerce webhook error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Extract form data from WooCommerce order meta data
 */
const extractFormData = (metaData) => {
  const formData = {};

  metaData.forEach(meta => {
    // Check for our custom field prefix
    if (meta.key && meta.key.startsWith('_pkonto_')) {
      const fieldName = meta.key.replace('_pkonto_', '');
      formData[fieldName] = meta.value;
    }
  });

  // Parse children data if it exists as JSON string
  if (formData.children && typeof formData.children === 'string') {
    try {
      formData.children = JSON.parse(formData.children);
    } catch (e) {
      formData.children = [];
    }
  }

  return Object.keys(formData).length > 0 ? formData : null;
};

/**
 * Test endpoint to verify webhook is working
 * GET /api/woocommerce/test
 */
const testEndpoint = (req, res) => {
  res.json({
    success: true,
    message: 'WooCommerce webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  handleWooCommerceWebhook,
  testEndpoint
};
