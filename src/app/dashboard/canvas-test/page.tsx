'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CanvasOverlayRenderer, GameOverlayData, PlayerStatsOverlayData, OverlayVariant } from '@/lib/services/canvas-overlay';
import { EnhancedScoreOverlay } from '@/components/live-streaming/EnhancedScoreOverlay';

// Mock player data for testing player stats overlay
const MOCK_PLAYERS = [
  { id: 'player-1', name: 'LeBron James', jerseyNumber: 23, teamId: 'team-a' },
  { id: 'player-2', name: 'Anthony Davis', jerseyNumber: 3, teamId: 'team-a' },
  { id: 'player-3', name: 'Jayson Tatum', jerseyNumber: 0, teamId: 'team-b' },
  { id: 'player-4', name: 'Jaylen Brown', jerseyNumber: 7, teamId: 'team-b' },
];

/**
 * Canvas Overlay Test Page
 * 
 * Side-by-side comparison of React overlay vs Canvas overlay
 * for visual validation and performance testing.
 * Includes NBA-style player stats overlay testing.
 */
export default function CanvasTestPage() {
  const [gameData, setGameData] = useState<GameOverlayData>({
    teamAName: 'Lakers',
    teamBName: 'Celtics',
    teamAId: 'team-a',
    teamBId: 'team-b',
    homeScore: 95,
    awayScore: 98,
    quarter: 4,
    gameClockMinutes: 8,
    gameClockSeconds: 45,
    shotClockSeconds: 14,
    teamAFouls: 4,
    teamBFouls: 5,
    teamATimeouts: 2,
    teamBTimeouts: 3,
    teamAPrimaryColor: '#552583',
    teamBPrimaryColor: '#007A33',
  });
  
  // Player stats overlay state
  const [playerStatsVisible, setPlayerStatsVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(MOCK_PLAYERS[0]);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Overlay variant state
  const [overlayVariant, setOverlayVariant] = useState<OverlayVariant>('classic');
  
  const [renderTime, setRenderTime] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasOverlayRenderer | null>(null);
  
  // Generate mock player stats overlay data
  const getPlayerStatsData = useCallback((): PlayerStatsOverlayData | undefined => {
    if (!playerStatsVisible) return undefined;
    
    const isTeamA = selectedPlayer.teamId === 'team-a';
    return {
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      jerseyNumber: selectedPlayer.jerseyNumber,
      teamName: isTeamA ? gameData.teamAName : gameData.teamBName,
      teamId: selectedPlayer.teamId,
      teamPrimaryColor: isTeamA ? gameData.teamAPrimaryColor : gameData.teamBPrimaryColor,
      profilePhotoUrl: undefined, // No photo for mock
      points: Math.floor(Math.random() * 30) + 10, // Random 10-40 pts
      rebounds: Math.floor(Math.random() * 10) + 2, // Random 2-12 reb
      assists: Math.floor(Math.random() * 8) + 1, // Random 1-9 ast
      freeThrowMade: Math.floor(Math.random() * 8) + 2, // Random 2-10 made
      freeThrowAttempts: Math.floor(Math.random() * 4) + 8, // Random 8-12 attempts
      isVisible: true,
      showUntil: Date.now() + 7000,
    };
  }, [playerStatsVisible, selectedPlayer, gameData]);
  
  // Trigger player stats overlay (simulates free throw event)
  const triggerPlayerOverlay = useCallback((player: typeof MOCK_PLAYERS[0]) => {
    // Clear any existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    setSelectedPlayer(player);
    setPlayerStatsVisible(true);
    
    // Auto-hide after 7 seconds
    hideTimeoutRef.current = setTimeout(() => {
      setPlayerStatsVisible(false);
    }, 7000);
  }, []);
  
  // Initialize renderer on mount
  useEffect(() => {
    const renderer = new CanvasOverlayRenderer();
    rendererRef.current = renderer;
    
    renderer.initialize().then(() => {
      updateCanvas();
    });
    
    return () => {
      renderer.destroy();
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);
  
  // Update canvas when game data, player stats, or variant changes
  useEffect(() => {
    updateCanvas();
  }, [gameData, playerStatsVisible, selectedPlayer, overlayVariant]);
  
  // Update variant in renderer
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setVariant(overlayVariant);
    }
  }, [overlayVariant]);
  
  const updateCanvas = async () => {
    if (!rendererRef.current || !canvasRef.current) return;
    
    const start = performance.now();
    
    // Include player stats overlay data if visible
    const dataWithPlayerStats: GameOverlayData = {
      ...gameData,
      activePlayerStats: getPlayerStatsData(),
    };
    
    const canvas = await rendererRef.current.render(dataWithPlayerStats);
    const end = performance.now();
    
    setRenderTime(end - start);
    
    // Display rendered canvas
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 1920, 1080);
      ctx.drawImage(canvas, 0, 0);
    }
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Canvas Overlay Test</h1>
      
      {/* Overlay Variant Selector */}
      <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
        <h3 className="text-lg font-semibold mb-2">Overlay Variant</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setOverlayVariant('classic')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              overlayVariant === 'classic'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Option 1: Classic
            <span className="block text-xs font-normal mt-1">Floating elements</span>
          </button>
          <button
            onClick={() => setOverlayVariant('nba')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              overlayVariant === 'nba'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Option 2: NBA-Style
            <span className="block text-xs font-normal mt-1">ESPN/TNT horizontal bar</span>
          </button>
        </div>
      </div>
      
      {/* Performance Metrics */}
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p className="text-sm">
          <strong>Render Time:</strong> {renderTime.toFixed(2)}ms
        </p>
        <p className={renderTime > 50 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
          {renderTime > 50 ? '⚠️ Slow (>50ms target)' : '✅ Fast (<50ms target)'}
        </p>
      </div>
      
      {/* Side-by-side Comparison */}
      <div className="grid grid-cols-2 gap-8">
        {/* React Version */}
        <div>
          <h2 className="text-lg font-semibold mb-2">React Overlay (Reference)</h2>
          <div className="relative bg-gray-800 w-full rounded overflow-hidden" style={{height: '540px'}}>
            <EnhancedScoreOverlay
              teamAName={gameData.teamAName}
              teamBName={gameData.teamBName}
              homeScore={gameData.homeScore}
              awayScore={gameData.awayScore}
              quarter={gameData.quarter}
              gameClockMinutes={gameData.gameClockMinutes}
              gameClockSeconds={gameData.gameClockSeconds}
              shotClockSeconds={gameData.shotClockSeconds}
              teamAFouls={gameData.teamAFouls}
              teamBFouls={gameData.teamBFouls}
              teamATimeouts={gameData.teamATimeouts}
              teamBTimeouts={gameData.teamBTimeouts}
              teamAId={gameData.teamAId}
              teamBId={gameData.teamBId}
              teamAPrimaryColor={gameData.teamAPrimaryColor}
              teamBPrimaryColor={gameData.teamBPrimaryColor}
            />
          </div>
        </div>
        
        {/* Canvas Version */}
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Canvas Overlay ({overlayVariant === 'classic' ? 'Classic' : 'NBA-Style'})
          </h2>
          <canvas 
            ref={canvasRef}
            width={1920}
            height={1080}
            className="w-full border border-gray-300 rounded bg-gray-800"
            style={{height: '540px', objectFit: 'contain'}}
          />
        </div>
      </div>
      
      {/* Test Controls */}
      <div className="mt-8 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Score & Game Controls</h3>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setGameData(d => ({...d, homeScore: d.homeScore + 2}))}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Home +2
            </button>
            <button 
              onClick={() => setGameData(d => ({...d, awayScore: d.awayScore + 3}))}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Away +3
            </button>
            <button 
              onClick={() => setGameData(d => ({...d, teamAFouls: d.teamAFouls + 1}))}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Team A Foul
            </button>
            <button 
              onClick={() => setGameData(d => ({...d, teamBFouls: d.teamBFouls + 1}))}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Team B Foul
            </button>
            <button 
              onClick={() => setGameData(d => ({...d, teamATimeouts: Math.max(0, d.teamATimeouts - 1)}))}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Team A Timeout
            </button>
            <button 
              onClick={() => setGameData(d => ({...d, gameClockMinutes: Math.max(0, d.gameClockMinutes - 1)}))}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clock -1min
            </button>
            <button 
              onClick={() => setGameData(d => ({...d, quarter: d.quarter === 4 ? 5 : d.quarter + 1}))}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Next Quarter
            </button>
          </div>
        </div>
        
        {/* Player Stats Overlay Controls (NBA-style) */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Player Stats Overlay (NBA-style)
            {playerStatsVisible && (
              <span className="ml-2 text-sm font-normal text-green-600">● Active</span>
            )}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Simulates free throw event - shows player stats card at bottom for 7 seconds
          </p>
          <div className="flex flex-wrap gap-2">
            {MOCK_PLAYERS.map(player => (
              <button
                key={player.id}
                onClick={() => triggerPlayerOverlay(player)}
                className={`px-4 py-2 rounded text-white transition-colors ${
                  player.teamId === 'team-a' 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                #{player.jerseyNumber} {player.name}
              </button>
            ))}
            <button
              onClick={() => setPlayerStatsVisible(false)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              disabled={!playerStatsVisible}
            >
              Hide Overlay
            </button>
          </div>
        </div>
        
        {/* Canvas Measurements Info */}
        <div className="p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-semibold mb-2">Canvas Measurements</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Canvas:</strong> 1920 × 1080px</p>
              <p><strong>Overlay MAX_WIDTH:</strong> 1280px</p>
              <p><strong>Score overlay Y:</strong> 0px (top edge)</p>
            </div>
            <div>
              <p><strong>Player stats card:</strong> 800 × 160px</p>
              <p><strong>Player stats Y:</strong> 840px (80px from bottom)</p>
              <p><strong>Auto-hide:</strong> 7 seconds</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

