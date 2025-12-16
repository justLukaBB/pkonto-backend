/**
 * P-Konto Freibetrag Calculation Service
 * Based on § 850k ZPO (Zivilprozessordnung)
 *
 * Current values (2024/2025):
 * - Base amount (Grundfreibetrag): €1,410.00
 * - Per spouse: €531.00
 * - Per child: €531.00
 * - Additional social benefits and health compensation are added directly
 */

const FREIBETRAG_CONSTANTS = {
  BASE_AMOUNT: 1410.00,          // Grundfreibetrag
  SPOUSE_AMOUNT: 531.00,         // Ehepartner/Lebenspartner
  CHILD_AMOUNT: 531.00,          // Pro Kind
  SOCIAL_PERSON_AMOUNT: 531.00   // Pro weitere Person mit Sozialleistungen
};

/**
 * Calculate the monthly Freibetrag (protected amount)
 * @param {Object} data - Calculation data from the form
 * @returns {Object} - Calculated Freibetrag with breakdown
 */
function calculateFreibetrag(data) {
  let total = FREIBETRAG_CONSTANTS.BASE_AMOUNT;
  const breakdown = [];

  breakdown.push({
    label: 'Grundfreibetrag',
    amount: FREIBETRAG_CONSTANTS.BASE_AMOUNT
  });

  // First person logic:
  // - If married: spouse is first person (585,23 EUR)
  // - If not married but has children: first child is first person (585,23 EUR)
  if (data.married) {
    total += FREIBETRAG_CONSTANTS.SPOUSE_AMOUNT;
    breakdown.push({
      label: 'Verheiratet/Lebenspartnerschaft',
      amount: FREIBETRAG_CONSTANTS.SPOUSE_AMOUNT
    });
  } else if (data.childrenCount > 0) {
    // First child counts as "erste Person"
    total += FREIBETRAG_CONSTANTS.SPOUSE_AMOUNT;
    breakdown.push({
      label: '1. Kind (erste Person)',
      amount: FREIBETRAG_CONSTANTS.SPOUSE_AMOUNT
    });
  }

  // Additional persons (weitere Personen):
  // - If married: ALL children are additional persons
  // - If not married: remaining children (total - 1) are additional persons
  let additionalChildren = 0;
  if (data.married) {
    additionalChildren = data.childrenCount; // All children
  } else if (data.childrenCount > 0) {
    additionalChildren = data.childrenCount - 1; // First child already counted
  }

  if (additionalChildren > 0) {
    const childrenTotal = additionalChildren * FREIBETRAG_CONSTANTS.CHILD_AMOUNT;
    total += childrenTotal;
    breakdown.push({
      label: additionalChildren === data.childrenCount
        ? `${additionalChildren} Kind${additionalChildren > 1 ? 'er' : ''}`
        : `${additionalChildren} weitere${additionalChildren > 1 ? 's' : ''} Kind${additionalChildren > 1 ? 'er' : ''}`,
      amount: childrenTotal
    });
  }

  // Add amount for additional persons receiving social benefits
  if (data.socialBenefitsCount > 0) {
    const socialTotal = data.socialBenefitsCount * FREIBETRAG_CONSTANTS.SOCIAL_PERSON_AMOUNT;
    total += socialTotal;
    breakdown.push({
      label: `${data.socialBenefitsCount} weitere Person${data.socialBenefitsCount > 1 ? 'en' : ''} mit Sozialleistungen`,
      amount: socialTotal
    });
  }

  // Add other child-related financial benefits (exact amount provided)
  if (data.healthCompensation > 0) {
    total += data.healthCompensation;
    breakdown.push({
      label: 'Andere Geldleistungen für Kinder',
      amount: data.healthCompensation
    });
  }

  return {
    total: parseFloat(total.toFixed(2)),
    breakdown,
    details: generateFreibetragDetails(data, total)
  };
}

/**
 * Generate human-readable details about the Freibetrag
 */
function generateFreibetragDetails(data, total) {
  let details = `Ihr monatlicher Freibetrag beträgt ${formatCurrency(total)}. `;

  if (data.married) {
    details += 'Dies beinhaltet den erhöhten Freibetrag für Verheiratete/Lebenspartner. ';
  }

  if (data.childrenCount > 0) {
    details += `Zusätzlich wurde der Freibetrag für ${data.childrenCount} Kind${data.childrenCount > 1 ? 'er' : ''} berücksichtigt. `;
  }

  if (data.socialBenefitsCount > 0) {
    details += `Freibeträge für ${data.socialBenefitsCount} weitere unterhaltsberechtigte Person${data.socialBenefitsCount > 1 ? 'en' : ''} wurden hinzugefügt. `;
  }

  if (data.healthCompensation > 0) {
    details += `Ihre anderen monatlichen Geldleistungen für Kinder (${formatCurrency(data.healthCompensation)}) wurden berücksichtigt.`;
  }

  return details;
}

/**
 * Format number as EUR currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

/**
 * Validate calculation data
 */
function validateCalculationData(data) {
  const errors = [];

  if (typeof data.married !== 'boolean') {
    errors.push('Familienstand (verheiratet) ist erforderlich');
  }

  if (typeof data.childrenCount !== 'number' || data.childrenCount < 0) {
    errors.push('Anzahl der Kinder muss eine positive Zahl sein');
  }

  if (data.childrenCount > 0 && (!data.children || data.children.length !== data.childrenCount)) {
    errors.push('Geburtsdaten aller Kinder sind erforderlich');
  }

  if (typeof data.socialBenefitsCount !== 'number' || data.socialBenefitsCount < 0) {
    errors.push('Anzahl der Personen mit Sozialleistungen muss eine positive Zahl sein');
  }

  if (typeof data.healthCompensation !== 'number' || data.healthCompensation < 0) {
    errors.push('Betrag für andere Geldleistungen für Kinder muss eine positive Zahl sein');
  }

  return errors;
}

module.exports = {
  calculateFreibetrag,
  validateCalculationData,
  formatCurrency,
  FREIBETRAG_CONSTANTS
};
