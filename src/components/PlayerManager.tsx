import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, UserPlus, Trash2, Search, Filter, Calendar, Hash, Edit, CheckCircle, Loader2, AlertCircle, Check } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Team as TeamType, Player } from "@/lib/types/tournament";
import { TeamService } from "@/lib/services/tournamentService";

interface PlayerManagerProps {
  team: TeamType | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTeam?: () => void;
}

export function PlayerManager({ team, isOpen, onClose, onUpdateTeam }: PlayerManagerProps) {
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingPlayerId, setAddingPlayerId] = useState<string | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Multi-select state for batch player addition
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Available roster players (not in team)
  const [rosterPlayers, setRosterPlayers] = useState<Player[]>([]);
  const [showRosterDialog, setShowRosterDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");
  const [skillFilter, setSkillFilter] = useState("All");

  const positions = ["All", "PG", "SG", "SF", "PF", "C"];
  const skillLevels = ["All", "Beginner", "Intermediate", "Advanced", "Professional"];

  // Player editing state
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    position: "",
    jerseyNumber: "",
    age: "",
    height: "",
    status: "Active" as const
  });

  // Load team players when modal opens
  useEffect(() => {
    if (team && isOpen) {
      setTeamPlayers(team.players || []);
      // Reset states when opening
      setError(null);
      setAddingPlayerId(null);
      setRecentlyAdded(new Set());
      setSuccessMessage(null);
    }
  }, [team, isOpen]);

  // Load roster players when team players change
  useEffect(() => {
    if (isOpen && team) {
      loadRosterPlayers();
    }
  }, [teamPlayers.length, isOpen, team]);

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setPositionFilter("All");
      setError(null);
      setAddingPlayerId(null);
      setRecentlyAdded(new Set());
      setSuccessMessage(null);
      setSelectedPlayers(new Set());
      setIsAddingBatch(false);
      setShowConfirmation(false);
    }
  }, [isOpen]);

  const loadRosterPlayers = async () => {
    try {
      setLoading(true);
      const allPlayers = await TeamService.getAllPlayers();
      
      // Get all players already assigned to ANY team in this tournament
      let allAssignedPlayerIds: string[] = [];
      if (team?.tournamentId) {
        try {
          const tournamentTeams = await TeamService.getTeamsByTournament(team.tournamentId);
          allAssignedPlayerIds = tournamentTeams.flatMap(t => t.players?.map(p => p.id) || []);
        } catch (error) {
          console.warn('Could not fetch tournament teams, falling back to current team only:', error);
          allAssignedPlayerIds = [...teamPlayers.map(p => p.id), ...(team?.players?.map(p => p.id) || [])];
        }
      } else {
        // Fallback: only exclude current team players
        allAssignedPlayerIds = [...teamPlayers.map(p => p.id), ...(team?.players?.map(p => p.id) || [])];
      }
      
      // Remove duplicates and filter out ALL assigned players in the tournament
      const availablePlayers = allPlayers.filter((player, index, self) => 
        index === self.findIndex(p => p.id === player.id) && 
        !allAssignedPlayerIds.includes(player.id)
      );
      
      console.log(`🔍 PlayerManager: Filtered ${allPlayers.length} total players to ${availablePlayers.length} available players`);
      console.log(`🔍 PlayerManager: Excluded ${allAssignedPlayerIds.length} already assigned players from tournament`);
      
      setRosterPlayers(availablePlayers);
    } catch (error) {
      console.error('Error loading roster players:', error);
      setError('Failed to load roster players');
    } finally {
      setLoading(false);
    }
  };

  const filteredRosterPlayers = rosterPlayers.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === "All" || player.position === positionFilter;
    return matchesSearch && matchesPosition;
  });

  const handleAddPlayerToTeam = async (rosterPlayer: Player) => {
    if (!team) return;

    // Prevent duplicate additions
    if (addingPlayerId === rosterPlayer.id || recentlyAdded.has(rosterPlayer.id)) {
      return;
    }

    // Check if player is already in team (using same robust logic as working implementation)
    const isPlayerAlreadyInTeam = teamPlayers.some(p => p.id === rosterPlayer.id);
    if (isPlayerAlreadyInTeam) {
      const playerDisplayName = rosterPlayer.name || rosterPlayer.email?.split('@')[0] || 'Player';
      setError(`${playerDisplayName} is already in this team`);
      return;
    }

    // Set loading state for this specific player
    setAddingPlayerId(rosterPlayer.id);
    setError(null);

    try {
      // Generate jersey number BEFORE database operation (like working implementation)
      const usedNumbers = teamPlayers.map(p => p.jerseyNumber);
      let jerseyNumber = 1;
      while (usedNumbers.includes(jerseyNumber) && jerseyNumber <= 99) {
        jerseyNumber++;
      }
      
      // Actually persist to database first to avoid duplicates - using same pattern as working implementation
      await TeamService.addPlayerToTeam(
        team.id, 
        rosterPlayer.id,
        rosterPlayer.position,     // ✅ Add position parameter
        jerseyNumber              // ✅ Add jersey number parameter
      );

      const newPlayer: Player = {
        ...rosterPlayer,
        jerseyNumber,
        inTeam: true
      };

      // Update UI after successful DB operation
      setTeamPlayers(prev => [...prev, newPlayer]);
      setRosterPlayers(prev => prev.filter(p => p.id !== rosterPlayer.id));
      
      // Add to recently added set for visual feedback
      setRecentlyAdded(prev => new Set([...prev, rosterPlayer.id]));
      
      // Show success message
      const playerDisplayName = rosterPlayer.name || rosterPlayer.email?.split('@')[0] || 'Player';
      setSuccessMessage(`${playerDisplayName} added to team! Jersey #${jerseyNumber} assigned`);
      
      // Update parent component
      onUpdateTeam?.();
      
      // Clear recently added and success message after 3 seconds
      setTimeout(() => {
        setRecentlyAdded(prev => {
          const newSet = new Set(prev);
          newSet.delete(rosterPlayer.id);
          return newSet;
        });
        setSuccessMessage(null);
      }, 3000);
      
      // DON'T close the dialog - let user continue adding players
      
    } catch (error) {
      console.error('Error adding player to team:', error);
      
      // Handle specific error cases
      if (error instanceof Error && error.message.includes('duplicate key')) {
        setError(`${rosterPlayer.name} is already in this team`);
      } else {
        setError(`Failed to add ${rosterPlayer.name}. Please try again.`);
      }
    } finally {
      setAddingPlayerId(null);
    }
  };

  const handleRemovePlayerFromTeam = async (playerId: string) => {
    if (!team) return;

    const playerToRemove = teamPlayers.find(p => p.id === playerId);
    if (!playerToRemove) return;

    try {
      // Optimistic update
      setTeamPlayers(teamPlayers.filter(p => p.id !== playerId));
      setRosterPlayers([...rosterPlayers, { ...playerToRemove, inTeam: false }]);
      
      // Actually persist to database
      await TeamService.removePlayerFromTeam(team.id, playerId);
      
      // Show success message
      setSuccessMessage(`${playerToRemove.name} removed from team`);
      
      onUpdateTeam?.();
    } catch (error) {
      console.error('Error removing player from team:', error);
      
      // Revert optimistic update on error
      setTeamPlayers([...teamPlayers, playerToRemove]);
      setRosterPlayers(rosterPlayers.filter(p => p.id !== playerId));
      
      setError(`Failed to remove ${playerToRemove.name}. Please try again.`);
    }
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setNewPlayer({
      name: player.name, // Read-only, cannot be edited
      position: player.position,
      jerseyNumber: player.jerseyNumber.toString(),
      age: "",
      height: "",
      status: "Active"
    });
    setIsAddPlayerOpen(true);
  };

  const handleUpdatePlayer = async () => {
    if (!editingPlayer || !newPlayer.position || !newPlayer.jerseyNumber) return;

    try {
      setLoading(true);
      
      const updatedPlayer: Player = {
        ...editingPlayer,
        name: newPlayer.name,
        position: newPlayer.position as Player['position'],
        jerseyNumber: parseInt(newPlayer.jerseyNumber),
      };

      // Update the player in the database (name is not editable as it's an independent profile)
      const success = await TeamService.updatePlayer(editingPlayer.id, {
        position: updatedPlayer.position,
        jerseyNumber: updatedPlayer.jerseyNumber
      });

      if (!success) {
        throw new Error('Failed to update player in database');
      }

      // Update local state after successful database update
      setTeamPlayers(teamPlayers.map(p => p.id === editingPlayer.id ? updatedPlayer : p));
      
      setNewPlayer({
        name: "",
        position: "",
        jerseyNumber: "",
        age: "",
        height: "",
        status: "Active"
      });
      setEditingPlayer(null);
      setIsAddPlayerOpen(false);
      onUpdateTeam?.();
      
      setSuccessMessage(`✅ ${updatedPlayer.name}'s position and jersey number updated successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      console.log('✅ Player updated successfully:', updatedPlayer.name);
    } catch (error) {
      console.error('Error updating player:', error);
      setError(`Failed to update player: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Revert local state changes on error
      setTeamPlayers(teamPlayers.map(p => p.id === editingPlayer.id ? editingPlayer : p));
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    const safeName = name || 'Unknown Player';
    return safeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Multi-select handlers
  const handlePlayerSelection = (playerId: string, isSelected: boolean) => {
    setSelectedPlayers(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(playerId);
      } else {
        newSet.delete(playerId);
      }
      return newSet;
    });
  };

  const handleBatchAddPlayers = async () => {
    if (!team || selectedPlayers.size === 0) return;

    setIsAddingBatch(true);
    setError(null);

    try {
      const selectedPlayerObjects = filteredRosterPlayers.filter(p => selectedPlayers.has(p.id));
      const results = { success: 0, failed: 0, errors: [] as string[] };
      
      // Pre-allocate jersey numbers for the entire batch to prevent conflicts
      const currentUsedNumbers = teamPlayers.map(p => p.jerseyNumber);
      const batchJerseyNumbers: { [playerId: string]: number } = {};
      let nextJerseyNumber = 1;
      
      for (const player of selectedPlayerObjects) {
        // Find next available jersey number across current team + batch
        while (currentUsedNumbers.includes(nextJerseyNumber) || 
               Object.values(batchJerseyNumbers).includes(nextJerseyNumber)) {
          nextJerseyNumber++;
          if (nextJerseyNumber > 99) {
            nextJerseyNumber = 1; // Wrap around if needed
          }
        }
        batchJerseyNumbers[player.id] = nextJerseyNumber;
        nextJerseyNumber++;
      }

      // Process each selected player with pre-allocated jersey numbers
      for (const player of selectedPlayerObjects) {
        try {
          // Check if player is already in team
          if (teamPlayers.some(p => p.id === player.id)) {
            results.failed++;
            results.errors.push(`${player.name || player.email?.split('@')[0] || 'Player'} is already in this team`);
            continue;
          }

          // Use pre-allocated jersey number
          const jerseyNumber = batchJerseyNumbers[player.id];

          // Add player to database
          await TeamService.addPlayerToTeam(
            team.id,
            player.id,
            player.position,
            jerseyNumber
          );

          // Update local state
          const newPlayer: Player = {
            ...player,
            jerseyNumber,
            inTeam: true
          };

          setTeamPlayers(prev => [...prev, newPlayer]);
          setRosterPlayers(prev => prev.filter(p => p.id !== player.id));
          setRecentlyAdded(prev => new Set([...prev, player.id]));

          results.success++;
        } catch (error) {
          results.failed++;
          const playerName = player.name || player.email?.split('@')[0] || 'Player';
          results.errors.push(`Failed to add ${playerName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Show summary
      if (results.success > 0) {
        setSuccessMessage(`${results.success} player${results.success > 1 ? 's' : ''} added successfully${results.failed > 0 ? `, ${results.failed} failed` : ''}`);
        onUpdateTeam?.();
      }

      if (results.failed > 0) {
        setError(`Some players failed to add: ${results.errors.slice(0, 3).join(', ')}${results.errors.length > 3 ? '...' : ''}`);
      }

      // Clear selection and close confirmation
      setSelectedPlayers(new Set());
      setShowConfirmation(false);

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

    } catch (error) {
      console.error('Error in batch add:', error);
      setError('Failed to add selected players. Please try again.');
    } finally {
      setIsAddingBatch(false);
    }
  };

  if (!team) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="truncate">{team.name} - Player Management</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              Manage players for {team.name}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-4 h-4" />
                <p className="text-sm font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {/* Player Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <Card className="border-0 overflow-hidden">
                <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
                  <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="text-xs sm:text-sm text-white/90">Total Players</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="text-lg sm:text-2xl font-bold transition-all duration-300">{teamPlayers.length}</div>
                    <p className="text-xs text-white/80">
                      {teamPlayers.length >= 5 ? 'Ready to play' : `Need ${5 - teamPlayers.length} more`}
                    </p>
                  </CardContent>
                </div>
              </Card>
              
              <Card className="border-0 overflow-hidden">
                <div className={`bg-gradient-to-br transition-all duration-300 ${
                  teamPlayers.length >= 5 ? 'from-green-500 to-green-600' : 'from-orange-500 to-orange-600'
                } text-white relative`}>
                  {teamPlayers.length < 5 && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  )}
                  <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="text-xs sm:text-sm text-white/90">Roster Status</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="text-sm font-bold flex items-center gap-2">
                      {teamPlayers.length >= 5 ? (
                        <>
                          <span className="text-lg">✓</span>
                          Ready to Play
                        </>
                      ) : (
                        <>
                          <span className="text-lg">⚠</span>
                          Need {5 - teamPlayers.length} More
                        </>
                      )}
                    </div>
                    <p className="text-xs text-white/80">
                      Min 5 players required
                    </p>
                  </CardContent>
                </div>
              </Card>
              
              <Card className="border-0 overflow-hidden">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="text-xs sm:text-sm text-white/90">Available</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="text-lg sm:text-2xl font-bold">{rosterPlayers.length}</div>
                    <p className="text-xs text-white/80">In roster</p>
                  </CardContent>
                </div>
              </Card>
              
              <Card className="border-0 overflow-hidden">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="text-xs sm:text-sm text-white/90">Positions</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="text-lg sm:text-2xl font-bold">
                      {new Set(teamPlayers.map(p => p.position)).size}
                    </div>
                    <p className="text-xs text-white/80">Covered</p>
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* Add Player Button */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
              <h3 className="text-base sm:text-lg font-semibold">Team Roster</h3>
              <Button 
                onClick={() => setShowRosterDialog(true)}
                className="gap-2 w-full sm:w-auto"
                size="sm"
                disabled={loading}
              >
                <UserPlus className="w-4 h-4" />
                Add from Roster
              </Button>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {teamPlayers.map((player) => (
                <Card key={player.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-primary/20">
                  <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="relative flex-shrink-0">
                          <Avatar className="border-2 border-primary/20 w-8 h-8 sm:w-10 sm:h-10">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-xs sm:text-sm">
                              {getInitials(player.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-xs font-bold text-white">{player.jerseyNumber}</span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold group-hover:text-primary transition-colors text-sm sm:text-base truncate">
                            {player.name || player.email?.split('@')[0] || 'Unknown Player'}
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{player.position || 'No Position'}</p>
                        </div>
                      </div>
                      <Badge variant="default" className="flex-shrink-0 text-xs">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="flex gap-1 pt-2 border-t border-border/50">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="hover:bg-primary/10 hover:text-primary h-8 flex-1"
                        onClick={() => handleEditPlayer(player)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0 flex-shrink-0"
                        onClick={() => handleRemovePlayerFromTeam(player.id)}
                        disabled={addingPlayerId !== null}
                        title="Remove player from team"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {teamPlayers.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Players Yet</h3>
                <p className="text-muted-foreground mb-4">
                  This team doesn't have any players yet. Add your first player to get started.
                </p>
                <Button onClick={() => setShowRosterDialog(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add First Player
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Player Dialog */}
      <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingPlayer ? 'Edit Player' : 'Add New Player'}
            </DialogTitle>
            <DialogDescription>
              {editingPlayer ? 'Update player information' : 'Add a new player to the team roster'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="playerName">Player Name (Profile Name - Not Editable)</Label>
              <Input
                id="playerName"
                value={newPlayer.name}
                readOnly
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
                placeholder="Player profile name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="position">Position</Label>
              <Select value={newPlayer.position} onValueChange={(value) => setNewPlayer({ ...newPlayer, position: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.filter(p => p !== "All").map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jerseyNumber">Jersey Number</Label>
              <Input
                id="jerseyNumber"
                type="number"
                value={newPlayer.jerseyNumber}
                onChange={(e) => setNewPlayer({ ...newPlayer, jerseyNumber: e.target.value })}
                placeholder="23"
                min="0"
                max="99"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsAddPlayerOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={editingPlayer ? handleUpdatePlayer : handleUpdatePlayer}
              className="flex-1"
              disabled={loading}
            >
              {editingPlayer ? 'Update Player' : 'Add Player'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Roster Dialog */}
      <Dialog open={showRosterDialog} onOpenChange={setShowRosterDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base sm:text-lg">Add Players to {team?.name}</DialogTitle>
            <DialogDescription className="text-sm">
              Current team size: <span className="font-medium text-primary">{teamPlayers.length} players</span>
              {teamPlayers.length < 5 && (
                <span className="text-orange-600 font-medium ml-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                  Need {5 - teamPlayers.length} more for minimum roster
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Success Alert for Recent Additions */}
            {recentlyAdded.size > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {recentlyAdded.size} player{recentlyAdded.size > 1 ? 's' : ''} added successfully!
                  </span>
                </div>
              </div>
            )}

            {/* Selection Summary */}
            {selectedPlayers.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-800">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {selectedPlayers.size} player{selectedPlayers.size > 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedPlayers(new Set())}
                      className="text-xs h-8"
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowConfirmation(true)}
                      className="text-xs h-8"
                    >
                      Add Selected
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {filteredRosterPlayers.map((player) => (
                <Card 
                  key={player.id} 
                  className={`border transition-all duration-200 ${
                    selectedPlayers.has(player.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border/50 hover:border-primary/20'
                  }`}
                >
                  <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        {/* Checkbox */}
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedPlayers.has(player.id)}
                            onChange={(e) => handlePlayerSelection(player.id, e.target.checked)}
                            className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                            disabled={recentlyAdded.has(player.id)}
                          />
                        </div>
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {getInitials(player.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm sm:text-base truncate">
                            {player.name || player.email?.split('@')[0] || 'Unknown Player'}
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{player.position || 'No Position'}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0 text-xs">
                        {player.isPremium ? 'Premium' : 'Regular'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 px-3 sm:px-6 pb-3 sm:pb-6">
                    <Button 
                      size="sm" 
                      variant={recentlyAdded.has(player.id) ? "default" : "ghost"}
                      className={`w-full gap-2 text-xs sm:text-sm h-8 sm:h-9 transition-all duration-300 ${
                        recentlyAdded.has(player.id) ? 'bg-green-600 hover:bg-green-700 text-white' : ''
                      }`}
                      onClick={() => handleAddPlayerToTeam(player)}
                      disabled={addingPlayerId === player.id || recentlyAdded.has(player.id)}
                    >
                      {addingPlayerId === player.id ? (
                        <>
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                          Adding...
                        </>
                      ) : recentlyAdded.has(player.id) ? (
                        <>
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          Added!
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                          Add to Team
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredRosterPlayers.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No Players Found</h3>
                <p className="text-muted-foreground text-sm">
                  Try adjusting your search criteria or contact support to add more players.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Player Addition</DialogTitle>
            <DialogDescription>
              Are you sure you want to add {selectedPlayers.size} player{selectedPlayers.size > 1 ? 's' : ''} to {team?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="text-sm text-muted-foreground mb-4">
              Selected players:
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {filteredRosterPlayers
                .filter(p => selectedPlayers.has(p.id))
                .map(player => (
                  <div key={player.id} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>{player.name || player.email?.split('@')[0] || 'Unknown Player'}</span>
                    <span className="text-muted-foreground">({player.position})</span>
                  </div>
                ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmation(false)}
              className="flex-1"
              disabled={isAddingBatch}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBatchAddPlayers}
              className="flex-1"
              disabled={isAddingBatch}
            >
              {isAddingBatch ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Add Players
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
