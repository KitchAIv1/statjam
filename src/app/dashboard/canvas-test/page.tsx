'use client';

import { useState, useEffect, useRef } from 'react';
import { CanvasOverlayRenderer, GameOverlayData } from '@/lib/services/canvas-overlay';
import { EnhancedScoreOverlay } from '@/components/live-streaming/EnhancedScoreOverlay';

/**
 * Canvas Overlay Test Page
 * 
 * Side-by-side comparison of React overlay vs Canvas overlay
 * for visual validation and performance testing
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
  
  const [renderTime, setRenderTime] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasOverlayRenderer | null>(null);
  
  // Initialize renderer on mount
  useEffect(() => {
    const renderer = new CanvasOverlayRenderer();
    rendererRef.current = renderer;
    
    renderer.initialize().then(() => {
      updateCanvas();
    });
    
    return () => {
      renderer.destroy();
    };
  }, []);
  
  // Update canvas when game data changes
  useEffect(() => {
    updateCanvas();
  }, [gameData]);
  
  const updateCanvas = async () => {
    if (!rendererRef.current || !canvasRef.current) return;
    
    const start = performance.now();
    const canvas = await rendererRef.current.render(gameData);
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
          <h2 className="text-lg font-semibold mb-2">Canvas Overlay (New)</h2>
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
      <div className="mt-8 space-x-4">
        <h3 className="text-lg font-semibold mb-2">Test Controls</h3>
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
    </div>
  );
}

