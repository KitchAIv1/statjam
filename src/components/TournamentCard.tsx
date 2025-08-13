import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface Game {
  opponent: string;
  opponentLogo?: string;
  time: string;
  isUpcoming: boolean;
}

interface TournamentCardProps {
  game: Game;
}

export function TournamentCard({ game }: TournamentCardProps) {
  return (
    <div className="flex items-center justify-between p-4 glass-card rounded-lg hover:opacity-80 transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 glass-card rounded-full flex items-center justify-center">
          {game.opponentLogo ? (
            <span className="text-xl">{game.opponentLogo}</span>
          ) : (
            <span className="text-sm text-muted-foreground">VS</span>
          )}
        </div>
        <div>
          <div className="font-semibold text-card-foreground">{game.opponent}</div>
          <div className="text-sm text-muted-foreground">vs Central</div>
        </div>
      </div>
      
      <div className="text-right">
        <Badge 
          variant="secondary" 
          className="bg-gradient-to-r from-primary to-orange-600 text-white text-xs font-bold mb-1 border-0"
        >
          UPCOMING
        </Badge>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="w-3 h-3" />
          {game.time}
        </div>
      </div>
    </div>
  );
}