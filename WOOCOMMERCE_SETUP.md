# WooCommerce Integration - Komplette Anleitung

## 📋 Übersicht

Diese Anleitung zeigt dir, wie du dein Elementor-Formular mit WooCommerce und deinem Node.js Backend verbindest.

**Workflow:**
```
Kunde füllt Formular aus (Elementor)
    ↓
Formular-Daten werden an WooCommerce übergeben
    ↓
Kunde zahlt via WooCommerce (Stripe/PayPal/etc.)
    ↓
WooCommerce sendet Webhook an dein Backend
    ↓
Backend: PDF generieren + Email senden
```

---

## 🚀 Teil 1: WooCommerce Produkt erstellen

### Schritt 1: Neues Produkt anlegen

1. Gehe zu **WordPress Admin** → **Produkte** → **Neu hinzufügen**

2. **Produktdetails:**
   - **Name:** P-Konto Bescheinigung
   - **Preis:** 29,00 €
   - **Produkttyp:** Einfaches Produkt
   - **Virtuell:** ✅ Ja (Häkchen setzen)
   - **Herunterladbar:** ❌ Nein

3. **Beschreibung:**
   ```
   Professionelle P-Konto Bescheinigung nach § 850k ZPO
   - Erstellt von Rechtsanwalt Thomas Scuric
   - Sofortiger Versand per Email
   - PDF-Format zum Ausdrucken
   ```

4. **Kurzbeschreibung:**
   ```
   Erhalten Sie Ihre beglaubigte P-Konto Bescheinigung innerhalb von Minuten per Email.
   ```

5. Klicke auf **Veröffentlichen**

6. **WICHTIG:** Notiere die Produkt-ID
   - Zu finden in der URL: `post=123` → ID ist `123`
   - Oder in der Produktliste

---

## 🔌 Teil 2: WordPress/PHP Code hinzufügen

### Schritt 1: WooCommerce Anpassungen

Füge folgenden Code in dein Theme ein (z.B. **Appearance** → **Theme File Editor** → `functions.php`):

```php
<?php
/**
 * P-Konto WooCommerce Integration
 */

// 1. Speichere Formular-Daten als Order Meta
add_action('woocommerce_add_to_cart', 'pkonto_save_form_data_to_cart', 10, 6);
function pkonto_save_form_data_to_cart($cart_item_key, $product_id, $quantity, $variation_id, $variation, $cart_item_data) {
    // Nur für unser P-Konto Produkt (ersetze 123 mit deiner Produkt-ID)
    if ($product_id != 123) { // <-- ÄNDERN: Deine Produkt-ID
        return;
    }

    // Speichere alle _pkonto_ Felder aus $_POST
    foreach ($_POST as $key => $value) {
        if (strpos($key, '_pkonto_') === 0) {
            WC()->session->set($key, sanitize_text_field($value));
        }
    }
}

// 2. Füge Formular-Daten zur Bestellung hinzu
add_action('woocommerce_checkout_create_order', 'pkonto_add_form_data_to_order', 10, 2);
function pkonto_add_form_data_to_order($order, $data) {
    // Hole alle gespeicherten Formular-Daten
    $session = WC()->session;

    if ($session) {
        $session_data = $session->get_session_data();

        foreach ($session_data as $key => $value) {
            if (strpos($key, '_pkonto_') === 0) {
                $order->update_meta_data($key, $value);
            }
        }
    }
}

// 3. AJAX Handler für "Add to Cart"
add_action('wp_ajax_pkonto_add_to_cart', 'pkonto_ajax_add_to_cart');
add_action('wp_ajax_nopriv_pkonto_add_to_cart', 'pkonto_ajax_add_to_cart');

function pkonto_ajax_add_to_cart() {
    $product_id = 123; // <-- ÄNDERN: Deine Produkt-ID

    // Speichere Formular-Daten in Session
    foreach ($_POST as $key => $value) {
        if (strpos($key, '_pkonto_') === 0) {
            WC()->session->set($key, sanitize_text_field($value));
        }
    }

    // Füge Produkt zum Warenkorb hinzu
    $cart_item_key = WC()->cart->add_to_cart($product_id, 1);

    if ($cart_item_key) {
        wp_send_json_success(array(
            'message' => 'Produkt wurde zum Warenkorb hinzugefügt',
            'cart_url' => wc_get_cart_url(),
            'checkout_url' => wc_get_checkout_url()
        ));
    } else {
        wp_send_json_error(array(
            'message' => 'Fehler beim Hinzufügen zum Warenkorb'
        ));
    }
}

// 4. Lade Frontend JavaScript Konfiguration
add_action('wp_footer', 'pkonto_load_js_config');
function pkonto_load_js_config() {
    ?>
    <script>
    var PKONTO_CONFIG = {
        product_id: 123, // <-- ÄNDERN: Deine Produkt-ID
        ajax_url: '<?php echo admin_url('admin-ajax.php'); ?>',
        checkout_url: '<?php echo wc_get_checkout_url(); ?>',
        backend_url: 'http://localhost:3000' // <-- ÄNDERN: Deine Backend-URL
    };
    </script>
    <?php
}
?>
```

