import { GameStat } from '@/types/liveStream';

export function useScoreCalculation() {
  const calculateScores = (
    stats: GameStat[],
    teamAId: string,
    teamBId: string
  ): { homeScore: number; awayScore: number } => {
    let homeScore = 0;
    let awayScore = 0;
    
    stats.forEach(stat => {
      if (stat.modifier === 'made') {
        const points = stat.stat_value || 0;
        
        if (stat.is_opponent_stat) {
          awayScore += points;
        } else if (stat.team_id === teamAId) {
          homeScore += points;
        } else if (stat.team_id === teamBId) {
          awayScore += points;
        }
      }
    });
    
    return { homeScore, awayScore };
  };

  return { calculateScores };
}

