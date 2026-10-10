import assert from "node:assert/strict";
import test from "node:test";
import { classifyActionItems, parseActionItems } from "../src/action-items.js";
import { dueRank, parseDueDate } from "../src/due-date.js";
import { groupByAssignee } from "../src/group-items.js";

test("4개 형식을 해석한다", () => {
  assert.deepEqual(parseDueDate("10/15"), { month: 10, day: 15 });
  assert.deepEqual(parseDueDate("10월 15일"), { month: 10, day: 15 });
  assert.deepEqual(parseDueDate("2026-10-15"), { year: 2026, month: 10, day: 15 });
  assert.deepEqual(parseDueDate("2026/10/15"), { year: 2026, month: 10, day: 15 });
});

test("어느 형식이든 같은 날짜는 같은 순위다", () => {
  assert.equal(dueRank("10/15"), dueRank("10월 15일"));
  assert.equal(dueRank("2026-10-15"), dueRank("2026/10/15"));
});

test("없는 날짜와 다른 표현은 기한이 아니다", () => {
  for (const text of ["13월 40일", "13/40", "2/30", "2026-02-29", "2026-13-01", "곧", "내일", "다음 주", ""]) {
    assert.equal(parseDueDate(text), null, text);
  }
});

test("윤년은 2월 29일을 허용한다", () => {
  assert.notEqual(parseDueDate("2028-02-29"), null);
  assert.notEqual(parseDueDate("2/29"), null);
});

test("기한이 없거나 해석되지 않으면 맨 아래 순위다", () => {
  assert.equal(dueRank(undefined), Number.POSITIVE_INFINITY);
  assert.equal(dueRank("곧"), Number.POSITIVE_INFINITY);
});

test("형식이 달라도 빠른 날짜 순으로 정렬하고 원문을 그대로 둔다", () => {
  const groups = groupByAssignee(
    parseActionItems("김민수: 견적서 보내기 (10월 15일)\n김민수: 계약서 검토 (10/10)"),
  );
  assert.deepEqual(
    groups[0]?.items.map((i) => i.due),
    ["10/10", "10월 15일"],
  );
});

test("연도가 있는 날짜는 연도까지 비교한다", () => {
  const groups = groupByAssignee(
    parseActionItems("이영희: 자료 정리 (2027-01-05)\n이영희: 일정 확인 (2026-12-30)"),
  );
  assert.deepEqual(
    groups[0]?.items.map((i) => i.due),
    ["2026-12-30", "2027-01-05"],
  );
});

test("연도 없는 날짜끼리는 월·일만 비교한다", () => {
  const groups = groupByAssignee(
    parseActionItems("이영희: 가 (1/5)\n이영희: 나 (12/30)"),
  );
  assert.deepEqual(
    groups[0]?.items.map((i) => i.due),
    ["1/5", "12/30"],
  );
});

test("연도 있는 기한과 없는 기한이 섞여도 기한 빠른 순으로 정렬한다", () => {
  const groups = groupByAssignee(
    parseActionItems("김철수: 견적 회신 (10/20)\n김철수: 계약서 검토 (2026-10-15)"),
  );
  assert.deepEqual(
    groups[0]?.items.map((i) => i.due),
    ["2026-10-15", "10/20"],
  );
});

test("형식이 달라도 같은 날짜는 적힌 순서를 유지한다", () => {
  const groups = groupByAssignee(
    parseActionItems("이영희: A (2026-10-15)\n이영희: B (10/15)"),
  );
  assert.deepEqual(
    groups[0]?.items.map((i) => i.task),
    ["A", "B"],
  );
});

test("체크박스가 없어도 새 형식 기한이 있으면 확정된 할 일이다", () => {
  const result = classifyActionItems("박지훈: 보고서 제출 (10월 20일)");
  assert.equal(result.items.length, 1);
  assert.deepEqual(result.unclear, []);
});

test("해석되지 않는 괄호는 확정 신호가 아니다", () => {
  for (const line of ["박지훈: 보고서 제출 (곧)", "박지훈: 보고서 제출 (13월 40일)"]) {
    const result = classifyActionItems(line);
    assert.deepEqual(result.items, [], line);
    assert.equal(result.unclear.length, 1, line);
  }
});