**⚠️ WICHTIG:** Ersetze `123` mit deiner tatsächlichen Produkt-ID!

---

## 🔗 Teil 3: Webhook einrichten

### Schritt 1: Webhook in WooCommerce erstellen

1. Gehe zu **WooCommerce** → **Einstellungen** → **Erweitert** → **Webhooks**

2. Klicke auf **Webhook hinzufügen**

3. **Webhook-Einstellungen:**
   - **Name:** P-Konto Backend Integration
   - **Status:** Aktiv
   - **Thema:** Order Updated (Bestellung aktualisiert)
   - **Zustellungs-URL:** `http://localhost:3000/api/woocommerce/webhook`
     - **Für Production:** `https://deine-domain.com/api/woocommerce/webhook`
   - **Geheim:** Generiere ein sicheres Secret (z.B. `wc_secret_abc123xyz`)
   - **API-Version:** WP REST API Integration v3

4. Klicke auf **Webhook speichern**

5. **Kopiere den Secret Key**

### Schritt 2: Secret in Backend eintragen

Öffne `/Users/luka.s/Backend P-konto/.env` und ersetze:

```env
WOOCOMMERCE_WEBHOOK_SECRET=wc_secret_abc123xyz
```

mit deinem tatsächlichen Webhook-Secret.

---

## 💻 Teil 4: Frontend JavaScript einbinden

### Option A: Via Elementor HTML Widget

1. Öffne deine Elementor-Seite
2. Füge ein **HTML Widget** hinzu (unterhalb deines Formulars)
3. Füge folgenden Code ein:

```html
<script>
// Lade das Frontend-Integration Script
(function() {
    var script = document.createElement('script');
    script.src = 'https://deine-domain.com/wp-content/uploads/pkonto-frontend.js';
    document.head.appendChild(script);
})();
</script>
```

### Option B: Via Theme Functions

Füge in `functions.php` hinzu:

```php
add_action('wp_enqueue_scripts', 'pkonto_enqueue_scripts');
function pkonto_enqueue_scripts() {
    wp_enqueue_script(
        'pkonto-frontend',
        get_template_directory_uri() . '/js/pkonto-frontend.js',
        array('jquery'),
        '1.0.0',
        true
    );
}
```

Dann lade `frontend-integration.js` hoch nach:
`/wp-content/themes/dein-theme/js/pkonto-frontend.js`

---

## ✅ Teil 5: Testen

### Schritt 1: Backend starten

```bash
cd "/Users/luka.s/Backend P-konto"
npm run dev
```

Stelle sicher, dass der Server läuft auf Port 3000.

### Schritt 2: Webhook testen

Teste ob der Webhook erreichbar ist:

```bash
curl http://localhost:3000/api/woocommerce/test
```

Sollte zurückgeben:
```json
{
  "success": true,
  "message": "WooCommerce webhook endpoint is working",
  "timestamp": "2025-12-14T..."
}
```

### Schritt 3: Testbestellung durchführen

1. Öffne deine Website
2. Fülle das Formular aus
3. Klicke auf "Jetzt kostenpflichtig beauftragen"
4. Du wirst zu WooCommerce Checkout weitergeleitet
5. Führe Testzahlung durch (nutze WooCommerce Test-Modus!)
6. Nach erfolgreicher Zahlung:
   - Webhook wird an Backend gesendet
   - Backend generiert PDF
   - Email wird versendet

### Schritt 4: Backend Logs prüfen

Im Terminal solltest du sehen:

