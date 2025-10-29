'use client';

import React, { useState, useEffect } from 'react';
import { X, Settings, CheckCircle2, Info, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { AutomationFlags } from '@/lib/types/automation';

interface PreFlightCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTracking: (settings: AutomationFlags) => void;
  
  // Game Info
  gameId: string;
  gameName: string; // e.g., "Lakers vs Warriors"
  tournamentName?: string;
  
  // Settings Sources
  tournamentDefaults: AutomationFlags; // From tournament.automation_flags
  lastUsedSettings?: AutomationFlags; // From user's previous game (future)
  
  // User Info
  userRole: 'stat_admin' | 'coach';
}

type PresetType = 'minimal' | 'balanced' | 'full' | 'custom';

const PRESETS: Record<PresetType, { label: string; description: string; settings: AutomationFlags }> = {
  minimal: {
    label: '🎯 Minimal (Beginner)',
    description: 'Manual control, automation only for basic features',
    settings: {
      clock: { enabled: false, autoPause: false, autoReset: false, ftMode: false, madeBasketStop: false },
      possession: { enabled: true, autoFlip: true, persistState: true, jumpBallArrow: false },
      sequences: { enabled: true, promptAssists: true, promptRebounds: true, promptBlocks: true, linkEvents: false, freeThrowSequence: true },
      fouls: { enabled: false, bonusFreeThrows: false, foulOutEnforcement: false, technicalEjection: false },
      undo: { enabled: false, maxHistorySize: 50 }
    }
  },
  balanced: {
    label: '⚡ Balanced (Recommended)',
    description: 'Smart automation with manual override when needed',
    settings: {
      clock: { enabled: true, autoPause: true, autoReset: true, ftMode: true, madeBasketStop: false },
      possession: { enabled: true, autoFlip: true, persistState: true, jumpBallArrow: false },
      sequences: { enabled: true, promptAssists: true, promptRebounds: true, promptBlocks: true, linkEvents: true, freeThrowSequence: true },
      fouls: { enabled: false, bonusFreeThrows: false, foulOutEnforcement: false, technicalEjection: false },
      undo: { enabled: false, maxHistorySize: 50 }
    }
  },
  full: {
    label: '🚀 Full Automation (Advanced)',
    description: 'Maximum automation, NBA-level tracking',
    settings: {
      clock: { enabled: true, autoPause: true, autoReset: true, ftMode: true, madeBasketStop: false },
      possession: { enabled: true, autoFlip: true, persistState: true, jumpBallArrow: true },
      sequences: { enabled: true, promptAssists: true, promptRebounds: true, promptBlocks: true, linkEvents: true, freeThrowSequence: true },
      fouls: { enabled: true, bonusFreeThrows: true, foulOutEnforcement: true, technicalEjection: true },
      undo: { enabled: true, maxHistorySize: 50 }
    }
  },
  custom: {
    label: '⚙️ Custom',
    description: 'Use tournament defaults or customize below',
    settings: {} as AutomationFlags // Will be replaced with actual settings
  }
};

