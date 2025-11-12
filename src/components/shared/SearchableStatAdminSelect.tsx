// ============================================================================
// SEARCHABLE STAT ADMIN SELECT
// ============================================================================
// Purpose: Searchable multi-select for stat admins
// Follows .cursorrules: <200 lines, single responsibility
// ============================================================================

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Search, UserCheck, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface StatAdmin {
  id: string;
  name: string;
  email: string;
}

interface SearchableStatAdminSelectProps {
  statAdmins: StatAdmin[];
  selectedIds: string[];
  onToggle: (adminId: string) => void;
  loading?: boolean;
  placeholder?: string;
}

/**
 * SearchableStatAdminSelect - Searchable multi-select dropdown for stat admins
 */
export function SearchableStatAdminSelect({
  statAdmins,
  selectedIds,
  onToggle,
  loading = false,
  placeholder = 'Search stat admins...'
}: SearchableStatAdminSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter stat admins based on search
  const filteredAdmins = search
    ? statAdmins.filter(admin =>
        admin.name?.toLowerCase().includes(search.toLowerCase()) ||
        admin.email.toLowerCase().includes(search.toLowerCase())
      )
    : statAdmins;

  const selectedCount = selectedIds.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredAdmins.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredAdmins[highlightedIndex]) {
          onToggle(filteredAdmins[highlightedIndex].id);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearch('');
        break;
    }
  };

  const handleToggle = (adminId: string) => {
    onToggle(adminId);
  };

  const getInitials = (admin: StatAdmin) => {
    if (admin.name) {
      return admin.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return admin.email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const getDisplayName = (admin: StatAdmin) => {
    return admin.name || admin.email.split('@')[0];
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !loading && setIsOpen(!isOpen)}
        disabled={loading}
        className={`
          w-full px-3 py-2 pr-10
          bg-background border border-input rounded-md
          text-sm text-left
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
          transition-colors
          ${isOpen ? 'ring-2 ring-ring' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            {selectedCount > 0 
              ? `${selectedCount} stat admin${selectedCount > 1 ? 's' : ''} selected`
              : placeholder}
          </span>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedCount}
            </Badge>
          )}
        </div>
      </button>

      {/* Icons */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      {isOpen && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>
          </div>

          {/* Stat Admins List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredAdmins.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                No stat admins found
              </div>
            ) : (
              filteredAdmins.map((admin, index) => {
                const isSelected = selectedIds.includes(admin.id);
                return (
                  <button
                    key={admin.id}
                    type="button"
                    onClick={() => handleToggle(admin.id)}
                    className={`
                      w-full px-3 py-2.5 text-left text-sm
                      transition-colors flex items-center gap-3
                      ${isSelected ? 'bg-accent text-accent-foreground' : ''}
                      ${highlightedIndex === index ? 'bg-muted' : ''}
                      hover:bg-muted
                    `}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10">
                        {getInitials(admin)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{getDisplayName(admin)}</p>
                      <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
                    </div>
                    {isSelected ? (
                      <UserCheck className="w-4 h-4 text-primary flex-shrink-0" />
                    ) : (
                      <UserPlus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

