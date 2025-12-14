const Application = require('../models/Application.model');
const { generateCertificate } = require('./pdf.service');
const { sendCertificateEmail } = require('./email.service');

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
  reprocessApplication
};
