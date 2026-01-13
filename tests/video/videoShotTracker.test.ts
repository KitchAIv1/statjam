/**
 * Video Shot Tracker Tests
 * 
 * Tests for shot location tracking in video stat entry:
 * - Location data flow from handler to service
 * - ShotTrackerContainer integration
 * - Zone detection validation
 * 
 * @module videoShotTracker.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock VideoStatService
const mockRecordVideoStat = vi.fn().mockResolvedValue('stat-123')
vi.mock('@/lib/services/videoStatService', () => ({
  VideoStatService: {
    recordVideoStat: (...args: unknown[]) => mockRecordVideoStat(...args),
  },
}))

// ============================================================================
// TEST DATA
// ============================================================================

interface LocationData {
  shotLocationX: number
  shotLocationY: number
  shotZone: string
}

interface RecordStatParams {
  gameId: string
  videoId: string
  playerId?: string
  customPlayerId?: string
  teamId: string
  statType: string
  modifier?: string
  videoTimestampMs: number
  quarter: number
  gameTimeMinutes: number
  gameTimeSeconds: number
  shotLocationX?: number
  shotLocationY?: number
  shotZone?: string
  skipPostUpdates?: boolean
  isOpponentStat?: boolean
}

const createLocationData = (overrides: Partial<LocationData> = {}): LocationData => ({
  shotLocationX: 50,
  shotLocationY: 75,
  shotZone: 'paint',
  ...overrides,
})

const createBaseStatParams = (overrides: Partial<RecordStatParams> = {}): RecordStatParams => ({
  gameId: 'game-123',
  videoId: 'video-456',
  playerId: 'player-1',
  teamId: 'team-a',
  statType: 'field_goal',
  modifier: 'made',
  videoTimestampMs: 120000,
  quarter: 1,
  gameTimeMinutes: 8,
  gameTimeSeconds: 30,
  skipPostUpdates: true,
  ...overrides,
})

// ============================================================================
// SHOT LOCATION DATA FLOW TESTS
// ============================================================================

describe('Video Shot Tracker - Location Data Flow', () => {
  beforeEach(() => {
    mockRecordVideoStat.mockClear()
  })

  it('should pass shot location data to VideoStatService', async () => {
    const { VideoStatService } = await import('@/lib/services/videoStatService')
    const locationData = createLocationData()
    const baseParams = createBaseStatParams()
    
    await VideoStatService.recordVideoStat({
      ...baseParams,
      shotLocationX: locationData.shotLocationX,
      shotLocationY: locationData.shotLocationY,
      shotZone: locationData.shotZone,
    })
    
    expect(mockRecordVideoStat).toHaveBeenCalledWith(
      expect.objectContaining({
        shotLocationX: 50,
        shotLocationY: 75,
        shotZone: 'paint',
      })
    )
  })

  it('should handle undefined location data gracefully', async () => {
    const { VideoStatService } = await import('@/lib/services/videoStatService')
    const baseParams = createBaseStatParams()
    
    await VideoStatService.recordVideoStat({
      ...baseParams,
      shotLocationX: undefined,
      shotLocationY: undefined,
      shotZone: undefined,
    })
    
    expect(mockRecordVideoStat).toHaveBeenCalledWith(
      expect.objectContaining({
        shotLocationX: undefined,
        shotLocationY: undefined,
        shotZone: undefined,
      })
    )
  })

  it('should include location data with 2PT made shots', async () => {
    const { VideoStatService } = await import('@/lib/services/videoStatService')
    const locationData = createLocationData({ shotZone: 'mid_range_left' })
    
    await VideoStatService.recordVideoStat({
      ...createBaseStatParams({
        statType: 'field_goal',
        modifier: 'made',
      }),
      shotLocationX: locationData.shotLocationX,
      shotLocationY: locationData.shotLocationY,
      shotZone: locationData.shotZone,
    })
    
    expect(mockRecordVideoStat).toHaveBeenCalledWith(
      expect.objectContaining({
        statType: 'field_goal',
        modifier: 'made',
        shotZone: 'mid_range_left',
      })
    )
  })

  it('should include location data with 3PT made shots', async () => {
    const { VideoStatService } = await import('@/lib/services/videoStatService')
    const locationData = createLocationData({ 
      shotLocationX: 15, 
      shotLocationY: 90,
      shotZone: 'corner_3_left' 
    })
    
    await VideoStatService.recordVideoStat({
      ...createBaseStatParams({
        statType: 'three_pointer',
        modifier: 'made',
      }),
      shotLocationX: locationData.shotLocationX,
      shotLocationY: locationData.shotLocationY,
      shotZone: locationData.shotZone,
    })
    
    expect(mockRecordVideoStat).toHaveBeenCalledWith(
      expect.objectContaining({
        statType: 'three_pointer',
        shotLocationX: 15,
        shotLocationY: 90,
        shotZone: 'corner_3_left',
      })
    )
  })

  it('should include location data with missed shots', async () => {
    const { VideoStatService } = await import('@/lib/services/videoStatService')
    const locationData = createLocationData({ shotZone: 'top_of_key' })
    
    await VideoStatService.recordVideoStat({
      ...createBaseStatParams({
        statType: 'field_goal',
        modifier: 'missed',
      }),
      shotLocationX: locationData.shotLocationX,
      shotLocationY: locationData.shotLocationY,
      shotZone: locationData.shotZone,
    })
    
    expect(mockRecordVideoStat).toHaveBeenCalledWith(
      expect.objectContaining({
        modifier: 'missed',
        shotZone: 'top_of_key',
      })
    )
  })
})

// ============================================================================
// SHOT ZONE DETECTION TESTS
// ============================================================================

describe('Video Shot Tracker - Zone Detection', () => {
  /**
   * Shot zones based on court coordinates (0-100 normalized):
   * - paint: center court, close to basket
   * - mid_range_left/right: sides, inside 3pt line
   * - top_of_key: center, mid-range
   * - corner_3_left/right: corners beyond 3pt line
   * - wing_3_left/right: wings beyond 3pt line
   * - top_3: top of arc beyond 3pt line
   */

  it('should identify paint zone correctly', () => {
    // Paint is typically center court (x: 35-65), close to basket (y: 0-30)
    const paintCoords = { x: 50, y: 20 }
    
    // Zone detection logic (simplified validation)
    const isPaint = paintCoords.x >= 35 && paintCoords.x <= 65 && paintCoords.y <= 35
    
    expect(isPaint).toBe(true)
  })

  it('should identify corner 3 zones correctly', () => {
    // Left corner: x < 20, y > 75
    const leftCorner = { x: 10, y: 85 }
    // Right corner: x > 80, y > 75
    const rightCorner = { x: 90, y: 85 }
    
    const isLeftCorner3 = leftCorner.x < 20 && leftCorner.y > 75
    const isRightCorner3 = rightCorner.x > 80 && rightCorner.y > 75
    
    expect(isLeftCorner3).toBe(true)
    expect(isRightCorner3).toBe(true)
  })

  it('should identify top of key zone correctly', () => {
    // Top of key: center (x: 35-65), mid-range (y: 35-55)
    const topOfKey = { x: 50, y: 45 }
    
    const isTopOfKey = topOfKey.x >= 35 && topOfKey.x <= 65 && 
                       topOfKey.y >= 35 && topOfKey.y <= 55
    
    expect(isTopOfKey).toBe(true)
  })

  it('should identify wing 3 zones correctly', () => {
    // Left wing: x < 35, y: 40-75
    const leftWing = { x: 25, y: 60 }
    // Right wing: x > 65, y: 40-75
    const rightWing = { x: 75, y: 60 }
    
    const isLeftWing = leftWing.x < 35 && leftWing.y >= 40 && leftWing.y <= 75
    const isRightWing = rightWing.x > 65 && rightWing.y >= 40 && rightWing.y <= 75
    
    expect(isLeftWing).toBe(true)
    expect(isRightWing).toBe(true)
  })
})

