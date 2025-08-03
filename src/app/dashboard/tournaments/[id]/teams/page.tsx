'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Plus, 
  UserPlus, 
  Upload, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  ArrowLeft
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  email: string;
  position: string;
  jerseyNumber: number;
  isPremium: boolean;
}

interface Team {
  id: string;
  name: string;
  logo?: string;
  players: Player[];
  captain: Player;
  coach?: string;
  wins: number;
  losses: number;
}

export default function TeamManagementPage({ params }: { params: { id: string } }) {
  const [teams, setTeams] = useState<Team[]>([
    {
      id: '1',
      name: 'Lakers Elite',
      players: [
        { id: '1', name: 'John Smith', email: 'john@example.com', position: 'PG', jerseyNumber: 1, isPremium: true },
        { id: '2', name: 'Mike Johnson', email: 'mike@example.com', position: 'SG', jerseyNumber: 2, isPremium: false },
        { id: '3', name: 'David Wilson', email: 'david@example.com', position: 'SF', jerseyNumber: 3, isPremium: true },
      ],
      captain: { id: '1', name: 'John Smith', email: 'john@example.com', position: 'PG', jerseyNumber: 1, isPremium: true },
      wins: 5,
      losses: 2
    },
    {
      id: '2',
      name: 'Warriors Pro',
      players: [
        { id: '4', name: 'Chris Davis', email: 'chris@example.com', position: 'PG', jerseyNumber: 4, isPremium: true },
        { id: '5', name: 'Alex Brown', email: 'alex@example.com', position: 'C', jerseyNumber: 5, isPremium: false },
      ],
      captain: { id: '4', name: 'Chris Davis', email: 'chris@example.com', position: 'PG', jerseyNumber: 4, isPremium: true },
      wins: 4,
      losses: 3
    }
  ]);

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.players.some(player => player.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen pt-16" style={{ backgroundColor: '#121212' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-400 hover:text-white transition-colors duration-200 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tournament
              </button>
              <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Anton, system-ui, sans-serif' }}>
                TEAM MANAGEMENT
              </h1>
              <p className="text-gray-400 text-lg">
                Manage teams and players for Tournament #{params.id}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowAddPlayer(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowCreateTeam(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search teams or players..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    style={{ backgroundColor: '#2a2a2a', borderColor: '#374151' }}
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <Button variant="ghost" size="lg">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="ghost" size="lg">
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Teams Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredTeams.map((team, index) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-purple-500/50 transition-all duration-200"
            >
              {/* Team Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#4B0082' }}>
                    <Users className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{team.name}</h3>
                    <p className="text-sm text-gray-400">{team.players.length} players</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Record</div>
                  <div className="text-white font-semibold">{team.wins}W - {team.losses}L</div>
                </div>
              </div>

              {/* Captain */}
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                <div className="text-xs text-gray-400 mb-1">Captain</div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{team.captain.jerseyNumber}</span>
                  </div>
                  <span className="text-white font-medium">{team.captain.name}</span>
                  {team.captain.isPremium && (
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                      Premium
                    </span>
                  )}
                </div>
              </div>

              {/* Players List */}
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-400">Players</div>
                {team.players.slice(0, 3).map((player) => (
                  <div key={player.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300">#{player.jerseyNumber}</span>
                      <span className="text-white">{player.name}</span>
                      <span className="text-gray-400">({player.position})</span>
                    </div>
                    {player.isPremium && (
                      <span className="text-xs text-yellow-400">★</span>
                    )}
                  </div>
                ))}
                {team.players.length > 3 && (
                  <div className="text-sm text-gray-400">
                    +{team.players.length - 3} more players
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTeam(team)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Edit team:', team.id)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => console.log('Delete team:', team.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredTeams.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No teams found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first team'}
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowCreateTeam(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Team
            </Button>
          </motion.div>
        )}

        {/* Create Team Modal */}
        {showCreateTeam && (
          <CreateTeamModal
            onClose={() => setShowCreateTeam(false)}
            onSave={(teamData) => {
              console.log('Creating team:', teamData);
              setShowCreateTeam(false);
            }}
          />
        )}

        {/* Add Player Modal */}
        {showAddPlayer && (
          <AddPlayerModal
            teams={teams}
            onClose={() => setShowAddPlayer(false)}
            onSave={(playerData) => {
              console.log('Adding player:', playerData);
              setShowAddPlayer(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Modal Components
function CreateTeamModal({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [teamData, setTeamData] = useState({
    name: '',
    coach: '',
    logo: ''
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4 border border-gray-800"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Create New Team</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team Name *
            </label>
            <input
              type="text"
              value={teamData.name}
              onChange={(e) => setTeamData({ ...teamData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              style={{ backgroundColor: '#2a2a2a', borderColor: '#374151' }}
              placeholder="Enter team name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Coach (Optional)
            </label>
            <input
              type="text"
              value={teamData.coach}
              onChange={(e) => setTeamData({ ...teamData, coach: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              style={{ backgroundColor: '#2a2a2a', borderColor: '#374151' }}
              placeholder="Enter coach name"
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-8">
          <Button variant="outline" size="lg" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" size="lg" onClick={() => onSave(teamData)} className="flex-1">
            Create Team
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function AddPlayerModal({ teams, onClose, onSave }: { teams: Team[]; onClose: () => void; onSave: (data: any) => void }) {
  const [playerData, setPlayerData] = useState({
    name: '',
    email: '',
    position: 'PG',
    jerseyNumber: 1,
    teamId: '',
    isPremium: false
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4 border border-gray-800"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Add Player</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={playerData.name}
                onChange={(e) => setPlayerData({ ...playerData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                style={{ backgroundColor: '#2a2a2a', borderColor: '#374151' }}
                placeholder="Player name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Jersey Number *
              </label>
              <input
                type="number"
                value={playerData.jerseyNumber}
                onChange={(e) => setPlayerData({ ...playerData, jerseyNumber: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                style={{ backgroundColor: '#2a2a2a', borderColor: '#374151' }}
                min="0"
                max="99"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={playerData.email}
              onChange={(e) => setPlayerData({ ...playerData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              style={{ backgroundColor: '#2a2a2a', borderColor: '#374151' }}
              placeholder="player@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Position *
              </label>
              <select
                value={playerData.position}
                onChange={(e) => setPlayerData({ ...playerData, position: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                style={{ backgroundColor: '#2a2a2a', borderColor: '#374151' }}
              >
                <option value="PG">Point Guard</option>
                <option value="SG">Shooting Guard</option>
                <option value="SF">Small Forward</option>
                <option value="PF">Power Forward</option>
                <option value="C">Center</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Team *
              </label>
              <select
                value={playerData.teamId}
                onChange={(e) => setPlayerData({ ...playerData, teamId: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                style={{ backgroundColor: '#2a2a2a', borderColor: '#374151' }}
              >
                <option value="">Select team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPremium"
              checked={playerData.isPremium}
              onChange={(e) => setPlayerData({ ...playerData, isPremium: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isPremium" className="text-sm text-gray-300">
              Premium player (higher visibility in search)
            </label>
          </div>
        </div>

        <div className="flex space-x-3 mt-8">
          <Button variant="outline" size="lg" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" size="lg" onClick={() => onSave(playerData)} className="flex-1">
            Add Player
          </Button>
        </div>
      </motion.div>
    </div>
  );
} 