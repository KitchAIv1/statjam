/**
 * Profile Validation Utilities
 * 
 * Provides validation for player profile data including personal information,
 * physical attributes, and team details.
 */

export interface ProfileValidationErrors {
  name?: string;
  jerseyNumber?: string;
  position?: string;
  height?: string;
  weight?: string;
  age?: string;
  team?: string;
}

/**
 * Validation limits for profile fields
 */
export const PROFILE_LIMITS = {
  name: {
    min: 2,
    max: 50,
  },
  jerseyNumber: {
    min: 0,
    max: 999,
  },
  height: {
    min: 48, // 4'0" in inches
    max: 96, // 8'0" in inches
  },
  weight: {
    min: 50, // lbs
    max: 400, // lbs
  },
  age: {
    min: 10,
    max: 99,
  },
};

/**
 * Valid basketball positions
 */
export const VALID_POSITIONS = [
  'PG', // Point Guard
  'SG', // Shooting Guard
  'SF', // Small Forward
  'PF', // Power Forward
  'C',  // Center
  'G',  // Guard (generic)
  'F',  // Forward (generic)
];

/**
 * Validate entire player profile
 * @param data - Player profile data
 * @returns Object with validation errors (empty if valid)
 */
export function validatePlayerProfile(data: {
  name?: string;
  jerseyNumber?: string | number;
  position?: string;
  height?: string | number;
  weight?: string | number;
  age?: string | number;
  team?: string;
}): ProfileValidationErrors {
  const errors: ProfileValidationErrors = {};

  // Validate name
  if (data.name !== undefined) {
    const nameError = validateName(data.name);
    if (nameError) errors.name = nameError;
  }

  // Validate jersey number
  if (data.jerseyNumber !== undefined && data.jerseyNumber !== '') {
    const jerseyError = validateJerseyNumber(data.jerseyNumber);
    if (jerseyError) errors.jerseyNumber = jerseyError;
  }

  // Validate position
  if (data.position !== undefined && data.position !== '') {
    const positionError = validatePosition(data.position);
    if (positionError) errors.position = positionError;
  }

  // Validate height
  if (data.height !== undefined && data.height !== '') {
    const heightError = validateHeight(data.height);
    if (heightError) errors.height = heightError;
  }

  // Validate weight
  if (data.weight !== undefined && data.weight !== '') {
    const weightError = validateWeight(data.weight);
    if (weightError) errors.weight = weightError;
  }

  // Validate age
  if (data.age !== undefined && data.age !== '' && data.age !== 0) {
    const ageError = validateAge(data.age);
    if (ageError) errors.age = ageError;
  }

  return errors;
}

/**
 * Validate player name
 */
export function validateName(name: string): string | null {
  if (!name || !name.trim()) {
    return 'Name is required';
  }

  const trimmedName = name.trim();

  if (trimmedName.length < PROFILE_LIMITS.name.min) {
    return `Name must be at least ${PROFILE_LIMITS.name.min} characters`;
  }

  if (trimmedName.length > PROFILE_LIMITS.name.max) {
    return `Name cannot exceed ${PROFILE_LIMITS.name.max} characters`;
  }

  return null;
}

/**
 * Validate jersey number
 */
export function validateJerseyNumber(jerseyNumber: string | number): string | null {
  const num = typeof jerseyNumber === 'string' 
    ? parseInt(jerseyNumber, 10) 
    : jerseyNumber;

  if (isNaN(num)) {
    return 'Jersey number must be a number';
  }

  if (num < PROFILE_LIMITS.jerseyNumber.min) {
    return `Jersey number cannot be negative`;
  }

  if (num > PROFILE_LIMITS.jerseyNumber.max) {
    return `Jersey number must be between ${PROFILE_LIMITS.jerseyNumber.min} and ${PROFILE_LIMITS.jerseyNumber.max}`;
  }

  return null;
}

/**
 * Validate position
 */
export function validatePosition(position: string): string | null {
  if (!position || !position.trim()) {
    return null; // Position is optional
  }

  const upperPosition = position.trim().toUpperCase();

  if (!VALID_POSITIONS.includes(upperPosition)) {
    return `Invalid position. Valid positions: ${VALID_POSITIONS.join(', ')}`;
  }

  return null;
}

/**
 * Validate height (in inches)
 */
export function validateHeight(height: string | number): string | null {
  const num = typeof height === 'string' 
    ? parseHeightToInches(height) 
    : height;

  if (num === null || isNaN(num)) {
    return 'Height must be a valid number';
  }

  if (num < PROFILE_LIMITS.height.min) {
    return `Height must be at least ${formatHeight(PROFILE_LIMITS.height.min)}`;
  }

  if (num > PROFILE_LIMITS.height.max) {
    return `Height cannot exceed ${formatHeight(PROFILE_LIMITS.height.max)}`;
  }

  return null;
}

/**
 * Validate weight (in lbs)
 */
export function validateWeight(weight: string | number): string | null {
  // Extract numeric value from string (handles "180 lbs", "180", etc.)
  const num = typeof weight === 'string' 
    ? parseFloat(weight.replace(/[^\d.]/g, '')) 
    : weight;

  if (isNaN(num)) {
    return 'Weight must be a number';
  }

  if (num < PROFILE_LIMITS.weight.min) {
    return `Weight must be at least ${PROFILE_LIMITS.weight.min} lbs`;
  }

  if (num > PROFILE_LIMITS.weight.max) {
    return `Weight cannot exceed ${PROFILE_LIMITS.weight.max} lbs`;
  }

  return null;
}

/**
 * Validate age
 */
export function validateAge(age: string | number): string | null {
  const num = typeof age === 'string' 
    ? parseInt(age, 10) 
    : age;

  if (isNaN(num)) {
    return 'Age must be a number';
  }

  if (num < PROFILE_LIMITS.age.min) {
    return `Age must be at least ${PROFILE_LIMITS.age.min}`;
  }

  if (num > PROFILE_LIMITS.age.max) {
    return `Age cannot exceed ${PROFILE_LIMITS.age.max}`;
  }

  return null;
}

/**
 * Format height in inches to feet and inches
 * @param inches - Height in inches
 * @returns Formatted string (e.g., "6'2\"")
 */
function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}'${remainingInches}"`;
}

/**
 * Parse height string to inches
 * Supports formats: "6'2\"", "6'2", "74", "74 inches"
 */
export function parseHeightToInches(height: string): number | null {
  if (!height) return null;

  // Try feet'inches" format
  const feetInchesMatch = height.match(/(\d+)'(\d+)/);
  if (feetInchesMatch) {
    const feet = parseInt(feetInchesMatch[1], 10);
    const inches = parseInt(feetInchesMatch[2], 10);
    return (feet * 12) + inches;
  }

  // Try plain number (assumed inches)
  const num = parseFloat(height.replace(/[^\d.]/g, ''));
  if (!isNaN(num)) {
    return num;
  }

  return null;
}

