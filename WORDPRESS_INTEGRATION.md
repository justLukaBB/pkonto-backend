# WordPress/Elementor Integration Guide

This guide explains how to integrate the P-Konto backend with your WordPress/Elementor form.

## Overview

Your existing HTML form will communicate with the Node.js backend via JavaScript/AJAX calls.

## Architecture

```
WordPress/Elementor Form (Frontend)
         ↓
    JavaScript AJAX
         ↓
   Node.js Backend API
         ↓
    MongoDB Database
         ↓
    Stripe Payment
         ↓
    PDF Generation + Email
```

## Integration Steps

### 1. Add JavaScript to Your WordPress Page

Add this JavaScript code to your WordPress page (in a custom HTML widget or theme's footer):

```javascript
<script>
// Configuration
const API_BASE_URL = 'https://your-backend-url.onrender.com/api';
let currentApplicationId = null;

// Step 1: Calculate Freibetrag
async function calculateFreibetrag() {
  const calculationData = {
    married: document.querySelector('input[name="married"]:checked').value === 'yes',
    childrenCount: parseInt(document.getElementById('children-count').value) || 0,
    children: getChildrenData(),
    socialBenefitsCount: parseInt(document.getElementById('social-benefits').value) || 0,
    healthCompensation: parseFloat(document.getElementById('health-compensation').value) || 0
  };

  try {
    const response = await fetch(`${API_BASE_URL}/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(calculationData)
    });

    const result = await response.json();

    if (result.success) {
      // Update the result display
      document.getElementById('result-amount').textContent = result.data.freibetragFormatted;
      document.getElementById('result-sub-label').textContent = result.data.details;
    } else {
      alert('Fehler bei der Berechnung: ' + result.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Verbindungsfehler. Bitte versuchen Sie es später erneut.');
  }
}

// Step 2: Submit Full Application
async function submitApplication() {
  const applicationData = {
    calculationData: {
      married: document.querySelector('input[name="married-2"]:checked').value === 'yes',
      childrenCount: parseInt(document.getElementById('children-count-2').value) || 0,
      children: getChildrenData(),
      socialBenefitsCount: parseInt(document.querySelector('[name="social-benefits-2"]').value) || 0,
      healthCompensation: parseFloat(document.querySelector('[name="health-compensation-2"]').value) || 0
    },
    personalData: {
      salutation: document.querySelector('select[name="salutation"]').value,
      firstName: document.querySelector('input[name="firstName"]').value,
      lastName: document.querySelector('input[name="lastName"]').value,
      street: document.querySelector('input[name="street"]').value,
      houseNumber: document.querySelector('input[name="houseNumber"]').value,
      zipCode: document.querySelector('input[name="zipCode"]').value,
      city: document.querySelector('input[name="city"]').value,
      birthdate: {
        day: parseInt(document.querySelector('select[name="birthDay"]').value),
        month: parseInt(document.querySelector('select[name="birthMonth"]').value),
        year: parseInt(document.querySelector('select[name="birthYear"]').value)
      },
      email: document.querySelector('input[name="email"]').value,
      phone: document.querySelector('input[name="phone"]')?.value || ''
    },
    bankData: {
      iban: document.querySelector('input[name="iban"]').value.replace(/\s/g, ''),
      bic: document.querySelector('input[name="bic"]').value
    },
    payment: {
      method: document.querySelector('input[name="payment"]:checked').value
    },
    agreementAccepted: document.getElementById('agreement').checked
  };

  try {
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(applicationData)
    });

    const result = await response.json();

    if (result.success) {
      currentApplicationId = result.data.applicationId;

      // Proceed to payment
      await initiateStripePayment(currentApplicationId);
    } else {
      alert('Fehler beim Einreichen: ' + result.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Verbindungsfehler. Bitte versuchen Sie es später erneut.');
  }
}

