// P-Konto Form JavaScript - Minimal Version (funktioniert mit deinem bestehenden CSS)
(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        backendUrl: 'https://pkonto-backend.onrender.com',
        productId: 123344, // WooCommerce Product ID - ANPASSEN!
        baseFreibetrag: 1410.64 // 2025 base amount
    };

    // State
    let currentStep = 1;
    let formData = {
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

    // Initialize
    function init() {
        console.log('P-Konto Form initialized');
        updateResultBox();
    }

    // Navigate to specific step
    window.goToStep = function(step) {
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

        currentStep = step;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Next step
    window.nextStep = function() {
        console.log('Next step from:', currentStep);

        // Collect data before validation
        collectStepData();

        // Validate
        if (!validateCurrentStep()) {
            return;
        }

        // Calculate on step 1 or 2
        if (currentStep === 1 || currentStep === 2) {
            calculateFreibetrag();
        }

        // Update summary before step 4
        if (currentStep === 3) {
            updateSummary();
        }

        // Move to next step
        if (currentStep < 4) {
            goToStep(currentStep + 1);
        }
    };

    // Previous step
    window.previousStep = function() {
        if (currentStep > 1) {
            goToStep(currentStep - 1);
        }
    };

    // Collect data from current step
    function collectStepData() {
        console.log('Collecting data from step:', currentStep);

        if (currentStep === 1) {
            const marriedYes = document.getElementById('married-yes');
            const childrenCount = document.getElementById('children-count');
            const socialBenefits = document.getElementById('social-benefits');
            const healthComp = document.getElementById('health-compensation');

            formData.calculationData.married = marriedYes ? marriedYes.checked : false;
            formData.calculationData.childrenCount = childrenCount ? parseInt(childrenCount.value) || 0 : 0;
            formData.calculationData.socialBenefitsCount = socialBenefits ? parseInt(socialBenefits.value) || 0 : 0;
            formData.calculationData.healthCompensation = healthComp ? parseFloat(healthComp.value) || 0 : 0;
        }

        if (currentStep === 2) {
            const marriedYes2 = document.getElementById('married-yes-2');
            const childrenCount2 = document.getElementById('children-count-2');

            formData.calculationData.married = marriedYes2 ? marriedYes2.checked : false;
            formData.calculationData.childrenCount = childrenCount2 ? parseInt(childrenCount2.value) || 0 : 0;
        }

        if (currentStep === 3) {
            // Personal data
            const step3 = document.getElementById('step-3');
            if (step3) {
                const selects = step3.querySelectorAll('select');
                const inputs = step3.querySelectorAll('input[type="text"], input[type="email"]');

                if (selects.length > 0) formData.personalData.salutation = selects[0].value;
                if (inputs.length > 0) formData.personalData.firstName = inputs[0].value;
                if (inputs.length > 1) formData.personalData.lastName = inputs[1].value;
                if (inputs.length > 2) formData.personalData.street = inputs[2].value;
                if (inputs.length > 3) formData.personalData.houseNumber = inputs[3].value;

                // Email
                const emailInput = step3.querySelector('input[type="email"]');
                if (emailInput) formData.personalData.email = emailInput.value;

                // Birthdate
                if (selects.length >= 4) {
                    formData.personalData.birthdate.day = selects[1].value;
                    formData.personalData.birthdate.month = selects[2].value;
                    formData.personalData.birthdate.year = selects[3].value;
                }

                // Bank data
                const ibanInput = step3.querySelector('input[placeholder="IBAN"]');
                const bicInput = step3.querySelector('input[placeholder="BIC/Swift-Code"]');
                if (ibanInput) formData.bankData.iban = ibanInput.value;
                if (bicInput) formData.bankData.bic = bicInput.value;
            }
        }

        console.log('Form data:', formData);
    }

    // Validate current step
    function validateCurrentStep() {
        if (currentStep === 3) {
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

            // Email validation
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

        if (currentStep === 4) {
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
        let amount = CONFIG.baseFreibetrag;

        // Married bonus
        if (formData.calculationData.married) {
            amount += 529.99;
        }

        // Children bonus
        if (formData.calculationData.childrenCount > 0) {
            amount += formData.calculationData.childrenCount * 592.87;
        }

        // Social benefits bonus
        if (formData.calculationData.socialBenefitsCount > 0) {
            amount += formData.calculationData.socialBenefitsCount * 529.99;
        }

        // Health compensation
        if (formData.calculationData.healthCompensation > 0) {
            amount += formData.calculationData.healthCompensation;
        }

        formData.calculatedFreibetrag.amount = amount;
        updateResultBox();

        console.log('Calculated Freibetrag:', amount.toFixed(2), '€');
    }

    // Update result box
    function updateResultBox() {
        const resultAmount = document.getElementById('result-amount');
        if (resultAmount) {
            resultAmount.textContent = formData.calculatedFreibetrag.amount.toFixed(2).replace('.', ',') + ' €';
        }
    }

    // Update summary
    function updateSummary() {
        console.log('Summary updated with:', formData);
        // Summary wird manuell im HTML gepflegt oder du kannst es hier dynamisch machen
    }

    // Submit form
    window.submitForm = async function() {
        console.log('Submit form called');

        if (!validateCurrentStep()) {
            return;
        }

        collectStepData();

        // Get payment method
        const paymentRadio = document.querySelector('input[name="payment"]:checked');
        if (paymentRadio) {
            formData.payment.method = paymentRadio.id;
        }

        try {
            const submitBtn = event.target;
            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Wird bearbeitet...';

            console.log('Submitting to WordPress/WooCommerce:', formData);

            // Check if PKONTO_CONFIG exists (WordPress integration)
            if (typeof PKONTO_CONFIG !== 'undefined' && PKONTO_CONFIG.ajax_url) {
                // WordPress AJAX submission
                const formDataFlat = new FormData();
                formDataFlat.append('action', 'pkonto_add_to_cart');

                // Add all form data with _pkonto_ prefix
                formDataFlat.append('_pkonto_salutation', formData.personalData.salutation);
                formDataFlat.append('_pkonto_firstName', formData.personalData.firstName);
                formDataFlat.append('_pkonto_lastName', formData.personalData.lastName);
                formDataFlat.append('_pkonto_street', formData.personalData.street);
                formDataFlat.append('_pkonto_houseNumber', formData.personalData.houseNumber);
                formDataFlat.append('_pkonto_email', formData.personalData.email);
                formDataFlat.append('_pkonto_birthdate_day', formData.personalData.birthdate.day);
                formDataFlat.append('_pkonto_birthdate_month', formData.personalData.birthdate.month);
                formDataFlat.append('_pkonto_birthdate_year', formData.personalData.birthdate.year);
                formDataFlat.append('_pkonto_iban', formData.bankData.iban);
                formDataFlat.append('_pkonto_bic', formData.bankData.bic);
                formDataFlat.append('_pkonto_married', formData.calculationData.married ? 'yes' : 'no');
                formDataFlat.append('_pkonto_childrenCount', formData.calculationData.childrenCount);
                formDataFlat.append('_pkonto_socialBenefitsCount', formData.calculationData.socialBenefitsCount);
                formDataFlat.append('_pkonto_healthCompensation', formData.calculationData.healthCompensation);
                formDataFlat.append('_pkonto_freibetrag', formData.calculatedFreibetrag.amount);

                const response = await fetch(PKONTO_CONFIG.ajax_url, {
                    method: 'POST',
                    body: formDataFlat
                });

                const result = await response.json();
                console.log('WordPress AJAX response:', result);

                if (result.success && result.data && result.data.checkout_url) {
                    // Redirect to checkout
                    window.location.href = result.data.checkout_url;
                } else {
                    throw new Error(result.data || 'Failed to add to cart');
                }

            } else {
                // Fallback: Direct backend submission
                console.log('PKONTO_CONFIG not found, using direct backend submission');

                const response = await fetch(CONFIG.backendUrl + '/api/applications', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    throw new Error('Backend submission failed');
                }

                const result = await response.json();
                alert('Antrag erfolgreich erstellt! Application ID: ' + result.data._id);
                console.log('Backend response:', result);
            }

        } catch (error) {
            console.error('Form submission error:', error);
            alert('Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.\n\n' + error.message);

            // Reset button
            if (event && event.target) {
                event.target.disabled = false;
                event.target.textContent = 'Jetzt kostenpflichtig beauftragen';
            }
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
