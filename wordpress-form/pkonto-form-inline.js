// P-Konto Form - Inline Version (Global Functions)
// Direkt im HTML einfügen

console.log('P-Konto Form wird geladen...');

// Configuration
const PKONTO_FORM_CONFIG = {
    backendUrl: 'https://pkonto-backend.onrender.com',
    productId: 123344, // ANPASSEN: Deine WooCommerce Product ID
    baseFreibetrag: 1410.64
};

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
        amount: 0,
        details: ''
    },
    payment: {
        method: 'paypal',
        amount: 29.00,
        status: 'pending'
    }
};

window.pkontoCurrentStep = 1;

// Navigate to step
window.goToStep = function(step) {
    console.log('goToStep:', step);

    if (step < 1 || step > 4) return;

    // Hide all steps
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

    // Show current step
    const currentStepEl = document.getElementById('step-' + step);
    if (currentStepEl) {
        currentStepEl.classList.add('active');
    }
    const currentProgressStep = document.querySelector('[data-step="' + step + '"]');
    if (currentProgressStep) {
        currentProgressStep.classList.add('active');
    }

    window.pkontoCurrentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Next step
window.nextStep = function() {
    console.log('nextStep from:', window.pkontoCurrentStep);

    collectStepData();

    if (!validateCurrentStep()) {
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
    }
};

// Previous step
window.previousStep = function() {
    if (window.pkontoCurrentStep > 1) {
        goToStep(window.pkontoCurrentStep - 1);
    }
};

// Collect data
function collectStepData() {
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
    }

    if (step === 2) {
        const marriedYes2 = document.getElementById('married-yes-2');
        const childrenCount2 = document.getElementById('children-count-2');

        data.calculationData.married = marriedYes2 ? marriedYes2.checked : false;
        data.calculationData.childrenCount = childrenCount2 ? parseInt(childrenCount2.value) || 0 : 0;
    }

    if (step === 3) {
        const step3 = document.getElementById('step-3');
        if (!step3) return;

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
    }

    console.log('Data collected:', data);
}

// Validate
function validateCurrentStep() {
    const step = window.pkontoCurrentStep;

    if (step === 3) {
        const step3 = document.getElementById('step-3');
        if (!step3) return false;

        const salutationSelect = step3.querySelector('select');
        const inputs = step3.querySelectorAll('input[type="text"]');
        const emailInput = step3.querySelector('input[type="email"]');
        const ibanInput = step3.querySelector('input[placeholder="IBAN"]');

        if (!salutationSelect || !salutationSelect.value) {
            alert('Bitte wählen Sie eine Anrede.');
            return false;
        }

        if (!inputs[0] || !inputs[0].value.trim()) {
            alert('Bitte geben Sie Ihren Vornamen ein.');
            return false;
        }

        if (!inputs[1] || !inputs[1].value.trim()) {
            alert('Bitte geben Sie Ihren Nachnamen ein.');
            return false;
        }

        if (!emailInput || !emailInput.value.trim()) {
            alert('Bitte geben Sie Ihre E-Mail-Adresse ein.');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            alert('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
            return false;
        }

        if (!ibanInput || !ibanInput.value.trim()) {
            alert('Bitte geben Sie Ihre IBAN ein.');
            return false;
        }
    }

    if (step === 4) {
        const checkbox = document.getElementById('agreement');
        if (!checkbox || !checkbox.checked) {
            alert('Bitte bestätigen Sie die AGB und Widerrufsbelehrung.');
            return false;
        }
    }

    return true;
}

// Calculate Freibetrag
function calculateFreibetrag() {
    const data = window.pkontoFormData;
    let amount = PKONTO_FORM_CONFIG.baseFreibetrag;

    if (data.calculationData.married) {
        amount += 529.99;
    }

    if (data.calculationData.childrenCount > 0) {
        amount += data.calculationData.childrenCount * 592.87;
    }

    if (data.calculationData.socialBenefitsCount > 0) {
        amount += data.calculationData.socialBenefitsCount * 529.99;
    }

    if (data.calculationData.healthCompensation > 0) {
        amount += data.calculationData.healthCompensation;
    }

    data.calculatedFreibetrag.amount = amount;
    updateResultBox();

    console.log('Calculated:', amount.toFixed(2), '€');
}

// Update result box
function updateResultBox() {
    const resultAmount = document.getElementById('result-amount');
    if (resultAmount) {
        const amount = window.pkontoFormData.calculatedFreibetrag.amount;
        resultAmount.textContent = amount.toFixed(2).replace('.', ',') + ' €';
    }
}

// Update summary
function updateSummary() {
    console.log('Summary updated');
}

// Submit form
window.submitForm = async function() {
    console.log('submitForm called');

    if (!validateCurrentStep()) {
        return;
    }

    collectStepData();

    const paymentRadio = document.querySelector('input[name="payment"]:checked');
    if (paymentRadio) {
        window.pkontoFormData.payment.method = paymentRadio.id;
    }

    const submitBtn = event.target;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird bearbeitet...';

    try {
        console.log('Submitting:', window.pkontoFormData);

        // WordPress AJAX
        if (typeof PKONTO_CONFIG !== 'undefined' && PKONTO_CONFIG.ajax_url) {
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

            const response = await fetch(PKONTO_CONFIG.ajax_url, {
                method: 'POST',
                body: formDataFlat
            });

            const result = await response.json();
            console.log('Response:', result);

            if (result.success && result.data && result.data.checkout_url) {
                window.location.href = result.data.checkout_url;
            } else {
                throw new Error(result.data || 'Failed to add to cart');
            }

        } else {
            // Fallback: Direct backend
            const response = await fetch(PKONTO_FORM_CONFIG.backendUrl + '/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(window.pkontoFormData)
            });

            if (!response.ok) throw new Error('Backend submission failed');

            const result = await response.json();
            alert('Antrag erfolgreich! ID: ' + result.data._id);
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Fehler: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Jetzt kostenpflichtig beauftragen';
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('P-Konto Form initialized');
    updateResultBox();
});
