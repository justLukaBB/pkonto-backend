# Quick Start Guide

Get your P-Konto backend up and running in 10 minutes!

## Prerequisites

- Node.js installed (v18 or higher)
- MongoDB running (local or Atlas)
- Text editor (VS Code recommended)

## 1. Install Dependencies

```bash
cd "/Users/luka.s/Backend P-konto"
npm install
```

## 2. Configure Environment

Copy example env file:
```bash
cp .env.example .env
```

Edit `.env` and update at minimum:
- `MONGODB_URI` - Your MongoDB connection string
- `EMAIL_USER` and `EMAIL_PASSWORD` - Email credentials
- `LAWYER_NAME` - Set to "Thomas Scuric"

## 3. Add Your Files

**Required:**
- Place lawyer stamp at: `src/templates/stamp.png`

**Optional:**
- Place PDF template at: `src/templates/certificate-template.pdf`

## 4. Start Server

```bash
npm run dev
```

Server starts at: http://localhost:5000

## 5. Test API

Open browser or use curl:

```bash
# Health check
curl http://localhost:5000/health

# Calculate Freibetrag
curl -X POST http://localhost:5000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "married": true,
    "childrenCount": 2,
    "children": [
      {"birthdate": {"day": 15, "month": 3, "year": 2015}, "receivesKindergeld": true},
      {"birthdate": {"day": 20, "month": 7, "year": 2018}, "receivesKindergeld": true}
    ],
    "socialBenefitsCount": 0,
    "healthCompensation": 0
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "freibetrag": 2472.00,
    "freibetragFormatted": "2.472,00 €",
    ...
  }
}
```

## 6. Submit Test Application

```bash
curl -X POST http://localhost:5000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "calculationData": {
      "married": false,
      "childrenCount": 0,
      "children": [],
      "socialBenefitsCount": 0,
      "healthCompensation": 0
    },
    "personalData": {
      "salutation": "herr",
      "firstName": "Max",
      "lastName": "Mustermann",
      "street": "Teststraße",
      "houseNumber": "1",
      "zipCode": "12345",
      "city": "Berlin",
      "birthdate": {"day": 1, "month": 1, "year": 1990},
      "email": "test@example.com"
    },
    "bankData": {
      "iban": "DE89370400440532013000",
      "bic": "COBADEFFXXX"
    },
    "payment": {
      "method": "paypal"
    },
    "agreementAccepted": true
  }'
```

## What's Next?

### For Development:
1. Read **README.md** for detailed documentation
2. Check **WORDPRESS_INTEGRATION.md** for frontend integration
3. Test all API endpoints

### For Production:
1. Read **DEPLOYMENT.md** for Render deployment
2. Set up MongoDB Atlas
3. Configure Stripe
4. Deploy to Render
5. Connect to WordPress

## File Structure

```
Backend P-konto/
├── src/
│   ├── config/         # Database config
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── controllers/    # Business logic
│   ├── services/       # Core services (PDF, email, calc)
│   ├── middleware/     # Validation
│   └── templates/      # PUT YOUR STAMP HERE!
├── uploads/            # Generated PDFs go here
├── .env                # YOUR SETTINGS
├── server.js           # Entry point
├── README.md           # Full documentation
├── DEPLOYMENT.md       # How to deploy
├── WORDPRESS_INTEGRATION.md  # Frontend guide
└── QUICKSTART.md       # This file
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/calculate` | Calculate Freibetrag |
| POST | `/api/applications` | Submit application |
| GET | `/api/applications/:id` | Get application |
| GET | `/api/applications` | List all applications |
| POST | `/api/stripe/create-payment-intent` | Create payment |
| POST | `/api/stripe/webhook` | Stripe webhook |

## Common Issues

### Can't Connect to MongoDB
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Start MongoDB or use MongoDB Atlas URL

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change PORT in .env or kill process using port 5000

### Validation Errors
```
{"success":false,"message":"Validierungsfehler"}
```
**Solution**: Check request body matches schema in validation.js

### Email Not Sending
```
Error: Invalid login: 535
```
**Solution**: Use App Password for Gmail, not regular password

## Need Help?

1. Check the logs in terminal
2. Read README.md for detailed info
3. Check relevant guide:
   - Development → README.md
   - WordPress → WORDPRESS_INTEGRATION.md
   - Deployment → DEPLOYMENT.md

## Stripe Test Mode

For testing payments without real money:

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`

Use any:
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

## Quick Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# View logs
# (Logs appear in terminal)

# Check MongoDB connection
# (Server logs show "MongoDB Connected: ..." on startup)

# Test endpoint
curl http://localhost:5000/health
```

## Success!

If you see:
```
Server running on port 5000
MongoDB Connected: ...
```

You're ready to go! 🎉

Next: Read WORDPRESS_INTEGRATION.md to connect your form.
