# Frontend Data Collection Fixes

## Issues Found from Production Error

The live form was sending incorrect data that failed MongoDB validation:

### 1. ❌ Salutation Not Lowercase
**Error:** `personalData.salutation: 'Herr' is not a valid enum value`
- Schema expects: `'herr'`, `'frau'`, or `'divers'` (lowercase)
- Form was sending: `'Herr'` (capitalized)

**Fix:**
```javascript
// Before
data.personalData.salutation = selects[0].value;

// After
data.personalData.salutation = selects[0].value.toLowerCase();
```

### 2. ❌ Birthdate Values Were Strings (Not Numbers)
**Error:** `personalData.birthdate.day/month/year` required but undefined
- Schema expects: Numbers (e.g., `15`, `6`, `1990`)
- Form was sending: Strings (e.g., `"15"`, `"6"`, `"1990"`)

**Fix:**
```javascript
// Before
data.personalData.birthdate.day = selects[1].value;
data.personalData.birthdate.month = selects[2].value;
data.personalData.birthdate.year = selects[3].value;

// After
data.personalData.birthdate.day = parseInt(selects[1].value) || 0;
data.personalData.birthdate.month = parseInt(selects[2].value) || 0;
data.personalData.birthdate.year = parseInt(selects[3].value) || 0;
```

### 3. ❌ Missing BIC Validation
**Error:** `bankData.bic: Path 'bankData.bic' is required`
- BIC field was not validated, so users could submit without it

**Fix:** Added validation:
```javascript
const bicInput = step3.querySelector('input[placeholder="BIC/Swift-Code"]');
if (!bicInput || !bicInput.value.trim()) {
    alert('Bitte geben Sie Ihren BIC/Swift-Code ein.');
    return false;
}
```

### 4. ❌ Missing Birthdate Validation
**Error:** Users could skip birthdate selection
- No validation for day/month/year dropdowns

**Fix:** Added validation for each field:
```javascript
if (!dayValue || dayValue === 'Tag') {
    alert('Bitte wählen Sie Ihren Geburtstag aus.');
    return false;
}

if (!monthValue || monthValue === 'Monat') {
    alert('Bitte wählen Sie Ihren Geburtsmonat aus.');
    return false;
}

if (!yearValue || yearValue === 'Jahr') {
    alert('Bitte wählen Sie Ihr Geburtsjahr aus.');
    return false;
}
```

### 5. ✅ Initial Data Structure
**Fix:** Changed birthdate initial values from strings to numbers:
```javascript
// Before
birthdate: { day: '', month: '', year: '' }

// After
birthdate: { day: 0, month: 0, year: 0 }
```

## Changes Made to ELEMENTOR-STRIPE-COMPLETE.html

### File: `/Users/luka.s/Backend P-konto/wordpress-form/ELEMENTOR-STRIPE-COMPLETE.html`

**Lines Changed:**
1. **Line 1303:** Initial birthdate structure (strings → numbers)
2. **Line 1421:** Salutation lowercase conversion
3. **Lines 1434-1436:** Birthdate parseInt conversion
4. **Lines 1523-1560:** Added birthdate and BIC validation

## ⚠️ IMPORTANT: Update Required

**You MUST update the Elementor HTML Widget with the new version of the file!**

### Steps to Update:

1. **Open WordPress Admin:** https://p-konto-bescheinigung.com/wp-admin
2. **Edit the page** with the P-Konto form
3. **Edit the Elementor HTML Widget** containing the form
4. **Replace ALL HTML** with the updated content from:
   `/Users/luka.s/Backend P-konto/wordpress-form/ELEMENTOR-STRIPE-COMPLETE.html`
5. **Save and Publish** the page

## Testing Checklist After Update

- [ ] Form loads correctly
- [ ] Step 1 → 2 → 3 → 4 navigation works
- [ ] Birthdate dropdowns show validation error if not selected
- [ ] BIC field shows validation error if empty
- [ ] Console shows birthdate as numbers (not strings)
- [ ] Console shows salutation as lowercase
- [ ] Form submits to Stripe successfully
- [ ] Payment completes and PDF is generated

## Expected Console Output (Step 3)

After the update, you should see:
```
Step 3 Daten gesammelt:
  Salutation: herr          ← lowercase!
  Name: Max Mustermann
  Birthdate: {day: 15, month: 6, year: 1990}  ← numbers!
  Email: max@example.com
  IBAN: DE89370400440532013000
  BIC: COBADEFFXXX           ← now collected!
```

## Files Modified

✅ `/Users/luka.s/Backend P-konto/wordpress-form/ELEMENTOR-STRIPE-COMPLETE.html`

## Status

🔧 **Frontend fixes complete**
⏳ **Awaiting Elementor widget update**
🚀 **Ready for production testing after update**
