"use client";

import { Button } from '@/components/ui/Button';
import { Mail, FileText, CheckCircle } from 'lucide-react';

interface PlayerProfileRecruitmentProps {
  recruitmentNote?: string;
  contactEmail?: string;
  variant?: 'light' | 'dark';
}

/**
 * PlayerProfileRecruitment - Recruitment CTA section
 * Shows when player is open to opportunities
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function PlayerProfileRecruitment({
  recruitmentNote,
  contactEmail,
  variant = 'dark',
}: PlayerProfileRecruitmentProps) {
  const handleContact = () => {
    if (contactEmail) {
      window.location.href = `mailto:${contactEmail}`;
    }
  };

  const handleDownloadStats = () => {
    alert('Stats PDF download coming soon!');
  };

  const isLight = variant === 'light';
  const badgeClass = isLight ? 'text-green-600' : 'text-green-400';
  const noteClass = isLight ? 'text-gray-600' : 'text-gray-300';
  const outlineClass = isLight
    ? 'border-gray-300 text-gray-700 hover:bg-gray-100'
    : 'border-white/30 text-white hover:bg-white/10';

  return (
    <div className="text-center sm:text-left">
      <div className={`inline-flex items-center gap-2 ${badgeClass} mb-4`}>
        <CheckCircle className="h-5 w-5" />
        <span className="text-sm font-semibold uppercase tracking-wide">
          Open to Opportunities
        </span>
      </div>
      {recruitmentNote && (
        <p className={`mb-6 max-w-lg italic ${noteClass}`}>&ldquo;{recruitmentNote}&rdquo;</p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        {contactEmail && (
          <Button
            onClick={handleContact}
            className="bg-[#FF3B30] text-white hover:bg-[#FF3B30]/90"
          >
            <Mail className="mr-2 h-4 w-4" />
            Contact Player
          </Button>
        )}
        <Button onClick={handleDownloadStats} variant="outline" className={outlineClass}>
          <FileText className="mr-2 h-4 w-4" />
          Download Stats
        </Button>
      </div>
    </div>
  );
}

