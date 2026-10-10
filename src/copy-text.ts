import type { AssigneeGroup } from "./group-items.js";

/** 복사할 미완료 할 일이 하나라도 있는지 본다. */
export function hasCopyableItems(group: AssigneeGroup): boolean {
  return group.items.some((item) => !item.done);
}

/** 담당자 이름 아래에 미완료 할 일을 화면 순서대로 `- 할 일 (기한)` 줄로 적은 글. */
export function formatGroupForCopy(group: AssigneeGroup): string {
  const lines = group.items
    .filter((item) => !item.done)
    .map((item) => `- ${item.task}${item.due ? ` (${item.due})` : ""}`);
  return [group.assignee, ...lines].join("\n");
}
