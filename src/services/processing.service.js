const Application = require('../models/Application.model');
const { generateCertificate } = require('./pdf.service');
const { sendCertificateEmail } = require('./email.service');

/**
 * Send order confirmation to Make.com webhook for Slack notification
 */
const sendOrderConfirmation = async (application) => {
  try {
    const webhookUrl = 'https://hook.eu2.make.com/836uqphu625qgwinko90jsiufnalryqd';

    const orderData = {
      orderId: application._id.toString(),
      orderDate: application.createdAt,
      completedAt: new Date(),

      // Customer Information
      customer: {
        salutation: application.personalData.salutation,
        firstName: application.personalData.firstName,
        lastName: application.personalData.lastName,
        email: application.personalData.email,
        birthdate: `${application.personalData.birthdate.day}.${application.personalData.birthdate.month}.${application.personalData.birthdate.year}`,
        address: {
          street: application.personalData.street,
          houseNumber: application.personalData.houseNumber,
          zipCode: application.personalData.zipCode,
          city: application.personalData.city
        }
      },

      // Bank Information
      bank: {
        iban: application.bankData.iban,
        bic: application.bankData.bic
      },

      // Calculation Data
      calculation: {
        married: application.calculationData.married,
        childrenCount: application.calculationData.childrenCount,
        healthCompensation: application.calculationData.healthCompensation,
        children: application.calculationData.children || []
      },

      // Freibetrag Information
      freibetrag: {
        amount: application.calculatedFreibetrag.amount,
        currency: 'EUR'
      },

      // Payment Information
      payment: {
        method: application.payment.method,
        amount: application.payment.amount,
        status: application.payment.status,
        paidAt: application.payment.paidAt,
        molliePaymentId: application.payment.molliePaymentId
      },

      // Application Status
      status: application.status,
      ipAddress: application.ipAddress
    };

    console.log('Sending order confirmation to Make.com webhook...');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (response.ok) {
      console.log('✓ Order confirmation sent to Slack successfully');
    } else {
      console.warn(`⚠️  Make.com webhook returned status ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    // Don't throw - this is not critical for the main flow
  }
};

/**
 * Process paid application: Generate PDF and send email
 * This is triggered after successful payment
 *
 * @param {string} applicationId - MongoDB _id of the application
 */
const processApplication = async (applicationId) => {
  try {
    // Find application
    const application = await Application.findById(applicationId);

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.payment.status !== 'completed') {
      throw new Error('Payment not completed');
    }

    console.log(`Processing application ${applicationId}...`);

    // Generate PDF certificate
    const pdfPath = await generateCertificate(application);

    // Update application with PDF path
    application.certificate.pdfPath = pdfPath;
    application.certificate.generated = true;
    application.certificate.generatedAt = new Date();
    application.status = 'certificate_generated';
    await application.save();

    console.log(`Certificate generated for application ${applicationId}`);

    // Send email with certificate
    await sendCertificateEmail(application, pdfPath);

    // Update application status
    application.certificate.sentViaEmail = true;
    application.certificate.emailSentAt = new Date();
    application.status = 'completed';
    await application.save();

    console.log(`Application ${applicationId} completed successfully`);

    // Send order confirmation to internal team via Make.com webhook
    await sendOrderConfirmation(application);

    return {
      success: true,
      applicationId: application._id,
      pdfPath,
      emailSent: true
    };
  } catch (error) {
    console.error('Processing error:', error);

    // Update application with error status if possible
    try {
      const application = await Application.findById(applicationId);
      if (application) {
        application.status = 'paid'; // Keep as paid but mark processing failed
        await application.save();
      }
    } catch (updateError) {
      console.error('Error updating application status:', updateError);
    }

    throw error;
  }
};

/**
 * Reprocess an application (for manual retries)
 */
const reprocessApplication = async (applicationId) => {
  try {
    const application = await Application.findById(applicationId);

    if (!application) {
      throw new Error('Application not found');
    }

    // Reset certificate status
    application.certificate.generated = false;
    application.certificate.sentViaEmail = false;
    application.status = 'paid';
    await application.save();

    // Process again
    return await processApplication(applicationId);
  } catch (error) {
    console.error('Reprocessing error:', error);
    throw error;
  }
};

module.exports = {
  processApplication,
  reprocessApplication,
  sendOrderConfirmation
};
