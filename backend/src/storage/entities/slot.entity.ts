export interface Slot {
  startTime: string;
  endTime: string;
}

export interface SlotsResponse {
  date: string;
  eventSlug: string;
  duration: number;
  slots: Slot[];
}
