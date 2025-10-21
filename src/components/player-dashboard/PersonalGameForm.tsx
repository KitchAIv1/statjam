'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Users, Save, RotateCcw, Target, Trophy, Zap, Shield, AlertTriangle } from 'lucide-react';
import { PersonalGameInput } from '@/lib/services/personalGamesService';
import { calculatePersonalGameStats, validatePersonalGameStats, formatPercentage } from '@/utils/personalStatsCalculations';
import { notify } from '@/lib/services/notificationService';

interface PersonalGameFormProps {
  onGameCreated: () => void;
  creating: boolean;
  onSubmit: (gameData: PersonalGameInput) => Promise<any>;
}

// Stat button configuration (simplified from StatButtonsV3)
const statButtons = [
  // Scoring Stats
  { id: 'points', label: '+1 PT', icon: Target, color: 'bg-orange-500 hover:bg-orange-600 text-white', increment: 1 },
  { id: 'points', label: '+2 PT', icon: Target, color: 'bg-orange-600 hover:bg-orange-700 text-white', increment: 2 },
  { id: 'points', label: '+3 PT', icon: Trophy, color: 'bg-red-500 hover:bg-red-600 text-white', increment: 3 },
  
  // Other Stats
  { id: 'rebounds', label: 'REB', icon: Shield, color: 'bg-green-500 hover:bg-green-600 text-white', increment: 1 },
  { id: 'assists', label: 'AST', icon: Zap, color: 'bg-blue-500 hover:bg-blue-600 text-white', increment: 1 },
  { id: 'steals', label: 'STL', icon: Zap, color: 'bg-purple-500 hover:bg-purple-600 text-white', increment: 1 },
  { id: 'blocks', label: 'BLK', icon: Shield, color: 'bg-indigo-500 hover:bg-indigo-600 text-white', increment: 1 },
  { id: 'turnovers', label: 'TO', icon: AlertTriangle, color: 'bg-yellow-500 hover:bg-yellow-600 text-white', increment: 1 },
  { id: 'fouls', label: 'FOUL', icon: AlertTriangle, color: 'bg-red-600 hover:bg-red-700 text-white', increment: 1 },
];

