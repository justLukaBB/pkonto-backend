/**
 * Frontend Integration for WooCommerce + P-Konto Backend
 *
 * This script handles the form submission and passes data to WooCommerce
 * Add this script to your WordPress/Elementor page
 */

(function() {
    'use strict';

    // Form data storage
    const formData = {
        step1: {},
        step2: {},
        step3: {},
        calculatedFreibetrag: 0
    };

    /**
     * Collect data from Step 1 (Initial Calculation)
     */
    function collectStep1Data() {
        return {
            married: document.querySelector('input[name="married"]:checked')?.value || 'no',
            childrenCount: parseInt(document.getElementById('children-count')?.value || 0),
            socialBenefitsCount: parseInt(document.getElementById('social-benefits')?.value || 0),
            healthCompensation: parseFloat(document.getElementById('health-compensation')?.value || 0)
        };
    }

    /**
     * Collect data from Step 2 (Detailed Information)
     */
    function collectStep2Data() {
        const childrenCount = parseInt(document.getElementById('children-count-2')?.value || 0);
        const children = [];

        // Collect children data
        for (let i = 1; i <= childrenCount; i++) {
            const daySelect = document.querySelector(`.children-section:nth-of-type(${i}) select:nth-of-type(1)`);
            const monthSelect = document.querySelector(`.children-section:nth-of-type(${i}) select:nth-of-type(2)`);
            const yearSelect = document.querySelector(`.children-section:nth-of-type(${i}) select:nth-of-type(3)`);
            const kindergeldRadio = document.querySelector(`input[name="kindergeld-${i}"]:checked`);

            if (daySelect && monthSelect && yearSelect) {
                children.push({
                    birthdate: {
                        day: parseInt(daySelect.value),
                        month: parseInt(monthSelect.value),
                        year: parseInt(yearSelect.value)
                    },
                    receivesKindergeld: kindergeldRadio?.value === 'yes'
                });
            }
        }

        return {
            married: document.querySelector('input[name="married-2"]:checked')?.value || 'no',
            childrenCount: childrenCount,
            children: children,
            socialBenefitsCount: parseInt(document.querySelector('#step-2 input[type="number"]:nth-of-type(3)')?.value || 0),
            healthCompensation: parseFloat(document.querySelector('#step-2 input[type="number"]:nth-of-type(4)')?.value || 0)
        };
    }

    /**
     * Collect data from Step 3 (Personal Data)
     */
    function collectStep3Data() {
        const selects = document.querySelectorAll('#step-3 select');
        const inputs = document.querySelectorAll('#step-3 input[type="text"], #step-3 input[type="email"]');

        return {
            salutation: selects[0]?.value || '',
            firstName: inputs[1]?.value || '',
            lastName: inputs[2]?.value || '',
            street: inputs[3]?.value || '',
            houseNumber: inputs[4]?.value || '',
            zipCode: inputs[5]?.value || '',
            city: inputs[6]?.value || '',
            birthdateDay: selects[1]?.value || '',
            birthdateMonth: selects[2]?.value || '',
            birthdateYear: selects[3]?.value || '',
            email: inputs[5]?.value || '',
            phone: inputs[6]?.value || '',
            iban: inputs[7]?.value || '',
            bic: inputs[8]?.value || ''
        };
    }

    /**
     * Get selected payment method
     */
    function getPaymentMethod() {
        const paymentRadio = document.querySelector('input[name="payment"]:checked');
        if (!paymentRadio) return 'paypal';

        const paymentId = paymentRadio.id;
        const methodMap = {
            'paypal': 'paypal',
            'klarna': 'klarna',
            'amazon': 'amazon',
            'nachnahme': 'nachnahme'
        };

        return methodMap[paymentId] || 'paypal';
    }

    /**
     * Add form data to WooCommerce cart/checkout
     */
    async function addToCartWithFormData() {
        try {
            // Collect all form data
            const step1 = collectStep1Data();
            const step2 = collectStep2Data();
            const step3 = collectStep3Data();
            const paymentMethod = getPaymentMethod();

            // Create form data for WooCommerce
            const formDataToSend = new FormData();
            formDataToSend.append('product_id', PKONTO_CONFIG.product_id); // Set this in WordPress
            formDataToSend.append('quantity', 1);

            // Add all custom fields with _pkonto_ prefix
            formDataToSend.append('_pkonto_married', step2.married);
            formDataToSend.append('_pkonto_childrenCount', step2.childrenCount);
            formDataToSend.append('_pkonto_children', JSON.stringify(step2.children));
            formDataToSend.append('_pkonto_socialBenefitsCount', step2.socialBenefitsCount);
            formDataToSend.append('_pkonto_healthCompensation', step2.healthCompensation);

            formDataToSend.append('_pkonto_salutation', step3.salutation);
            formDataToSend.append('_pkonto_firstName', step3.firstName);
            formDataToSend.append('_pkonto_lastName', step3.lastName);
            formDataToSend.append('_pkonto_street', step3.street);
            formDataToSend.append('_pkonto_houseNumber', step3.houseNumber);
            formDataToSend.append('_pkonto_zipCode', step3.zipCode);
            formDataToSend.append('_pkonto_city', step3.city);
            formDataToSend.append('_pkonto_birthdateDay', step3.birthdateDay);
            formDataToSend.append('_pkonto_birthdateMonth', step3.birthdateMonth);
            formDataToSend.append('_pkonto_birthdateYear', step3.birthdateYear);
            formDataToSend.append('_pkonto_email', step3.email);
            formDataToSend.append('_pkonto_phone', step3.phone);
            formDataToSend.append('_pkonto_iban', step3.iban);
            formDataToSend.append('_pkonto_bic', step3.bic);
            formDataToSend.append('_pkonto_paymentMethod', paymentMethod);

            // Add to cart via AJAX
            const response = await fetch(PKONTO_CONFIG.ajax_url, {
                method: 'POST',
                body: formDataToSend
            });

            const result = await response.json();

            if (result.success) {
                // Redirect to checkout
                window.location.href = PKONTO_CONFIG.checkout_url;
            } else {
                alert('Fehler beim Hinzufügen zum Warenkorb. Bitte versuchen Sie es erneut.');
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        }
    }

    /**
     * Submit form handler
     */
    window.submitForm = function() {
        // Check if agreement checkbox is checked
        const agreementCheckbox = document.getElementById('agreement');
        if (!agreementCheckbox || !agreementCheckbox.checked) {
            alert('Bitte akzeptieren Sie die AGB und Widerrufsbelehrung.');
            return;
        }

        // Add to cart with all form data
        addToCartWithFormData();
    };

    /**
     * Calculate Freibetrag
     * This function is called when user clicks "Freibetrag berechnen"
     */
    window.calculateFreibetrag = async function(data) {
        try {
            const response = await fetch(PKONTO_CONFIG.backend_url + '/api/calculate/freibetrag', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                formData.calculatedFreibetrag = result.data.total;

                // Update display
                const resultAmount = document.getElementById('result-amount');
                if (resultAmount) {
                    resultAmount.textContent = new Intl.NumberFormat('de-DE', {
                        style: 'currency',
                        currency: 'EUR'
                    }).format(result.data.total);
                }

                const resultSubLabel = document.getElementById('result-sub-label');
                if (resultSubLabel) {
                    resultSubLabel.textContent = result.data.details;
                }

                return result.data;
            }

        } catch (error) {
            console.error('Calculation error:', error);
        }
    };

})();

/**
 * Configuration object - Set these values in WordPress
 * Add this to your WordPress theme's functions.php or in a separate script:
 *
 * <script>
 * var PKONTO_CONFIG = {
 *     product_id: 123, // Your WooCommerce Product ID
 *     ajax_url: '<?php echo admin_url('admin-ajax.php'); ?>',
 *     checkout_url: '<?php echo wc_get_checkout_url(); ?>',
 *     backend_url: 'http://localhost:3000' // Or your production backend URL
 * };
 * </script>
 */
