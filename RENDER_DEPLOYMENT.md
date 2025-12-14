# Render.com Deployment - Schritt-für-Schritt Anleitung

## ✅ Vorbereitung abgeschlossen

- ✅ Git Repository erstellt
- ✅ Code auf GitHub gepusht: https://github.com/justLukaBB/pkonto-backend
- ✅ render.yaml Konfiguration erstellt

---

## 🚀 Deployment auf Render.com

### Schritt 1: Render Account erstellen (falls noch nicht vorhanden)

1. Gehe zu: https://dashboard.render.com/register
2. Registriere dich mit deinem GitHub Account (empfohlen)
3. Bestätige deine Email-Adresse

### Schritt 2: Neuen Web Service erstellen

1. Gehe zu: https://dashboard.render.com/
2. Klicke auf **"New +"** → **"Web Service"**
3. Wähle **"Build and deploy from a Git repository"**
4. Klicke auf **"Connect account"** um GitHub zu verbinden (falls noch nicht verbunden)
5. Suche nach dem Repository: **pkonto-backend**
6. Klicke auf **"Connect"**

### Schritt 3: Service konfigurieren

Render sollte automatisch die `render.yaml` Datei erkennen. Falls nicht, verwende diese Einstellungen:

**Basic Settings:**
- **Name:** `pkonto-backend`
- **Region:** `Frankfurt (EU Central)`
- **Branch:** `main`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Advanced Settings:**
- **Plan:** `Free` (für Tests) oder `Starter` (für Production)
- **Health Check Path:** `/health`

### Schritt 4: Environment Variables setzen

Klicke auf **"Advanced"** → **"Add Environment Variable"** und füge folgende Variablen hinzu:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://justlukax_db_user:kRtfaBx4tTtHX6gW@p-konto.gnctit.mongodb.net/pkonto-db?appName=P-Konto
WORDPRESS_URL=https://p-konto-bescheinigung.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=justlukax@gmail.com
EMAIL_PASSWORD=ppfgkhrwpvgweuwk
EMAIL_FROM=noreply@p-konto-bescheinigung.com
WOOCOMMERCE_WEBHOOK_SECRET=dein_webhook_secret_hier
CERTIFICATE_PRICE=29.00
LAWYER_NAME=Thomas Scuric
LAWYER_TITLE=Rechtsanwalt
STAMP_IMAGE_PATH=./src/templates/stamp.png
```

⚠️ **WICHTIG:**
- Ersetze `dein_webhook_secret_hier` mit einem sicheren Secret (z.B. `wc_prod_abc123xyz456`)
- Notiere dir das Secret - du brauchst es später für WooCommerce!

### Schritt 5: Deployment starten

1. Klicke auf **"Create Web Service"**
2. Render beginnt automatisch mit dem Deployment
3. Warte ca. 2-5 Minuten
4. Wenn erfolgreich, siehst du: **"Your service is live 🎉"**

### Schritt 6: Backend-URL notieren

Nach dem Deployment findest du deine URL oben:

```
https://pkonto-backend-xxxx.onrender.com
```

**Notiere dir diese URL!** Du brauchst sie für:
- WordPress PKONTO_CONFIG
- WooCommerce Webhook-URL

---

## 🔧 MongoDB IP-Whitelist aktualisieren

1. Gehe zu: https://cloud.mongodb.com/
2. Navigiere zu deinem Cluster → **Network Access**
3. Klicke auf **"Add IP Address"**
4. Um die Render IP zu bekommen:
   - Option 1: Füge `0.0.0.0/0` hinzu (alle IPs - einfach aber weniger sicher)
   - Option 2: Render verwendet dynamische IPs - empfohlen ist `0.0.0.0/0` für Render Free Tier

**Für Production:** Verwende MongoDB Atlas Whitelist oder ziehe zu Render PostgreSQL um.

---

## 🧪 Deployment testen

### Test 1: Health Check

```bash
curl https://pkonto-backend-xxxx.onrender.com/health
```

Sollte zurückgeben:
```json
{
  "status": "ok",
  "timestamp": "2025-12-14T..."
}
```

### Test 2: WooCommerce Webhook Endpoint

```bash
curl https://pkonto-backend-xxxx.onrender.com/api/woocommerce/test
```

Sollte zurückgeben:
```json
{
  "success": true,
  "message": "WooCommerce webhook endpoint is working"
}
```

---

## 📝 WordPress konfigurieren

### 1. PKONTO_CONFIG aktualisieren

In deiner WordPress `functions.php`:

```php
function pkonto_load_js_config() {
    ?>
    <script>
    var PKONTO_CONFIG = {
        product_id: 123344,
        ajax_url: '<?php echo admin_url('admin-ajax.php'); ?>',
        checkout_url: '<?php echo wc_get_checkout_url(); ?>',
        backend_url: 'https://pkonto-backend-xxxx.onrender.com' // ← DEINE RENDER-URL
    };
    </script>
    <?php
}
```

### 2. WooCommerce Webhook URL aktualisieren

1. Gehe zu: **WooCommerce** → **Einstellungen** → **Erweitert** → **Webhooks**
2. Klicke auf deinen Webhook (oder erstelle einen neuen)
3. **Zustellungs-URL:** `https://pkonto-backend-xxxx.onrender.com/api/woocommerce/webhook`
4. **Geheim:** Das Secret aus den Render Environment Variables
5. **Speichern**

