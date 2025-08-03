'use client';

import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, Eye, Edit, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Tournament {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  venue: string;
  maxTeams: number;
  currentTeams: number;
  tournamentType: string;
  isPublic: boolean;
  entryFee: number;
  prizePool: number;
}

interface TournamentCardProps {
  tournament: Tournament;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onManage?: (id: string) => void;
}

export function TournamentCard({ tournament, onView, onEdit, onManage }: TournamentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20';
      case 'draft': return 'text-yellow-400 bg-yellow-500/20';
      case 'completed': return 'text-blue-400 bg-blue-500/20';
      case 'cancelled': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'ACTIVE';
      case 'draft': return 'DRAFT';
      case 'completed': return 'COMPLETED';
      case 'cancelled': return 'CANCELLED';
      default: return status.toUpperCase();
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-purple-500/50 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#4B0082' }}>
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{tournament.name}</h3>
            <p className="text-sm text-gray-400">{tournament.venue}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
          {getStatusLabel(tournament.status)}
        </span>
      </div>

      {/* Tournament Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">
            {tournament.currentTeams}/{tournament.maxTeams} Teams
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">
            {new Date(tournament.startDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Tournament Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Format:</span>
          <span className="text-white font-medium">{tournament.tournamentType.replace('_', ' ').toUpperCase()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Entry Fee:</span>
          <span className="text-white font-medium">${tournament.entryFee}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Prize Pool:</span>
          <span className="text-white font-medium">${tournament.prizePool}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Visibility:</span>
          <span className="text-white font-medium">{tournament.isPublic ? 'Public' : 'Private'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        {onView && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(tournament.id)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
        )}
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(tournament.id)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
        )}
        {onManage && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onManage(tournament.id)}
            className="flex-1"
          >
            <Settings className="w-4 h-4 mr-1" />
            Manage
          </Button>
        )}
      </div>
    </motion.div>
  );
} 