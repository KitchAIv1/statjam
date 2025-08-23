import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { UserPlus, Eye, Settings, CalendarDays } from "lucide-react";
import { Tournament } from "@/lib/types/tournament";
import { useTournamentTeamCount } from "@/hooks/useTournamentTeamCount";
import { useTournamentGameStatus } from "@/hooks/useTournamentGameStatus";

interface TournamentTableRowProps {
  tournament: Tournament;
  onManageTeams: (tournament: Tournament) => void;
  onManageSchedule: (tournament: Tournament) => void;
  onOpenSettings: (tournament: Tournament) => void;
}

function getStatusVariant(status: Tournament['status']) {
  switch (status) {
    case 'active':
      return 'default';
    case 'completed':
      return 'secondary';
    case 'draft':
      return 'outline';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function TournamentTableRow({ tournament, onManageTeams, onManageSchedule, onOpenSettings }: TournamentTableRowProps) {
  const { currentTeams, maxTeams, loading: teamCountLoading } = useTournamentTeamCount(tournament.id, {
    maxTeams: tournament.maxTeams
  });
  
  const { hasGames, gameCount, loading: gameStatusLoading } = useTournamentGameStatus(tournament.id);

  return (
    <TableRow>
      <TableCell className="font-medium">{tournament.name}</TableCell>
      <TableCell>{tournament.tournamentType}</TableCell>
      <TableCell>
        {teamCountLoading ? (
          <span className="animate-pulse">...</span>
        ) : (
          `${currentTeams}/${maxTeams}`
        )}
      </TableCell>
      <TableCell>
        {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <Badge variant={getStatusVariant(tournament.status)}>
          {tournament.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => onManageTeams(tournament)}
            title="Manage Teams"
          >
            <UserPlus className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant={hasGames ? "default" : "ghost"}
            onClick={() => onManageSchedule(tournament)}
            title={hasGames ? `View Schedule (${gameCount} games)` : "Create Schedule"}
            disabled={gameStatusLoading}
            className={hasGames ? "bg-green-600 hover:bg-green-700 text-white" : ""}
          >
            <CalendarDays className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => onOpenSettings(tournament)}
            title="Tournament Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
