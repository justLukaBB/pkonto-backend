# Deployment Guide to Render

This guide will help you deploy the P-Konto backend to Render.

## Prerequisites

- GitHub account
- Render account (free tier available)
- MongoDB Atlas account (free tier available)
- Stripe account
- Email provider (Gmail, SendGrid, etc.)

## Step-by-Step Deployment

### 1. Prepare MongoDB Database

#### Create MongoDB Atlas Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Create a new cluster (free M0 tier is sufficient for testing)
4. Click "Connect" → "Connect your application"
5. Copy connection string, it looks like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pkonto-db
   ```
6. Replace `<password>` with your actual password
7. Add your IP address to whitelist (or allow from anywhere: 0.0.0.0/0)

### 2. Set Up GitHub Repository

1. Initialize git repository (if not done):
   ```bash
   cd "/Users/luka.s/Backend P-konto"
   git init
   git add .
   git commit -m "Initial commit: P-Konto backend"
   ```

2. Create new repository on GitHub:
   - Go to https://github.com/new
   - Create repository (e.g., "pkonto-backend")
   - Don't initialize with README (you already have one)

3. Push to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/pkonto-backend.git
   git branch -M main
   git push -u origin main
   ```

### 3. Deploy to Render

#### Create Web Service

1. Go to https://render.com
2. Sign up or log in
3. Click "New +" → "Web Service"
4. Connect your GitHub account
5. Select your repository ("pkonto-backend")

#### Configure Service

**Basic Settings:**
- **Name**: `pkonto-backend` (or your choice)
- **Region**: Choose closest to your users (e.g., Frankfurt for Germany)
- **Branch**: `main`
- **Root Directory**: Leave empty
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type:**
- Start with "Free" tier for testing
- Upgrade to "Starter" ($7/month) for production

#### Add Environment Variables

Click "Environment" tab and add all these variables:

```
NODE_ENV = production
PORT = 10000

# MongoDB
MONGODB_URI = mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pkonto-db

# WordPress
WORDPRESS_URL = https://p-konto-bescheinigung.com

# Email
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USER = your-email@gmail.com
EMAIL_PASSWORD = your-app-password
EMAIL_FROM = noreply@p-konto-bescheinigung.com

# Stripe (use test keys first)
STRIPE_SECRET_KEY = sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY = pk_test_xxxxx
STRIPE_WEBHOOK_SECRET = whsec_xxxxx

# Application
CERTIFICATE_PRICE = 29.00
LAWYER_NAME = Thomas Scuric
LAWYER_TITLE = Rechtsanwalt
STAMP_IMAGE_PATH = ./src/templates/stamp.png
```

**Important Notes:**
- Use production values, not development values
- MongoDB URI should point to MongoDB Atlas
- Stripe keys should be test keys initially
- EMAIL_PASSWORD for Gmail should be an App Password, not your regular password

### 4. Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Pull code from GitHub
   - Install dependencies
   - Start the server
3. Wait for deployment to complete (2-5 minutes)
4. You'll get a URL like: `https://pkonto-backend.onrender.com`

### 5. Test Deployment

Test the health endpoint:
```bash
curl https://pkonto-backend.onrender.com/health
```

Should return:
```json
{"status":"ok","message":"P-Konto Backend is running"}
```

### 6. Upload PDF Template and Stamp

Since Render uses ephemeral file system, you have two options:

#### Option A: Store in Repository (Recommended)

1. Add your files locally:
   ```bash
   # Add stamp
   cp /path/to/stamp.png src/templates/stamp.png

   # Add template (optional)
   cp /path/to/template.pdf src/templates/certificate-template.pdf
   ```

2. Update `.gitignore` to allow these files:
   ```bash
   # Comment out these lines in .gitignore if they exist
   # src/templates/stamp.png
   # src/templates/certificate-template.pdf
   ```

3. Commit and push:
   ```bash
   git add src/templates/
   git commit -m "Add PDF template and stamp"
   git push
   ```

4. Render will auto-deploy with the new files

#### Option B: Use Cloud Storage (For Sensitive Files)

If your stamp/template is sensitive:
1. Upload to AWS S3, Google Cloud Storage, or similar
2. Update code to fetch from cloud storage
3. Add cloud storage credentials to environment variables

### 7. Configure Stripe Webhooks

1. Go to Stripe Dashboard: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://pkonto-backend.onrender.com/api/stripe/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click "Add endpoint"
6. Copy the webhook signing secret (starts with `whsec_`)
7. Update `STRIPE_WEBHOOK_SECRET` in Render environment variables
8. Restart the service in Render

### 8. Update WordPress Form

Update the API URL in your WordPress JavaScript:

