import type { ActionItem } from "./action-items.js";
import { dueRank, referenceYear } from "./due-date.js";

/** 한 담당자의 할 일 묶음. */
export interface AssigneeGroup {
  assignee: string;
  items: ActionItem[];
}

/** 담당자별로 묶고(첫 등장 순서), 묶음 안은 기한 빠른 순으로 정렬한다. */
export function groupByAssignee(items: ActionItem[]): AssigneeGroup[] {
  const groups = new Map<string, ActionItem[]>();
  for (const item of items) {
    const bucket = groups.get(item.assignee);
    if (bucket) bucket.push(item);
    else groups.set(item.assignee, [item]);
  }
  return [...groups].map(([assignee, bucket]) => {
    const year = referenceYear(bucket.map((item) => item.due));
    return {
      assignee,
      items: bucket
        .map((item, index) => ({ item, index, rank: dueRank(item.due, year) }))
        .sort((a, b) => {
          if (a.rank === b.rank) return a.index - b.index;
          return a.rank < b.rank ? -1 : 1;
        })
        .map((entry) => entry.item),
    };
  });
}
