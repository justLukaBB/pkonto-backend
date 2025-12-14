require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Test MongoDB Connection
 * Run with: node test-mongodb.js
 */

const testMongoDB = async () => {
  console.log('🔧 Testing MongoDB connection...\n');
  console.log('Connection URI:', process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password
  console.log('');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ MongoDB connection successful!\n');

    // Get connection details
    const db = mongoose.connection.db;
    const admin = db.admin();
    const info = await admin.serverInfo();

    console.log('📊 Database Information:');
    console.log(`  Host: ${mongoose.connection.host}`);
    console.log(`  Database: ${mongoose.connection.name}`);
    console.log(`  MongoDB Version: ${info.version}`);
    console.log(`  Connection State: ${mongoose.connection.readyState === 1 ? 'Connected ✓' : 'Disconnected ✗'}`);
    console.log('');

    // List collections
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections in database:');
    if (collections.length === 0) {
      console.log('  (No collections yet - this is normal for a new database)');
    } else {
      collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    }
    console.log('');

    // Test create a document (optional)
    console.log('🧪 Testing document creation...');
    const TestModel = mongoose.model('Test', new mongoose.Schema({
      message: String,
      timestamp: Date
    }));

    const testDoc = new TestModel({
      message: 'MongoDB connection test successful!',
      timestamp: new Date()
    });

    await testDoc.save();
    console.log('✅ Test document created successfully!');
    console.log('');

    // Clean up test document
    await TestModel.deleteMany({});
    console.log('🧹 Test document cleaned up');
    console.log('');

    // Close connection
    await mongoose.connection.close();
    console.log('🎉 MongoDB is fully configured and working!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. ✅ MongoDB - Configured');
    console.log('  2. ✅ Email - Configured');
    console.log('  3. ⏳ Add stamp.png to src/templates/');
    console.log('  4. ⏳ Start backend: npm run dev');
    console.log('');

  } catch (error) {
    console.error('❌ MongoDB connection failed!\n');
    console.error('Error:', error.message);
    console.error('');
    console.error('Common issues:');
    console.error('  - Wrong username or password');
    console.error('  - IP address not whitelisted in MongoDB Atlas');
    console.error('  - Network/firewall blocking connection');
    console.error('  - Cluster not ready yet (wait a few minutes)');
    console.error('');
    console.error('To fix:');
    console.error('  1. Go to MongoDB Atlas → Network Access');
    console.error('  2. Add IP Address: 0.0.0.0/0 (allow from anywhere)');
    console.error('  3. Go to Database Access → Check username and password');
    console.error('  4. Wait 2-3 minutes for changes to take effect');
    console.error('');
    process.exit(1);
  }
};

// Run test
testMongoDB();