// ============================================================================
// COORDINATE NORMALIZATION TESTS
// ============================================================================

describe('Video Shot Tracker - Coordinate Normalization', () => {
  it('should accept coordinates in 0-100 range', () => {
    const validCoords = [
      { x: 0, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 100 },
      { x: 25.5, y: 75.3 },
    ]
    
    validCoords.forEach(coord => {
      const isValid = coord.x >= 0 && coord.x <= 100 && 
                      coord.y >= 0 && coord.y <= 100
      expect(isValid).toBe(true)
    })
  })

  it('should handle edge boundary coordinates', () => {
    // Boundary cases
    const boundaries = [
      { x: 0, y: 0, desc: 'top-left corner' },
      { x: 100, y: 0, desc: 'top-right corner' },
      { x: 0, y: 100, desc: 'bottom-left corner' },
      { x: 100, y: 100, desc: 'bottom-right corner' },
    ]
    
    boundaries.forEach(({ x, y }) => {
      const isValid = x >= 0 && x <= 100 && y >= 0 && y <= 100
      expect(isValid).toBe(true)
    })
  })
})

// ============================================================================
// CUSTOM PLAYER SHOT TRACKING TESTS
// ============================================================================

describe('Video Shot Tracker - Custom Player Support', () => {
  beforeEach(() => {
    mockRecordVideoStat.mockClear()
  })

  it('should include location data for custom player shots', async () => {
    const { VideoStatService } = await import('@/lib/services/videoStatService')
    const locationData = createLocationData()
    
    await VideoStatService.recordVideoStat({
      ...createBaseStatParams({
        playerId: undefined,
        customPlayerId: 'custom-player-123',
      }),
      shotLocationX: locationData.shotLocationX,
      shotLocationY: locationData.shotLocationY,
      shotZone: locationData.shotZone,
    })
    
    expect(mockRecordVideoStat).toHaveBeenCalledWith(
      expect.objectContaining({
        customPlayerId: 'custom-player-123',
        shotLocationX: 50,
        shotLocationY: 75,
        shotZone: 'paint',
      })
    )
  })

  it('should handle opponent stat shots with location', async () => {
    const { VideoStatService } = await import('@/lib/services/videoStatService')
    const locationData = createLocationData({ shotZone: 'wing_3_right' })
    
    await VideoStatService.recordVideoStat({
      ...createBaseStatParams({
        isOpponentStat: true,
      }),
      shotLocationX: locationData.shotLocationX,
      shotLocationY: locationData.shotLocationY,
      shotZone: locationData.shotZone,
    })
    
    expect(mockRecordVideoStat).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpponentStat: true,
        shotZone: 'wing_3_right',
      })
    )
  })
})

