import assert from "node:assert/strict";
import test from "node:test";
import {
  FORMAT_GUIDE,
  FORMAT_HINT,
  classifyActionItems,
  collectUnreadLines,
  parseActionItems,
} from "../src/action-items.js";

test("신호 없는 `참고: 이전 회의록`은 확인이 필요한 줄에 나온다", () => {
  const result = classifyActionItems("참고: 이전 회의록");
  assert.deepEqual(result.items, []);
  assert.deepEqual(result.unclear, [{ assignee: "참고", task: "이전 회의록", done: false }]);
});

test("같은 회의록에 확정된 담당자면 신호 없는 줄도 그 사람 묶음에 넣는다", () => {
  const result = classifyActionItems("이영희: 계약서 검토 (10/12)\n이영희: 자료 정리");
  assert.deepEqual(
    result.items.map((i) => i.task),
    ["계약서 검토", "자료 정리"],
  );
  assert.deepEqual(result.unclear, []);
});

test("확정 줄이 뒤에 나와도 앞의 줄을 승격하고 순서를 유지한다", () => {
  const result = classifyActionItems("이영희: 자료 정리\n이영희: 계약서 검토 (10/12)");
  assert.deepEqual(
    result.items.map((i) => i.task),
    ["자료 정리", "계약서 검토"],
  );
  assert.deepEqual(result.unclear, []);
});

test("신호 없는 줄만 있으면 확인이 필요한 줄에 나온다", () => {
  const result = classifyActionItems("이영희: 자료 정리");
  assert.deepEqual(result.items, []);
  assert.equal(result.unclear.length, 1);
  assert.equal(result.unclear[0]?.assignee, "이영희");
});

test("체크박스가 있으면 확정이다", () => {
  const result = classifyActionItems("- [ ] 김민수: 견적서 보내기\n김민수: 메모");
  assert.equal(result.items.length, 2);
  assert.deepEqual(result.unclear, []);
});

test("M/D가 아닌 괄호는 신호가 아니다", () => {
  const result = classifyActionItems("이영희: 다음 주 (곧)");
  assert.deepEqual(result.items, []);
  assert.equal(result.unclear.length, 1);
});

test("이름이 정확히 같을 때만 승격한다", () => {
  const result = classifyActionItems("Jim Corners: 가 (10/1)\nJim: 나");
  assert.deepEqual(
    result.items.map((i) => i.assignee),
    ["Jim Corners"],
  );
  assert.deepEqual(
    result.unclear.map((i) => i.assignee),
    ["Jim"],
  );
});

test("안건과 결정은 지금처럼 제외된다", () => {
  const result = classifyActionItems("안건: 예산\n결정: 예산 확정");
  assert.deepEqual(result, { items: [], unclear: [] });
});

test("parseActionItems는 신호와 관계없이 모든 줄을 그대로 돌려준다", () => {
  assert.equal(parseActionItems("참고: 이전 회의록").length, 1);
});

test("읽지 못한 줄 중 콜론이 있는 줄을 원문 그대로 순서대로 모은다", () => {
  const text = [
    "1. 김철수: 견적 회신 (10/20)",
    "**김철수**: 견적 회신",
    "김철수(개발): 로그 확인",
    "김철수, 이영희：계약서 검토",
    "김철수 - 견적 회신",
    "  오늘 회의는 잘 끝났다  ",
  ].join("\n");
  assert.deepEqual(collectUnreadLines(text), [
    "1. 김철수: 견적 회신 (10/20)",
    "**김철수**: 견적 회신",
    "김철수(개발): 로그 확인",
    "김철수, 이영희：계약서 검토",
  ]);
});

test("읽은 줄과 안건·결정 줄, 빈 줄은 읽지 못한 줄에 넣지 않는다", () => {
  const text = "김철수: 견적 회신 (10/20)\n참고: 이전 회의록\n안건: 예산\n결정: 예산 확정\n\n   ";
  assert.deepEqual(collectUnreadLines(text), []);
});

test("형식 안내 문구가 있다", () => {
  assert.ok(FORMAT_HINT.includes("김철수: 견적 회신 (10/20)"));
  assert.ok(FORMAT_GUIDE.includes("이름: 할 일"));
});
