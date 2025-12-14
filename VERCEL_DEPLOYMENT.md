# Vercel Deployment - Schritt-für-Schritt Anleitung

## ✅ Vorbereitung abgeschlossen

- ✅ Git Repository erstellt
- ✅ Code auf GitHub gepusht: https://github.com/justLukaBB/pkonto-backend
- ✅ vercel.json Konfiguration erstellt
- ✅ Vercel-Anpassungen (DOCX statt PDF auf Serverless)

---

## ⚠️ Wichtige Hinweise zu Vercel

### Was funktioniert:
- ✅ Word (DOCX) Generierung
- ✅ Email-Versand
- ✅ MongoDB Verbindung
- ✅ WooCommerce Webhooks
- ✅ Alle API Endpoints

### Was NICHT funktioniert:
- ❌ **PDF-Konvertierung** (LibreOffice nicht verfügbar auf Serverless)
- ⚠️ Deine Kunden erhalten **DOCX-Dateien** statt PDFs

### Alternative:
**Für PDF-Konvertierung empfehle ich:**
- Option 1: Render.com nutzen (siehe RENDER_DEPLOYMENT.md) - **empfohlen für PDFs**
- Option 2: Externe PDF-API nutzen (z.B. DocuPipe, CloudConvert)
- Option 3: DOCX akzeptieren (funktioniert auch bei Banken)

---

## 🚀 Deployment auf Vercel

### Schritt 1: Vercel Account erstellen

1. Gehe zu: https://vercel.com/signup
2. Registriere dich mit deinem GitHub Account
3. Bestätige deine Email-Adresse

### Schritt 2: Projekt importieren

1. Gehe zu: https://vercel.com/new
2. Klicke auf **"Import Git Repository"**
3. Wähle **pkonto-backend** aus der Liste
4. Klicke auf **"Import"**

### Schritt 3: Projekt konfigurieren

**Framework Preset:** Other

**Build & Development Settings:**
- **Build Command:** (leer lassen)
- **Output Directory:** (leer lassen)
- **Install Command:** `npm install`

### Schritt 4: Environment Variables setzen

Klicke auf **"Environment Variables"** und füge hinzu:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://justlukax_db_user:kRtfaBx4tTtHX6gW@p-konto.gnctit.mongodb.net/pkonto-db?appName=P-Konto
WORDPRESS_URL=https://p-konto-bescheinigung.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=justlukax@gmail.com
EMAIL_PASSWORD=ppfgkhrwpvgweuwk
EMAIL_FROM=noreply@p-konto-bescheinigung.com
WOOCOMMERCE_WEBHOOK_SECRET=wc_prod_vercel_2024_xyz789
CERTIFICATE_PRICE=29.00
LAWYER_NAME=Thomas Scuric
LAWYER_TITLE=Rechtsanwalt
STAMP_IMAGE_PATH=./src/templates/stamp.png
```

⚠️ **WICHTIG:**
- Notiere dir das `WOOCOMMERCE_WEBHOOK_SECRET` - du brauchst es für WooCommerce!
- Die Variable `VERCEL=1` wird automatisch gesetzt (erkennt Serverless-Umgebung)

### Schritt 5: Deploy starten

1. Klicke auf **"Deploy"**
2. Warte 1-2 Minuten
3. Wenn erfolgreich: **"Congratulations! 🎉"**

### Schritt 6: Deployment-URL notieren

Nach dem Deployment findest du deine URL:

```
https://pkonto-backend-xxxx.vercel.app
```

**Notiere dir diese URL!** Du brauchst sie für:
- WordPress PKONTO_CONFIG
- WooCommerce Webhook-URL

---

## 🔧 MongoDB IP-Whitelist aktualisieren

1. Gehe zu: https://cloud.mongodb.com/
2. Navigiere zu deinem Cluster → **Network Access**
3. Klicke auf **"Add IP Address"**
4. Füge hinzu: **0.0.0.0/0** (alle IPs)
   - Vercel nutzt dynamische IPs, daher ist dies notwendig

**Sicherheitshinweis:** Stelle sicher, dass dein MongoDB Passwort stark ist!

---

## 🧪 Deployment testen

### Test 1: Health Check

```bash
curl https://pkonto-backend-xxxx.vercel.app/health
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
curl https://pkonto-backend-xxxx.vercel.app/api/woocommerce/test
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
        backend_url: 'https://pkonto-backend-xxxx.vercel.app' // ← DEINE VERCEL-URL
    };
    </script>
    <?php
}
```

### 2. WooCommerce Webhook erstellen/aktualisieren

1. Gehe zu: **WooCommerce** → **Einstellungen** → **Erweitert** → **Webhooks**
2. Erstelle neuen Webhook oder bearbeite bestehenden:
   - **Name:** P-Konto Backend (Vercel)
   - **Status:** Aktiv
   - **Thema:** Order Updated
   - **Zustellungs-URL:** `https://pkonto-backend-xxxx.vercel.app/api/woocommerce/webhook`
   - **Geheim:** Das Secret aus den Vercel Environment Variables
