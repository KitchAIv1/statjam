export const trackEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
};

export const Analytics = {
  playerProfileView: (playerId: string, playerName: string) =>
    trackEvent('player_profile_view', { player_id: playerId, player_name: playerName }),

  tournamentView: (tournamentId: string, tournamentName: string) =>
    trackEvent('tournament_view', { tournament_id: tournamentId, tournament_name: tournamentName }),

  gameViewerOpen: (gameId: string) =>
    trackEvent('game_viewer_open', { game_id: gameId }),

  globalSearch: (query: string, resultsCount: number) =>
    trackEvent('global_search', { search_term: query, results_count: resultsCount }),

  signUp: (role: string) =>
    trackEvent('sign_up', { method: 'email', role }),

  premiumUpgrade: (plan: string) =>
    trackEvent('purchase', { plan }),

  tournamentCreated: (tournamentId: string, tournamentName: string) =>
    trackEvent('tournament_created', { tournament_id: tournamentId, tournament_name: tournamentName }),

  teamCreated: (teamId: string, tournamentId: string) =>
    trackEvent('team_created', { team_id: teamId, tournament_id: tournamentId }),

  liveStreamStarted: (gameId: string, platform: string) =>
    trackEvent('live_stream_started', { game_id: gameId, platform }),

  liveStreamEnded: (gameId: string, durationMinutes: number) =>
    trackEvent('live_stream_ended', { game_id: gameId, duration_minutes: durationMinutes }),

  coachGameStarted: (gameId: string) =>
    trackEvent('coach_game_started', { game_id: gameId }),

  videoUploadStarted: (gameId: string, sizeMb: number) =>
    trackEvent('video_upload_started', { game_id: gameId, size_mb: sizeMb }),

  videoUploadCompleted: (gameId: string) =>
    trackEvent('video_upload_completed', { game_id: gameId }),

  videoStatTrackingOrdered: (videoId: string, status: string) =>
    trackEvent('video_stat_tracking_ordered', { video_id: videoId, status }),
};
