import { dayjs } from './dayjs';

export function formatSlot(iso: string, tz: string): string {
  return dayjs.utc(iso).tz(tz).format('HH:mm');
}

export function formatSlotRange(startIso: string, durationMinutes: number, tz: string): string {
  const start = dayjs.utc(startIso).tz(tz);
  const end = start.add(durationMinutes, 'minute');
  return `${start.format('HH:mm')}–${end.format('HH:mm')}`;
}

export function formatLongDate(iso: string, tz: string, locale = 'en'): string {
  return dayjs.utc(iso).tz(tz).locale(locale).format('dddd, MMMM D, YYYY');
}

export function toDateParam(date: Date | string, tz: string): string {
  const d = typeof date === 'string' ? dayjs.tz(date, tz) : dayjs(date).tz(tz);
  return d.format('YYYY-MM-DD');
}

export function tzAbbreviation(tz: string): string {
  return dayjs().tz(tz).format('z');
}
