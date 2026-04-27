export interface Event {
  id: string;
  title: string;
  description: string;
  duration: number;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventSummary {
  title: string;
  slug: string;
  duration: number;
}

export const toEventSummary = (event: Event): EventSummary => ({
  title: event.title,
  slug: event.slug,
  duration: event.duration,
});
