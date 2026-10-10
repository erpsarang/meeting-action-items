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
    "10:30 회의 시작",
    "김철수:",
    "한 두 세 네 단어: 내용",
    "  오늘 회의는 잘 끝났다  ",
  ].join("\n");
  assert.deepEqual(collectUnreadLines(text), [
    "10:30 회의 시작",
    "김철수:",
    "한 두 세 네 단어: 내용",
  ]);
});

test("새 형식 줄도 안건·결정 이름이 있으면 읽지 않고 모으지도 않는다", () => {
  const text = "1. 안건: 예산\n**결정**: 예산 확정\n김철수, 안건: 가\n결정 - 예산";
  assert.deepEqual(classifyActionItems(text), { items: [], unclear: [] });
  assert.deepEqual(collectUnreadLines(text), []);
});

test("번호·굵은 이름·괄호·여러 담당자는 확정 신호가 있으면 할 일이다", () => {
  const text = [
    "1. 김철수: 견적 회신 (10/20)",
    "2) 이영희: 계약서 검토 (10/22)",
    "**박지훈:** 일정 조율 (10/25)",
    "최민수(개발): 로그 확인 (10/22)",
    "정하나, 한지우: 회의실 예약 (10/30)",
  ].join("\n");
  const result = classifyActionItems(text);
  assert.deepEqual(result.unclear, []);
  assert.deepEqual(
    result.items.map((i) => [i.assignee, i.task, i.due]),
    [
      ["김철수", "견적 회신", "10/20"],
      ["이영희", "계약서 검토", "10/22"],
      ["박지훈", "일정 조율", "10/25"],
      ["최민수", "(개발) 로그 확인", "10/22"],
      ["정하나", "회의실 예약", "10/30"],
      ["한지우", "회의실 예약", "10/30"],
    ],
  );
});

test("4줄 회의록 예시: 하이픈 줄은 확정된 담당자 묶음으로 승격된다", () => {
  const text = [
    "1. 김철수: 견적 회신 (10/20)",
    "2) 이영희: 계약서 검토 (10/22)",
    "**박지훈**: 일정 조율 (10/25)",
    "김철수 - 자료 정리",
  ].join("\n");
  const result = classifyActionItems(text);
  assert.deepEqual(result.unclear, []);
  assert.deepEqual(
    result.items.map((i) => [i.assignee, i.task, i.due]),
    [
      ["김철수", "견적 회신", "10/20"],
      ["이영희", "계약서 검토", "10/22"],
      ["박지훈", "일정 조율", "10/25"],
      ["김철수", "자료 정리", undefined],
    ],
  );
});

test("신호 없는 새 형식 줄은 확인이 필요한 줄에 남는다", () => {
  const result = classifyActionItems("김철수 - 견적 회신\n**이영희**: 계약서 검토");
  assert.deepEqual(result.items, []);
  assert.deepEqual(
    result.unclear.map((i) => [i.assignee, i.task]),
    [
      ["김철수", "견적 회신"],
      ["이영희", "계약서 검토"],
    ],
  );
});

test("URL 줄과 없는 날짜는 새 형식에서도 할 일이 아니다", () => {
  const result = classifyActionItems("http://example.com/a\n김철수: 보고 (13월 40일)");
  assert.deepEqual(result.items, []);
  assert.deepEqual(result.unclear.map((i) => i.assignee), ["김철수"]);
});

test("읽은 줄과 안건·결정 줄, 빈 줄은 읽지 못한 줄에 넣지 않는다", () => {
  const text = "김철수: 견적 회신 (10/20)\n참고: 이전 회의록\n안건: 예산\n결정: 예산 확정\n\n   ";
  assert.deepEqual(collectUnreadLines(text), []);
});

test("형식 안내 문구가 있다", () => {
  assert.ok(FORMAT_HINT.includes("김철수: 견적 회신 (10/20)"));
  assert.ok(FORMAT_GUIDE.includes("이름: 할 일"));
});
