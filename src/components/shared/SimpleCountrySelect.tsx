// ============================================================================
// SIMPLE COUNTRY SELECT
// ============================================================================
// Purpose: Lightweight country selector for forms (native select element)
// Follows .cursorrules: <100 lines, single responsibility
// ============================================================================

import React from 'react';
import { getSortedCountries, POPULAR_COUNTRIES } from '@/data/countries';

interface SimpleCountrySelectProps {
  value: string;
  onChange: (country: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * SimpleCountrySelect - Native select dropdown for country selection
 * 
 * Benefits:
 * - Lightweight (no custom UI, just native select)
 * - Accessible (browser native, keyboard friendly)
 * - Mobile-friendly (native mobile pickers)
 * - Fast rendering
 * - Complete country list (195+ countries)
 * - Popular countries shown first
 * 
 * Use in: Forms, modals, settings
 */
export function SimpleCountrySelect({ 
  value, 
  onChange, 
  disabled = false,
  className = ''
}: SimpleCountrySelectProps) {
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const countries = getSortedCountries();
  const popularCount = POPULAR_COUNTRIES.length;

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className={`
        w-full px-3 py-2 
        bg-background 
        border border-input rounded-md
        text-sm
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${className}
      `}
    >
      <option value="">Select a country...</option>
      
      {/* Popular countries first */}
      {countries.slice(0, popularCount).map((country) => (
        <option key={country.code} value={country.code}>
          {country.flag} {country.name}
        </option>
      ))}
      
      {/* Separator */}
      <option disabled>──────────</option>
      
      {/* All other countries alphabetically */}
      {countries.slice(popularCount).map((country) => (
        <option key={country.code} value={country.code}>
          {country.flag} {country.name}
        </option>
      ))}
    </select>
  );
}