export function PreFlightCheckModal({
  isOpen,
  onClose,
  onStartTracking,
  gameId,
  gameName,
  tournamentName,
  tournamentDefaults,
  lastUsedSettings,
  userRole
}: PreFlightCheckModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('balanced');
  const [customSettings, setCustomSettings] = useState<AutomationFlags>(tournamentDefaults);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize with tournament defaults or last used settings
  useEffect(() => {
    if (isOpen) {
      // Determine which preset matches the tournament defaults (if any)
      const matchingPreset = Object.entries(PRESETS).find(([key, preset]) => {
        if (key === 'custom') return false;
        return JSON.stringify(preset.settings.clock) === JSON.stringify(tournamentDefaults.clock) &&
               JSON.stringify(preset.settings.possession) === JSON.stringify(tournamentDefaults.possession) &&
               JSON.stringify(preset.settings.sequences) === JSON.stringify(tournamentDefaults.sequences);
      });

      if (matchingPreset) {
        setSelectedPreset(matchingPreset[0] as PresetType);
      } else {
        setSelectedPreset('custom');
      }
      
      setCustomSettings(tournamentDefaults);
      setShowAdvanced(false);
    }
  }, [isOpen, tournamentDefaults]);

  if (!isOpen) return null;

  const handlePresetChange = (preset: PresetType) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      setCustomSettings(PRESETS[preset].settings);
    }
  };

  const handleStartTracking = () => {
    const finalSettings = selectedPreset === 'custom' ? customSettings : PRESETS[selectedPreset].settings;
    console.log('🚀 Starting tracking with settings:', finalSettings);
    onStartTracking(finalSettings);
  };

  const toggleSetting = (category: keyof AutomationFlags, key: string) => {
    setCustomSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key as keyof typeof prev[typeof category]]
      }
    }));
    setSelectedPreset('custom'); // Switch to custom when manually toggling
  };

  const currentSettings = selectedPreset === 'custom' ? customSettings : PRESETS[selectedPreset].settings;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 border-2 border-orange-500"
        style={{
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <Zap className="w-7 h-7 text-orange-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pre-Flight Check</h2>
              <p className="text-sm text-gray-600 mt-1">Configure automation before tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Game Info */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{gameName}</p>
                {tournamentName && (
                  <p className="text-sm text-gray-600 mt-1">Tournament: {tournamentName}</p>
                )}
                <Badge variant="outline" className="mt-2 text-xs">
                  {userRole === 'stat_admin' ? 'Stat Admin Mode' : 'Coach Mode'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Preset Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Quick Setup
            </label>
            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(PRESETS) as PresetType[]).filter(key => key !== 'custom').map((presetKey) => {
                const preset = PRESETS[presetKey];
                return (
                  <button
                    key={presetKey}
                    onClick={() => handlePresetChange(presetKey)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      selectedPreset === presetKey
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{preset.label}</p>
                        <p className="text-sm text-gray-600 mt-1">{preset.description}</p>
                      </div>
                      {selectedPreset === presetKey && (
                        <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Settings Summary */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-start gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">Automation Status</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentSettings.clock.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-gray-700">Clock Automation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentSettings.possession.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-gray-700">Possession Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentSettings.sequences.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-gray-700">Play Sequences</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentSettings.fouls.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-gray-700">Foul Automation</span>
              </div>
            </div>
          </div>

          {/* Advanced Settings (Collapsible) */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
            >
              {showAdvanced ? '▼ Hide' : '▶ Show'} Advanced Settings
            </button>
            
            {showAdvanced && (
              <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200">
                {/* Clock Automation Details */}
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-2">🕐 Clock Automation</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={currentSettings.clock.enabled}
                        onChange={() => toggleSetting('clock', 'enabled')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700">Enable Clock Automation</span>
                    </label>
                    {currentSettings.clock.enabled && (
                      <>
                        <label className="flex items-center gap-2 text-sm ml-6">
                          <input
                            type="checkbox"
                            checked={currentSettings.clock.autoPause}
                            onChange={() => toggleSetting('clock', 'autoPause')}
                            className="rounded border-gray-300"
                          />
                          <span className="text-gray-600">Auto-pause on fouls/timeouts</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm ml-6">
                          <input
                            type="checkbox"
                            checked={currentSettings.clock.autoReset}
                            onChange={() => toggleSetting('clock', 'autoReset')}
                            className="rounded border-gray-300"
                          />
                          <span className="text-gray-600">Auto-reset shot clock</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm ml-6">
                          <input
                            type="checkbox"
                            checked={currentSettings.clock.ftMode}
                            onChange={() => toggleSetting('clock', 'ftMode')}
                            className="rounded border-gray-300"
                          />
                          <span className="text-gray-600">Free throw mode</span>
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {/* Possession Tracking Details */}
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-2">🏀 Possession Tracking</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={currentSettings.possession.enabled}
                        onChange={() => toggleSetting('possession', 'enabled')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700">Enable Possession Tracking</span>
                    </label>
                    {currentSettings.possession.enabled && (
                      <>
                        <label className="flex items-center gap-2 text-sm ml-6">
                          <input
                            type="checkbox"
                            checked={currentSettings.possession.autoFlip}
                            onChange={() => toggleSetting('possession', 'autoFlip')}
                            className="rounded border-gray-300"
                          />
                          <span className="text-gray-600">Auto-flip on events</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm ml-6">
                          <input
                            type="checkbox"
                            checked={currentSettings.possession.persistState}
                            onChange={() => toggleSetting('possession', 'persistState')}
                            className="rounded border-gray-300"
                          />
                          <span className="text-gray-600">Save to database</span>
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {/* Play Sequences Details */}
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-2">🎯 Play Sequences</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={currentSettings.sequences.enabled}
                        onChange={() => toggleSetting('sequences', 'enabled')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700">Enable Play Sequences</span>
                    </label>
                    {currentSettings.sequences.enabled && (
                      <>
                        <label className="flex items-center gap-2 text-sm ml-6">
                          <input
                            type="checkbox"
                            checked={currentSettings.sequences.promptAssists}
                            onChange={() => toggleSetting('sequences', 'promptAssists')}
                            className="rounded border-gray-300"
                          />
                          <span className="text-gray-600">Prompt for assists</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm ml-6">
                          <input
                            type="checkbox"
                            checked={currentSettings.sequences.promptRebounds}
                            onChange={() => toggleSetting('sequences', 'promptRebounds')}
                            className="rounded border-gray-300"
                          />
                          <span className="text-gray-600">Prompt for rebounds</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm ml-6">
                          <input
                            type="checkbox"
                            checked={currentSettings.sequences.linkEvents}
                            onChange={() => toggleSetting('sequences', 'linkEvents')}
                            className="rounded border-gray-300"
                          />
                          <span className="text-gray-600">Auto-link related events</span>
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex-shrink-0">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 py-3 text-base font-semibold hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartTracking}
            className="flex-1 py-3 text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white"
          >
            Start Tracking →
          </Button>
        </div>
      </div>
    </div>
  );
}

