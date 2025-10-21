'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Target, 
  Trophy, 
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PersonalGame, PersonalGameStats } from '@/lib/services/personalGamesService';
import { formatPercentage } from '@/utils/personalStatsCalculations';

interface PersonalGameCardProps {
  game: PersonalGame & { stats: PersonalGameStats };
  isRecent?: boolean;
  onEdit?: (game: PersonalGame) => void;
  onDelete?: (gameId: string) => void;
  onView?: (game: PersonalGame) => void;
}

export function PersonalGameCard({ 
  game, 
  isRecent = false,
  onEdit,
  onDelete,
  onView
}: PersonalGameCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Format game date
  const gameDate = new Date(game.game_date);
  const isToday = gameDate.toDateString() === new Date().toDateString();
  const isYesterday = gameDate.toDateString() === new Date(Date.now() - 86400000).toDateString();
  
  let dateDisplay = gameDate.toLocaleDateString();
  if (isToday) dateDisplay = 'Today';
  else if (isYesterday) dateDisplay = 'Yesterday';

  // Calculate days ago
  const daysAgo = Math.floor((Date.now() - gameDate.getTime()) / (1000 * 60 * 60 * 24));
  const timeAgo = daysAgo === 0 ? 'Today' : 
                  daysAgo === 1 ? 'Yesterday' : 
                  daysAgo < 7 ? `${daysAgo} days ago` :
                  daysAgo < 30 ? `${Math.floor(daysAgo / 7)} weeks ago` :
                  `${Math.floor(daysAgo / 30)} months ago`;

  // Determine card styling based on performance
  const isGreatGame = game.points >= 30 || (game.points >= 20 && game.assists >= 8);
  const isGoodGame = game.points >= 20 || (game.points >= 15 && (game.rebounds >= 8 || game.assists >= 6));

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      isRecent ? 'ring-1 ring-primary/20' : ''
    } ${isGreatGame ? 'bg-gradient-to-r from-orange-50 to-transparent border-orange-200' : 
         isGoodGame ? 'bg-gradient-to-r from-blue-50 to-transparent border-blue-200' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          {/* Left side - Game info */}
          <div className="flex-1 space-y-2">
            {/* Date and badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {dateDisplay}
              </div>
              
              {isRecent && (
                <Badge variant="secondary" className="text-xs">
                  Recent
                </Badge>
              )}
              
              {isGreatGame && (
                <Badge className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                  <Trophy className="w-3 h-3 mr-1" />
                  Great Game
                </Badge>
              )}
              
              {game.is_public && (
                <Badge variant="outline" className="text-xs">
                  Public
                </Badge>
              )}
            </div>

            {/* Location and opponent */}
            <div className="space-y-1">
              {game.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {game.location}
                </div>
              )}
              
              {game.opponent && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-3 h-3" />
                  vs {game.opponent}
                </div>
              )}
            </div>

            {/* Main stat line */}
            <div className="text-lg font-semibold text-primary">
              {game.stats.stat_line}
            </div>

            {/* Shooting stats (if available) */}
            {(game.fg_attempted > 0 || game.three_pt_attempted > 0 || game.ft_attempted > 0) && (
              <div className="flex gap-4 text-sm">
                {game.fg_attempted > 0 && (
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3 text-muted-foreground" />
                    <span>{game.fg_made}/{game.fg_attempted} FG</span>
                    <span className="text-muted-foreground">
                      ({formatPercentage(game.stats.fg_percentage)})
                    </span>
                  </div>
                )}
                
                {game.three_pt_attempted > 0 && (
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-muted-foreground" />
                    <span>{game.three_pt_made}/{game.three_pt_attempted} 3PT</span>
                    <span className="text-muted-foreground">
                      ({formatPercentage(game.stats.three_pt_percentage)})
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Expandable details */}
            {showDetails && (
              <div className="pt-3 border-t space-y-2">
                {/* All stats breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">{game.points}</div>
                    <div className="text-xs text-muted-foreground">PTS</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{game.rebounds}</div>
                    <div className="text-xs text-muted-foreground">REB</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{game.assists}</div>
                    <div className="text-xs text-muted-foreground">AST</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{game.steals + game.blocks}</div>
                    <div className="text-xs text-muted-foreground">STL+BLK</div>
                  </div>
                </div>

                {/* Advanced stats */}
                {game.fg_attempted > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm pt-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Effective FG%</div>
                      <div className="font-medium">{formatPercentage(game.stats.efg_percentage)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total Shots</div>
                      <div className="font-medium">{game.stats.total_shots}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Made Shots</div>
                      <div className="font-medium">{game.stats.made_shots}</div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {game.notes && (
                  <div className="pt-2">
                    <div className="text-xs text-muted-foreground mb-1">Notes:</div>
                    <div className="text-sm bg-muted/50 rounded p-2">
                      {game.notes}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side - Actions and time */}
          <div className="flex flex-col items-end gap-2 ml-4">
            {/* Time ago */}
            <div className="text-xs text-muted-foreground text-right">
              {timeAgo}
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDetails(!showDetails)}>
                  <Eye className="w-4 h-4 mr-2" />
                  {showDetails ? 'Hide Details' : 'View Details'}
                </DropdownMenuItem>
                
                {onView && (
                  <DropdownMenuItem onClick={() => onView(game)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Full View
                  </DropdownMenuItem>
                )}
                
                {onEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(game)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Game
                    </DropdownMenuItem>
                  </>
                )}
                
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(game.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Game
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick toggle for details on mobile */}
        <div className="mt-3 sm:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-xs"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