export function PersonalGameForm({ onGameCreated, creating, onSubmit }: PersonalGameFormProps) {
  // Form state
  const [gameData, setGameData] = useState<PersonalGameInput>({
    game_date: new Date().toISOString().split('T')[0], // Today's date
    location: '',
    opponent: '',
    points: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fouls: 0,
    fg_made: 0,
    fg_attempted: 0,
    three_pt_made: 0,
    three_pt_attempted: 0,
    ft_made: 0,
    ft_attempted: 0,
    is_public: false,
    notes: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate live stats
  const calculatedStats = calculatePersonalGameStats(gameData);
  const validation = validatePersonalGameStats(gameData);

  // Handle stat button clicks
  const handleStatClick = useCallback((statId: string, increment: number) => {
    setGameData(prev => ({
      ...prev,
      [statId]: Math.max(0, prev[statId as keyof PersonalGameInput] as number + increment)
    }));
  }, []);

  // Handle shooting stat changes
  const handleShootingChange = useCallback((field: string, value: number) => {
    setGameData(prev => ({
      ...prev,
      [field]: Math.max(0, value)
    }));
  }, []);

  // Handle form field changes
  const handleFieldChange = useCallback((field: string, value: string | boolean) => {
    setGameData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Reset form
  const handleReset = useCallback(() => {
    setGameData({
      game_date: new Date().toISOString().split('T')[0],
      location: '',
      opponent: '',
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
      fg_made: 0,
      fg_attempted: 0,
      three_pt_made: 0,
      three_pt_attempted: 0,
      ft_made: 0,
      ft_attempted: 0,
      is_public: false,
      notes: ''
    });
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validation.valid) {
      notify.error('Invalid stats', validation.errors.join(', '));
      return;
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        notify.warning('Please verify', warning);
      });
    }

    try {
      const result = await onSubmit(gameData);
      if (result) {
        notify.success('Game saved!', `Recorded ${calculatedStats.statLine}`);
        handleReset();
        onGameCreated();
      }
    } catch (error) {
      // Error handling is done in the service/hook
      console.error('Form submission error:', error);
    }
  }, [gameData, validation, onSubmit, calculatedStats.statLine, handleReset, onGameCreated]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Game Metadata */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="game_date" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Game Date
          </Label>
          <Input
            id="game_date"
            type="date"
            value={gameData.game_date}
            onChange={(e) => handleFieldChange('game_date', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="location"
            placeholder="e.g., Local gym, Park court"
            value={gameData.location}
            onChange={(e) => handleFieldChange('location', e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="opponent" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Opponent <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="opponent"
            placeholder="e.g., Team name, Friends"
            value={gameData.opponent}
            onChange={(e) => handleFieldChange('opponent', e.target.value)}
            maxLength={100}
          />
        </div>
      </div>

      {/* Live Stats Display */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{calculatedStats.statLine}</div>
              <div className="text-sm text-muted-foreground">Current Stats</div>
            </div>
            {calculatedStats.fieldGoal.attempted > 0 && (
              <div>
                <div className="text-lg font-semibold">
                  {formatPercentage(calculatedStats.fieldGoal.percentage)} FG
                </div>
                <div className="text-xs text-muted-foreground">
                  {calculatedStats.fieldGoal.made}/{calculatedStats.fieldGoal.attempted}
                </div>
              </div>
            )}
            {calculatedStats.threePoint.attempted > 0 && (
              <div>
                <div className="text-lg font-semibold">
                  {formatPercentage(calculatedStats.threePoint.percentage)} 3PT
                </div>
                <div className="text-xs text-muted-foreground">
                  {calculatedStats.threePoint.made}/{calculatedStats.threePoint.attempted}
                </div>
              </div>
            )}
            {calculatedStats.freeThrow.attempted > 0 && (
              <div>
                <div className="text-lg font-semibold">
                  {formatPercentage(calculatedStats.freeThrow.percentage)} FT
                </div>
                <div className="text-xs text-muted-foreground">
                  {calculatedStats.freeThrow.made}/{calculatedStats.freeThrow.attempted}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stat Buttons */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Quick Stats</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {statButtons.map((button, index) => {
            const Icon = button.icon;
            return (
              <Button
                key={`${button.id}-${index}`}
                type="button"
                variant="outline"
                size="sm"
                className={`${button.color} border-0 min-h-[44px] touch-manipulation`}
                onClick={() => handleStatClick(button.id, button.increment)}
              >
                <Icon className="w-4 h-4 mr-1" />
                {button.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Advanced Shooting Stats */}
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mb-3"
        >
          {showAdvanced ? 'Hide' : 'Show'} Detailed Shooting
        </Button>

        {showAdvanced && (
          <div className="grid gap-4 md:grid-cols-3">
            {/* Field Goals */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Field Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Made</Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={gameData.fg_made}
                      onChange={(e) => handleShootingChange('fg_made', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Attempted</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={gameData.fg_attempted}
                      onChange={(e) => handleShootingChange('fg_attempted', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                {gameData.fg_attempted > 0 && (
                  <div className="text-center">
                    <Badge variant="secondary">
                      {formatPercentage(calculatedStats.fieldGoal.percentage)}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3-Pointers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">3-Pointers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Made</Label>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      value={gameData.three_pt_made}
                      onChange={(e) => handleShootingChange('three_pt_made', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Attempted</Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={gameData.three_pt_attempted}
                      onChange={(e) => handleShootingChange('three_pt_attempted', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                {gameData.three_pt_attempted > 0 && (
                  <div className="text-center">
                    <Badge variant="secondary">
                      {formatPercentage(calculatedStats.threePoint.percentage)}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Free Throws */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Free Throws</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Made</Label>
                    <Input
                      type="number"
                      min="0"
                      max="30"
                      value={gameData.ft_made}
                      onChange={(e) => handleShootingChange('ft_made', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Attempted</Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={gameData.ft_attempted}
                      onChange={(e) => handleShootingChange('ft_attempted', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                {gameData.ft_attempted > 0 && (
                  <div className="text-center">
                    <Badge variant="secondary">
                      {formatPercentage(calculatedStats.freeThrow.percentage)}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes <span className="text-muted-foreground">(optional)</span></Label>
        <Textarea
          id="notes"
          placeholder="Add any notes about the game..."
          value={gameData.notes}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          maxLength={500}
          rows={3}
        />
      </div>

      {/* Validation Errors */}
      {!validation.valid && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="text-sm text-destructive">
            <strong>Please fix these issues:</strong>
            <ul className="mt-1 list-disc list-inside">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={creating || !validation.valid}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          {creating ? 'Saving...' : 'Save Game'}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={creating}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>
    </form>
  );
}
