/**
 * CountrySelector Component
 * 
 * Purpose: Country selection for signup (Step 3)
 * Follows .cursorrules: <200 lines, single responsibility
 */

import React, { useState } from 'react';
import { authPageStyles } from './styles/AuthPageStyles';

interface CountrySelectorProps {
  value: string;
  onChange: (country: string) => void;
  disabled?: boolean;
}

const POPULAR_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' }
];

const ALL_COUNTRIES = [
  ...POPULAR_COUNTRIES,
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' }
];

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = searchQuery
    ? ALL_COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : ALL_COUNTRIES;

  const handleCountrySelect = (code: string) => {
    onChange(code);
    setSearchMode(false);
    setSearchQuery('');
  };

  const selectedCountry = ALL_COUNTRIES.find(c => c.code === value);

  if (searchMode) {
    return (
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search countries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          style={{
            ...authPageStyles.input,
            marginBottom: '12px'
          }}
          autoFocus
        />
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)'
        }}>
          {filteredCountries.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => handleCountrySelect(country.code)}
              disabled={disabled}
              style={{
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                backgroundColor: value === country.code ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                color: '#fff',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                if (!disabled) e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.05)';
              }}
              onMouseLeave={(e) => {
                if (value !== country.code) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ marginRight: '12px', fontSize: '20px' }}>{country.flag}</span>
              {country.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setSearchMode(false);
            setSearchQuery('');
          }}
          disabled={disabled}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            color: '#fff',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          ← Back to popular
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        marginBottom: '12px',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '14px',
        fontWeight: '600'
      }}>
        Popular Countries
      </div>
      
      <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
        {POPULAR_COUNTRIES.map((country) => (
          <button
            key={country.code}
            type="button"
            onClick={() => handleCountrySelect(country.code)}
            disabled={disabled}
            style={{
              padding: '14px 16px',
              backgroundColor: value === country.code ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: value === country.code ? '2px solid #f97316' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              if (!disabled && value !== country.code) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (value !== country.code) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }
            }}
          >
            <span style={{ marginRight: '12px', fontSize: '20px' }}>{country.flag}</span>
            {country.name}
            {value === country.code && (
              <span style={{ float: 'right', color: '#f97316' }}>✓</span>
            )}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setSearchMode(true)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          color: 'rgba(255, 255, 255, 0.7)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        🔍 Search all countries...
      </button>

      {selectedCountry && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          borderRadius: '8px',
          color: '#fbbf24',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px' }}>💡</span>
          <span>We'll show you local tournaments and events</span>
        </div>
      )}
    </div>
  );
};

