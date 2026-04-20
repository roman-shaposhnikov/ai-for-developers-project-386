import dayjs from 'dayjs';
import 'dayjs/locale/ru';

export function formatDate(date: Date | string): string {
  return dayjs(date).locale('ru').format('D MMMM YYYY');
}

export function formatDateShort(date: Date | string): string {
  return dayjs(date).locale('ru').format('D MMM');
}

export function formatDateTime(date: Date | string): string {
  return dayjs(date).locale('ru').format('D MMMM YYYY, HH:mm');
}

export function formatTime(date: Date | string): string {
  return dayjs(date).format('HH:mm');
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)}–${formatTime(end)}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} минут`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`;
  }
  return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'} ${remainingMinutes} минут`;
}

export function formatDayOfWeek(date: Date | string): string {
  return dayjs(date).locale('ru').format('dddd');
}

export function getToday(): Date {
  return dayjs().startOf('day').toDate();
}

export function addDays(date: Date | string, days: number): Date {
  return dayjs(date).add(days, 'day').toDate();
}

export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  return dayjs(date1).isSame(date2, 'day');
}

export function isBefore(date1: Date | string, date2: Date | string): boolean {
  return dayjs(date1).isBefore(date2, 'day');
}

export function isAfter(date1: Date | string, date2: Date | string): boolean {
  return dayjs(date1).isAfter(date2, 'day');
}

export function toISODate(date: Date | string): string {
  return dayjs(date).format('YYYY-MM-DD');
}

export function parseISO(dateString: string): Date {
  return dayjs(dateString).toDate();
}

export function getWeekDay(date: Date | string): number {
  // 0 = Sunday, 1 = Monday, etc.
  return dayjs(date).day();
}

export function getCalendarDays(date: Date | string): Date[] {
  const start = dayjs(date).startOf('month').startOf('week');
  const end = dayjs(date).endOf('month').endOf('week');
  const days: Date[] = [];
  let current = start;
  
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    days.push(current.toDate());
    current = current.add(1, 'day');
  }
  
  return days;
}
