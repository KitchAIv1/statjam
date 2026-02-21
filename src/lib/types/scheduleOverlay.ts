export interface ScheduleGameRow {
  id: string;
  teamAName: string;
  teamBName: string;
  teamALogoUrl?: string;
  teamBLogoUrl?: string;
  startTime: string;
  timeFormatted: string;
  dateFormatted: string;
  venue?: string;
  country: string;
}

export interface ScheduleOverlayPayload {
  displayDate: string;
  games: ScheduleGameRow[];
}
