import { parseDueDate } from "./due-date.js";

/** 회의록에서 뽑아낸 할 일 한 건. */
export interface ActionItem {
  assignee: string;
  task: string;
  due?: string;
  done: boolean;
}

// [목록 기호] [체크박스] 이름(글자 1~3단어): 할 일
const LINE_PATTERN = /^\s*(?:[-*+]\s+)?(?:\[([ xX])\]\s*)?(\p{L}+(?: \p{L}+){0,2})\s*[:：]\s*(.+?)\s*$/u;
const DUE_PATTERN = /^(.*?)\s*\(([^()]+)\)$/;
// 담당자가 아닌 라벨.
const NON_ASSIGNEE_LABELS = new Set(["안건", "결정"]);

interface ParsedLine {
  item: ActionItem;
  // 체크박스 또는 줄 끝에 해석되는 기한이 있으면 할 일로 확정한다.
  confirmed: boolean;
}

// 줄 하나를 해석한다. `이름: 할 일` 모양이 아니면 null.
function parseLine(line: string): ParsedLine | null {
  {
    const match = LINE_PATTERN.exec(line);
    if (!match) return null;
    const mark = match[1];
    const assignee = match[2];
    const rest = match[3];
    if (assignee === undefined || rest === undefined) return null;
    if (NON_ASSIGNEE_LABELS.has(assignee)) return null;
    // URL(http://...)은 이름: 할 일이 아니다.
    if (rest.startsWith("//")) return null;

    let task = rest;
    let due: string | undefined;
    const dueMatch = DUE_PATTERN.exec(rest);
    if (dueMatch && dueMatch[1] && dueMatch[2]) {
      task = dueMatch[1];
      due = dueMatch[2].trim();
    }

    const item: ActionItem = { assignee, task, done: mark === "x" || mark === "X" };
    if (due) item.due = due;
    const confirmed = mark !== undefined || (due !== undefined && parseDueDate(due) !== null);
    return { item, confirmed };
  }
}

/** 회의록 텍스트에서 `이름: 할 일` 모양의 줄만 골라 목록으로 돌려준다. */
export function parseActionItems(text: string): ActionItem[] {
  const items: ActionItem[] = [];
  for (const line of text.split(/\r?\n/)) {
    const parsed = parseLine(line);
    if (parsed) items.push(parsed.item);
  }
  return items;
}

/**
 * 할 일 줄과 확인이 필요한 줄로 나눈다. 신호가 없는 줄은 같은 회의록에서
 * 확정된 담당자와 이름이 같을 때만 할 일로 보고, 아니면 unclear에 남긴다.
 */
export function classifyActionItems(text: string): { items: ActionItem[]; unclear: ActionItem[] } {
  const parsedLines: ParsedLine[] = [];
  for (const line of text.split(/\r?\n/)) {
    const parsed = parseLine(line);
    if (parsed) parsedLines.push(parsed);
  }
  const confirmedAssignees = new Set(
    parsedLines.filter((p) => p.confirmed).map((p) => p.item.assignee),
  );
  const items: ActionItem[] = [];
  const unclear: ActionItem[] = [];
  for (const { item, confirmed } of parsedLines) {
    if (confirmed || confirmedAssignees.has(item.assignee)) items.push(item);
    else unclear.push(item);
  }
  return { items, unclear };
}

/** 입력 칸 옆에 적는 인식되는 형식 한 줄. */
export const FORMAT_HINT = "인식되는 형식: 이름: 할 일 (기한) 예) 김철수: 견적 회신 (10/20)";

/** 할 일을 하나도 읽지 못했을 때 보여 주는 형식 안내와 예시. */
export const FORMAT_GUIDE =
  "읽을 수 있는 할 일이 없습니다. '이름: 할 일' 형식으로 쓰면 인식됩니다. 예) 김철수: 견적 회신 (10/20) / 이영희: 계약서 검토";

/**
 * 읽지 못한 줄 중 ':' 또는 '：'가 있는 줄을 trim한 원문 그대로 입력 순서대로 돌려준다.
 * `안건`/`결정` 라벨 줄은 제외한다.
 */
export function collectUnreadLines(text: string): string[] {
  const lines: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "") continue;
    if (parseLine(raw) !== null) continue;
    if (!line.includes(":") && !line.includes("：")) continue;
    const match = LINE_PATTERN.exec(raw);
    if (match?.[2] !== undefined && NON_ASSIGNEE_LABELS.has(match[2])) continue;
    lines.push(line);
  }
  return lines;
}
