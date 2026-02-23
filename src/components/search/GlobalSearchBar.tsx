'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { useTournamentTheme } from '@/contexts/TournamentThemeContext';
import { getTournamentThemeClass } from '@/lib/utils/tournamentThemeClasses';
import { Search } from 'lucide-react';

export function GlobalSearchBar() {
  const router = useRouter();
  const { theme } = useTournamentTheme();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownPortalRef = useRef<HTMLDivElement>(null);

  const { results, loading, hasResults } = useGlobalSearch(query);

  const showDropdown = isOpen && query.trim().length >= 2;

  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [showDropdown]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !inputRef.current?.contains(target) &&
        !dropdownPortalRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);


  const handlePlayerClick = (id: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/player/${id}`);
  };

  const handleTeamClick = (teamId: string, tournamentId?: string) => {
    setIsOpen(false);
    setQuery('');
    if (!tournamentId) {
      toast.error('Team not in a public tournament');
      return;
    }
    router.push(`/t/${tournamentId}/team/${teamId}`);
  };

  const handleTournamentClick = (id: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/t/${id}`);
  };

  const handleGameClick = (id: string) => {
    setIsOpen(false);
    setQuery('');
    window.open(`/game-viewer-v3/${id}`, '_blank');
  };

  const handleCoachClick = (id: string) => {
    setIsOpen(false);
    setQuery('');
    console.log('[GlobalSearch] Coach clicked:', id);
  };

  const isEmpty =
    !loading &&
    query.trim().length >= 2 &&
    !results.players.length &&
    !results.teams.length &&
    !results.tournaments.length &&
    !results.games.length &&
    !results.coaches.length;

  const dropdownContent = showDropdown && (
    <div
      ref={dropdownPortalRef}
      style={{
        position: 'fixed',
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        zIndex: 9999,
      }}
      className={`max-h-[400px] overflow-y-auto rounded-lg border shadow-xl ${getTournamentThemeClass('headerBorder', theme)} ${getTournamentThemeClass('headerBg', theme)}`}
    >
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#FF3B30]/30 border-t-[#FF3B30]" />
            </div>
          )}

          {!loading && isEmpty && (
            <div className={`px-4 py-6 text-center text-sm ${getTournamentThemeClass('inputPlaceholder', theme)}`}>
              No results found for &quot;{query}&quot;
            </div>
          )}

          {!loading && hasResults && (
            <div className="py-2">
              {results.players.length > 0 && (
                <div className="px-3 pb-2">
                  <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${getTournamentThemeClass('inputIcon', theme)}`}>
                    Players
                  </p>
                  {results.players.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePlayerClick(p.id)}
                      className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition ${getTournamentThemeClass('rowHover', theme)} ${getTournamentThemeClass('pageText', theme)}`}
                    >
                      {p.photo ? (
                        <Image src={p.photo} alt="" width={32} height={32} className="rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF3B30]/20 text-sm font-semibold text-[#FF3B30]">
                          {(p.name || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.teams.length > 0 && (
                <div className={`border-t ${getTournamentThemeClass('border', theme)} px-3 py-2`}>
                  <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${getTournamentThemeClass('inputIcon', theme)}`}>
                    Teams
                  </p>
                  {results.teams.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTeamClick(t.id, t.tournamentId)}
                      className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition ${getTournamentThemeClass('rowHover', theme)} ${getTournamentThemeClass('pageText', theme)}`}
                    >
                      {t.logo ? (
                        <Image src={t.logo} alt="" width={32} height={32} className="rounded object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-[#FF3B30]/20 text-sm font-semibold text-[#FF3B30]">
                          {(t.name || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.tournaments.length > 0 && (
                <div className={`border-t ${getTournamentThemeClass('border', theme)} px-3 py-2`}>
                  <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${getTournamentThemeClass('inputIcon', theme)}`}>
                    Tournaments
                  </p>
                  {results.tournaments.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTournamentClick(t.id)}
                      className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition ${getTournamentThemeClass('rowHover', theme)} ${getTournamentThemeClass('pageText', theme)}`}
                    >
                      {t.logo ? (
                        <Image src={t.logo} alt="" width={32} height={32} className="rounded object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-[#FF3B30]/20 text-sm font-semibold text-[#FF3B30]">
                          {(t.name || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.games.length > 0 && (
                <div className={`border-t ${getTournamentThemeClass('border', theme)} px-3 py-2`}>
                  <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${getTournamentThemeClass('inputIcon', theme)}`}>
                    Games
                  </p>
                  {results.games.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleGameClick(g.id)}
                      className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition ${getTournamentThemeClass('rowHover', theme)} ${getTournamentThemeClass('pageText', theme)}`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-[#FF3B30]/20 text-xs font-semibold text-[#FF3B30]">
                        vs
                      </div>
                      <span className="truncate">
                        {g.teamAName} vs {g.teamBName}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.coaches.length > 0 && (
                <div className={`border-t ${getTournamentThemeClass('border', theme)} px-3 py-2`}>
                  <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${getTournamentThemeClass('inputIcon', theme)}`}>
                    Coaches
                  </p>
                  {results.coaches.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleCoachClick(c.id)}
                      className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition ${getTournamentThemeClass('rowHover', theme)} ${getTournamentThemeClass('pageText', theme)}`}
                    >
                      {c.photo ? (
                        <Image src={c.photo} alt="" width={32} height={32} className="rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF3B30]/20 text-sm font-semibold text-[#FF3B30]">
                          {(c.name || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
    </div>
  );

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          placeholder="Search Teams, Tournaments, Players..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={`w-full rounded-full border px-4 py-2 pl-10 text-sm focus:border-[#FF3B30]/50 focus:outline-none focus:ring-1 focus:ring-[#FF3B30]/30 ${getTournamentThemeClass('inputBorder', theme)} ${getTournamentThemeClass('inputBg', theme)} ${getTournamentThemeClass('inputText', theme)} ${getTournamentThemeClass('inputPlaceholder', theme)}`}
        />
        <Search
          className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${getTournamentThemeClass('inputIcon', theme)}`}
        />
      </div>
      {typeof window !== 'undefined' && dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
}