```javascript
const API_BASE_URL = 'https://pkonto-backend.onrender.com/api';
```

### 9. Test Complete Flow

1. Go to your WordPress form
2. Fill out form
3. Calculate Freibetrag → Should work
4. Submit application → Should create record
5. Complete payment → Should receive email with PDF

Check application was created:
```bash
curl https://pkonto-backend.onrender.com/api/applications
```

### 10. Go Live with Stripe

Once testing is complete:

1. Get live Stripe keys from dashboard
2. Update environment variables in Render:
   ```
   STRIPE_SECRET_KEY = sk_live_xxxxx
   STRIPE_PUBLISHABLE_KEY = pk_live_xxxxx
   ```
3. Update webhook with production keys
4. Test with real (small) payment

## Monitoring and Maintenance

### View Logs

In Render dashboard:
1. Go to your service
2. Click "Logs" tab
3. View real-time logs

### Auto-Deploy on Git Push

Render automatically deploys when you push to `main` branch:

```bash
git add .
git commit -m "Update feature"
git push
```

### Custom Domain (Optional)

1. In Render, go to "Settings" → "Custom Domain"
2. Add your domain (e.g., `api.p-konto-bescheinigung.com`)
3. Update DNS records as instructed
4. Update `WORDPRESS_URL` and webhook URLs accordingly

### Scaling

#### Free Tier Limitations:
- Sleeps after 15 minutes of inactivity
- 750 hours/month free
- Can take 30 seconds to wake up

#### Upgrade to Starter ($7/month):
- Always on (no sleeping)
- Faster performance
- More memory

To upgrade:
1. Go to service settings
2. Change "Instance Type" to "Starter"
3. Confirm

### Backups

#### MongoDB Backups:
- MongoDB Atlas has automatic backups
- Free tier: No point-in-time recovery
- Paid tiers: Daily backups with point-in-time recovery

#### Code Backups:
- Your code is on GitHub (already backed up)
- Consider setting up GitHub Actions for CI/CD

### Environment Variables Update

To change environment variables:
1. Go to Render dashboard
2. Select service → "Environment"
3. Update variables
4. Service will auto-restart

## Troubleshooting

### Service Won't Start

Check logs for errors:
- MongoDB connection failed → Check `MONGODB_URI`
- Missing environment variables → Check all env vars are set
- Port issues → Ensure using `process.env.PORT`

### Stripe Webhook Not Working

1. Check webhook URL is correct
2. Verify webhook secret is correct
3. Check Render logs for webhook errors
4. View webhook delivery attempts in Stripe dashboard

### MongoDB Connection Issues

1. Whitelist Render's IP (or use 0.0.0.0/0)
2. Check username/password in connection string
3. Ensure database name is correct
4. Test connection from Render shell

### Email Not Sending

1. For Gmail: Use App Password, enable 2FA
2. Check credentials are correct
3. Try different SMTP provider (SendGrid, Mailgun)
4. Check email logs in Render

### PDF Generation Issues

1. Check stamp file exists in repository
2. Verify file permissions
3. Check logs for specific errors
4. Test PDF generation manually

## Production Checklist

- [ ] MongoDB Atlas cluster created and connected
- [ ] All environment variables configured
- [ ] Stamp and template files uploaded
- [ ] Stripe live keys configured
- [ ] Stripe webhook configured and tested
- [ ] WordPress form updated with API URL
- [ ] Complete payment flow tested
- [ ] Email delivery tested
- [ ] PDF generation tested
- [ ] CORS configured correctly
- [ ] Error monitoring set up
- [ ] Backup strategy in place
- [ ] Custom domain configured (optional)
- [ ] SSL/HTTPS working
- [ ] Performance tested under load

## Cost Estimate

Monthly costs (approximate):

- **Render**: $0 (free tier) or $7 (starter)
- **MongoDB Atlas**: $0 (free tier 512MB)
- **Stripe**: 1.4% + €0.25 per transaction
- **Email**: $0 (Gmail) or ~$10 (SendGrid)

**Total**: ~$7-17/month for production

## Next Steps

After deployment:
1. Monitor first few transactions closely
2. Set up error alerting (email, Slack, etc.)
3. Add analytics/tracking
4. Implement admin dashboard
5. Add authentication for admin endpoints
6. Scale as traffic grows

## Support Resources

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/
- **Stripe Docs**: https://stripe.com/docs
- **Node.js Docs**: https://nodejs.org/docs

## Getting Help

If you encounter issues:
1. Check Render logs first
2. Review this guide and README.md
3. Check Stripe webhook logs
4. MongoDB Atlas connection logs
5. GitHub Issues (if using shared repo)