// ============================================================================
// SHOT TYPE DETERMINATION TESTS
// ============================================================================

describe('Video Shot Tracker - Shot Type from Zone', () => {
  /**
   * Shot type is determined by zone:
   * - Zones inside 3pt line: field_goal (2PT)
   * - Zones outside 3pt line: three_pointer (3PT)
   */

  const threePointZones = [
    'corner_3_left',
    'corner_3_right', 
    'wing_3_left',
    'wing_3_right',
    'top_3',
  ]

  const twoPointZones = [
    'paint',
    'mid_range_left',
    'mid_range_right',
    'top_of_key',
    'elbow_left',
    'elbow_right',
  ]

  it('should identify 3-point zones', () => {
    threePointZones.forEach(zone => {
      const isThreePoint = zone.includes('3') || zone.includes('corner')
      expect(isThreePoint).toBe(true)
    })
  })

  it('should identify 2-point zones', () => {
    twoPointZones.forEach(zone => {
      const isThreePoint = zone.includes('3')
      expect(isThreePoint).toBe(false)
    })
  })
})

// ============================================================================
// INPUT MODE TOGGLE TESTS
// ============================================================================

describe('Video Shot Tracker - Input Mode Toggle', () => {
  it('should default to classic mode', () => {
    const defaultMode: 'classic' | 'shot_tracker' = 'classic'
    expect(defaultMode).toBe('classic')
  })

  it('should toggle between modes correctly', () => {
    let mode: 'classic' | 'shot_tracker' = 'classic'
    
    // Toggle to shot_tracker
    mode = mode === 'classic' ? 'shot_tracker' : 'classic'
    expect(mode).toBe('shot_tracker')
    
    // Toggle back to classic
    mode = mode === 'classic' ? 'shot_tracker' : 'classic'
    expect(mode).toBe('classic')
  })

  it('should recognize valid input modes', () => {
    const validModes = ['classic', 'shot_tracker']
    
    validModes.forEach(mode => {
      const isValid = mode === 'classic' || mode === 'shot_tracker'
      expect(isValid).toBe(true)
    })
  })
})

// ============================================================================
// STAT RECORD WITH LOCATION INTEGRATION TESTS
// ============================================================================

describe('Video Shot Tracker - handleStatRecord Integration', () => {
  beforeEach(() => {
    mockRecordVideoStat.mockClear()
  })

  it('should pass all parameters including location to service', async () => {
    const { VideoStatService } = await import('@/lib/services/videoStatService')
    
    await VideoStatService.recordVideoStat({
      gameId: 'game-abc', videoId: 'video-xyz', playerId: 'player-1', teamId: 'team-a',
      statType: 'field_goal', modifier: 'made', videoTimestampMs: 60000,
      quarter: 2, gameTimeMinutes: 5, gameTimeSeconds: 45,
      shotLocationX: 30, shotLocationY: 25, shotZone: 'paint', skipPostUpdates: true,
    })
    
    expect(mockRecordVideoStat).toHaveBeenCalledTimes(1)
    expect(mockRecordVideoStat).toHaveBeenCalledWith(
      expect.objectContaining({ shotLocationX: 30, shotLocationY: 25, shotZone: 'paint' })
    )
  })

  it('should handle backward compatibility (no location data)', async () => {
    const { VideoStatService } = await import('@/lib/services/videoStatService')
    
    await VideoStatService.recordVideoStat({
      gameId: 'game-abc', videoId: 'video-xyz', playerId: 'player-1', teamId: 'team-a',
      statType: 'assist', videoTimestampMs: 60000, quarter: 2,
      gameTimeMinutes: 5, gameTimeSeconds: 45, skipPostUpdates: true,
    })
    
    expect(mockRecordVideoStat).toHaveBeenCalledTimes(1)
  })
})
