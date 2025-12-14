require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.WORDPRESS_URL || '*',
  credentials: true
}));

// Stripe webhook needs raw body, so handle it before JSON parsing
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/applications', require('./src/routes/application.routes'));
app.use('/api/calculate', require('./src/routes/calculate.routes'));
app.use('/api/stripe', require('./src/routes/stripe.routes'));
app.use('/api/woocommerce', require('./src/routes/woocommerce.routes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'P-Konto Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
