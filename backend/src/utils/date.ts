import dayjs from 'dayjs';

export const now = (): number => Date.now();

export const days = (n: number): number => n * 24 * 60 * 60 * 1000;

export function todayRange(): [number, number] {
  const start = dayjs().startOf('day').valueOf();
  const end = dayjs().endOf('day').valueOf();
  return [start, end];
}

export function rangeOf(period: 'week' | 'month'): [number, number] {
  const start = dayjs().startOf(period).valueOf();
  const end = dayjs().endOf(period).valueOf();
  return [start, end];
}

export function toMs(dateStr: string, endOfDay = false): number {
  return endOfDay
    ? dayjs(dateStr).endOf('day').valueOf()
    : dayjs(dateStr).startOf('day').valueOf();
}

export function fmt(ts: number): string {
  return dayjs(ts).format('YYYY-MM-DD HH:mm');
}
