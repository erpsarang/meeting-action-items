import assert from "node:assert/strict";
import test from "node:test";
import { parseActionItems } from "../src/action-items.js";

test("체크박스와 기한이 있는 줄을 할 일로 뽑는다", () => {
  assert.deepEqual(parseActionItems("- [ ] 김민수: 견적서 보내기 (10/15)"), [
    { assignee: "김민수", task: "견적서 보내기", due: "10/15", done: false },
  ]);
});

test("체크박스가 없어도 이름: 할 일 모양이면 뽑는다", () => {
  assert.deepEqual(parseActionItems("이영희: 계약서 검토"), [
    { assignee: "이영희", task: "계약서 검토", done: false },
  ]);
});

test("완료 표시된 줄도 done=true로 포함한다", () => {
  assert.deepEqual(parseActionItems("- [x] 박지훈: 보고서 제출 (10/20)"), [
    { assignee: "박지훈", task: "보고서 제출", due: "10/20", done: true },
  ]);
});

test("이름 형식 5종을 모두 허용한다", () => {
  const names = ["김민수", "한이정아", "안드레아스", "Andrej", "Jim Corners"];
  const result = parseActionItems(names.map((n) => `${n}: 자료 준비`).join("\n"));
  assert.deepEqual(
    result.map((i) => i.assignee),
    names,
  );
});

test("전각 콜론도 허용한다", () => {
  assert.equal(parseActionItems("김민수：자료 준비")[0]?.task, "자료 준비");
});

test("그냥 메모 줄은 제외한다", () => {
  const text = [
    "오늘 회의는 잘 끝났다",
    "10:30 회의 시작",
    "참고 http://example.com",
    "http://example.com/a",
    "김민수:",
    "",
  ].join("\n");
  assert.deepEqual(parseActionItems(text), []);
});

test("메모가 섞여 있으면 할 일 줄만 순서대로 뽑는다", () => {
  const text = "회의 메모입니다\n- [ ] 김민수: 견적서 보내기\n그냥 메모\n이영희: 계약서 검토";
  assert.deepEqual(
    parseActionItems(text).map((i) => i.assignee),
    ["김민수", "이영희"],
  );
});

test("안건과 결정 줄은 담당자로 뽑지 않는다", () => {
  assert.deepEqual(parseActionItems("안건: 예산\n결정: 예산 확정\n- [ ] 안건: 예산"), []);
});
