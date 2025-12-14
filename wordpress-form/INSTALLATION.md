# P-Konto Formular - Installation in WordPress/Elementor

## 📋 Dateien

- `pkonto-form.css` - Styling
- `pkonto-form.js` - Funktionalität
- Dein bestehendes HTML

---

## 🚀 Installation

### Schritt 1: CSS hochladen

1. Gehe zu **Darstellung** → **Customizer** → **Zusätzliches CSS**
2. Kopiere den **kompletten Inhalt** von `pkonto-form.css`
3. Füge ihn dort ein
4. Klicke **"Veröffentlichen"**

**ODER** (Alternative):

1. FTP/cPanel: Lade `pkonto-form.css` hoch nach `/wp-content/themes/dein-theme/`
2. Füge in `functions.php` ein:
```php
function pkonto_enqueue_styles() {
    wp_enqueue_style('pkonto-form', get_template_directory_uri() . '/pkonto-form.css');
}
add_action('wp_enqueue_scripts', 'pkonto_enqueue_styles');
```

---

### Schritt 2: JavaScript hochladen

**Empfohlen: Code Snippets Plugin**

1. Gehe zu **Snippets** → **Add New**
2. Name: `P-Konto Form JavaScript`
3. Wähle: **JavaScript Snippet**
4. Kopiere den **kompletten Inhalt** von `pkonto-form.js`
5. **Location:** Wähle **Footer** (wichtig!)
6. **Priority:** 10
7. Klicke **"Save Changes and Activate"**

**ODER** (manuell in HTML):

Füge am **Ende** deines HTML-Formulars ein:
```html
<script>
// Hier den kompletten Inhalt von pkonto-form.js einfügen
</script>
```

---

### Schritt 3: Formular aktualisieren in Elementor

1. Öffne deine Seite in Elementor
2. Finde das HTML-Widget mit dem Formular
3. **Wichtig:** Das HTML MUSS diese IDs haben (sind bereits drin):
   - `step-1`, `step-2`, `step-3`, `step-4` für die Schritte
   - `married-yes`, `married-no` für die Radio-Buttons
   - `children-count`, `social-benefits`, `health-compensation` für die Inputs
   - etc.

4. **Teste ob CSS und JS geladen sind:**
   - Formular sollte jetzt styled sein
   - Buttons sollten funktionieren
   - Browser-Konsole (F12) sollte zeigen: `P-Konto Form initialized`

---

## 🧪 Testen

1. Öffne die Seite im Browser
2. Drücke **F12** → **Console** Tab
3. Du solltest sehen: `P-Konto Form initialized`
4. Klicke auf **"Freibetrag berechnen"**
   - Sollte zu Schritt 2 wechseln
   - Freibetrag sollte berechnet werden

5. Fülle alle Schritte aus
6. Bei Schritt 4 → **"Jetzt kostenpflichtig beauftragen"**
   - Sollte zu WooCommerce Checkout weiterleiten

---

## ⚙️ Konfiguration

In `pkonto-form.js` findest du:

```javascript
const CONFIG = {
    backendUrl: 'https://pkonto-backend.onrender.com',
    productId: 123344, // DEINE WooCommerce Product ID
    baseFreibetrag: 1410.64 // 2025 Grundfreibetrag
};
```

**Anpassen:**
- `productId`: Deine tatsächliche WooCommerce Produkt-ID
- `backendUrl`: Deine Render Backend-URL (bereits korrekt)
- `baseFreibetrag`: Aktueller Grundfreibetrag für 2025

---

## 🔍 Fehlerbehebung

### Problem: Formular funktioniert nicht

**Lösung:**
1. Prüfe Browser-Konsole (F12) auf Fehler
2. Stelle sicher CSS und JS sind geladen:
   - Rechtsklick → "Seitenquelltext anzeigen"
   - Suche nach `pkonto-form.css` und `pkonto-form.js`

### Problem: "PKONTO_CONFIG is not defined"

**Lösung:**
Dein WordPress Code Snippet ist nicht aktiv. Prüfe:
1. **Snippets** → **"P-Konto Backend URL Fix"** ist aktiviert
2. Falls nicht, aktiviere es

### Problem: Beim Absenden passiert nichts

**Lösung:**
1. Öffne Browser-Konsole (F12)
2. Klicke auf Button
3. Schaue welcher Fehler kommt
4. Meistens: `PKONTO_CONFIG` nicht definiert → siehe oben

### Problem: Styling sieht falsch aus

**Lösung:**
1. CSS wurde nicht geladen
2. Gehe zu **Darstellung** → **Customizer** → **Zusätzliches CSS**
3. Füge CSS ein und speichere

---

## 📝 Wichtige Hinweise

1. **Product ID**: Die WooCommerce Produkt-ID (`123344`) musst du durch deine echte Produkt-ID ersetzen!
   - Gehe zu **Produkte** → Öffne dein P-Konto Produkt
   - In der URL siehst du: `post=123` ← Das ist die ID

2. **Kinder-Details**: Das Formular zeigt aktuell statische Kinder-Felder. Für dynamische Generierung (Anzahl Kinder = Anzahl Felder) wäre zusätzlicher Code nötig.

3. **Bezahlmethoden**: Die Bezahlmethoden (PayPal, Klarna, etc.) sind aktuell nur zur Anzeige. Die tatsächliche Bezahlung erfolgt über WooCommerce Checkout.

---

## 🎯 Workflow

So funktioniert der komplette Ablauf:

1. **User füllt Formular aus** → JavaScript sammelt Daten
2. **User klickt "Beauftragen"** → JavaScript ruft WordPress AJAX auf
3. **WordPress** → Fügt Produkt in WooCommerce Cart + speichert Formulardaten in Order Meta
4. **Redirect** → Weiterleitung zum WooCommerce Checkout
5. **User bezahlt** → Bestellung wird "Completed"
6. **WooCommerce Webhook** → Sendet Order-Daten an dein Render Backend
7. **Render Backend** → Generiert PDF, sendet Email an Kunden

---

## 🆘 Support

Bei Problemen:
1. Prüfe Browser-Konsole (F12) auf JavaScript-Fehler
2. Prüfe WordPress-Logs
3. Prüfe Render-Logs (https://dashboard.render.com → dein Service → Logs)

---

**Viel Erfolg!** 🚀
