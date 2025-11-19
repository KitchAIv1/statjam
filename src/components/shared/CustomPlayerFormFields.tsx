/**
 * Custom Player Form Fields
 * 
 * Purpose: Form fields for custom player creation (name, jersey, position)
 * Extracted from CustomPlayerForm to follow .cursorrules
 * Follows .cursorrules: <200 lines, single responsibility (form fields only)
 * 
 * @module CustomPlayerFormFields
 */

'use client';

import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CustomPlayerFormFieldsProps {
  formData: {
    name: string;
    jersey_number: string;
    position: string | undefined;
  };
  onFormDataChange: (updates: Partial<CustomPlayerFormFieldsProps['formData']>) => void;
}

/**
 * CustomPlayerFormFields - Form fields component
 * 
 * Features:
 * - Player name input
 * - Jersey number input (supports leading zeros: 00, 001, etc.)
 * - Position select dropdown
 */
export function CustomPlayerFormFields({
  formData,
  onFormDataChange
}: CustomPlayerFormFieldsProps) {
  return (
    <>
      {/* Player Name */}
      <div className="space-y-2">
        <Label htmlFor="player-name">Player Name *</Label>
        <Input
          id="player-name"
          value={formData.name}
          onChange={(e) => onFormDataChange({ name: e.target.value })}
          placeholder="e.g., John Smith"
          required
        />
      </div>

      {/* Jersey Number */}
      <div className="space-y-2">
        <Label htmlFor="jersey-number">Jersey Number (Optional)</Label>
        <Input
          id="jersey-number"
          type="text"
          value={formData.jersey_number}
          onChange={(e) => {
            const value = e.target.value;
            // Allow empty or numeric values with leading zeros (00, 000, 001, etc.)
            if (value === '') {
              onFormDataChange({ jersey_number: '' });
            } else if (/^\d+$/.test(value) && value.length <= 3) {
              const num = parseInt(value, 10);
              // Validate range 0-999, but preserve string format (00, 000, 001, etc.)
              if (num >= 0 && num <= 999) {
                onFormDataChange({ jersey_number: value });
              }
            }
          }}
          placeholder="e.g., 0, 00, 000, 001, 23, 999"
          maxLength={3}
        />
      </div>

      {/* Position */}
      <div className="space-y-2">
        <Label>Position (Optional)</Label>
        <Select
          value={formData.position || 'none'}
          onValueChange={(value) => onFormDataChange({ position: value === 'none' ? undefined : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Position</SelectItem>
            <SelectItem value="PG">Point Guard (PG)</SelectItem>
            <SelectItem value="SG">Shooting Guard (SG)</SelectItem>
            <SelectItem value="SF">Small Forward (SF)</SelectItem>
            <SelectItem value="PF">Power Forward (PF)</SelectItem>
            <SelectItem value="C">Center (C)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

