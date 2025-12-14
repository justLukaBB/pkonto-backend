require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./src/models/Application.model');
const { generateCertificate } = require('./src/services/pdf.service');
const { sendCertificateEmail } = require('./src/services/email.service');

/**
 * Test PDF Generation and Email Delivery
 * Run with: node test-pdf-generation.js <application-id>
 */

const testPDFGeneration = async () => {
  const applicationId = process.argv[2];

  if (!applicationId) {
    console.error('❌ Fehler: Application ID erforderlich');
    console.error('Usage: node test-pdf-generation.js <application-id>');
    process.exit(1);
  }

  console.log('🔧 Testing PDF generation and email delivery...\n');
  console.log(`Application ID: ${applicationId}\n`);

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Find application
    console.log('🔍 Finding application...');
    const application = await Application.findById(applicationId);

    if (!application) {
      throw new Error('Application not found');
    }

    console.log('✅ Application found');
    console.log(`   Customer: ${application.personalData.firstName} ${application.personalData.lastName}`);
    console.log(`   Email: ${application.personalData.email}`);
    console.log(`   Freibetrag: ${application.calculatedFreibetrag.amount.toFixed(2)} EUR`);
    console.log(`   Status: ${application.status}\n`);

    // Simulate payment completion (for testing)
    if (application.payment.status !== 'completed') {
      console.log('💳 Simulating payment completion...');
      application.payment.status = 'completed';
      application.payment.paidAt = new Date();
      application.status = 'paid';
      await application.save();
      console.log('✅ Payment status updated to "completed"\n');
    }

    // Generate PDF certificate
    console.log('📄 Generating PDF certificate...');
    const pdfPath = await generateCertificate(application);
    console.log(`✅ PDF generated: ${pdfPath}\n`);

    // Update application
    application.certificate.pdfPath = pdfPath;
    application.certificate.generated = true;
    application.certificate.generatedAt = new Date();
    application.status = 'certificate_generated';
    await application.save();

    console.log('📧 Sending certificate via email...');
    const emailResult = await sendCertificateEmail(application, pdfPath);
    console.log(`✅ Email sent! Message ID: ${emailResult.messageId}\n`);

    // Final update
    application.certificate.sentViaEmail = true;
    application.certificate.emailSentAt = new Date();
    application.status = 'completed';
    await application.save();

    console.log('🎉 Success! Complete workflow tested:\n');
    console.log('  ✅ Application found in database');
    console.log('  ✅ Payment marked as completed');
    console.log('  ✅ PDF certificate generated');
    console.log('  ✅ Email sent to customer');
    console.log('  ✅ Status updated to "completed"');
    console.log('');
    console.log(`📧 Check your email at: ${application.personalData.email}`);
    console.log(`📄 PDF saved at: ${pdfPath}`);
    console.log('');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed!\n');
    console.error('Error:', error.message);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run test
testPDFGeneration();
