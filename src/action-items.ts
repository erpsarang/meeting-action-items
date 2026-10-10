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

/** 회의록 텍스트에서 `이름: 할 일` 모양의 줄만 골라 목록으로 돌려준다. */
export function parseActionItems(text: string): ActionItem[] {
  const items: ActionItem[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = LINE_PATTERN.exec(line);
    if (!match) continue;
    const mark = match[1];
    const assignee = match[2];
    const rest = match[3];
    if (assignee === undefined || rest === undefined) continue;
    // URL(http://...)은 이름: 할 일이 아니다.
    if (rest.startsWith("//")) continue;

    let task = rest;
    let due: string | undefined;
    const dueMatch = DUE_PATTERN.exec(rest);
    if (dueMatch && dueMatch[1] && dueMatch[2]) {
      task = dueMatch[1];
      due = dueMatch[2].trim();
    }

    const item: ActionItem = { assignee, task, done: mark === "x" || mark === "X" };
    if (due) item.due = due;
    items.push(item);
  }
  return items;
}
