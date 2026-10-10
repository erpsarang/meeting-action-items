import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyActionItems } from "../src/action-items.js";
import { formatGroupForCopy, hasCopyableItems } from "../src/copy-text.js";
import { groupByAssignee } from "../src/group-items.js";

function groupsOf(text: string) {
  return groupByAssignee(classifyActionItems(text).items);
}

test("기한은 괄호에 쓴 그대로 넣고 기한 빠른 순으로 적는다", () => {
  const [group] = groupsOf("김민수: 견적서 보내기 (10월 15일)\n김민수: 계약서 검토 (10/10)");
  assert.ok(group);
  assert.equal(formatGroupForCopy(group), "김민수\n- 계약서 검토 (10/10)\n- 견적서 보내기 (10월 15일)");
});

test("기한이 없는 항목은 괄호 없이 맨 아래에 적는다", () => {
  const [group] = groupsOf("이영희: 자료 정리\n이영희: 일정 확인 (9/1)");
  assert.ok(group);
  assert.equal(formatGroupForCopy(group), "이영희\n- 일정 확인 (9/1)\n- 자료 정리");
});

test("완료 항목은 복사에서 뺀다", () => {
  const [group] = groupsOf("[x] 박지훈: 보고서 제출 (10/1)\n[ ] 박지훈: 발표 준비 (10/5)");
  assert.ok(group);
  assert.equal(formatGroupForCopy(group), "박지훈\n- 발표 준비 (10/5)");
  assert.equal(hasCopyableItems(group), true);
});

test("모두 완료면 이름만 남고 복사할 수 없다", () => {
  const [group] = groupsOf("[x] 박지훈: 보고서 제출 (10/1)");
  assert.ok(group);
  assert.equal(formatGroupForCopy(group), "박지훈");
  assert.equal(hasCopyableItems(group), false);
});

test("HTML 문자는 해석하지 않고 그대로 둔다", () => {
  const group = {
    assignee: "Jim Corners",
    items: [{ assignee: "Jim Corners", task: "<b>확인</b>", done: false }],
  };
  assert.equal(formatGroupForCopy(group), "Jim Corners\n- <b>확인</b>");
});