// Step 3: Initiate Stripe Payment
async function initiateStripePayment(applicationId) {
  try {
    const response = await fetch(`${API_BASE_URL}/stripe/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ applicationId })
    });

    const result = await response.json();

    if (result.success) {
      // Redirect to Stripe Checkout or use Stripe Elements
      // Option 1: Stripe Checkout (simpler)
      window.location.href = `https://checkout.stripe.com/pay/${result.data.clientSecret}`;

      // Option 2: Stripe Elements (more customizable)
      // showStripePaymentForm(result.data.clientSecret);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Fehler beim Initiieren der Zahlung.');
  }
}

// Helper: Get children data from form
function getChildrenData() {
  const childrenCount = parseInt(document.getElementById('children-count-2').value) || 0;
  const children = [];

  for (let i = 1; i <= childrenCount; i++) {
    children.push({
      birthdate: {
        day: parseInt(document.querySelector(`select[name="child${i}Day"]`).value),
        month: parseInt(document.querySelector(`select[name="child${i}Month"]`).value),
        year: parseInt(document.querySelector(`select[name="child${i}Year"]`).value)
      },
      receivesKindergeld: document.querySelector(`input[name="kindergeld-${i}"]:checked`).value === 'yes'
    });
  }

  return children;
}

// Update your existing button onclick handlers
document.querySelector('.btn-calculate')?.addEventListener('click', calculateFreibetrag);
document.querySelector('.btn-submit')?.addEventListener('click', submitApplication);
</script>
```

### 2. Add Stripe Payment Integration

Add Stripe.js to your WordPress page:

```html
<script src="https://js.stripe.com/v3/"></script>

<script>
// Initialize Stripe
const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY'); // Get from backend API

// Alternative: Fetch public key from backend
async function initStripe() {
  const response = await fetch(`${API_BASE_URL}/stripe/config`);
  const config = await response.json();
  const stripe = Stripe(config.data.publishableKey);
}
</script>
```

### 3. Update Form Name Attributes

Make sure your HTML form inputs have proper `name` attributes matching the JavaScript above:

```html
<!-- Example -->
<input type="text" name="firstName" placeholder="Vorname">
<input type="text" name="lastName" placeholder="Name">
<input type="email" name="email" placeholder="E-Mail">
<!-- etc. -->
```

### 4. CORS Configuration

Ensure your backend `.env` has the correct WordPress URL:

```env
WORDPRESS_URL=https://p-konto-bescheinigung.com
```

This allows your WordPress site to make API calls to the backend.

### 5. Payment Success Redirect

After Stripe payment succeeds, redirect user to a success page:

```javascript
// In your Stripe configuration
const stripe = Stripe('pk_...');

stripe.confirmPayment({
  // ...
  return_url: 'https://p-konto-bescheinigung.com/erfolg'
});
```

Create a WordPress page at `/erfolg` that shows:
- Payment successful message
- "Your certificate will be sent to your email"
- Application ID for reference

## Testing

### 1. Test Mode

Use Stripe test keys for development:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Test Cards

Use Stripe test card numbers:
- Success: `4242 4242 4242 4242`
- Failure: `4000 0000 0000 0002`
- Any future expiry date and any 3-digit CVC

### 3. Test the Flow

1. Fill out form
2. Click "Freibetrag berechnen" → Should show calculated amount
3. Fill out personal details
4. Submit form → Should create application
5. Complete payment → Should trigger PDF generation and email

## Troubleshooting

### CORS Errors

If you see CORS errors in browser console:
1. Check `WORDPRESS_URL` in backend `.env`
2. Restart backend server after changing `.env`
3. Verify WordPress domain is correct (with or without www)

### Payment Not Working

1. Check Stripe keys are correct
2. Verify webhook is set up in Stripe dashboard
3. Check webhook secret in `.env`
4. View webhook logs in Stripe dashboard

### Email Not Received

1. Check spam folder
2. Verify email credentials in `.env`
3. Check backend logs for email errors
4. Test email configuration separately

## Alternative: Use Elementor Pro Forms

If you have Elementor Pro, you can use their form builder:

1. Create form in Elementor
2. Add webhook action after submission
3. Point webhook to: `https://your-backend.onrender.com/api/applications`
4. Map form fields to API format

## Production Checklist

- [ ] Update `API_BASE_URL` to production URL
- [ ] Switch to live Stripe keys
- [ ] Test full payment flow
- [ ] Verify emails are being sent
- [ ] Test PDF generation
- [ ] Set up SSL certificate
- [ ] Enable HTTPS on both WordPress and backend
- [ ] Monitor error logs
- [ ] Set up backup for MongoDB
- [ ] Add analytics/tracking

## Security Notes

- Never expose Stripe secret key in frontend
- Always validate data on backend
- Use HTTPS in production
- Keep WordPress and plugins updated
- Use strong passwords for all services
- Enable 2FA where possible

## Support

For questions about:
- **Backend API**: Check backend logs and README.md
- **WordPress integration**: Check browser console for errors
- **Stripe payments**: Check Stripe dashboard logs
