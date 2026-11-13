/** Calendar arithmetic uses UTC date-only values; account scheduling stays in Asia/Shanghai. */
export function calendarDate(date: Date): string {
  return `${String(date.getUTCFullYear()).padStart(4, "0")}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function parseCalendarDate(value: string): Date {
  const date = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || calendarDate(date) !== value) {
    throw new RangeError("日期格式无效");
  }
  return date;
}

export function addCalendarDays(value: string, days: number): string {
  const date = parseCalendarDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return calendarDate(date);
}

/** Move the selected day with the month, clamping e.g. March 31 to February 28. */
export function shiftCalendarMonth(value: string, months: number): string {
  const date = parseCalendarDate(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const last = new Date(date);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  date.setUTCDate(Math.min(day, last.getUTCDate()));
  return calendarDate(date);
}

export function calendarMonthDays(value: string): string[] {
  const first = parseCalendarDate(`${value.slice(0, 7)}-01`);
  first.setUTCDate(first.getUTCDate() - ((first.getUTCDay() + 6) % 7));
  const start = calendarDate(first);
  return Array.from({ length: 42 }, (_, index) => addCalendarDays(start, index));
}

export function shanghaiToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function calendarDayLabel(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "UTC", year: "numeric", month: "long", day: "numeric", weekday: "short",
  }).format(parseCalendarDate(value));
}

