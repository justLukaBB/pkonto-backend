const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  birthdate: {
    day: { type: Number, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true }
  },
  receivesKindergeld: { type: Boolean, required: true }
});

const applicationSchema = new mongoose.Schema({
  // Step 1 & 2: Calculation Data
  calculationData: {
    married: { type: Boolean, required: true },
    childrenCount: { type: Number, default: 0 },
    children: [childSchema],
    socialBenefitsCount: { type: Number, default: 0 },
    healthCompensation: { type: Number, default: 0 }
  },

  // Step 3: Personal Data
  personalData: {
    salutation: {
      type: String,
      enum: ['herr', 'frau', 'divers'],
      required: true
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    street: { type: String, required: true },
    houseNumber: { type: String, required: true },
    zipCode: { type: String, required: true },
    city: { type: String, required: true },
    birthdate: {
      day: { type: Number, required: true },
      month: { type: Number, required: true },
      year: { type: Number, required: true }
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: { type: String }
  },

  // Bank Information
  bankData: {
    iban: { type: String, required: true },
    bic: { type: String, required: true }
  },

  // Calculated Freibetrag
  calculatedFreibetrag: {
    amount: { type: Number, required: true },
    details: { type: String }
  },

  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['paypal', 'klarna', 'amazon', 'applepay', 'woocommerce', 'stripe', 'mollie', 'mandant-code'],
      required: true
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    stripePaymentIntentId: { type: String },
    stripeCheckoutSessionId: { type: String },
    molliePaymentId: { type: String },
    woocommerceOrderId: { type: String },
    paidAt: { type: Date }
  },

  // Certificate Information
  certificate: {
    generated: { type: Boolean, default: false },
    generatedAt: { type: Date },
    pdfPath: { type: String },
    sentViaEmail: { type: Boolean, default: false },
    emailSentAt: { type: Date }
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'payment_pending', 'paid', 'certificate_generated', 'completed'],
    default: 'draft'
  },

  // Agreement & Legal
  agreementAccepted: { type: Boolean, required: true },
  ipAddress: { type: String },

}, {
  timestamps: true
});

// Index for quick lookups
applicationSchema.index({ 'personalData.email': 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
