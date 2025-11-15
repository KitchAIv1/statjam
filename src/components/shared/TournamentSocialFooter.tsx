"use client";

import { Facebook, Instagram, Twitter } from 'lucide-react';
import { useOrganizerProfile } from '@/hooks/useOrganizerProfile';

interface TournamentSocialFooterProps {
  organizerId?: string | null;
}

/**
 * TournamentSocialFooter - Footer component with social links for tournaments page
 * 
 * Purpose: Display StatJam platform social links in footer with optional organizer info
 * Follows .cursorrules: <200 lines, single responsibility, mobile responsive
 */
export function TournamentSocialFooter({ organizerId }: TournamentSocialFooterProps = {}) {
  const { organizer } = useOrganizerProfile(organizerId || null);
  return (
    <footer className="border-t border-white/10 bg-[#121212] py-6 sm:py-10 mt-12">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 sm:gap-6 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          {organizerId && organizer ? (
            <>
              <div className="text-xs uppercase tracking-wide text-white/40 sm:text-sm">Organizer</div>
              <div className="mt-1 text-base font-semibold text-white/90 sm:text-lg">{organizer.name}</div>
              <div className="text-xs text-[#B3B3B3] sm:text-sm">Tournament Organizer</div>
            </>
          ) : (
            <>
              <div className="text-xs uppercase tracking-wide text-white/40 sm:text-sm">StatJam</div>
              <div className="mt-1 text-base font-semibold text-white/90 sm:text-lg">Basketball Tournament Platform</div>
              <div className="text-xs text-[#B3B3B3] sm:text-sm">Real-time stats • Live tracking • Professional analytics</div>
            </>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.facebook.com/people/Statjam/61583861420167/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-[#FF3B30] transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5 sm:w-6 sm:h-6" />
            </a>
            <a
              href="https://instagram.com/stat.jam"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-[#FF3B30] transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5 sm:w-6 sm:h-6" />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-[#FF3B30] transition-colors"
              aria-label="X (Twitter)"
            >
              <Twitter className="w-5 h-5 sm:w-6 sm:h-6" />
            </a>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#B3B3B3] sm:gap-3 sm:text-sm">
            <a href="#" className="transition hover:text-white">Privacy</a>
            <span className="h-4 w-px bg-white/20" />
            <a href="#" className="transition hover:text-white">Terms</a>
            <span className="h-4 w-px bg-white/20" />
            <a href="#" className="transition hover:text-white">Contact</a>
            <span className="h-4 w-px bg-white/20" />
            <span>© {new Date().getFullYear()} StatJam</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