```
WooCommerce Webhook received
Order ID: 456
Order Status: completed
Extracted form data: { ... }
Application created: 693eb676088a4e061e0cda17
Certificate generated (DOCX): /uploads/certificate-...
PDF generated: /uploads/certificate-....pdf
Email sent: <message-id>
WooCommerce order processed successfully
```

---

## 🔧 Troubleshooting

### Problem: Webhook kommt nicht an

**Lösung:**
1. Prüfe ob Backend läuft: `http://localhost:3000/health`
2. Prüfe Webhook-URL in WooCommerce
3. Für lokales Testen: Nutze [ngrok](https://ngrok.com/)
   ```bash
   ngrok http 3000
   ```
   Dann nutze die ngrok-URL: `https://abc123.ngrok.io/api/woocommerce/webhook`

### Problem: Formular-Daten fehlen

**Lösung:**
- Prüfe ob alle Felder die richtige `id` und `name` haben
- Prüfe Browser Console auf JavaScript-Fehler
- Prüfe ob `PKONTO_CONFIG` geladen wurde: Console → `console.log(PKONTO_CONFIG)`

### Problem: PDF wird nicht generiert

**Lösung:**
- Prüfe Backend Logs
- Stelle sicher MongoDB läuft
- Stelle sicher LibreOffice installiert ist

### Problem: Email kommt nicht an

**Lösung:**
- Prüfe `.env` Email-Konfiguration
- Prüfe Spam-Ordner
- Teste Email-Service: `node test-email.js`

---

## 🚀 Production Deployment

### Checklist vor dem Live-Gang:

- [ ] Backend auf Server deployen (z.B. Render.com)
- [ ] Backend-URL in WordPress `PKONTO_CONFIG` ändern
- [ ] Webhook-URL in WooCommerce auf Production-URL ändern
- [ ] MongoDB IP-Whitelist für Production-Server aktualisieren
- [ ] SSL-Zertifikat für Backend (HTTPS!)
- [ ] Test-Modus in WooCommerce deaktivieren
- [ ] Live-Zahlungsmethoden aktivieren
- [ ] Test-Bestellung durchführen

---

## 📊 Monitoring

### Backend-Logs

Prüfe regelmäßig:
```bash
# Logs ansehen
pm2 logs backend-pkonto

# Oder mit Docker
docker logs pkonto-backend
```

### WooCommerce Webhook-Logs

In WordPress:
**WooCommerce** → **Einstellungen** → **Erweitert** → **Webhooks** → Klick auf deinen Webhook → **Logs**

Hier siehst du alle gesendeten Webhooks und deren Status.

---

## 🎯 Erweiterte Konfiguration

### Bestellstatus anpassen

Standardmäßig reagiert der Webhook auf `completed` und `processing`.

Um nur auf `completed` zu reagieren, ändere in `woocommerce.controller.js`:

```javascript
if (orderData.status !== 'completed') {
    console.log('Order not completed yet, skipping...');
    return res.status(200).json({ message: 'Order not completed yet' });
}
```

### Mehrere Produkte unterstützen

Wenn du mehrere P-Konto-Produkte hast, prüfe die Produkt-ID im Webhook:

```javascript
// In woocommerce.controller.js
const PKONTO_PRODUCT_IDS = [123, 124, 125];

if (!orderData.line_items.some(item => PKONTO_PRODUCT_IDS.includes(item.product_id))) {
    return res.status(200).json({ message: 'Not a P-Konto product' });
}
```

---

## 💡 Tipps

1. **Verwende WooCommerce Test-Modus** während der Entwicklung
2. **Sichere regelmäßig** deine MongoDB-Datenbank
3. **Überwache die Logs** für Fehler
4. **Teste den kompletten Flow** vor jedem Deployment
5. **Nutze Webhooks Logs** in WooCommerce für Debugging

---

## 📞 Support

Bei Problemen:
1. Prüfe Backend-Logs
2. Prüfe WooCommerce Webhook-Logs
3. Teste Endpoints manuell mit curl
4. Prüfe Browser Console auf JS-Fehler

---

## ✅ Fertig!

Dein System ist jetzt vollständig integriert! 🎉

**Der komplette Flow funktioniert:**
```
Kunde → Formular → WooCommerce → Zahlung → Webhook → Backend → PDF → Email
```
