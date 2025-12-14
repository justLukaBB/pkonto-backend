require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./src/models/Application.model');
const { generateFromWordTemplate } = require('./src/services/word-template.service');

/**
 * Test Word Template Generation
 * Run with: node test-word-template.js <application-id>
 */

const testWordTemplate = async () => {
  const applicationId = process.argv[2] || '693c3228a0902ab6a0ba06f2';

  console.log('🔧 Testing Word template generation...\n');
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
    console.log(`   Freibetrag: ${application.calculatedFreibetrag.amount.toFixed(2)} EUR\n`);

    // Generate Word document
    console.log('📝 Generating Word document from template...');
    const docPath = await generateFromWordTemplate(application);
    console.log(`✅ Word document generated!\n`);
    console.log(`📄 File saved at: ${docPath}\n`);

    console.log('🎉 Success!');
    console.log('');
    console.log('Next steps:');
    console.log(`  1. Open the file: open "${docPath}"`);
    console.log('  2. Check if all placeholders are filled correctly');
    console.log('  3. If needed, adjust placeholders in your Word template');
    console.log('');
    console.log('Template Placeholder Format:');
    console.log('  In your Word document, use: {firstName}, {lastName}, {iban}, etc.');
    console.log('  Available placeholders: See word-template.service.js prepareTemplateData()');
    console.log('');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed!\n');
    console.error('Error:', error.message);

    if (error.properties && error.properties.errors) {
      console.error('\nTemplate Errors:');
      error.properties.errors.forEach(err => {
        console.error(`  - ${err.message}`);
        console.error(`    Tag: {${err.properties.id}}`);
      });
      console.error('\nMake sure your Word template has placeholders like {firstName}, {lastName}, etc.');
    }

    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run test
testWordTemplate();
