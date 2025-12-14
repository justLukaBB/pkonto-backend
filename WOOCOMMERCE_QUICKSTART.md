# WooCommerce Integration - Quick Start ⚡

## 🎯 In 10 Minuten startklar!

### 1. WooCommerce Produkt erstellen (2 Min)
- WordPress → **Produkte** → **Neu hinzufügen**
- Name: "P-Konto Bescheinigung"
- Preis: 29,00 €
- Virtuell: ✅ Ja
- Veröffentlichen
- **Notiere Produkt-ID** (z.B. `123`)

---

### 2. PHP Code in WordPress einfügen (3 Min)

**WordPress → Appearance → Theme File Editor → functions.php**

Am Ende der Datei einfügen:

```php
<?php
// P-Konto Integration
add_action('wp_ajax_pkonto_add_to_cart', 'pkonto_ajax_add_to_cart');
add_action('wp_ajax_nopriv_pkonto_add_to_cart', 'pkonto_ajax_add_to_cart');

function pkonto_ajax_add_to_cart() {
    $product_id = 123; // ← DEINE PRODUKT-ID HIER

    foreach ($_POST as $key => $value) {
        if (strpos($key, '_pkonto_') === 0) {
            WC()->session->set($key, sanitize_text_field($value));
        }
    }

    $cart_item_key = WC()->cart->add_to_cart($product_id, 1);

    if ($cart_item_key) {
        wp_send_json_success(array(
            'checkout_url' => wc_get_checkout_url()
        ));
    } else {
        wp_send_json_error();
    }
}

add_action('woocommerce_checkout_create_order', 'pkonto_add_form_data_to_order', 10, 2);
function pkonto_add_form_data_to_order($order, $data) {
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

add_action('wp_footer', 'pkonto_load_js_config');
function pkonto_load_js_config() {
    ?>
    <script>
    var PKONTO_CONFIG = {
        product_id: 123, // ← DEINE PRODUKT-ID HIER
        ajax_url: '<?php echo admin_url('admin-ajax.php'); ?>',
        checkout_url: '<?php echo wc_get_checkout_url(); ?>',
        backend_url: 'http://localhost:3000' // ← ÄNDERN für Production
    };
    </script>
    <?php
}
?>
```

**⚠️ WICHTIG:** Ersetze `123` mit deiner Produkt-ID!

---

### 3. Webhook erstellen (2 Min)

**WooCommerce → Einstellungen → Erweitert → Webhooks**

- Klick: **Webhook hinzufügen**
- **Name:** P-Konto Backend
- **Status:** Aktiv
- **Thema:** Order Updated
- **URL:** `http://localhost:3000/api/woocommerce/webhook`
- **Geheim:** `wc_secret_12345` (selbst wählen)
- **Speichern**

Dann in `.env` eintragen:
```env
WOOCOMMERCE_WEBHOOK_SECRET=wc_secret_12345
```

---

### 4. JavaScript Code einfügen (2 Min)

**Elementor → Seite bearbeiten**

Am Ende der Seite ein **HTML Widget** hinzufügen mit:

```html
<script src="/wp-content/uploads/pkonto-frontend.js"></script>
```

Dann lade die Datei `frontend-integration.js` hoch nach:
`/wp-content/uploads/pkonto-frontend.js`

(Via FTP oder WordPress Media Library)

---

### 5. Backend starten & testen (1 Min)

```bash
cd "/Users/luka.s/Backend P-konto"
npm run dev
```

Teste:
```bash
curl http://localhost:3000/api/woocommerce/test
```

Sollte zeigen:
```json
{"success":true,"message":"WooCommerce webhook endpoint is working"}
```

---

## ✅ Fertig!

Jetzt kannst du eine Testbestellung machen:

1. Öffne deine Website
2. Fülle Formular aus
3. Klick "Jetzt kostenpflichtig beauftragen"
4. Checkout durchführen
5. PDF wird automatisch generiert
6. Email wird versendet

---

## 🐛 Schnelle Hilfe

**Webhook kommt nicht an?**
- Prüfe: `http://localhost:3000/health`
- Nutze ngrok für lokales Testen: `ngrok http 3000`

**Formular-Daten fehlen?**
- Prüfe Browser Console auf Fehler
- Prüfe ob `PKONTO_CONFIG` existiert: `console.log(PKONTO_CONFIG)`

**PDF wird nicht erstellt?**
- Prüfe Backend Logs im Terminal
- Teste: `node test-complete-workflow.js`

---

## 📚 Vollständige Anleitung

Siehe `WOOCOMMERCE_SETUP.md` für Details!
