/**
 * Edit Custom Player Form Component
 * 
 * Purpose: Form fields for editing custom player details (name, jersey, position)
 * Follows .cursorrules: <200 lines, single responsibility (form fields only)
 * 
 * @module EditCustomPlayerForm
 */

'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditCustomPlayerFormProps {
  name: string;
  jerseyNumber: string; // String to preserve leading zeros
  position?: string;
  onNameChange: (name: string) => void;
  onJerseyNumberChange: (jerseyNumber: string) => void;
  onPositionChange: (position: string | undefined) => void;
  disabled?: boolean;
}

/**
 * EditCustomPlayerForm - Form fields for editing custom player details
 * 
 * Features:
 * - Edit name field
 * - Edit jersey_number field (text input for leading zeros: 00, 001, etc.)
 * - Edit position dropdown
 * - No photo upload (handled separately)
 */
export function EditCustomPlayerForm({
  name,
  jerseyNumber,
  position,
  onNameChange,
  onJerseyNumberChange,
  onPositionChange,
  disabled = false
}: EditCustomPlayerFormProps) {
  return (
    <div className="space-y-4">
      {/* Player Name */}
      <div className="space-y-2">
        <Label htmlFor="edit-player-name">Player Name *</Label>
        <Input
          id="edit-player-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g., John Smith"
          required
          disabled={disabled}
        />
      </div>

      {/* Jersey Number */}
      <div className="space-y-2">
        <Label htmlFor="edit-jersey-number">Jersey Number (Optional)</Label>
        <Input
          id="edit-jersey-number"
          type="text"
          value={jerseyNumber}
          onChange={(e) => {
            const value = e.target.value;
            // Allow empty or numeric values with leading zeros (00, 000, 001, etc.)
            if (value === '') {
              onJerseyNumberChange('');
            } else if (/^\d+$/.test(value) && value.length <= 3) {
              const num = parseInt(value, 10);
              // Validate range 0-999, but preserve string format (00, 000, 001, etc.)
              if (num >= 0 && num <= 999) {
                onJerseyNumberChange(value);
              }
            }
          }}
          placeholder="e.g., 0, 00, 000, 001, 23, 999"
          maxLength={3}
          disabled={disabled}
        />
      </div>

      {/* Position */}
      <div className="space-y-2">
        <Label>Position (Optional)</Label>
        <Select
          value={position || 'none'}
          onValueChange={(value) => onPositionChange(value === 'none' ? undefined : value)}
          disabled={disabled}
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
    </div>
  );
}

