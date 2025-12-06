"use client";

import { Button } from '@/components/ui/Button';
import { Mail, FileText, CheckCircle } from 'lucide-react';

interface PlayerProfileRecruitmentProps {
  recruitmentNote?: string;
  contactEmail?: string;
}

/**
 * PlayerProfileRecruitment - Recruitment CTA section
 * 
 * Dark section with white text
 * Shows when player is open to opportunities
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function PlayerProfileRecruitment({ 
  recruitmentNote, 
  contactEmail 
}: PlayerProfileRecruitmentProps) {
  const handleContact = () => {
    if (contactEmail) {
      window.location.href = `mailto:${contactEmail}`;
    }
  };

  const handleDownloadStats = () => {
    // TODO: Implement PDF download
    alert('Stats PDF download coming soon!');
  };

  return (
    <div className="text-center sm:text-left">
      {/* Status Badge */}
      <div className="inline-flex items-center gap-2 text-green-400 mb-4">
        <CheckCircle className="w-5 h-5" />
        <span className="font-semibold uppercase tracking-wide text-sm">
          Open to Opportunities
        </span>
      </div>

      {/* Note */}
      {recruitmentNote && (
        <p className="text-gray-300 italic mb-6 max-w-lg">
          &ldquo;{recruitmentNote}&rdquo;
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {contactEmail && (
          <Button
            onClick={handleContact}
            className="bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white"
          >
            <Mail className="w-4 h-4 mr-2" />
            Contact Player
          </Button>
        )}
        <Button
          onClick={handleDownloadStats}
          variant="outline"
          className="border-white/30 text-white hover:bg-white/10"
        >
          <FileText className="w-4 h-4 mr-2" />
          Download Stats
        </Button>
      </div>
    </div>
  );
}

