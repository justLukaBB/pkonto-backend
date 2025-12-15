# Dynamische Checkboxen im Word-Template

## Verfügbare Checkbox-Platzhalter

Das System stellt automatisch diese Checkbox-Platzhalter bereit:

### 1. "Die Bescheinigung wird erteilt als"

**Verwende im Word-Template:**
```
Die Bescheinigung wird erteilt als:

<<geeignetePersonCheck>> geeignete Person gemäß § 305 Abs. 1 Nr. 1 InsO
<<geeigneteStelleCheck>> geeignete Stelle gemäß § 305 Abs. 1 Nr. 1 InsO
```

**Automatische Logik:**
- `<<geeigneteStelleCheck>>` ist immer `☑` (ausgefüllt) für Rechtsanwalt/Kanzlei
- `<<geeignetePersonCheck>>` ist immer `☐` (leer) für Rechtsanwalt/Kanzlei

---

### 2. Familienstand / Verheiratet

**Verwende im Word-Template:**
```
<<marriedCheck>> Verheiratet/Lebenspartnerschaft
<<notMarriedCheck>> Ledig/Geschieden
```

**Automatische Logik:**
- Wenn der Antragsteller verheiratet/in Lebenspartnerschaft ist: `☑` bei married, `☐` bei notMarried
- Sonst umgekehrt

---

### 3. Gesundheitsschaden / Mehraufwand

**Verwende im Word-Template:**
```
<<hasHealthCompensationCheck>> Ja, Gesundheitsschaden liegt vor
<<noHealthCompensationCheck>> Nein, kein Gesundheitsschaden
```

**Automatische Logik:**
- Wenn `healthCompensation > 0`: `☑` bei has, `☐` bei no
- Sonst umgekehrt

---

### 4. Kinder mit Kindergeld

**Verwende im Word-Template:**
```
<<#children>>
Kind <<number>>: <<kindergeldCheck>> mit Kindergeld  <<noKindergeldCheck>> ohne Kindergeld
<</children>>
```

**Automatische Logik:**
- Pro Kind wird automatisch gesetzt ob es Kindergeld erhält

---

## Anleitung: Checkboxen im Word-Template ersetzen

### Schritt 1: Word-Template öffnen
Öffne `/Users/luka.s/Backend P-konto/src/templates/certificate-template.docx`

### Schritt 2: Checkbox-Stelle finden
Suche nach: "Die Bescheinigung wird erteilt als"

### Schritt 3: Bestehende Checkboxen entfernen
- Lösche die Word-Checkbox-Controls
- Oder: Ersetze sie durch Text

### Schritt 4: Platzhalter einfügen

**VORHER:**
```
☑ geeignete Person gemäß § 305 Abs. 1 Nr. 1 InsO
☐ geeignete Stelle gemäß § 305 Abs. 1 Nr. 1 InsO
```

**NACHHER:**
```
<<geeignetePersonCheck>> geeignete Person gemäß § 305 Abs. 1 Nr. 1 InsO
<<geeigneteStelleCheck>> geeignete Stelle gemäß § 305 Abs. 1 Nr. 1 InsO
```

### Schritt 5: Speichern
Speichere das Word-Dokument (Cmd+S)

---

## Checkbox-Zeichen

Das System verwendet diese Unicode-Zeichen:
- `☑` (U+2611) - Ausgefülltes Kästchen (checked)
- `☐` (U+2610) - Leeres Kästchen (unchecked)

Diese werden automatisch vom Backend eingefügt basierend auf den Formulardaten.

---

## Konfiguration ändern

### Person vs. Stelle ändern

In `/Users/luka.s/Backend P-konto/src/services/word-template.service.js` Zeile 105-106:

```javascript
const isGeeignetePerson = false; // true = Person, false = Stelle
const isGeeigneteStelle = true;  // true = Stelle, false = Person
```

**Standard:** Immer "geeignete Stelle" für Rechtsanwalt/Kanzlei

---

## Alle verfügbaren Checkbox-Platzhalter

| Platzhalter | Beschreibung | Wert wenn true | Wert wenn false |
|-------------|--------------|----------------|-----------------|
| `<<geeignetePersonCheck>>` | Person gemäß InsO | ☑ | ☐ |
| `<<geeigneteStelleCheck>>` | Stelle gemäß InsO | ☑ | ☐ |
| `<<marriedCheck>>` | Verheiratet/Lebenspartnerschaft | ☑ | ☐ |
| `<<notMarriedCheck>>` | Ledig/Geschieden | ☑ | ☐ |
| `<<hasHealthCompensationCheck>>` | Gesundheitsschaden vorhanden | ☑ | ☐ |
| `<<noHealthCompensationCheck>>` | Kein Gesundheitsschaden | ☑ | ☐ |
| `<<kindergeldCheck>>` | Kind erhält Kindergeld | ☑ | ☐ |
| `<<noKindergeldCheck>>` | Kind erhält kein Kindergeld | ☑ | ☐ |

---

## Testen

Nach dem Aktualisieren des Templates kannst du testen:

```bash
cd /Users/luka.s/Backend\ P-konto
node test-word-template.js <APPLICATION_ID>
```

Das generiert ein Test-Zertifikat mit den neuen Platzhaltern.
