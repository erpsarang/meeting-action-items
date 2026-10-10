import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("index.html은 필수 id와 입력 label을 가진다", () => {
  for (const id of ["app-title", "app-description", "minutes-input", "action-items-empty", "action-items"]) {
    assert.ok(html.includes(`id="${id}"`), `${id} 없음`);
  }
  assert.match(html, /<label for="minutes-input">/);
});

test("index.html은 styles.css를 연결한다", () => {
  assert.match(html, /<link rel="stylesheet" href="\/src\/styles\.css" \/>/);
});

test("index.html과 styles.css에는 외부 URL이 없다", () => {
  assert.doesNotMatch(html, /https?:\/\//);
  assert.doesNotMatch(css, /https?:\/\//);
  assert.doesNotMatch(css, /@import/);
});
