import assert from "node:assert/strict";
import test from "node:test";
import { appInfo } from "../src/app-info.js";

test("화면 머리에 App 이름과 설명을 보여 준다", () => {
  assert.equal(appInfo.title, "회의록 할 일 정리");
  assert.match(appInfo.description, /회의록/);
});