---

## 🔍 Logs ansehen

In Render Dashboard:
1. Gehe zu deinem Service
2. Klicke auf **"Logs"** im linken Menü
3. Hier siehst du alle Backend-Logs in Echtzeit

---

## ⚠️ Wichtige Hinweise

### Free Tier Limitationen

Render Free Tier:
- ✅ Kostenlos
- ⚠️ Service schläft nach 15 Min Inaktivität
- ⚠️ Erster Request nach Schlaf dauert ~30 Sek
- ⚠️ 750 Stunden/Monat (reicht für 1 Service)

**Für Production:** Upgrade zu Starter Plan ($7/Monat):
- 🚀 Kein Sleep
- 🚀 Bessere Performance
- 🚀 Mehr RAM

### Auto-Deploy

Render ist jetzt mit GitHub verbunden:
- Jeder Push auf `main` Branch → Automatisches Deployment
- Du kannst Auto-Deploy in den Settings deaktivieren

---

## 🎯 Checklist

Nach dem Deployment:

- [ ] Service deployed und läuft
- [ ] `/health` Endpoint funktioniert
- [ ] `/api/woocommerce/test` Endpoint funktioniert
- [ ] MongoDB IP-Whitelist aktualisiert
- [ ] WordPress `PKONTO_CONFIG` aktualisiert
- [ ] WooCommerce Webhook URL aktualisiert
- [ ] Testbestellung durchgeführt
- [ ] Email empfangen
- [ ] PDF generiert

---

## 🆘 Troubleshooting

### Service startet nicht

1. Prüfe Logs in Render Dashboard
2. Häufige Fehler:
   - MongoDB Verbindungsfehler → IP-Whitelist prüfen
   - Port-Fehler → Stelle sicher `PORT=10000` in ENV vars
   - Module not found → `npm install` in Build Command

### Webhook kommt nicht an

1. Prüfe WooCommerce Webhook Logs
2. Prüfe Render Logs
3. Teste Endpoint manuell mit curl
4. Stelle sicher Webhook Secret stimmt überein

### Service ist langsam

1. Free Tier schläft nach 15 Min
2. Upgrade zu Starter Plan für bessere Performance
3. Oder: Nutze Cron-Job um Service wach zu halten (nicht empfohlen)

---

## 🎉 Fertig!

Dein Backend läuft jetzt auf Render.com!

**Nächste Schritte:**
1. Teste kompletten Workflow
2. Führe echte Testbestellung durch
3. Überwache Logs für Fehler
4. Bei Erfolg: Upgrade zu Starter Plan für Production

---

**Support:**
- Render Docs: https://render.com/docs
- Render Community: https://community.render.com/
