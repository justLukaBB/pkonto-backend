// P-KONTO FORM - DEBUG VERSION (ohne Emojis für bessere Kompatibilität)
console.log('===============================================');
console.log('P-Konto Form Script laeuft...');
console.log('Zeit:', new Date().toLocaleTimeString());
console.log('===============================================');

// Check WordPress - create if not exists
console.log('WordPress Integration Check:');
console.log('  PKONTO_CONFIG existiert?', typeof PKONTO_CONFIG !== 'undefined');

// Create PKONTO_CONFIG if it doesn't exist
if (typeof PKONTO_CONFIG === 'undefined') {
    console.warn('  WARNUNG - PKONTO_CONFIG nicht gefunden! Erstelle lokale Kopie...');
    window.PKONTO_CONFIG = {
        product_id: 571,
        ajax_url: window.location.origin + '/wp-admin/admin-ajax.php',
        checkout_url: window.location.origin + '/?page_id=520',
        backend_url: 'https://pkonto-backend.onrender.com'
    };
    console.log('  OK - PKONTO_CONFIG erstellt:', PKONTO_CONFIG);
} else {
    console.log('  OK - PKONTO_CONFIG gefunden:', PKONTO_CONFIG);
}

// Config
const PKONTO_FORM_CONFIG = {
    backendUrl: 'https://pkonto-backend.onrender.com',
    productId: 571,
    baseFreibetrag: 1410.64
};

console.log('Form Config:', PKONTO_FORM_CONFIG);

// Global State
window.pkontoFormData = {
    calculationData: {
        married: false,
        childrenCount: 0,
        children: [],
        socialBenefitsCount: 0,
        healthCompensation: 0
    },
    personalData: {
        salutation: '',
        firstName: '',
        lastName: '',
        street: '',
        houseNumber: '',
        zipCode: '',
        city: '',
        birthdate: { day: '', month: '', year: '' },
        email: '',
        phone: ''
    },
    bankData: {
        iban: '',
        bic: ''
    },
    calculatedFreibetrag: {
        amount: PKONTO_FORM_CONFIG.baseFreibetrag,
        details: ''
    },
    payment: {
        method: 'paypal',
        amount: 29.00,
        status: 'pending'
    }
};

window.pkontoCurrentStep = 1;

console.log('Initial FormData erstellt');

// Navigate to step
window.goToStep = function(step) {
    console.log('-----------------------------------------------');
    console.log('goToStep:', step);
    console.log('-----------------------------------------------');

    if (step < 1 || step > 4) {
        console.error('FEHLER - Invalid step:', step);
        return;
    }

    for (let i = 1; i <= 4; i++) {
        const stepEl = document.getElementById('step-' + i);
        if (stepEl) {
            stepEl.classList.remove('active');
        }

        const progressStep = document.querySelector('[data-step="' + i + '"]');
        if (progressStep) {
            progressStep.classList.remove('active');
            if (i < step) {
                progressStep.classList.add('completed');
            } else {
                progressStep.classList.remove('completed');
            }
        }
    }

    const currentStepEl = document.getElementById('step-' + step);
    if (currentStepEl) {
        currentStepEl.classList.add('active');
        console.log('OK - Step', step, 'ist jetzt aktiv');
    } else {
        console.error('FEHLER - Step element nicht gefunden:', 'step-' + step);
    }

    const currentProgressStep = document.querySelector('[data-step="' + step + '"]');
    if (currentProgressStep) currentProgressStep.classList.add('active');

    window.pkontoCurrentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    console.log('OK - Navigation abgeschlossen');
};

