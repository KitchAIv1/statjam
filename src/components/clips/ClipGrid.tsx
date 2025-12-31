'use client';

import React, { useState } from 'react';
import { 
  Film, 
  Play, 
  Clock, 
  Filter, 
  ChevronDown,
  Target,
  Zap,
  Shield,
  Trophy,
  Hand,
  CircleDot
} from 'lucide-react';
import { GeneratedClip } from '@/lib/services/clipService';
import { ClipPlayer } from './ClipPlayer';

interface Player {
  id: string;
  name: string;
  jersey_number?: number;
}

interface ClipGridProps {
  clips: GeneratedClip[];
  players?: Player[];
  playerName?: string;
}

type StatTypeFilter = 'all' | 'field_goal' | 'three_pointer' | 'rebound' | 'assist' | 'steal' | 'block' | 'free_throw';

// Stat type configuration with icons and colors
const STAT_CONFIG: Record<string, { label: string; shortLabel: string; icon: React.ElementType; color: string; bgColor: string }> = {
  field_goal: { label: 'Field Goal', shortLabel: '2PT', icon: Target, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  three_pointer: { label: '3-Pointer', shortLabel: '3PT', icon: Trophy, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  rebound: { label: 'Rebound', shortLabel: 'REB', icon: Shield, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  assist: { label: 'Assist', shortLabel: 'AST', icon: Zap, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  steal: { label: 'Steal', shortLabel: 'STL', icon: Hand, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  block: { label: 'Block', shortLabel: 'BLK', icon: Shield, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  free_throw: { label: 'Free Throw', shortLabel: 'FT', icon: CircleDot, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
};

/**
 * Grid display of clips with filtering and playback
 * Enhanced with player names, game clock, and stat icons
 */
export function ClipGrid({ clips, players = [], playerName }: ClipGridProps) {
  const [filter, setFilter] = useState<StatTypeFilter>('all');
  const [playerFilter, setPlayerFilter] = useState<string>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showPlayerMenu, setShowPlayerMenu] = useState(false);
  const [activeClip, setActiveClip] = useState<GeneratedClip | null>(null);

  // Create player lookup map
  const playerMap = new Map(players.map(p => [p.id, p]));

  // Get players who have clips (for filter dropdown)
  const playersWithClips = players.filter(player => 
    clips.some(clip => 
      (clip.custom_player_id === player.id) || (clip.player_id === player.id)
    )
  );

  // Get player name for a clip
  const getPlayerName = (clip: GeneratedClip): string | null => {
    const playerId = clip.custom_player_id || clip.player_id;
    if (!playerId) return null;
    const player = playerMap.get(playerId);
    return player ? player.name : null;
  };

  // Get player jersey number
  const getPlayerJersey = (clip: GeneratedClip): number | null => {
    const playerId = clip.custom_player_id || clip.player_id;
    if (!playerId) return null;
    const player = playerMap.get(playerId);
    return player?.jersey_number ?? null;
  };

  // Filter clips by stat type and player
  const filteredClips = clips.filter(clip => {
    // Stat type filter
    const passesStatFilter = filter === 'all' || clip.stat_type === filter;
    
    // Player filter
    const clipPlayerId = clip.custom_player_id || clip.player_id;
    const passesPlayerFilter = playerFilter === 'all' || clipPlayerId === playerFilter;
    
    return passesStatFilter && passesPlayerFilter;
  });

  // Stat type labels for filter
  const statTypeLabels: Record<StatTypeFilter, string> = {
    all: 'All Clips',
    field_goal: '2-Pointers',
    three_pointer: '3-Pointers',
    rebound: 'Rebounds',
    assist: 'Assists',
    steal: 'Steals',
    block: 'Blocks',
    free_throw: 'Free Throws',
  };

  // Get stat type counts - stat_type is stored directly
  const statCounts = clips.reduce((acc, clip) => {
    acc[clip.stat_type] = (acc[clip.stat_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Format clip stat type for display - stat_type is stored directly
  const getStatDisplay = (clip: GeneratedClip) => {
    const statKey = clip.stat_type;
    
    const config = STAT_CONFIG[statKey] || { 
      label: clip.stat_type, 
      shortLabel: clip.stat_type.toUpperCase().slice(0, 3),
      icon: Film,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20'
    };

    // Add modifier for rebounds
    if (clip.stat_type === 'rebound') {
      config.shortLabel = clip.stat_modifier === 'offensive' ? 'OREB' : 'DREB';
    }

    return config;
  };

  // Format game clock
  const formatGameClock = (clip: GeneratedClip): string => {
    const mins = clip.game_clock_minutes;
    const secs = clip.game_clock_seconds.toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Format clip title for modal
  const formatClipTitle = (clip: GeneratedClip): string => {
    const stat = getStatDisplay(clip);
    const playerDisplay = getPlayerName(clip);
    const jersey = getPlayerJersey(clip);
    
    let title = `Q${clip.quarter} ${stat.shortLabel}`;
    if (playerDisplay) {
      title = jersey ? `#${jersey} ${playerDisplay} - ${title}` : `${playerDisplay} - ${title}`;
    }
    return title;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Film className="w-5 h-5 text-orange-500" />
          <div>
            <h3 className="font-semibold text-gray-900">
              {playerName ? `${playerName}'s Clips` : 'Game Clips'}
            </h3>
            <p className="text-sm text-gray-500">
              {filteredClips.length === clips.length 
                ? `${clips.length} total clips` 
                : `${filteredClips.length} of ${clips.length} clips`}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Player Filter Dropdown */}
          {playersWithClips.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowPlayerMenu(!showPlayerMenu);
                  setShowFilterMenu(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors ${
                  playerFilter !== 'all' ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-gray-200'
                }`}
              >
                <span className="truncate max-w-[120px]">
                  {playerFilter === 'all' 
                    ? 'All Players' 
                    : playerMap.get(playerFilter)?.name || 'Player'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
              </button>

              {showPlayerMenu && (
                <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => {
                      setPlayerFilter('all');
                      setShowPlayerMenu(false);
                    }}
                    className={`
                      w-full px-3 py-2 text-left text-sm flex items-center justify-between
                      hover:bg-gray-50 rounded-t-lg
                      ${playerFilter === 'all' ? 'bg-purple-50 text-purple-600' : 'text-gray-700'}
                    `}
                  >
                    <span>All Players</span>
                    <span className="text-xs text-gray-400">{clips.length}</span>
                  </button>
                  {playersWithClips.map((player) => {
                    const playerClipCount = clips.filter(c => 
                      c.custom_player_id === player.id || c.player_id === player.id
                    ).length;
                    
                    return (
                      <button
                        key={player.id}
                        onClick={() => {
                          setPlayerFilter(player.id);
                          setShowPlayerMenu(false);
                        }}
                        className={`
                          w-full px-3 py-2 text-left text-sm flex items-center justify-between
                          hover:bg-gray-50 last:rounded-b-lg
                          ${playerFilter === player.id ? 'bg-purple-50 text-purple-600' : 'text-gray-700'}
                        `}
                      >
                        <span className="flex items-center gap-2">
                          {player.jersey_number && (
                            <span className="text-xs text-gray-400">#{player.jersey_number}</span>
                          )}
                          <span className="truncate">{player.name}</span>
                        </span>
                        <span className="text-xs text-gray-400">{playerClipCount}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Stat Type Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowFilterMenu(!showFilterMenu);
                setShowPlayerMenu(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors ${
                filter !== 'all' ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-gray-200'
              }`}
            >
              <Filter className="w-4 h-4 text-gray-500" />
              <span>{statTypeLabels[filter]}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {(Object.keys(statTypeLabels) as StatTypeFilter[]).map((key) => {
                  const count = key === 'all' ? clips.length : (statCounts[key] || 0);
                  if (key !== 'all' && count === 0) return null;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setFilter(key);
                        setShowFilterMenu(false);
                      }}
                      className={`
                        w-full px-3 py-2 text-left text-sm flex items-center justify-between
                        hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg
                        ${filter === key ? 'bg-orange-50 text-orange-600' : 'text-gray-700'}
                      `}
                    >
                      <span>{statTypeLabels[key]}</span>
                      <span className="text-xs text-gray-400">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clips Grid */}
      {filteredClips.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Film className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No clips available</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredClips.map((clip) => {
            const stat = getStatDisplay(clip);
            const StatIcon = stat.icon;
            const clipPlayerName = getPlayerName(clip);
            const jersey = getPlayerJersey(clip);

            return (
              <button
                key={clip.id}
                onClick={() => setActiveClip(clip)}
                className="group relative bg-gray-900 rounded-xl overflow-hidden aspect-video hover:ring-2 hover:ring-orange-500 transition-all shadow-lg"
              >
                {/* Background gradient based on stat type */}
                <div className={`absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950`} />
                
                {/* Stat Type Badge - Top Left */}
                <div className="absolute top-2 left-2 z-10">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${stat.bgColor}`}>
                    <StatIcon className={`w-3 h-3 ${stat.color}`} />
                    <span className={`text-[10px] font-bold ${stat.color}`}>
                      {stat.shortLabel}
                    </span>
                  </div>
                </div>

                {/* Quarter & Game Clock - Top Right */}
                <div className="absolute top-2 right-2 z-10">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                    <span className="text-[10px] font-medium text-white">
                      Q{clip.quarter}
                    </span>
                    <span className="text-[10px] text-white/60">•</span>
                    <Clock className="w-2.5 h-2.5 text-white/60" />
                    <span className="text-[10px] text-white/80">
                      {formatGameClock(clip)}
                    </span>
                  </div>
                </div>
                
                {/* Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-orange-500/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  </div>
                </div>

                {/* Player Info - Bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3">
                  {clipPlayerName ? (
                    <div className="flex items-center gap-2">
                      {jersey && (
                        <span className="text-xs font-bold text-orange-400">
                          #{jersey}
                        </span>
                      )}
                      <span className="text-xs font-medium text-white truncate">
                        {clipPlayerName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-white/60">Unknown Player</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Clip Player Modal */}
      {activeClip && activeClip.bunny_clip_url && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveClip(null);
          }}
        >
          <div className="max-w-4xl w-full">
            <ClipPlayer
              clipUrl={activeClip.bunny_clip_url}
              title={formatClipTitle(activeClip)}
              onClose={() => setActiveClip(null)}
              autoPlay
            />
          </div>
        </div>
      )}
    </div>
  );
}
