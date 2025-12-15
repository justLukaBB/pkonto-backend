# Mollie Payment Integration Setup

Mollie ist ein europäischer Payment Provider mit Unterstützung für alle gängigen Zahlungsmethoden.

## 1. Mollie Account erstellen

1. Gehe zu https://www.mollie.com/
2. Registriere dich für einen Account
3. Verifiziere dein Unternehmen (für Live-Zahlungen)

## 2. API Keys erhalten

### Test-Modus:
1. Login in dein Mollie Dashboard
2. Gehe zu **Developers → API keys**
3. Kopiere deinen **Test API key** (beginnt mit `test_`)

### Live-Modus:
1. Nachdem dein Account verifiziert wurde
2. Wechsle zu Live-Modus
3. Kopiere deinen **Live API key** (beginnt mit `live_`)

## 3. Backend Konfiguration

Füge deinen Mollie API Key in die `.env` Datei ein:

```bash
# Test-Modus
MOLLIE_API_KEY=test_dHar4XY7LxsDOtmnkVtjNVWXLSlXsM

# Live-Modus (nach Verifizierung)
MOLLIE_API_KEY=live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Frontend & Backend URLs für Redirects und Webhooks
FRONTEND_URL=https://p-konto-bescheinigung.com
BACKEND_URL=https://pkonto-backend-1.onrender.com
```

## 4. Webhook URL konfigurieren

Mollie sendet Zahlungsstatus-Updates über Webhooks.

### Webhook URL:
```
https://pkonto-backend-1.onrender.com/api/mollie/webhook
```

### Im Mollie Dashboard einstellen:
1. Gehe zu **Settings → Website profiles**
2. Wähle dein Profil aus
3. Setze **Webhook URL** auf die obige URL
4. Speichern

## 5. Frontend Integration

### Option A: Mollie statt Stripe (vollständig ersetzen)

Ersetze in `ELEMENTOR-STRIPE-COMPLETE.html` den Stripe-Code:

```javascript
// ALTE STRIPE VERSION:
const response = await fetch(`${PKONTO_FORM_CONFIG.backendUrl}/api/stripe/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
});

// NEUE MOLLIE VERSION:
const response = await fetch(`${PKONTO_FORM_CONFIG.backendUrl}/api/mollie/create-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
});

const result = await response.json();
if (result.success) {
    window.location.href = result.data.checkoutUrl; // Redirect zu Mollie Checkout
}
```

### Option B: Beide Payment Provider anbieten

Füge eine Auswahl im Frontend hinzu:

```html
<div class="payment-provider-selection">
    <h3>Zahlungsanbieter wählen:</h3>
    <label>
        <input type="radio" name="provider" value="stripe" checked>
        Kreditkarte (Stripe)
    </label>
    <label>
        <input type="radio" name="provider" value="mollie">
        iDEAL, SOFORT, Bancontact, etc. (Mollie)
    </label>
</div>
```

Dann im JavaScript:

```javascript
const provider = document.querySelector('input[name="provider"]:checked').value;
const endpoint = provider === 'stripe'
    ? '/api/stripe/create-checkout-session'
    : '/api/mollie/create-payment';

const response = await fetch(`${PKONTO_FORM_CONFIG.backendUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
});
```

## 6. Unterstützte Zahlungsmethoden

Mollie unterstützt automatisch:
- **iDEAL** (Niederlande)
- **SOFORT** (Deutschland)
- **Bancontact** (Belgien)
- **Kreditkarte** (Visa, Mastercard, American Express)
- **PayPal**
- **Apple Pay**
- **Google Pay**
- **Klarna**
- **Giropay**
- **EPS** (Österreich)
- **Przelewy24** (Polen)
- Und viele mehr...

Die verfügbaren Methoden werden automatisch basierend auf:
- Kunde's Land
- Währung (EUR)
- Account-Einstellungen

angezeigt.

## 7. Testing

### Test-Karten:
Mollie bietet Test-Karten für alle Zahlungsmethoden:

- **Erfolgreiche Zahlung**: Nutze die "paid" Option im Checkout
- **Fehlgeschlagene Zahlung**: Nutze die "failed" Option
- **Stornierte Zahlung**: Nutze die "canceled" Option

Mehr Info: https://docs.mollie.com/overview/testing

## 8. Webhook Testing lokal

Für lokale Entwicklung mit Webhooks:

```bash
# ngrok installieren
brew install ngrok

# Tunnel starten
ngrok http 5000

# Die ngrok URL (z.B. https://abc123.ngrok.io) im Mollie Dashboard als Webhook URL eintragen:
# https://abc123.ngrok.io/api/mollie/webhook
```

## 9. Production Checklist

- [ ] Mollie Account verifiziert
- [ ] Live API Key in `.env` gesetzt
- [ ] Webhook URL im Mollie Dashboard konfiguriert
- [ ] `FRONTEND_URL` und `BACKEND_URL` in `.env` gesetzt
- [ ] Test-Zahlung im Live-Modus durchgeführt
- [ ] Email-Versand nach erfolgreicher Zahlung getestet

## 10. Vorteile von Mollie

✅ **Europäisch**: DSGVO-konform, europäische Firma
✅ **Keine Setup-Gebühren**: Pay-as-you-go Preismodell
✅ **Viele Zahlungsmethoden**: iDEAL, SOFORT, Giropay, etc.
✅ **Einfache Integration**: Ähnlich wie Stripe
✅ **Günstige Gebühren**: 0,29 EUR + 2,9% pro Transaktion
✅ **Schnelle Auszahlung**: 1-2 Werktage

## 11. API Endpoints

### Backend Endpoints:
- `POST /api/mollie/create-payment` - Zahlung erstellen
- `POST /api/mollie/webhook` - Webhook für Status-Updates
- `GET /api/mollie/payment/:paymentId` - Zahlungsstatus abrufen

### Erfolgreich bezahlt:
```
https://p-konto-bescheinigung.com/?payment=success&application_id=123abc
```

### Zahlung abgebrochen:
Mollie redirected automatisch zur `redirectUrl` mit Status-Parametern.

## Support

- Mollie Docs: https://docs.mollie.com/
- API Reference: https://docs.mollie.com/reference/v2/
- Support: https://help.mollie.com/
