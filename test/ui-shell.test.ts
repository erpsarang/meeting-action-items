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

test("index.html의 section은 aria-labelledby로 제목과 연결된다", () => {
  const sections = html.match(/<section\b[^>]*>/g) ?? [];
  assert.equal(sections.length, 2);
  for (const tag of sections) {
    const match = /aria-labelledby="([^"]+)"/.exec(tag);
    assert.ok(match, `aria-labelledby 없음: ${tag}`);
    assert.ok(html.includes(`id="${match[1]}"`), `${match[1]} 제목 없음`);
  }
});

test("styles.css는 포커스 표시와 좁은 화면 규칙을 가진다", () => {
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media/);
});

test("styles.css는 url()로 리소스를 불러오지 않는다", () => {
  assert.doesNotMatch(css, /url\(/);
});

test("index.html과 styles.css에는 외부 URL이 없다", () => {
  assert.doesNotMatch(html, /https?:\/\//);
  assert.doesNotMatch(css, /https?:\/\//);
  assert.doesNotMatch(css, /@import/);
});
