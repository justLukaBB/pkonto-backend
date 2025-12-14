require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./src/models/Application.model');

const updateEmail = async () => {
  const applicationId = process.argv[2];
  const newEmail = process.argv[3] || 'justlukax@gmail.com';

  console.log('🔧 Updating email address...\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const application = await Application.findById(applicationId);

    if (!application) {
      throw new Error('Application not found');
    }

    const oldEmail = application.personalData.email;
    application.personalData.email = newEmail;
    await application.save();

    console.log('✅ Email updated!');
    console.log(`   Old: ${oldEmail}`);
    console.log(`   New: ${newEmail}\n`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

updateEmail();
