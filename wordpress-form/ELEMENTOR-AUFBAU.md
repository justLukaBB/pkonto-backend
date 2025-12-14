# P-Konto Seite - Schritt-für-Schritt Aufbau in Elementor

## 📋 Seitenstruktur Übersicht

Die Seite besteht aus 4 Hauptbereichen:
1. **Header** - Titel und Fortschrittsanzeige
2. **Schritt 1** - Freibetrag berechnen
3. **Schritt 2** - Persönliche Daten
4. **Schritt 3** - Zusammenfassung und Bestellung

---

## 🚀 Schritt 1: Neue Seite erstellen

1. Gehe zu **Seiten** → **Erstellen**
2. Name: `P-Konto Bescheinigung`
3. Klicke **Mit Elementor bearbeiten**

---

## 📦 Schritt 2: Container-Struktur aufbauen

### Main Container
1. Klicke **+** → Wähle **Container**
2. Container Settings:
   - Layout: **Full Width**
   - Content Width: **1200px**
   - Padding: **40px 20px**
   - Background: **Weiß (#FFFFFF)**

---

## 🎯 Schritt 3: Header-Bereich

### 3.1 Titel hinzufügen
1. Ziehe **Überschrift** Widget in Container
2. Einstellungen:
   - Text: `Schritt 1: Freibetrag berechnen`
   - HTML Tag: **H2**
   - ID: `current-step-title`
   - Schriftgröße: **28px**
   - Farbe: **#333333**
   - Ausrichtung: **Zentriert**

### 3.2 Fortschrittsanzeige (Optional)
Später mit HTML Widget hinzufügen wenn gewünscht.

---

## 💶 Schritt 4: Freibetrag-Rechner (Schritt 1)

### 4.1 Container für Schritt 1
1. Neuer **Container** (in Main Container)
2. Container Settings:
   - ID: `step-1`
   - Klasse: `step-content active`
   - Padding: **20px**

### 4.2 Frage: Verheiratet?
1. Ziehe **HTML** Widget
2. Code:
```html
<div style="margin-bottom: 20px;">
    <label style="display: block; margin-bottom: 10px; font-weight: 600;">
        Sind Sie verheiratet?
    </label>
    <input type="radio" id="married-yes" name="married" value="yes">
    <label for="married-yes">Ja</label>
    <input type="radio" id="married-no" name="married" value="no" checked style="margin-left: 20px;">
    <label for="married-no">Nein</label>
</div>
```

### 4.3 Anzahl Kinder
1. Neues **HTML** Widget
2. Code:
```html
<div style="margin-bottom: 20px;">
    <label style="display: block; margin-bottom: 10px; font-weight: 600;">
        Anzahl Kinder:
    </label>
    <input type="number" id="children-count" value="0" min="0"
           style="padding: 10px; width: 100px; border: 1px solid #ddd; border-radius: 4px;">
</div>
```

### 4.4 Sozialleistungen
1. Neues **HTML** Widget
2. Code:
```html
<div style="margin-bottom: 20px;">
    <label style="display: block; margin-bottom: 10px; font-weight: 600;">
        Sozialleistungen für weitere Personen:
    </label>
    <input type="number" id="social-benefits" value="0" min="0"
           style="padding: 10px; width: 100px; border: 1px solid #ddd; border-radius: 4px;">
</div>
```

### 4.5 Gesundheitsschäden
1. Neues **HTML** Widget
2. Code:
```html
<div style="margin-bottom: 30px;">
    <label style="display: block; margin-bottom: 10px; font-weight: 600;">
        Gesundheitsschäden (€/Monat):
    </label>
    <input type="number" id="health-compensation" value="0" min="0"
           style="padding: 10px; width: 100px; border: 1px solid #ddd; border-radius: 4px;">
</div>
```

### 4.6 Ergebnis-Box
1. Neues **HTML** Widget
2. Code:
```html
<div style="background: #EA5530; color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
    <div style="font-size: 14px; margin-bottom: 10px;">
        Ihr monatlicher Freibetrag:
    </div>
    <div id="result-amount" style="font-size: 36px; font-weight: 700;">
        1.410,64 €
    </div>
</div>
```

### 4.7 Weiter-Button
1. Ziehe **Button** Widget
2. Einstellungen:
   - Text: `Freibetrag berechnen`
   - Link: `#`
   - ID: Keine (wird über onclick funktionieren)
   - Style:
     - Hintergrundfarbe: **#EA5530**
     - Text Farbe: **Weiß**
     - Breite: **100%**
     - Padding: **15px**
     - Border Radius: **4px**
     - Schriftgröße: **16px**
     - Schriftgewicht: **600**

**WICHTIG:** Später müssen wir `onclick="nextStep()"` hinzufügen!

---

## 👤 Schritt 5: Persönliche Daten (Schritt 2)

### 5.1 Container für Schritt 2
1. Neuer **Container** (in Main Container)
2. Container Settings:
   - ID: `step-2`
   - Display: **None** (versteckt am Anfang)
   - Padding: **20px**

### 5.2 Anrede
1. **HTML** Widget:
```html
<div style="margin-bottom: 15px;">
    <label style="display: block; margin-bottom: 5px; font-weight: 600;">
        Anrede:
    </label>
    <select id="salutation" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
        <option value="">Bitte wählen</option>
        <option value="herr">Herr</option>
        <option value="frau">Frau</option>
        <option value="divers">Divers</option>
    </select>
</div>
```

### 5.3 Vorname
1. **HTML** Widget:
```html
<div style="margin-bottom: 15px;">
    <label style="display: block; margin-bottom: 5px; font-weight: 600;">
        Vorname:
    </label>
    <input type="text" id="firstName"
           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
</div>
```

### 5.4 Nachname
1. **HTML** Widget:
```html
<div style="margin-bottom: 15px;">
    <label style="display: block; margin-bottom: 5px; font-weight: 600;">
        Nachname:
    </label>
    <input type="text" id="lastName"
           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
</div>
```

### 5.5 E-Mail
1. **HTML** Widget:
```html
<div style="margin-bottom: 15px;">
    <label style="display: block; margin-bottom: 5px; font-weight: 600;">
        E-Mail:
    </label>
    <input type="email" id="email"
           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
</div>
```

### 5.6 IBAN
1. **HTML** Widget:
```html
<div style="margin-bottom: 15px;">
    <label style="display: block; margin-bottom: 5px; font-weight: 600;">
        IBAN:
    </label>
    <input type="text" id="iban"
           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
</div>
```

### 5.7 AGB Checkbox
1. **HTML** Widget:
```html
<div style="margin-bottom: 20px;">
    <input type="checkbox" id="agreement">
    <label for="agreement">
        Ich bestätige die Richtigkeit meiner Angaben und akzeptiere die AGB.
    </label>
</div>
```

### 5.8 Zurück + Bestellen Buttons
1. **HTML** Widget:
```html
<div style="display: flex; gap: 15px;">
    <button onclick="previousStep()"
            style="flex: 1; padding: 15px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
        Zurück
    </button>
    <button onclick="submitForm()"
            style="flex: 2; padding: 15px; background: #EA5530; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; font-size: 16px;">
        Jetzt bestellen (29,00 €)
    </button>
</div>
```

---

## ⚙️ Schritt 6: JavaScript hinzufügen

### 6.1 JavaScript Widget (am Ende der Seite)
1. Ziehe **HTML** Widget ganz nach unten
2. Füge ein:

```html
<script>
console.log('Minimal Form geladen');

var currentStep = 1;
var formData = {
    married: false,
    childrenCount: 0,
    socialBenefitsCount: 0,
    healthCompensation: 0,
    freibetrag: 1410.64
};

function nextStep() {
    console.log('nextStep called');

    // Sammle Daten
    formData.married = document.getElementById('married-yes').checked;
    formData.childrenCount = parseInt(document.getElementById('children-count').value) || 0;
    formData.socialBenefitsCount = parseInt(document.getElementById('social-benefits').value) || 0;
    formData.healthCompensation = parseFloat(document.getElementById('health-compensation').value) || 0;

    // Berechne Freibetrag
    var amount = 1410.64;
    if (formData.married) amount += 529.99;
    if (formData.childrenCount > 0) amount += formData.childrenCount * 592.87;
    if (formData.socialBenefitsCount > 0) amount += formData.socialBenefitsCount * 529.99;
    if (formData.healthCompensation > 0) amount += formData.healthCompensation;

    formData.freibetrag = amount;

    console.log('Berechnet:', amount.toFixed(2), '€');

    // Update Anzeige
    document.getElementById('result-amount').textContent = amount.toFixed(2).replace('.', ',') + ' €';

    // Zeige Schritt 2
    document.getElementById('step-1').style.display = 'none';
    document.getElementById('step-2').style.display = 'block';
    document.getElementById('current-step-title').textContent = 'Schritt 2: Ihre Daten';

    window.scrollTo({top: 0, behavior: 'smooth'});
}

function previousStep() {
    document.getElementById('step-2').style.display = 'none';
    document.getElementById('step-1').style.display = 'block';
    document.getElementById('current-step-title').textContent = 'Schritt 1: Freibetrag berechnen';
}

function submitForm() {
    console.log('submitForm called');

    // Validierung
    var salutation = document.getElementById('salutation').value;
    var firstName = document.getElementById('firstName').value;
    var lastName = document.getElementById('lastName').value;
    var email = document.getElementById('email').value;
    var iban = document.getElementById('iban').value;
    var agreement = document.getElementById('agreement').checked;

    if (!salutation || !firstName || !lastName || !email || !iban) {
        alert('Bitte füllen Sie alle Felder aus.');
        return;
    }

    if (!agreement) {
        alert('Bitte bestätigen Sie die AGB.');
        return;
    }

    // Sende zu WordPress/WooCommerce
    if (typeof PKONTO_CONFIG !== 'undefined') {
        var formDataToSend = new FormData();
        formDataToSend.append('action', 'pkonto_add_to_cart');
        formDataToSend.append('_pkonto_salutation', salutation);
        formDataToSend.append('_pkonto_firstName', firstName);
        formDataToSend.append('_pkonto_lastName', lastName);
        formDataToSend.append('_pkonto_email', email);
        formDataToSend.append('_pkonto_iban', iban);
        formDataToSend.append('_pkonto_married', formData.married ? 'yes' : 'no');
        formDataToSend.append('_pkonto_childrenCount', formData.childrenCount);
        formDataToSend.append('_pkonto_freibetrag', formData.freibetrag);

        fetch(PKONTO_CONFIG.ajax_url, {
            method: 'POST',
            body: formDataToSend
        })
        .then(function(response) { return response.json(); })
        .then(function(result) {
            console.log('Response:', result);
            if (result.success && result.data.checkout_url) {
                window.location.href = result.data.checkout_url;
            } else {
                alert('Fehler beim Hinzufügen zum Warenkorb');
            }
        })
        .catch(function(error) {
            console.error('Error:', error);
            alert('Fehler: ' + error.message);
        });
    } else {
        alert('PKONTO_CONFIG nicht gefunden. Bitte prüfen Sie die functions.php');
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready');
    console.log('PKONTO_CONFIG vorhanden?', typeof PKONTO_CONFIG !== 'undefined');
});
</script>
```

---

## 🎨 Schritt 7: Button onclick Fix

Da Elementor Button Widgets kein `onclick` Attribut haben, ersetze den Button in Schritt 1 durch:

**HTML Widget statt Button Widget:**
```html
<button onclick="nextStep()"
        style="width: 100%; padding: 15px; background: #EA5530; color: white; border: none; border-radius: 4px; font-size: 16px; font-weight: 600; cursor: pointer;">
    Freibetrag berechnen
</button>
```

---

## ✅ Schritt 8: Testen

1. Klicke **Aktualisieren** in Elementor
2. Öffne Seite im neuen Tab
3. Drücke **F12** → **Console**
4. Teste:
   - ✅ Console zeigt: "Minimal Form geladen"
   - ✅ Console zeigt: "DOM ready"
   - ✅ PKONTO_CONFIG vorhanden?
   - ✅ Freibetrag berechnen Button → zu Schritt 2
   - ✅ Zurück Button → zu Schritt 1
   - ✅ Bestellen Button → Validierung + Weiterleitung

---

## 📝 Wichtige IDs Checkliste

Stelle sicher diese IDs sind korrekt:
- ✅ `current-step-title` - Überschrift
- ✅ `step-1` - Container Schritt 1
- ✅ `step-2` - Container Schritt 2
- ✅ `married-yes` - Radio Button Ja
- ✅ `married-no` - Radio Button Nein
- ✅ `children-count` - Input Kinder
- ✅ `social-benefits` - Input Sozialleistungen
- ✅ `health-compensation` - Input Gesundheitsschäden
- ✅ `result-amount` - Freibetrag Anzeige
- ✅ `salutation` - Select Anrede
- ✅ `firstName` - Input Vorname
- ✅ `lastName` - Input Nachname
- ✅ `email` - Input E-Mail
- ✅ `iban` - Input IBAN
- ✅ `agreement` - Checkbox AGB

---

Viel Erfolg beim Aufbau! 🚀
