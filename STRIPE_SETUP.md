# Stripe Integration Setup

## Schritt 1: Stripe Account erstellen

1. Gehe zu https://dashboard.stripe.com/register
2. Erstelle einen Account (falls noch nicht vorhanden)
3. Bestätige deine Email-Adresse

## Schritt 2: Test-Keys holen

### Im Stripe Dashboard:

1. Gehe zu https://dashboard.stripe.com/test/apikeys
2. **Wichtig:** Stelle sicher, dass du im **Test-Modus** bist (Toggle oben rechts)
3. Kopiere die folgenden Keys:

#### Publishable Key (Öffentlich - für Frontend)
```
pk_test_...
```

#### Secret Key (Geheim - für Backend)
```
sk_test_...
```

## Schritt 3: Webhook Secret erstellen

### Für Lokale Entwicklung (Stripe CLI):

1. Installiere Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login bei Stripe:
   ```bash
   stripe login
   ```

3. Starte Webhook Forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Kopiere den angezeigten Webhook Secret:
   ```
   whsec_...
   ```

### Für Production (Stripe Dashboard):

1. Gehe zu https://dashboard.stripe.com/webhooks
2. Klicke "Add endpoint"
3. URL eingeben: `https://your-domain.com/api/stripe/webhook`
4. Events auswählen:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Endpoint erstellen
6. Kopiere den Webhook Signing Secret

## Schritt 4: .env-Datei aktualisieren

Öffne `/Users/luka.s/Backend P-konto/.env` und ersetze die Platzhalter:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_DEIN_SECRET_KEY_HIER
STRIPE_PUBLISHABLE_KEY=pk_test_DEIN_PUBLISHABLE_KEY_HIER
STRIPE_WEBHOOK_SECRET=whsec_DEIN_WEBHOOK_SECRET_HIER
```

## Schritt 5: Server neu starten

```bash
npm run dev
```

## Testen der Integration

### Test-Kreditkarten (von Stripe bereitgestellt):

| Karte                | Nummer           | Ergebnis |
|---------------------|------------------|----------|
| Erfolg              | 4242424242424242 | Zahlung erfolgreich |
| Authentifizierung   | 4000002500003155 | Requires 3D Secure |
| Abgelehnt (insuffic)| 4000000000009995 | Karte abgelehnt |
| Expired             | 4000000000000069 | Karte abgelaufen |

- **CVC:** Beliebige 3 Ziffern
- **Ablaufdatum:** Beliebiges zukünftiges Datum
- **PLZ:** Beliebige PLZ

## API Endpoints

### GET /api/stripe/config
Gibt den Public Key zurück (für Frontend)

```bash
curl http://localhost:3000/api/stripe/config
```

### POST /api/stripe/create-payment-intent
Erstellt einen Payment Intent

```bash
curl -X POST http://localhost:3000/api/stripe/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"applicationId": "YOUR_APPLICATION_ID"}'
```

### POST /api/stripe/webhook
Webhook-Handler (wird von Stripe aufgerufen)

## Workflow

1. **Kunde füllt Formular aus** → Application wird in MongoDB erstellt
2. **Frontend fordert Payment Intent an** → `POST /api/stripe/create-payment-intent`
3. **Kunde zahlt mit Stripe Elements** → Stripe verarbeitet Zahlung
4. **Stripe sendet Webhook** → `POST /api/stripe/webhook`
5. **Backend verarbeitet Zahlung:**
   - Payment Status → `completed`
   - PDF wird generiert
   - Email wird versendet
   - Application Status → `completed`

## Stripe CLI für lokale Tests

Simuliere einen erfolgreichen Payment-Webhook:

```bash
stripe trigger payment_intent.succeeded
```

## Sicherheitshinweise

⚠️ **WICHTIG:**
- Secret Keys niemals im Frontend verwenden
- Secret Keys niemals in Git committen
- In Production nur HTTPS verwenden
- Webhook-Signaturen immer verifizieren

## Support

- Stripe Dokumentation: https://stripe.com/docs
- Stripe Test-Karten: https://stripe.com/docs/testing
- Stripe CLI: https://stripe.com/docs/stripe-cli