// Collect data
function collectStepData() {
    console.log('-----------------------------------------------');
    console.log('collectStepData() - Step:', window.pkontoCurrentStep);
    console.log('-----------------------------------------------');

    const step = window.pkontoCurrentStep;
    const data = window.pkontoFormData;

    if (step === 1) {
        const marriedYes = document.getElementById('married-yes');
        const childrenCount = document.getElementById('children-count');
        const socialBenefits = document.getElementById('social-benefits');
        const healthComp = document.getElementById('health-compensation');

        data.calculationData.married = marriedYes ? marriedYes.checked : false;
        data.calculationData.childrenCount = childrenCount ? parseInt(childrenCount.value) || 0 : 0;
        data.calculationData.socialBenefitsCount = socialBenefits ? parseInt(socialBenefits.value) || 0 : 0;
        data.calculationData.healthCompensation = healthComp ? parseFloat(healthComp.value) || 0 : 0;

        console.log('Step 1 Daten gesammelt:');
        console.log('  Verheiratet:', data.calculationData.married ? 'JA' : 'NEIN');
        console.log('  Kinder:', data.calculationData.childrenCount);
        console.log('  Sozialleistungen:', data.calculationData.socialBenefitsCount);
        console.log('  Gesundheitskomp:', data.calculationData.healthCompensation);
    }

    if (step === 2) {
        const marriedYes2 = document.getElementById('married-yes-2');
        const childrenCount2 = document.getElementById('children-count-2');

        data.calculationData.married = marriedYes2 ? marriedYes2.checked : false;
        data.calculationData.childrenCount = childrenCount2 ? parseInt(childrenCount2.value) || 0 : 0;

        console.log('Step 2 Daten gesammelt:');
        console.log('  Verheiratet:', data.calculationData.married ? 'JA' : 'NEIN');
        console.log('  Kinder:', data.calculationData.childrenCount);
    }

    if (step === 3) {
        const step3 = document.getElementById('step-3');
        if (!step3) {
            console.error('FEHLER - Step 3 element nicht gefunden!');
            return;
        }

        const selects = step3.querySelectorAll('select');
        const inputs = step3.querySelectorAll('input[type="text"], input[type="email"]');

        if (selects.length > 0) data.personalData.salutation = selects[0].value;
        if (inputs.length > 0) data.personalData.firstName = inputs[0].value;
        if (inputs.length > 1) data.personalData.lastName = inputs[1].value;
        if (inputs.length > 2) data.personalData.street = inputs[2].value;
        if (inputs.length > 3) data.personalData.houseNumber = inputs[3].value;

        const emailInput = step3.querySelector('input[type="email"]');
        if (emailInput) data.personalData.email = emailInput.value;

        if (selects.length >= 4) {
            data.personalData.birthdate.day = selects[1].value;
            data.personalData.birthdate.month = selects[2].value;
            data.personalData.birthdate.year = selects[3].value;
        }

        const ibanInput = step3.querySelector('input[placeholder="IBAN"]');
        const bicInput = step3.querySelector('input[placeholder="BIC/Swift-Code"]');
        if (ibanInput) data.bankData.iban = ibanInput.value;
        if (bicInput) data.bankData.bic = bicInput.value;

        console.log('Step 3 Daten gesammelt:');
        console.log('  Name:', data.personalData.firstName, data.personalData.lastName);
        console.log('  Email:', data.personalData.email);
        console.log('  IBAN:', data.bankData.iban);
    }

    console.log('Komplette FormData:', data);
}

// Validate
function validateCurrentStep() {
    const step = window.pkontoCurrentStep;
    console.log('-----------------------------------------------');
    console.log('validateCurrentStep() - Step:', step);
    console.log('-----------------------------------------------');

    if (step === 1 || step === 2) {
        console.log('OK - Keine Validierung fuer Step', step);
        return true;
    }

    if (step === 3) {
        const step3 = document.getElementById('step-3');
        if (!step3) {
            console.error('FEHLER - Step 3 element nicht gefunden!');
            return false;
        }

        const salutationSelect = step3.querySelector('select');
        const inputs = step3.querySelectorAll('input[type="text"]');
        const emailInput = step3.querySelector('input[type="email"]');
        const ibanInput = step3.querySelector('input[placeholder="IBAN"]');

        if (!salutationSelect || !salutationSelect.value) {
            console.warn('WARNUNG - Anrede fehlt');
            alert('Bitte waehlen Sie eine Anrede.');
            return false;
        }

        if (!inputs[0] || !inputs[0].value.trim()) {
            console.warn('WARNUNG - Vorname fehlt');
            alert('Bitte geben Sie Ihren Vornamen ein.');
            return false;
        }

        if (!inputs[1] || !inputs[1].value.trim()) {
            console.warn('WARNUNG - Nachname fehlt');
            alert('Bitte geben Sie Ihren Nachnamen ein.');
            return false;
        }

        if (!emailInput || !emailInput.value.trim()) {
            console.warn('WARNUNG - Email fehlt');
            alert('Bitte geben Sie Ihre E-Mail-Adresse ein.');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            console.warn('WARNUNG - Email ungueltig');
            alert('Bitte geben Sie eine gueltige E-Mail-Adresse ein.');
            return false;
        }

        if (!ibanInput || !ibanInput.value.trim()) {
            console.warn('WARNUNG - IBAN fehlt');
            alert('Bitte geben Sie Ihre IBAN ein.');
            return false;
        }

        console.log('OK - Step 3 Validierung erfolgreich');
    }

    if (step === 4) {
        const checkbox = document.getElementById('agreement');
        if (!checkbox || !checkbox.checked) {
            console.warn('WARNUNG - AGB nicht akzeptiert');
            alert('Bitte bestaetigen Sie die AGB und Widerrufsbelehrung.');
            return false;
        }
        console.log('OK - Step 4 Validierung erfolgreich');
    }

    return true;
}

