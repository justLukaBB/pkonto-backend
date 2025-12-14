# P-Konto Bescheinigung Backend

Backend API for automated P-Konto (Pfändungsschutzkonto) certificate generation according to § 850k ZPO.

## Features

- **Freibetrag Calculation**: Automatic calculation of protected amounts based on marital status, children, and other factors
- **PDF Generation**: Automated certificate generation with lawyer stamp/signature
- **Payment Processing**: Stripe integration for secure payments
- **Email Delivery**: Automatic email delivery of certificates after payment
- **Data Validation**: Comprehensive validation of all input data
- **MongoDB Storage**: Secure storage of applications and processing status

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **PDF Generation**: pdf-lib (for templates) + PDFKit (fallback)
- **Email**: Nodemailer
- **Payment**: Stripe
- **Validation**: Joi
- **Hosting**: Render-ready

## Project Structure

```
Backend P-konto/
├── src/
│   ├── config/
│   │   └── database.js           # MongoDB connection
│   ├── models/
│   │   └── Application.model.js  # Application schema
│   ├── routes/
│   │   ├── application.routes.js # Application endpoints
│   │   ├── calculate.routes.js   # Calculation endpoints
│   │   └── stripe.routes.js      # Stripe/payment endpoints
│   ├── controllers/
│   │   ├── application.controller.js
│   │   ├── calculation.controller.js
│   │   └── stripe.controller.js
│   ├── services/
│   │   ├── calculation.service.js    # Freibetrag calculation logic
│   │   ├── pdf.service.js            # PDF generation
│   │   ├── email.service.js          # Email sending
│   │   └── processing.service.js     # Orchestration service
│   ├── middleware/
│   │   └── validation.js         # Joi validation schemas
│   ├── utils/                    # Helper functions
│   └── templates/
│       ├── certificate-template.pdf  # PDF template (add your template here)
│       └── stamp.png             # Lawyer stamp image (add your stamp here)
├── uploads/                      # Generated PDFs
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── package.json
├── server.js                     # Entry point
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pkonto-db

# WordPress CORS
WORDPRESS_URL=https://your-wordpress-site.com

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@p-konto-bescheinigung.com

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Application
CERTIFICATE_PRICE=29.00
LAWYER_NAME=Thomas Scuric
LAWYER_TITLE=Rechtsanwalt
STAMP_IMAGE_PATH=./src/templates/stamp.png
```

### 3. Add Your PDF Template and Stamp

1. Place your PDF template at: `src/templates/certificate-template.pdf`
2. Place the lawyer's stamp/signature image at: `src/templates/stamp.png`

If you don't have a template, the system will generate a PDF from scratch.

### 4. Set Up MongoDB

#### Option A: MongoDB Atlas (Recommended for Production)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string and add to `.env`

#### Option B: Local MongoDB

```bash
# Install MongoDB locally
brew install mongodb-community  # macOS
# or follow instructions for your OS

# Start MongoDB
brew services start mongodb-community

# Use local connection string
MONGODB_URI=mongodb://localhost:27017/pkonto-db
```

### 5. Set Up Stripe

1. Create account at https://stripe.com
2. Get API keys from Dashboard
3. Set up webhook endpoint: `https://your-domain.com/api/stripe/webhook`
4. Add webhook secret to `.env`
5. Listen for these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

### 6. Configure Email

#### Gmail Example:

1. Enable 2FA on your Google account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use App Password in `EMAIL_PASSWORD`

#### Other SMTP Providers:

- SendGrid, Mailgun, AWS SES, etc.
- Update `EMAIL_HOST`, `EMAIL_PORT`, and credentials

### 7. Run the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will start at `http://localhost:5000`

## API Endpoints

### Health Check

```
GET /health
```

### Calculate Freibetrag

```
POST /api/calculate

Body:
{
  "married": true,
  "childrenCount": 2,
  "children": [
    {
      "birthdate": { "day": 15, "month": 3, "year": 2015 },
      "receivesKindergeld": true
    }
  ],
  "socialBenefitsCount": 0,
  "healthCompensation": 0
}

Response:
{
  "success": true,
  "data": {
    "freibetrag": 2472.00,
    "freibetragFormatted": "2.472,00 €",
    "breakdown": [...],
    "details": "..."
  }
}
```

### Submit Application

