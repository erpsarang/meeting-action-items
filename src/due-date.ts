/** 해석된 기한. 연도가 적혀 있지 않으면 year가 없다. */
export interface DueDate {
  year?: number;
  month: number;
  day: number;
}

const MONTH_DAY_PATTERN = /^(\d{1,2})\/(\d{1,2})$/;
const KOREAN_PATTERN = /^(\d{1,2})월\s*(\d{1,2})일$/;
const ISO_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const SLASH_YEAR_PATTERN = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/;

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// 월·일이 실제로 있는 날짜인지 본다. 연도가 없으면 2월은 29일까지 허용한다.
function build(year: number | undefined, month: number, day: number): DueDate | null {
  if (month < 1 || month > 12 || day < 1) return null;
  let max = DAYS_IN_MONTH[month - 1] ?? 0;
  if (month === 2 && year !== undefined && !isLeapYear(year)) max = 28;
  if (day > max) return null;
  return year === undefined ? { month, day } : { year, month, day };
}

/** `10/15`, `10월 15일`, `2026-10-15`, `2026/10/15`를 해석한다. 그 밖에는 null. */
export function parseDueDate(text: string): DueDate | null {
  const value = text.trim();
  let match = MONTH_DAY_PATTERN.exec(value) ?? KOREAN_PATTERN.exec(value);
  if (match) return build(undefined, Number(match[1]), Number(match[2]));
  match = ISO_PATTERN.exec(value) ?? SLASH_YEAR_PATTERN.exec(value);
  if (match) return build(Number(match[1]), Number(match[2]), Number(match[3]));
  return null;
}

// year*10000 + month*100 + day. 연도가 없으면 year 0이라 월·일만 비교한다.
// 기한이 없거나 해석되지 않으면 맨 아래.
export function dueRank(due: string | undefined): number {
  if (!due) return Number.POSITIVE_INFINITY;
  const parsed = parseDueDate(due);
  if (!parsed) return Number.POSITIVE_INFINITY;
  return (parsed.year ?? 0) * 10000 + parsed.month * 100 + parsed.day;
}