// Calculate Freibetrag
function calculateFreibetrag() {
    console.log('-----------------------------------------------');
    console.log('calculateFreibetrag()');
    console.log('-----------------------------------------------');

    const data = window.pkontoFormData;
    let amount = PKONTO_FORM_CONFIG.baseFreibetrag;

    console.log('  Basis:', amount.toFixed(2), 'EUR');

    if (data.calculationData.married) {
        amount += 529.99;
        console.log('  + Verheiratet: 529.99 EUR');
    }

    if (data.calculationData.childrenCount > 0) {
        const childBonus = data.calculationData.childrenCount * 592.87;
        amount += childBonus;
        console.log('  +', data.calculationData.childrenCount, 'Kinder:', childBonus.toFixed(2), 'EUR');
    }

    if (data.calculationData.socialBenefitsCount > 0) {
        const socialBonus = data.calculationData.socialBenefitsCount * 529.99;
        amount += socialBonus;
        console.log('  +', data.calculationData.socialBenefitsCount, 'Sozialleistungen:', socialBonus.toFixed(2), 'EUR');
    }

    if (data.calculationData.healthCompensation > 0) {
        amount += data.calculationData.healthCompensation;
        console.log('  + Gesundheitskomp:', data.calculationData.healthCompensation.toFixed(2), 'EUR');
    }

    data.calculatedFreibetrag.amount = amount;

    console.log('  =========================================');
    console.log('  GESAMT FREIBETRAG:', amount.toFixed(2), 'EUR');
    console.log('  =========================================');

    updateResultBox();
}

// Update result box
function updateResultBox() {
    const resultAmount = document.getElementById('result-amount');
    if (resultAmount) {
        const amount = window.pkontoFormData.calculatedFreibetrag.amount;
        const formatted = amount.toFixed(2).replace('.', ',') + ' EUR';
        resultAmount.textContent = formatted;
        console.log('Result Box aktualisiert:', formatted);
    } else {
        console.error('FEHLER - Result Box Element nicht gefunden!');
    }
}

// Update summary
function updateSummary() {
    console.log('Summary wird aktualisiert...');
}

// Next step
window.nextStep = function() {
    console.log('===============================================');
    console.log('nextStep() aufgerufen!');
    console.log('  Current Step:', window.pkontoCurrentStep);
    console.log('===============================================');

    collectStepData();

    if (!validateCurrentStep()) {
        console.warn('WARNUNG - Validierung fehlgeschlagen - bleibe auf Step', window.pkontoCurrentStep);
        return;
    }

    if (window.pkontoCurrentStep === 1 || window.pkontoCurrentStep === 2) {
        calculateFreibetrag();
    }

    if (window.pkontoCurrentStep === 3) {
        updateSummary();
    }

    if (window.pkontoCurrentStep < 4) {
        goToStep(window.pkontoCurrentStep + 1);
    } else {
        console.log('INFO - Bereits auf letztem Step');
    }
};

// Previous step
window.previousStep = function() {
    console.log('===============================================');
    console.log('previousStep() aufgerufen!');
    console.log('===============================================');

    if (window.pkontoCurrentStep > 1) {
        goToStep(window.pkontoCurrentStep - 1);
    }
};

