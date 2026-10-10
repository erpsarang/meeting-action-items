import type { ActionItem } from "./action-items.js";

/** 한 담당자의 할 일 묶음. */
export interface AssigneeGroup {
  assignee: string;
  items: ActionItem[];
}

const DUE_DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})$/;

// M/D는 월*100+일, 기한이 없거나 해석되지 않으면 맨 아래.
function dueRank(due: string | undefined): number {
  if (!due) return Number.POSITIVE_INFINITY;
  const match = DUE_DATE_PATTERN.exec(due);
  if (!match) return Number.POSITIVE_INFINITY;
  return Number(match[1]) * 100 + Number(match[2]);
}

/** 담당자별로 묶고(첫 등장 순서), 묶음 안은 기한 빠른 순으로 정렬한다. */
export function groupByAssignee(items: ActionItem[]): AssigneeGroup[] {
  const groups = new Map<string, ActionItem[]>();
  for (const item of items) {
    const bucket = groups.get(item.assignee);
    if (bucket) bucket.push(item);
    else groups.set(item.assignee, [item]);
  }
  return [...groups].map(([assignee, bucket]) => ({
    assignee,
    items: bucket
      .map((item, index) => ({ item, index, rank: dueRank(item.due) }))
      .sort((a, b) => {
        if (a.rank === b.rank) return a.index - b.index;
        return a.rank < b.rank ? -1 : 1;
      })
      .map((entry) => entry.item),
  }));
}
