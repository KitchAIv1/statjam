'use client';

import { useState, use } from 'react';
import { GameViewerV3Provider, useGameViewerV3Context } from '@/providers/GameViewerV3Provider';
import { GameViewerV3Header } from './components/GameViewerV3Header';
import { BoxScoreTabV3 } from './components/BoxScoreTabV3';
import { PlayFeedTabV3 } from './components/PlayFeedTabV3';
import { GameAwardsV3 } from './components/GameAwardsV3';
import { ClipsTabV3 } from './components/ClipsTabV3';
import { TournamentGameArticle } from '@/app/game-viewer/[gameId]/components/TournamentGameArticle';
import { ThemeToggle } from '@/app/game-viewer/[gameId]/components/ThemeToggle';
import { FileText } from 'lucide-react';

type TabType = 'box-score' | 'play-by-play' | 'clips' | 'article';

/** AI Recap tab with fallback for games without articles */
function AIRecapTab({ gameId, isDark }: { gameId: string; isDark: boolean }) {
  const article = <TournamentGameArticle gameId={gameId} isDark={isDark} />;
  
  if (!article || gameId !== '7f743a36-8814-4932-b116-4ce22ab3afb9') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] p-6 text-center">
        <div className={`w-16 h-16 mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-orange-100'}`}>
          <FileText className="w-8 h-8 text-orange-400" />
        </div>
        <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Recap Coming Soon</h3>
        <p className={`text-sm max-w-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          AI-generated game recaps are being developed. Check back soon for detailed game analysis!
        </p>
      </div>
    );
  }

  return article;
}

interface PageProps {
  params: Promise<{ gameId: string }>;
}

function GameViewerV3Content() {
  const { gameData, loading, error, isLive, isDark, theme, toggleTheme } = useGameViewerV3Context();
  const [activeTab, setActiveTab] = useState<TabType>('box-score');

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-50/50 via-white to-red-50/30'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-50/50 via-white to-red-50/30'}`}>
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">Failed to load game</p>
          <p className={isDark ? 'text-gray-500' : 'text-gray-600'}>{error || 'Game not found'}</p>
        </div>
      </div>
    );
  }

  const isCompleted = gameData.game.status === 'completed';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-50/50 via-white to-red-50/30'}`}>
      <GameViewerV3Header />
      
      {/* Awards Section (completed games only) */}
      {isCompleted && <div className="max-w-6xl mx-auto px-4 pt-6"><GameAwardsV3 /></div>}
      
      {/* Tab Navigation */}
      <div className={`border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-orange-200 bg-white/80'}`}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Game viewer tabs">
            <TabButton active={activeTab === 'box-score'} onClick={() => setActiveTab('box-score')} label="Box Score" isDark={isDark} />
            <TabButton active={activeTab === 'play-by-play'} onClick={() => setActiveTab('play-by-play')} label="Play-by-Play" isDark={isDark} />
            <TabButton active={activeTab === 'clips'} onClick={() => setActiveTab('clips')} label="Clips" isDark={isDark} />
            {isCompleted && (
              <TabButton active={activeTab === 'article'} onClick={() => setActiveTab('article')} label="AI Recap" isDark={isDark} />
            )}
          </nav>
          <ThemeToggle theme={theme} onToggle={toggleTheme} size="sm" />
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'box-score' && <BoxScoreTabV3 />}
        {activeTab === 'play-by-play' && <PlayFeedTabV3 />}
        {activeTab === 'clips' && <ClipsTabV3 />}
        {activeTab === 'article' && <AIRecapTab gameId={gameData.game.id} isDark={isDark} />}
      </main>

      {/* Live Indicator */}
      {isLive && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      )}
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  isDark?: boolean;
}

function TabButton({ active, onClick, label, isDark = true }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
        active 
          ? 'text-orange-500 border-b-2 border-orange-500' 
          : isDark 
            ? 'text-gray-400 hover:text-gray-200' 
            : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
    </button>
  );
}

export default function GameViewerV3Page({ params }: PageProps) {
  const { gameId } = use(params);

  return (
    <GameViewerV3Provider gameId={gameId}>
      <GameViewerV3Content />
    </GameViewerV3Provider>
  );
}
