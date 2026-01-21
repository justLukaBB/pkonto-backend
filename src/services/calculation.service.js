/**
 * P-Konto Freibetrag Calculation Service
 * Based on § 850k ZPO (Zivilprozessordnung)
 *
 * Current values (2025):
 * - Base amount (Grundfreibetrag): €1,560.00
 * - First person (spouse or first child): €585.23
 * - Additional persons (further children): €326.04 per person
 * - Kindergeld bonus: €259.00 per child receiving Kindergeld
 * - Additional social benefits and health compensation are added directly
 */

const FREIBETRAG_CONSTANTS = {
  BASE_AMOUNT: 1560.00,          // Grundfreibetrag (2025)
  FIRST_PERSON: 585.23,          // Erste Person (Ehepartner oder 1. Kind)
  ADDITIONAL_PERSON: 326.04,     // Weitere Personen (weitere Kinder)
  KINDERGELD_BONUS: 259.00,      // Kindergeld pro Kind (2025)
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

  // Use childrenCount for 326.04 EUR calculation (total children, not just those with Kindergeld)
  const totalChildren = data.childrenCount || 0;
  const childrenWithKindergeld = data.children?.length || 0;

  // First person logic:
  // - If married: spouse is first person (585.23 EUR)
  // - If NOT married but has children: first child is first person (585.23 EUR)
  if (data.married) {
    total += FREIBETRAG_CONSTANTS.FIRST_PERSON;
    breakdown.push({
      label: 'Verheiratet/Lebenspartnerschaft (erste Person)',
      amount: FREIBETRAG_CONSTANTS.FIRST_PERSON
    });
  } else if (totalChildren > 0) {
    // First child counts as "erste Person"
    total += FREIBETRAG_CONSTANTS.FIRST_PERSON;
    breakdown.push({
      label: '1. Kind (erste Person)',
      amount: FREIBETRAG_CONSTANTS.FIRST_PERSON
    });
  }

  // Additional persons (weitere Personen): 326.04 EUR each
  // - If married: ALL children are additional persons
  // - If NOT married: remaining children (total - 1) are additional persons
  // - MAXIMUM: 4 children for 326.04 EUR calculation
  let additionalChildren = 0;
  if (data.married) {
    additionalChildren = totalChildren; // All children
  } else if (totalChildren > 0) {
    additionalChildren = totalChildren - 1; // First child already counted
  }

  // Cap at maximum 4 children for 326.04 EUR calculation
  const additionalChildrenForCalculation = Math.min(additionalChildren, 4);

  if (additionalChildrenForCalculation > 0) {
    const childrenTotal = additionalChildrenForCalculation * FREIBETRAG_CONSTANTS.ADDITIONAL_PERSON;
    total += childrenTotal;
    breakdown.push({
      label: `${additionalChildrenForCalculation} weitere${additionalChildrenForCalculation > 1 ? '' : 's'} Kind${additionalChildrenForCalculation > 1 ? 'er' : ''} (max. 4)`,
      amount: childrenTotal
    });
  }

  // Kindergeld bonus: 259 EUR per child receiving Kindergeld
  // This IS included in total AND shown separately in PDF fields
  if (childrenWithKindergeld > 0) {
    const kindergeldTotal = childrenWithKindergeld * FREIBETRAG_CONSTANTS.KINDERGELD_BONUS;
    total += kindergeldTotal;
    breakdown.push({
      label: `Kindergeld für ${childrenWithKindergeld} Kind${childrenWithKindergeld > 1 ? 'er' : ''}`,
      amount: kindergeldTotal
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

  const totalChildren = data.childrenCount || 0;
  const childrenWithKindergeld = data.children?.length || 0;

  if (totalChildren > 0) {
    details += `Der Freibetrag für ${totalChildren} Kind${totalChildren > 1 ? 'er' : ''} wurde berücksichtigt. `;
  }

  if (childrenWithKindergeld > 0) {
    details += `Das Kindergeld für ${childrenWithKindergeld} Kind${childrenWithKindergeld > 1 ? 'er' : ''} (${formatCurrency(childrenWithKindergeld * FREIBETRAG_CONSTANTS.KINDERGELD_BONUS)}) wird in der Bescheinigung separat aufgeführt. `;
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
