import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, Area, AreaChart } from 'recharts';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, TrendingUp, Target, Filter, BarChart3 } from 'lucide-react';

type ViewMode = 'overview' | 'games' | 'tournaments';
type TimeFilter = 'all' | 'month' | 'quarter' | 'season';

// Mock data for different view modes
const performanceData = [
  { 
    month: 'Jan', 
    points: 18, 
    assists: 8, 
    rebounds: 12, 
    steals: 2.5, 
    blocks: 1.2,
    fieldGoal: 45.2,
    threePoint: 38.5,
    freeThrow: 82.1
  },
  { 
    month: 'Feb', 
    points: 22, 
    assists: 12, 
    rebounds: 15, 
    steals: 3.1, 
    blocks: 1.8,
    fieldGoal: 48.3,
    threePoint: 42.1,
    freeThrow: 85.7
  },
  { 
    month: 'Mar', 
    points: 25, 
    assists: 10, 
    rebounds: 18, 
    steals: 2.8, 
    blocks: 2.1,
    fieldGoal: 52.1,
    threePoint: 39.4,
    freeThrow: 78.9
  },
  { 
    month: 'Apr', 
    points: 28, 
    assists: 14, 
    rebounds: 20, 
    steals: 3.5, 
    blocks: 2.4,
    fieldGoal: 55.8,
    threePoint: 45.2,
    freeThrow: 88.2
  },
  { 
    month: 'May', 
    points: 24, 
    assists: 11, 
    rebounds: 22, 
    steals: 2.9, 
    blocks: 1.9,
    fieldGoal: 49.6,
    threePoint: 41.8,
    freeThrow: 81.4
  },
  { 
    month: 'Jun', 
    points: 30, 
    assists: 15, 
    rebounds: 25, 
    steals: 4.1, 
    blocks: 2.7,
    fieldGoal: 58.3,
    threePoint: 47.6,
    freeThrow: 90.1
  },
  { 
    month: 'Jul', 
    points: 32, 
    assists: 16, 
    rebounds: 24, 
    steals: 3.8, 
    blocks: 2.5,
    fieldGoal: 60.2,
    threePoint: 44.3,
    freeThrow: 86.8
  },
  { 
    month: 'Aug', 
    points: 35, 
    assists: 18, 
    rebounds: 28, 
    steals: 4.3, 
    blocks: 3.1,
    fieldGoal: 62.7,
    threePoint: 48.9,
    freeThrow: 91.5
  }
];

// Per-game performance data
const gameData = [
  { game: 'Game 1', date: 'Dec 15', opponent: 'Eagles', points: 28, assists: 12, rebounds: 15, fieldGoal: 52.3, threePoint: 45.5, freeThrow: 88.9, steals: 3, blocks: 2 },
  { game: 'Game 2', date: 'Dec 12', opponent: 'Lions', points: 31, assists: 8, rebounds: 18, fieldGoal: 58.7, threePoint: 41.2, freeThrow: 85.7, steals: 4, blocks: 1 },
  { game: 'Game 3', date: 'Dec 8', opponent: 'Hawks', points: 24, assists: 15, rebounds: 12, fieldGoal: 48.3, threePoint: 38.9, freeThrow: 92.3, steals: 2, blocks: 3 },
  { game: 'Game 4', date: 'Dec 5', opponent: 'Tigers', points: 33, assists: 10, rebounds: 20, fieldGoal: 61.5, threePoint: 50.0, freeThrow: 90.0, steals: 5, blocks: 2 },
  { game: 'Game 5', date: 'Dec 1', opponent: 'Wolves', points: 19, assists: 13, rebounds: 14, fieldGoal: 44.4, threePoint: 33.3, freeThrow: 75.0, steals: 1, blocks: 1 },
];

// Tournament performance data
const tournamentData = [
  { tournament: 'State Championship', date: 'Nov 2024', games: 5, avgPoints: 28.4, avgAssists: 11.2, avgRebounds: 16.8, avgFieldGoal: 54.2, avgThreePoint: 42.1, avgFreeThrow: 87.5 },
  { tournament: 'Regional Finals', date: 'Oct 2024', games: 4, avgPoints: 24.8, avgAssists: 9.5, avgRebounds: 14.3, avgFieldGoal: 49.8, avgThreePoint: 38.7, avgFreeThrow: 83.2 },
  { tournament: 'City League', date: 'Sep 2024', games: 6, avgPoints: 26.7, avgAssists: 12.8, avgRebounds: 18.2, avgFieldGoal: 52.1, avgThreePoint: 44.5, avgFreeThrow: 89.1 },
  { tournament: 'Summer Classic', date: 'Aug 2024', games: 3, avgPoints: 31.3, avgAssists: 14.7, avgRebounds: 21.0, avgFieldGoal: 58.9, avgThreePoint: 47.2, avgFreeThrow: 91.7 },
];

