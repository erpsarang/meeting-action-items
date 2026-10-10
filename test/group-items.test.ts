import assert from "node:assert/strict";
import test from "node:test";
import { parseActionItems } from "../src/action-items.js";
import { groupByAssignee } from "../src/group-items.js";

test("담당자를 첫 등장 순서로 묶는다", () => {
  const groups = groupByAssignee(
    parseActionItems("김민수: 가\n이영희: 나\n김민수: 다"),
  );
  assert.deepEqual(
    groups.map((g) => g.assignee),
    ["김민수", "이영희"],
  );
  assert.equal(groups[0]?.items.length, 2);
});

test("묶음 안에서 기한이 빠른 순으로 정렬한다", () => {
  const groups = groupByAssignee(
    parseActionItems("김민수: 견적서 보내기 (10/15)\n김민수: 계약서 검토 (10/10)"),
  );
  assert.deepEqual(
    groups[0]?.items.map((i) => i.due),
    ["10/10", "10/15"],
  );
});

test("월이 다르면 월 순서로 정렬한다", () => {
  const groups = groupByAssignee(
    parseActionItems("김민수: 가 (11/1)\n김민수: 나 (9/30)"),
  );
  assert.deepEqual(
    groups[0]?.items.map((i) => i.due),
    ["9/30", "11/1"],
  );
});

test("기한이 없거나 해석되지 않는 항목은 맨 아래에 두고 순서를 유지한다", () => {
  const groups = groupByAssignee(
    parseActionItems("이영희: 자료 정리\n이영희: 다음 주 (곧)\n이영희: 검토 (10/10)\n이영희: 마무리"),
  );
  assert.deepEqual(
    groups[0]?.items.map((i) => i.task),
    ["검토", "자료 정리", "다음 주", "마무리"],
  );
});

test("완료 항목도 목록에 남고 같은 기준으로 정렬한다", () => {
  const groups = groupByAssignee(
    parseActionItems("- [x] 김민수: 가 (10/20)\n- [ ] 김민수: 나 (10/01)"),
  );
  assert.deepEqual(
    groups[0]?.items.map((i) => [i.task, i.done]),
    [
      ["나", false],
      ["가", true],
    ],
  );
});

test("빈 목록은 빈 묶음이다", () => {
  assert.deepEqual(groupByAssignee([]), []);
});

test("연말과 연초에 걸친 연도 없는 기한도 실제 기한 빠른 순으로 정렬한다", () => {
  const today = new Date(2026, 11, 20);
  for (const text of [
    "김철수: 결산 보고 (12/30)\n김철수: 신년 계획 (1/5)",
    "김철수: 신년 계획 (1/5)\n김철수: 결산 보고 (12/30)",
  ]) {
    const groups = groupByAssignee(parseActionItems(text), today);
    assert.deepEqual(
      groups[0]?.items.map((i) => i.due),
      ["12/30", "1/5"],
    );
  }
});

test("연도가 적힌 기한이 있는 묶음은 그 연도를 연도 없는 기한에 적용한다", () => {
  const groups = groupByAssignee(
    parseActionItems("김철수: 가 (1/5)\n김철수: 나 (2027-01-03)"),
    new Date(2026, 11, 20),
  );
  assert.deepEqual(
    groups[0]?.items.map((i) => i.due),
    ["2027-01-03", "1/5"],
  );
});

test("183일까지는 같은 해, 184일부터는 다음 해로 본다", () => {
  const groups = groupByAssignee(
    parseActionItems("김철수: 가 (6/19)\n김철수: 나 (6/20)"),
    new Date(2026, 11, 20),
  );
  assert.deepEqual(
    groups[0]?.items.map((i) => i.due),
    ["6/20", "6/19"],
  );
});
