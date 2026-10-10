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

// 묶음에서 연도가 적힌 첫 번째 기한의 연도. 없으면 0.
export function referenceYear(dues: (string | undefined)[]): number {
  for (const due of dues) {
    if (!due) continue;
    const parsed = parseDueDate(due);
    if (parsed?.year !== undefined) return parsed.year;
  }
  return 0;
}

// 연도 없는 월·일이 today보다 이 일수를 넘게 지났으면 다음 해의 기한으로 본다(약 6개월).
const YEARLESS_PAST_THRESHOLD_DAYS = 183;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** 연도 없는 월·일의 연도를 today 기준으로 추정한다. 크게 지난 월·일은 다음 해로 본다. */
export function estimateYear(month: number, day: number, today: Date): number {
  const year = today.getFullYear();
  const todayMs = Date.UTC(year, today.getMonth(), today.getDate());
  // 윤년이 아닌 해의 2/29는 3/1로 넘어가지만 비교에는 문제가 없다.
  const dueMs = Date.UTC(year, month - 1, day);
  const daysPast = (todayMs - dueMs) / MS_PER_DAY;
  return daysPast > YEARLESS_PAST_THRESHOLD_DAYS ? year + 1 : year;
}

// year*10000 + month*100 + day. 연도가 없으면 today가 있을 때 추정 연도를, 없으면 yearlessYear(기본 0)를 연도로 본다.
// 기한이 없거나 해석되지 않으면 맨 아래.
export function dueRank(due: string | undefined, yearlessYear = 0, today?: Date): number {
  if (!due) return Number.POSITIVE_INFINITY;
  const parsed = parseDueDate(due);
  if (!parsed) return Number.POSITIVE_INFINITY;
  const year =
    parsed.year ?? (today ? estimateYear(parsed.month, parsed.day, today) : yearlessYear);
  return year * 10000 + parsed.month * 100 + parsed.day;
}
