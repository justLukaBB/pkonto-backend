/**
 * P-Konto Freibetrag Calculation Service
 * Based on § 850k ZPO (Zivilprozessordnung)
 *
 * Current values (2025):
 * - Base amount (Grundfreibetrag): €1,560.00
 * - First person (spouse or first child): €585.23
 * - Additional persons (further children): €326.04 per person
 * - Additional social benefits and health compensation are added directly
 */

const FREIBETRAG_CONSTANTS = {
  BASE_AMOUNT: 1560.00,          // Grundfreibetrag (2025)
  FIRST_PERSON: 585.23,          // Erste Person (Ehepartner oder 1. Kind)
  ADDITIONAL_PERSON: 326.04,     // Weitere Personen (weitere Kinder)
  SOCIAL_PERSON_AMOUNT: 326.04   // Pro weitere Person mit Sozialleistungen
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

  // IMPORTANT: Use children.length (children with Kindergeld), NOT childrenCount (total children)
  const childrenWithKindergeld = data.children?.length || 0;

  // First person logic:
  // - If married: spouse is first person (585,23 EUR)
  // - If not married but has children: first child is first person (585,23 EUR)
  if (data.married) {
    total += FREIBETRAG_CONSTANTS.FIRST_PERSON;
    breakdown.push({
      label: 'Verheiratet/Lebenspartnerschaft',
      amount: FREIBETRAG_CONSTANTS.FIRST_PERSON
    });
  } else if (childrenWithKindergeld > 0) {
    // First child counts as "erste Person"
    total += FREIBETRAG_CONSTANTS.FIRST_PERSON;
    breakdown.push({
      label: '1. Kind (erste Person)',
      amount: FREIBETRAG_CONSTANTS.FIRST_PERSON
    });
  }

  // Additional persons (weitere Personen):
  // - If married: ALL children with Kindergeld are additional persons
  // - If not married: remaining children (total - 1) are additional persons
  let additionalChildren = 0;
  if (data.married) {
    additionalChildren = childrenWithKindergeld; // All children with Kindergeld
  } else if (childrenWithKindergeld > 0) {
    additionalChildren = childrenWithKindergeld - 1; // First child already counted
  }

  if (additionalChildren > 0) {
    const childrenTotal = additionalChildren * FREIBETRAG_CONSTANTS.ADDITIONAL_PERSON;
    total += childrenTotal;
    breakdown.push({
      label: additionalChildren === childrenWithKindergeld
        ? `${additionalChildren} Kind${additionalChildren > 1 ? 'er' : ''} mit Kindergeld`
        : `${additionalChildren} weitere${additionalChildren > 1 ? 's' : ''} Kind${additionalChildren > 1 ? 'er' : ''} mit Kindergeld`,
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

  const childrenWithKindergeld = data.children?.length || 0;
  if (childrenWithKindergeld > 0) {
    details += `Zusätzlich wurde der Freibetrag für ${childrenWithKindergeld} Kind${childrenWithKindergeld > 1 ? 'er' : ''} mit Kindergeld berücksichtigt. `;
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

  const childrenWithKindergeld = data.children?.length || 0;
  if (childrenWithKindergeld > 0 && !data.children) {
    errors.push('Geburtsdaten aller Kinder mit Kindergeld sind erforderlich');
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