// Submit form
window.submitForm = async function() {
    console.log('===============================================');
    console.log('submitForm() AUFGERUFEN!');
    console.log('===============================================');

    if (!validateCurrentStep()) {
        console.warn('WARNUNG - Validierung fehlgeschlagen');
        return;
    }

    collectStepData();

    const paymentRadio = document.querySelector('input[name="payment"]:checked');
    if (paymentRadio) {
        window.pkontoFormData.payment.method = paymentRadio.id;
        console.log('Zahlungsmethode:', paymentRadio.id);
    }

    const submitBtn = document.activeElement;
    if (submitBtn && submitBtn.tagName === 'BUTTON') {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Wird bearbeitet...';
    }

    try {
        console.log('Bereite Submission vor...');
        console.log('FormData:', window.pkontoFormData);

        // Check WordPress AJAX
        if (typeof PKONTO_CONFIG !== 'undefined' && PKONTO_CONFIG.ajax_url) {
            console.log('OK - WordPress AJAX verfuegbar!');
            console.log('AJAX URL:', PKONTO_CONFIG.ajax_url);

            const formDataFlat = new FormData();
            formDataFlat.append('action', 'pkonto_add_to_cart');

            const data = window.pkontoFormData;
            formDataFlat.append('_pkonto_salutation', data.personalData.salutation);
            formDataFlat.append('_pkonto_firstName', data.personalData.firstName);
            formDataFlat.append('_pkonto_lastName', data.personalData.lastName);
            formDataFlat.append('_pkonto_street', data.personalData.street);
            formDataFlat.append('_pkonto_houseNumber', data.personalData.houseNumber);
            formDataFlat.append('_pkonto_email', data.personalData.email);
            formDataFlat.append('_pkonto_birthdate_day', data.personalData.birthdate.day);
            formDataFlat.append('_pkonto_birthdate_month', data.personalData.birthdate.month);
            formDataFlat.append('_pkonto_birthdate_year', data.personalData.birthdate.year);
            formDataFlat.append('_pkonto_iban', data.bankData.iban);
            formDataFlat.append('_pkonto_bic', data.bankData.bic);
            formDataFlat.append('_pkonto_married', data.calculationData.married ? 'yes' : 'no');
            formDataFlat.append('_pkonto_childrenCount', data.calculationData.childrenCount);
            formDataFlat.append('_pkonto_socialBenefitsCount', data.calculationData.socialBenefitsCount);
            formDataFlat.append('_pkonto_healthCompensation', data.calculationData.healthCompensation);
            formDataFlat.append('_pkonto_freibetrag', data.calculatedFreibetrag.amount);

            console.log('Sende zu WordPress AJAX...');

            const response = await fetch(PKONTO_CONFIG.ajax_url, {
                method: 'POST',
                body: formDataFlat
            });

            console.log('Response Status:', response.status);

            const result = await response.json();
            console.log('Response Data:', result);

            if (result.success && result.data && result.data.checkout_url) {
                console.log('ERFOLGREICH!');
                console.log('Redirect zu:', result.data.checkout_url);
                window.location.href = result.data.checkout_url;
            } else {
                throw new Error(result.data || 'Failed to add to cart');
            }

        } else {
            console.warn('WARNUNG - WordPress AJAX nicht verfuegbar');
            console.log('Fallback: Sende direkt zu Backend');
            console.log('Backend URL:', PKONTO_FORM_CONFIG.backendUrl);

            const response = await fetch(PKONTO_FORM_CONFIG.backendUrl + '/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(window.pkontoFormData)
            });

            console.log('Backend Response Status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('FEHLER - Backend Error:', errorText);
                throw new Error('Backend submission failed');
            }

            const result = await response.json();
            console.log('OK - Backend Response:', result);

            alert('Antrag erfolgreich eingereicht! ID: ' + result.data._id + '\n\nHinweis: Dies ist nur eine Test-Submission.');
        }

    } catch (error) {
        console.error('===============================================');
        console.error('FEHLER beim Submit!');
        console.error('===============================================');
        console.error('Error:', error);
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        console.error('===============================================');

        alert('Fehler beim Absenden: ' + error.message + '\n\nBitte pruefen Sie die Browser-Konsole (F12) fuer Details.');

        if (submitBtn && submitBtn.tagName === 'BUTTON') {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Jetzt kostenpflichtig beauftragen';
        }
    }
};

// Initialize
console.log('===============================================');
console.log('Initialisiere Form...');
console.log('===============================================');

updateResultBox();

console.log('OK - P-Konto Form erfolgreich initialisiert!');
console.log('===============================================');

// WICHTIG: Globale Aliase fuer onclick-Handler (Elementor Kompatibilitaet)
// Die Buttons im HTML verwenden onclick="nextStep()" ohne window. prefix
// Wir muessen die Funktionen auch OHNE window. prefix verfuegbar machen
console.log('Erstelle globale Funktions-Aliase...');

// Exportiere window.xxx auch als globale Variablen
if (typeof nextStep === 'undefined') {
    window.nextStep = window.nextStep;
}
if (typeof previousStep === 'undefined') {
    window.previousStep = window.previousStep;
}
if (typeof goToStep === 'undefined') {
    window.goToStep = window.goToStep;
}
if (typeof submitForm === 'undefined') {
    window.submitForm = window.submitForm;
}

// Test ob die Funktionen verfuegbar sind
console.log('Funktions-Check:');
console.log('  typeof window.nextStep:', typeof window.nextStep);
console.log('  typeof window.previousStep:', typeof window.previousStep);
console.log('  typeof window.goToStep:', typeof window.goToStep);
console.log('  typeof window.submitForm:', typeof window.submitForm);

// Test ob onclick funktioniert
console.log('Teste onclick-Zugriff:');
try {
    console.log('  eval("typeof nextStep"):', eval('typeof nextStep'));
    console.log('  eval("typeof submitForm"):', eval('typeof submitForm'));
} catch(e) {
    console.error('  FEHLER beim eval-Test:', e.message);
}

console.log('OK - Alle Funktionen registriert!');
