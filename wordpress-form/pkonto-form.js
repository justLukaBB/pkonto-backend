// P-Konto Form JavaScript
(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        backendUrl: 'https://pkonto-backend.onrender.com',
        productId: 123344, // WooCommerce Product ID
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
            birthdate: {
                day: '',
                month: '',
                year: ''
            },
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
        setupChildrenCountListener();
    }

    // Navigate to specific step
    window.goToStep = function(step) {
        if (step < 1 || step > 4) return;

        // Hide current step
        document.querySelectorAll('.step-content').forEach(el => {
            el.classList.remove('active');
        });
        document.querySelectorAll('.progress-steps .step').forEach(el => {
            el.classList.remove('active');
        });

        // Show new step
        document.getElementById('step-' + step).classList.add('active');
        document.querySelector('[data-step="' + step + '"]').classList.add('active');

        // Mark previous steps as completed
        for (let i = 1; i < step; i++) {
            document.querySelector('[data-step="' + i + '"]').classList.add('completed');
        }

        currentStep = step;
        window.scrollTo(0, 0);
    };

    // Next step
    window.nextStep = function() {
        if (!validateCurrentStep()) {
            return;
        }

        // Collect data from current step
        collectStepData();

        // Calculate Freibetrag if moving from step 1
        if (currentStep === 1) {
            calculateFreibetrag();
        }

        // Update result box if moving from step 2
        if (currentStep === 2) {
            calculateFreibetrag();
            syncStep2ToStep1();
        }

        // Update summary if moving to step 4
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

    // Validate current step
    function validateCurrentStep() {
        if (currentStep === 3) {
            // Validate personal data
            const salutation = document.querySelector('#step-3 select[placeholder="Anrede"]').value;
            const firstName = document.querySelector('#step-3 input[placeholder="Vorname"]').value;
            const lastName = document.querySelector('#step-3 input[placeholder="Name"]').value;
            const email = document.querySelector('#step-3 input[type="email"]').value;
            const iban = document.querySelector('#step-3 input[placeholder="IBAN"]').value;

            if (!salutation || !firstName || !lastName || !email || !iban) {
                alert('Bitte füllen Sie alle Pflichtfelder aus.');
                return false;
            }

            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
                return false;
            }
        }

        if (currentStep === 4) {
            // Validate checkbox
            const checkbox = document.getElementById('agreement');
            if (!checkbox.checked) {
                alert('Bitte bestätigen Sie die AGB und Widerrufsbelehrung.');
                return false;
            }
        }

        return true;
    }

    // Collect data from current step
    function collectStepData() {
        if (currentStep === 1) {
            formData.calculationData.married = document.getElementById('married-yes').checked;
            formData.calculationData.childrenCount = parseInt(document.getElementById('children-count').value) || 0;
            formData.calculationData.socialBenefitsCount = parseInt(document.getElementById('social-benefits').value) || 0;
            formData.calculationData.healthCompensation = parseFloat(document.getElementById('health-compensation').value) || 0;
        }

        if (currentStep === 2) {
            formData.calculationData.married = document.getElementById('married-yes-2').checked;
            formData.calculationData.childrenCount = parseInt(document.getElementById('children-count-2').value) || 0;

            // Collect children data
            formData.calculationData.children = [];
            for (let i = 1; i <= formData.calculationData.childrenCount; i++) {
                // Note: In real implementation, you'd collect actual values from the dynamically generated fields
                formData.calculationData.children.push({
                    birthdate: {
                        day: 1,
                        month: 1,
                        year: 2010
                    },
                    receivesKindergeld: true
                });
            }
        }

        if (currentStep === 3) {
            const selects = document.querySelectorAll('#step-3 select');
            const inputs = document.querySelectorAll('#step-3 input');

            formData.personalData.salutation = selects[0].value;
            formData.personalData.firstName = inputs[0].value;
            formData.personalData.lastName = inputs[1].value;
            formData.personalData.street = inputs[2].value;
            formData.personalData.houseNumber = inputs[3].value;

            // Birthdate from selects
            formData.personalData.birthdate.day = selects[1].value;
            formData.personalData.birthdate.month = selects[2].value;
            formData.personalData.birthdate.year = selects[3].value;

            formData.personalData.email = document.querySelector('#step-3 input[type="email"]').value;
            formData.personalData.zipCode = inputs[4].value || '00000'; // You might need to adjust input order
            formData.personalData.city = inputs[5]?.value || 'Stadt'; // Adjust as needed

            formData.bankData.iban = document.querySelector('#step-3 input[placeholder="IBAN"]').value;
            formData.bankData.bic = document.querySelector('#step-3 input[placeholder="BIC/Swift-Code"]').value;
        }
    }

    // Calculate Freibetrag
    function calculateFreibetrag() {
        let amount = CONFIG.baseFreibetrag;
        let details = [];

        // Base amount
        details.push(`Grundfreibetrag: ${CONFIG.baseFreibetrag.toFixed(2)} €`);

        // Married bonus
        if (formData.calculationData.married) {
            const marriedBonus = 529.99;
            amount += marriedBonus;
            details.push(`Verheiratet: +${marriedBonus.toFixed(2)} €`);
        }

        // Children bonus
        if (formData.calculationData.childrenCount > 0) {
            const childBonus = formData.calculationData.childrenCount * 592.87;
            amount += childBonus;
            details.push(`${formData.calculationData.childrenCount} Kind(er): +${childBonus.toFixed(2)} €`);
        }

        // Social benefits bonus
        if (formData.calculationData.socialBenefitsCount > 0) {
            const socialBonus = formData.calculationData.socialBenefitsCount * 529.99;
            amount += socialBonus;
            details.push(`${formData.calculationData.socialBenefitsCount} weitere Person(en): +${socialBonus.toFixed(2)} €`);
        }

        // Health compensation
        if (formData.calculationData.healthCompensation > 0) {
            amount += formData.calculationData.healthCompensation;
            details.push(`Gesundheitsschäden: +${formData.calculationData.healthCompensation.toFixed(2)} €`);
        }

        formData.calculatedFreibetrag.amount = amount;
        formData.calculatedFreibetrag.details = details.join('\n');

        updateResultBox();
    }

    // Update result box
    function updateResultBox() {
        const resultAmount = document.getElementById('result-amount');
        if (resultAmount) {
            resultAmount.textContent = formData.calculatedFreibetrag.amount.toFixed(2) + ' €';
        }
    }

    // Sync Step 2 data to Step 1 (for consistency)
    function syncStep2ToStep1() {
        document.getElementById('married-yes').checked = document.getElementById('married-yes-2').checked;
        document.getElementById('married-no').checked = document.getElementById('married-no-2').checked;
        document.getElementById('children-count').value = document.getElementById('children-count-2').value;
    }

    // Update summary on step 4
    function updateSummary() {
        // You would update the summary boxes here with actual data
        // This is a placeholder - in real implementation, you'd populate all summary fields
        console.log('Updating summary with:', formData);
    }

    // Setup children count listener
    function setupChildrenCountListener() {
        const childrenInput = document.getElementById('children-count-2');
        if (childrenInput) {
            childrenInput.addEventListener('change', function() {
                // In real implementation, dynamically generate children detail sections
                console.log('Children count changed:', this.value);
            });
        }
    }

    // Submit form
    window.submitForm = async function() {
        if (!validateCurrentStep()) {
            return;
        }

        collectStepData();

        // Get selected payment method
        const paymentMethod = document.querySelector('input[name="payment"]:checked')?.id || 'paypal';
        formData.payment.method = paymentMethod;

        try {
            // Show loading state
            const submitBtn = event.target;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Wird bearbeitet...';

            console.log('Submitting form data:', formData);

            // Method 1: Use WordPress AJAX to add to cart
            if (typeof PKONTO_CONFIG !== 'undefined') {
                // Add to WooCommerce cart via AJAX
                const response = await fetch(PKONTO_CONFIG.ajax_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'pkonto_add_to_cart',
                        ...flattenFormData()
                    })
                });

                const result = await response.json();

                if (result.success && result.data.checkout_url) {
                    // Redirect to checkout
                    window.location.href = result.data.checkout_url;
                } else {
                    throw new Error('Failed to add to cart');
                }
            } else {
                // Fallback: Direct backend submission (if WordPress AJAX not available)
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
            }

        } catch (error) {
            console.error('Form submission error:', error);
            alert('Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.');

            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Jetzt kostenpflichtig beauftragen';
        }
    };

    // Flatten form data for WordPress AJAX
    function flattenFormData() {
        const flattened = {};

        // Personal data
        flattened._pkonto_salutation = formData.personalData.salutation;
        flattened._pkonto_firstName = formData.personalData.firstName;
        flattened._pkonto_lastName = formData.personalData.lastName;
        flattened._pkonto_street = formData.personalData.street;
        flattened._pkonto_houseNumber = formData.personalData.houseNumber;
        flattened._pkonto_zipCode = formData.personalData.zipCode;
        flattened._pkonto_city = formData.personalData.city;
        flattened._pkonto_birthdate_day = formData.personalData.birthdate.day;
        flattened._pkonto_birthdate_month = formData.personalData.birthdate.month;
        flattened._pkonto_birthdate_year = formData.personalData.birthdate.year;
        flattened._pkonto_email = formData.personalData.email;

        // Bank data
        flattened._pkonto_iban = formData.bankData.iban;
        flattened._pkonto_bic = formData.bankData.bic;

        // Calculation data
        flattened._pkonto_married = formData.calculationData.married ? 'yes' : 'no';
        flattened._pkonto_childrenCount = formData.calculationData.childrenCount;
        flattened._pkonto_socialBenefitsCount = formData.calculationData.socialBenefitsCount;
        flattened._pkonto_healthCompensation = formData.calculationData.healthCompensation;

        // Calculated amount
        flattened._pkonto_freibetrag = formData.calculatedFreibetrag.amount;

        return flattened;
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
