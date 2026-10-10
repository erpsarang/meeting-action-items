import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const webMain = readFileSync(new URL("../src/web-main.ts", import.meta.url), "utf8");

test("index.html은 필수 id와 입력 label을 가진다", () => {
  for (const id of ["app-title", "app-description", "minutes-input", "action-items-empty", "action-items"]) {
    assert.ok(html.includes(`id="${id}"`), `${id} 없음`);
  }
  assert.match(html, /<label for="minutes-input">/);
});

test("index.html은 styles.css를 연결한다", () => {
  assert.match(html, /<link rel="stylesheet" href="\/src\/styles\.css" \/>/);
});

test("index.html은 ui5-card 두 개와 제목이 있는 ui5-card-header를 가진다", () => {
  assert.equal((html.match(/<ui5-card>/g) ?? []).length, 2);
  const headers = html.match(/<ui5-card-header\b[^>]*>/g) ?? [];
  assert.equal(headers.length, 2);
  for (const tag of headers) {
    assert.match(tag, /slot="header"/);
    assert.match(tag, /title-text="[^"]+"/);
  }
});

test("index.html의 section은 aria-label을 가진다", () => {
  const sections = html.match(/<section\b[^>]*>/g) ?? [];
  assert.equal(sections.length, 2);
  for (const tag of sections) {
    assert.match(tag, /aria-label="[^"]+"/);
  }
});

test("입력 칸은 accessible-name을 가진 ui5-textarea다", () => {
  const tag = /<ui5-textarea\b[^>]*>/.exec(html);
  assert.ok(tag, "ui5-textarea 없음");
  assert.match(tag[0], /id="minutes-input"/);
  assert.match(tag[0], /accessible-name="[^"]+"/);
});

test("web-main.ts는 글꼴 로딩을 끄고 필요한 UI5 컴포넌트만 import한다", () => {
  assert.match(webMain, /setDefaultFontLoading\(false\)/);
  assert.doesNotMatch(webMain, /Assets\.js/);
  assert.doesNotMatch(webMain, /webcomponents-fiori/);
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
