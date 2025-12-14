const Joi = require('joi');

// Child data validation schema
const childSchema = Joi.object({
  birthdate: Joi.object({
    day: Joi.number().min(1).max(31).required(),
    month: Joi.number().min(1).max(12).required(),
    year: Joi.number().min(1900).max(new Date().getFullYear()).required()
  }).required(),
  receivesKindergeld: Joi.boolean().required()
});

// Calculation data validation
const calculationSchema = Joi.object({
  married: Joi.boolean().required(),
  childrenCount: Joi.number().min(0).max(20).required(),
  children: Joi.array().items(childSchema).optional(),
  socialBenefitsCount: Joi.number().min(0).max(20).required(),
  healthCompensation: Joi.number().min(0).required()
});

// Personal data validation
const personalDataSchema = Joi.object({
  salutation: Joi.string().valid('herr', 'frau', 'divers').required(),
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  street: Joi.string().min(2).max(200).required(),
  houseNumber: Joi.string().min(1).max(10).required(),
  zipCode: Joi.string().pattern(/^\d{5}$/).required()
    .messages({ 'string.pattern.base': 'PLZ muss 5 Ziffern haben' }),
  city: Joi.string().min(2).max(100).required(),
  birthdate: Joi.object({
    day: Joi.number().min(1).max(31).required(),
    month: Joi.number().min(1).max(12).required(),
    year: Joi.number().min(1900).max(new Date().getFullYear() - 18).required()
  }).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional()
});

// Bank data validation
const bankDataSchema = Joi.object({
  iban: Joi.string()
    .pattern(/^[A-Z]{2}\d{2}[A-Z0-9]+$/)
    .min(15)
    .max(34)
    .required()
    .messages({ 'string.pattern.base': 'Ungültige IBAN' }),
  bic: Joi.string()
    .pattern(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/)
    .required()
    .messages({ 'string.pattern.base': 'Ungültiger BIC/Swift-Code' })
});

// Payment data validation
const paymentSchema = Joi.object({
  method: Joi.string().valid('paypal', 'klarna', 'amazon', 'nachnahme').required()
});

// Full application submission validation
const applicationSubmissionSchema = Joi.object({
  calculationData: calculationSchema.required(),
  personalData: personalDataSchema.required(),
  bankData: bankDataSchema.required(),
  payment: paymentSchema.required(),
  agreementAccepted: Joi.boolean().valid(true).required()
    .messages({ 'any.only': 'Sie müssen den AGB zustimmen' })
});

/**
 * Middleware to validate calculation request
 */
const validateCalculation = (req, res, next) => {
  const { error } = calculationSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validierungsfehler',
      errors: error.details.map(detail => detail.message)
    });
  }

  next();
};

/**
 * Middleware to validate full application submission
 */
const validateApplication = (req, res, next) => {
  const { error } = applicationSubmissionSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validierungsfehler',
      errors: error.details.map(detail => detail.message)
    });
  }

  next();
};

module.exports = {
  validateCalculation,
  validateApplication,
  calculationSchema,
  applicationSubmissionSchema
};
