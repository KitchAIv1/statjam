"use client";

import { Facebook, Instagram, Twitter } from 'lucide-react';
import { useOrganizerProfile } from '@/hooks/useOrganizerProfile';
import { useTournamentTheme } from '@/contexts/TournamentThemeContext';
import { getTournamentThemeClass } from '@/lib/utils/tournamentThemeClasses';

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
  const { theme } = useTournamentTheme();
  return (
    <footer className={`border-t py-6 sm:py-10 mt-12 ${getTournamentThemeClass('footerBorder', theme)} ${getTournamentThemeClass('footerBg', theme)}`}>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 sm:gap-6 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          {organizerId && organizer ? (
            <>
              <div className={`text-xs uppercase tracking-wide sm:text-sm ${getTournamentThemeClass('footerLabel', theme)}`}>Organizer</div>
              <div className={`mt-1 text-base font-semibold sm:text-lg ${getTournamentThemeClass('footerTitle', theme)}`}>{organizer.name}</div>
              <div className={`text-xs sm:text-sm ${getTournamentThemeClass('footerText', theme)}`}>Tournament Organizer</div>
            </>
          ) : (
            <>
              <div className={`text-xs uppercase tracking-wide sm:text-sm ${getTournamentThemeClass('footerLabel', theme)}`}>StatJam</div>
              <div className={`mt-1 text-base font-semibold sm:text-lg ${getTournamentThemeClass('footerTitle', theme)}`}>Basketball Tournament Platform</div>
              <div className={`text-xs sm:text-sm ${getTournamentThemeClass('footerText', theme)}`}>Real-time stats • Live tracking • Professional analytics</div>
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
              className={getTournamentThemeClass('socialIcon', theme)}
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5 sm:w-6 sm:h-6" />
            </a>
            <a
              href="https://instagram.com/stat.jam"
              target="_blank"
              rel="noopener noreferrer"
              className={getTournamentThemeClass('socialIcon', theme)}
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5 sm:w-6 sm:h-6" />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className={getTournamentThemeClass('socialIcon', theme)}
              aria-label="X (Twitter)"
            >
              <Twitter className="w-5 h-5 sm:w-6 sm:h-6" />
            </a>
          </div>

          {/* Footer Links */}
          <div className={`flex flex-wrap items-center gap-2 text-xs sm:gap-3 sm:text-sm ${getTournamentThemeClass('footerText', theme)}`}>
            <a href="#" className={getTournamentThemeClass('footerLink', theme)}>Privacy</a>
            <span className={`h-4 w-px ${getTournamentThemeClass('footerDivider', theme)}`} />
            <a href="#" className={getTournamentThemeClass('footerLink', theme)}>Terms</a>
            <span className={`h-4 w-px ${getTournamentThemeClass('footerDivider', theme)}`} />
            <a href="#" className={getTournamentThemeClass('footerLink', theme)}>Contact</a>
            <span className={`h-4 w-px ${getTournamentThemeClass('footerDivider', theme)}`} />
            <span>© {new Date().getFullYear()} StatJam</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

