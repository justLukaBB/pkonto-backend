# End-to-End Test Guide

## ✅ System Status

All backend systems are **READY** for testing:

- ✅ Backend running on Render: https://pkonto-backend.onrender.com
- ✅ Stripe configured with test keys
- ✅ Checkout session creation working
- ✅ Webhook endpoint configured
- ✅ MongoDB connection active
- ✅ LibreOffice installed for PDF generation

## 📋 Test Steps

### 1. Open the Form
Navigate to: **https://p-konto-bescheinigung.com**

### 2. Fill Out the Form

**Step 1 - Calculation:**
- Marital status: Choose any
- Number of children: 0-2
- Social benefits: 0
- Health compensation: 0

**Step 2 - Additional Info:**
(Continue with same choices)

**Step 3 - Personal Data:**
- Salutation: Herr/Frau/Divers
- First Name: Test
- Last Name: User
- Street: Teststraße
- House Number: 123
- Zip Code: 12345
- City: Berlin
- Birthdate: 15.06.1990
- Email: **YOUR_EMAIL@example.com** (use a real email to receive the PDF!)
- IBAN: DE89370400440532013000
- BIC: COBADEFFXXX

**Step 4 - Payment:**
- Select any payment method (it will redirect to Stripe regardless)
- Click "Jetzt kostenpflichtig beauftragen"

### 3. Complete Stripe Payment

You'll be redirected to Stripe Checkout.

**Test Card Details:**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
Name: Test User
```

Click **"Pay"**

### 4. Verify Success

After payment:
1. You should be redirected back to the website with `?payment=success` in URL
2. Check your email inbox for the P-Konto certificate PDF
3. The PDF should be attached to the email

## 🔍 Debugging

If something fails, check:

### Backend Logs on Render:
https://dashboard.render.com/

Look for:
```
Checkout session completed for application <ID>
Application <ID> marked as paid via checkout session
Certificate generated for application <ID>
Email sent successfully to <email>
```

### Stripe Dashboard:
https://dashboard.stripe.com/test/payments

Check if the payment intent succeeded.

### Webhook Events:
https://dashboard.stripe.com/test/webhooks

Verify `checkout.session.completed` event was delivered.

## ✅ Expected Results

1. **Payment:** Stripe payment succeeds
2. **Webhook:** Stripe sends `checkout.session.completed` event
3. **Backend:** Updates application status to `paid` → `certificate_generated` → `completed`
4. **PDF:** Generates DOCX, converts to PDF
5. **Email:** Sends email with PDF attachment

## 📝 Test Checklist

- [ ] Form loads correctly
- [ ] Form navigation works (Step 1 → 2 → 3 → 4)
- [ ] Data collection works (check browser console logs)
- [ ] Stripe redirect works
- [ ] Payment completes successfully
- [ ] Redirect back to website with success URL
- [ ] Email received with PDF attachment
- [ ] PDF opens and shows correct data

## 🐛 Known Issues

None currently! System is ready for testing.

## 📊 Test Application Created

A test application was already created during API testing:

**Application ID:** `693f1d72ec53e929f9c57598`
**Status:** `payment_pending`

You can use this to verify the MongoDB structure is correct.