const chartMetrics = [
  { key: 'points', name: 'Points', color: '#ea580c', domain: [0, 40], category: 'performance' },
  { key: 'assists', name: 'Assists', color: '#f97316', domain: [0, 20], category: 'performance' },
  { key: 'rebounds', name: 'Rebounds', color: '#fb923c', domain: [0, 30], category: 'performance' },
  { key: 'steals', name: 'Steals', color: '#fdba74', domain: [0, 5], category: 'performance' },
  { key: 'blocks', name: 'Blocks', color: '#fed7aa', domain: [0, 4], category: 'performance' },
  { key: 'fieldGoal', name: 'FG%', color: '#10b981', domain: [30, 70], category: 'shooting' },
  { key: 'threePoint', name: '3PT%', color: '#3b82f6', domain: [25, 55], category: 'shooting' },
  { key: 'freeThrow', name: 'FT%', color: '#8b5cf6', domain: [70, 100], category: 'shooting' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-modal-accent rounded-lg p-4 shadow-xl border border-primary/20 min-w-[200px]">
        <h4 className="font-semibold text-foreground mb-3 border-b border-border/50 pb-2">
          {label} Performance
        </h4>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-foreground font-medium capitalize">
                  {entry.dataKey}
                </span>
              </div>
              <span className="font-semibold text-foreground">
                {typeof entry.value === 'number' 
                  ? (entry.dataKey.includes('Goal') || entry.dataKey.includes('Point') || entry.dataKey.includes('Throw') || entry.dataKey.includes('FG') || entry.dataKey.includes('3PT') || entry.dataKey.includes('FT'))
                    ? `${entry.value.toFixed(1)}%`
                    : entry.value.toFixed(1)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ activeMetrics, onToggleMetric }: any) => {
  const performanceMetrics = chartMetrics.filter(m => m.category === 'performance');
  const shootingMetrics = chartMetrics.filter(m => m.category === 'shooting');

  return (
    <div className="space-y-4 mb-6">
      {/* Performance Metrics */}
      <div>
        <h4 className="text-sm text-muted-foreground mb-2">Performance Stats</h4>
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
          {performanceMetrics.map((metric) => (
            <button
              key={metric.key}
              onClick={() => onToggleMetric(metric.key)}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 ${
                activeMetrics.includes(metric.key)
                  ? 'bg-card/80 border border-primary/30 shadow-sm'
                  : 'bg-card/30 border border-border/30 opacity-60 hover:opacity-80'
              }`}
            >
              <div 
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  activeMetrics.includes(metric.key) ? 'shadow-md' : ''
                }`}
                style={{ backgroundColor: metric.color }}
              />
              <span className={`text-sm font-medium transition-colors duration-200 ${
                activeMetrics.includes(metric.key) ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {metric.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Shooting Percentages */}
      <div>
        <h4 className="text-sm text-muted-foreground mb-2">Shooting Percentages</h4>
        <div className="grid grid-cols-3 gap-3">
          {shootingMetrics.map((metric) => (
            <button
              key={metric.key}
              onClick={() => onToggleMetric(metric.key)}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 ${
                activeMetrics.includes(metric.key)
                  ? 'bg-card/80 border border-primary/30 shadow-sm'
                  : 'bg-card/30 border border-border/30 opacity-60 hover:opacity-80'
              }`}
            >
              <div 
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  activeMetrics.includes(metric.key) ? 'shadow-md' : ''
                }`}
                style={{ backgroundColor: metric.color }}
              />
              <span className={`text-sm font-medium transition-colors duration-200 ${
                activeMetrics.includes(metric.key) ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {metric.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export function PerformanceChart({ series }: { series?: Array<Record<string, any>> }) {
  const [activeMetrics, setActiveMetrics] = useState(['points', 'fieldGoal', 'threePoint']);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  // Show empty state for new users with no performance data
  if (!series || series.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold text-foreground mb-2">No Performance Data Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Start playing games to see your performance analytics</p>
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleToggleMetric = (metricKey: string) => {
    setActiveMetrics(prev => {
      if (prev.includes(metricKey)) {
        return prev.filter(key => key !== metricKey);
      } else {
        return [...prev, metricKey];
      }
    });
  };

  const getCurrentData = () => {
    if (series && series.length > 0) {
      // Expect keys like: date (label), points, rebounds, assists, fieldGoal, threePoint, freeThrow
      return series.map((row: any) => ({
        ...row,
        month: row.label || row.date,
      }));
    }
    // Return empty array instead of mock data for new users
    return [];
  };

  const getXAxisKey = () => {
    switch (viewMode) {
      case 'games':
        return 'game';
      case 'tournaments':
        return 'tournament';
      default:
        return 'month';
    }
  };

  const getViewModeIcon = (mode: ViewMode) => {
    switch (mode) {
      case 'games':
        return <Target className="w-4 h-4" />;
      case 'tournaments':
        return <Calendar className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getYAxisDomain = () => {
    const activeValues = activeMetrics.map(key => {
      const metric = chartMetrics.find(m => m.key === key);
      return metric ? metric.domain : [0, 100];
    });
    
    const min = Math.min(...activeValues.map(domain => domain[0]));
    const max = Math.max(...activeValues.map(domain => domain[1]));
    
    return [min, max];
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-foreground">Performance Analytics</h3>
          <p className="text-sm text-muted-foreground">Track your progress across key basketball metrics</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* View Mode Selector */}
          <div className="flex items-center gap-1 glass-card p-1 rounded-lg">
            {(['overview', 'games', 'tournaments'] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 transition-all duration-200 ${
                  viewMode === mode 
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm' 
                    : 'hover:bg-card/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                {getViewModeIcon(mode)}
                <span className="ml-2 capitalize">{mode}</span>
              </Button>
            ))}
          </div>

          {/* Time Filter */}
          <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
            <SelectTrigger className="w-32 glass-card border-border/50">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="season">This Season</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* View Mode Description */}
      <div className="glass-card-light p-4 rounded-lg border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          {getViewModeIcon(viewMode)}
          <h4 className="font-medium text-foreground">
            {viewMode === 'overview' && 'Season Overview'}
            {viewMode === 'games' && 'Per-Game Performance'}
            {viewMode === 'tournaments' && 'Tournament Averages'}
          </h4>
        </div>
        <p className="text-sm text-muted-foreground">
          {viewMode === 'overview' && 'Monthly progression tracking across the entire season with trend analysis.'}
          {viewMode === 'games' && 'Individual game performance with opponent analysis and game-specific metrics.'}
          {viewMode === 'tournaments' && 'Tournament-level averages showing performance across different competitions.'}
        </p>
      </div>

      <CustomLegend 
        activeMetrics={activeMetrics} 
        onToggleMetric={handleToggleMetric}
      />
      
      <div className="h-96 glass-card-light rounded-xl p-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={getCurrentData()}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              {chartMetrics.map((metric) => (
                <linearGradient key={metric.key} id={`gradient-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metric.color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={metric.color} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            
            <XAxis 
              dataKey={getXAxisKey()} 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fill: '#78716c', 
                fontSize: 12,
                fontWeight: 500
              }}
              angle={viewMode === 'tournaments' ? -45 : 0}
              textAnchor={viewMode === 'tournaments' ? 'end' : 'middle'}
              height={viewMode === 'tournaments' ? 80 : 30}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fill: '#78716c', 
                fontSize: 12,
                fontWeight: 500
              }}
              domain={getYAxisDomain()}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {chartMetrics.map((metric) => 
              activeMetrics.includes(metric.key) && (
                <Line 
                  key={metric.key}
                  type="monotone" 
                  dataKey={metric.key} 
                  stroke={metric.color}
                  strokeWidth={3}
                  dot={{ 
                    fill: metric.color, 
                    strokeWidth: 2, 
                    stroke: '#fefaf7',
                    r: 5,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                  }}
                  activeDot={{ 
                    r: 7, 
                    fill: metric.color, 
                    strokeWidth: 3,
                    stroke: '#fefaf7',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                  }}
                  name={metric.name}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  connectNulls={false}
                  strokeDasharray={metric.category === 'shooting' ? "0" : "5 5"}
                />
              )
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Summary Cards */}
      <div className="space-y-6">
        {/* Key Performance Stats */}
        <div>
          <h4 className="font-medium text-foreground mb-3">Key Performance Metrics</h4>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {chartMetrics.filter(m => m.category === 'performance').map((metric) => {
              const currentData = getCurrentData();
              const latestValue = currentData[currentData.length - 1][metric.key as keyof typeof currentData[0]];
              const previousValue = currentData[currentData.length - 2]?.[metric.key as keyof typeof currentData[0]] || latestValue;
              const change = previousValue ? ((Number(latestValue) - Number(previousValue)) / Number(previousValue)) * 100 : 0;
              
              return (
                <div key={metric.key} className="glass-card p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{metric.name}</span>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: metric.color }}
                    />
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-foreground">
                      {typeof latestValue === 'number' ? latestValue.toFixed(1) : latestValue}
                    </span>
                    <span className={`text-sm font-medium ${
                      change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-muted-foreground'
                    }`}>
                      {change > 0 ? '+' : ''}{change.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shooting Efficiency */}
        <div>
          <h4 className="font-medium text-foreground mb-3">Shooting Efficiency</h4>
          <div className="grid grid-cols-3 gap-4">
            {chartMetrics.filter(m => m.category === 'shooting').map((metric) => {
              const currentData = getCurrentData();
              const latestValue = currentData[currentData.length - 1][metric.key as keyof typeof currentData[0]];
              const previousValue = currentData[currentData.length - 2]?.[metric.key as keyof typeof currentData[0]] || latestValue;
              const change = previousValue ? ((Number(latestValue) - Number(previousValue)) / Number(previousValue)) * 100 : 0;
              
              return (
                <div key={metric.key} className="glass-card-accent p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{metric.name}</span>
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: metric.color }}
                    />
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-foreground">
                      {typeof latestValue === 'number' ? `${latestValue.toFixed(1)}%` : latestValue}
                    </span>
                    <span className={`text-sm font-medium ${
                      change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-muted-foreground'
                    }`}>
                      {change > 0 ? '+' : ''}{change.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}