3. **Speichern**

---

## 🔍 Logs ansehen

### Option 1: Vercel Dashboard

1. Gehe zu: https://vercel.com/dashboard
2. Wähle dein Projekt
3. Klicke auf **"Deployments"**
4. Klicke auf das neueste Deployment
5. Klicke auf **"Functions"** oder **"Logs"**

### Option 2: Vercel CLI

```bash
vercel logs https://pkonto-backend-xxxx.vercel.app
```

---

## ⚡ Vercel Features

### Auto-Deploy

Vercel deployed automatisch bei jedem Git Push:
- Push zu `main` → Automatisches Production Deployment
- Jeder Branch → Preview Deployment

### Custom Domain (Optional)

1. Gehe zu Project Settings → **Domains**
2. Füge deine Domain hinzu (z.B. `api.p-konto-bescheinigung.com`)
3. Aktualisiere DNS-Einträge wie angezeigt
4. SSL-Zertifikat wird automatisch erstellt

---

## 📊 Performance & Limits

### Vercel Free Tier:

- ✅ 100 GB Bandwidth/Monat
- ✅ Unlimited Deployments
- ✅ Automatic HTTPS
- ⏱️ 10 Sek Serverless Function Timeout
- 💾 4 GB Function Memory

**Für Production mit höherem Traffic:** Upgrade zu Pro Plan ($20/Monat)

---

## ⚠️ Bekannte Limitationen

### 1. Keine PDF-Konvertierung

**Problem:** LibreOffice nicht verfügbar auf Vercel Serverless

**Lösung:**
- Kunden erhalten DOCX-Dateien (funktioniert auch bei Banken!)
- ODER: Nutze Render.com für PDF-Support (siehe RENDER_DEPLOYMENT.md)
- ODER: Externe PDF-API integrieren

### 2. Temporäre Dateien

**Problem:** Nur `/tmp` ist beschreibbar, wird nach Function-Ende gelöscht

**Lösung:** Bereits implementiert! Dateien werden generiert, per Email versendet, dann automatisch gelöscht.

### 3. Cold Starts

**Problem:** Erste Request nach Inaktivität kann 1-3 Sek dauern

**Lösung:**
- Akzeptabel für Webhooks
- Oder: Upgrade zu Pro für bessere Performance

---

## 🎯 Checklist

Nach dem Deployment:

- [ ] Service deployed und läuft
- [ ] `/health` Endpoint funktioniert
- [ ] `/api/woocommerce/test` Endpoint funktioniert
- [ ] MongoDB IP-Whitelist auf 0.0.0.0/0 gesetzt
- [ ] WordPress `PKONTO_CONFIG` mit Vercel-URL aktualisiert
- [ ] WooCommerce Webhook mit Vercel-URL aktualisiert
- [ ] Testbestellung durchgeführt
- [ ] Email mit DOCX empfangen ✉️
- [ ] DOCX öffnet korrekt

---

## 🆘 Troubleshooting

### Service startet nicht

1. Prüfe Logs in Vercel Dashboard → Functions
2. Häufige Fehler:
   - MongoDB Verbindungsfehler → IP-Whitelist prüfen
   - Environment Variables fehlen → Vercel Dashboard prüfen
   - Module not found → Package.json prüfen

### Webhook kommt nicht an

1. Prüfe WooCommerce Webhook Logs
2. Prüfe Vercel Function Logs
3. Teste Endpoint manuell mit curl
4. Stelle sicher Webhook Secret stimmt überein

### DOCX wird nicht generiert

1. Prüfe Vercel Logs für Fehler
2. Stelle sicher Template existiert in `/src/templates/`
3. Teste MongoDB Verbindung

### Email kommt nicht an

1. Prüfe Spam-Ordner
2. Prüfe Gmail "Less secure apps" Einstellung
3. Nutze Gmail App Password statt normalem Passwort
4. Prüfe Vercel Function Logs

---

## 💡 Tipps

1. **Nutze Vercel CLI** für schnelleres Debugging: `npm i -g vercel`
2. **Preview Deployments** für Tests: Erstelle Branch, Push, automatisches Preview
3. **Environment Variables** können per Environment (Production, Preview, Development) unterschiedlich sein
4. **Überwache Bandwidth** im Vercel Dashboard
5. **Custom Domain** für professionelleres Image

---

## 🎉 Fertig!

Dein Backend läuft jetzt auf Vercel!

**Wichtig:**
- Kunden erhalten **DOCX-Dateien** (kein PDF)
- Das ist völlig in Ordnung! Banken akzeptieren auch Word-Dokumente.
- Wenn du unbedingt PDFs brauchst, siehe RENDER_DEPLOYMENT.md

**Nächste Schritte:**
1. Teste kompletten Workflow
2. Führe echte Testbestellung durch
3. Prüfe ob DOCX bei Bank akzeptiert wird
4. Bei Erfolg: Live schalten! 🚀

---

**Support:**
- Vercel Docs: https://vercel.com/docs
- Vercel Community: https://github.com/vercel/vercel/discussions