```
POST /api/applications

Body:
{
  "calculationData": { ... },
  "personalData": {
    "salutation": "herr",
    "firstName": "Max",
    "lastName": "Mustermann",
    "street": "Musterstraße",
    "houseNumber": "15",
    "zipCode": "40210",
    "city": "Düsseldorf",
    "birthdate": { "day": 11, "month": 5, "year": 1964 },
    "email": "test@example.com",
    "phone": "+49..."
  },
  "bankData": {
    "iban": "DE123456789...",
    "bic": "XXXXX..."
  },
  "payment": {
    "method": "paypal"
  },
  "agreementAccepted": true
}

Response:
{
  "success": true,
  "message": "Antrag erfolgreich eingereicht",
  "data": {
    "applicationId": "...",
    "freibetrag": 2472.00,
    "paymentAmount": 29.00,
    "paymentMethod": "paypal"
  }
}
```

### Get Application

```
GET /api/applications/:id

Response:
{
  "success": true,
  "data": { ... }
}
```

### Create Payment Intent (Stripe)

```
POST /api/stripe/create-payment-intent

Body:
{
  "applicationId": "..."
}

Response:
{
  "success": true,
  "data": {
    "clientSecret": "pi_...",
    "paymentIntentId": "pi_..."
  }
}
```

### Stripe Webhook

```
POST /api/stripe/webhook
(Handled automatically by Stripe)
```

## Deployment to Render

### 1. Create Render Account

Sign up at https://render.com

### 2. Create Web Service

1. Connect your GitHub repository
2. Choose "Web Service"
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

### 3. Add Environment Variables

Add all variables from `.env` in Render dashboard

### 4. Deploy

Render will automatically deploy on push to main branch

### 5. Set Up Stripe Webhook

Update webhook URL to your Render URL:
```
https://your-app.onrender.com/api/stripe/webhook
```

## Workflow

1. **User fills form** on WordPress site
2. **Frontend calls** `POST /api/calculate` to show Freibetrag
3. **User submits** form → `POST /api/applications`
4. **Backend creates** application in MongoDB (status: `payment_pending`)
5. **Frontend initiates** Stripe payment → `POST /api/stripe/create-payment-intent`
6. **User completes** payment
7. **Stripe webhook** triggers → `POST /api/stripe/webhook`
8. **Backend automatically**:
   - Updates payment status to `completed`
   - Generates PDF certificate
   - Sends email with certificate
   - Updates status to `completed`

## Freibetrag Calculation

Based on § 850k ZPO (current 2024/2025 values):

- **Base amount**: €1,410.00
- **Spouse**: +€531.00
- **Per child**: +€531.00
- **Per additional person with social benefits**: +€531.00
- **Health compensation**: exact amount provided

Example:
- Single person: €1,410.00
- Married with 2 children: €1,410 + €531 + (2 × €531) = €3,003.00

## Security Considerations

- All input is validated using Joi schemas
- IBAN and BIC validation
- CORS configured for WordPress domain only
- Stripe webhook signature verification
- MongoDB connection string should use authentication
- Use HTTPS in production
- Environment variables never committed to git

## Troubleshooting

### MongoDB Connection Failed

- Check `MONGODB_URI` in `.env`
- Whitelist your IP in MongoDB Atlas
- Ensure MongoDB service is running (if local)

### Email Not Sending

- Check SMTP credentials
- For Gmail, use App Password, not regular password
- Check firewall/port 587 access

### PDF Generation Failed

- Check if `src/templates/stamp.png` exists
- Verify PDF template path
- Check file permissions for `uploads/` directory

### Stripe Webhook Not Working

- Verify webhook secret in `.env`
- Check webhook URL in Stripe dashboard
- Ensure endpoint is publicly accessible
- Check Stripe dashboard for webhook delivery attempts

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Run tests (when implemented)
npm test
```

## TODO / Future Enhancements

- [ ] Add authentication for admin endpoints
- [ ] Implement admin dashboard
- [ ] Add rate limiting
- [ ] Add logging (Winston/Morgan)
- [ ] Add unit tests (Jest)
- [ ] Add API documentation (Swagger)
- [ ] Implement retry logic for failed emails
- [ ] Add support for multiple languages
- [ ] Add analytics/tracking

## License

ISC

## Support

For questions or issues, contact: [Your Contact Information]
