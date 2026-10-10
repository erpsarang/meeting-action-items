import { setDefaultFontLoading } from "@ui5/webcomponents-base/dist/config/Fonts.js";
import "@ui5/webcomponents/dist/Card.js";
import "@ui5/webcomponents/dist/CardHeader.js";
import "@ui5/webcomponents/dist/TextArea.js";
import type TextArea from "@ui5/webcomponents/dist/TextArea.js";
import "@ui5/webcomponents/dist/Button.js";
import type Button from "@ui5/webcomponents/dist/Button.js";
import "@ui5/webcomponents/dist/List.js";
import type List from "@ui5/webcomponents/dist/List.js";
import "@ui5/webcomponents/dist/ListItemStandard.js";
import type ListItemStandard from "@ui5/webcomponents/dist/ListItemStandard.js";
import "@ui5/webcomponents/dist/MessageStrip.js";
import type MessageStrip from "@ui5/webcomponents/dist/MessageStrip.js";
import {
  FORMAT_GUIDE,
  FORMAT_HINT,
  classifyActionItems,
  collectUnreadLines,
} from "./action-items.js";
import { appInfo } from "./app-info.js";
import { COPY_FAILED_LABEL, formatGroupForCopy, hasCopyableItems } from "./copy-text.js";
import { groupByAssignee } from "./group-items.js";

setDefaultFontLoading(false);

document.querySelector<HTMLElement>("#app-title")!.textContent = appInfo.title;
document.querySelector<HTMLElement>("#app-description")!.textContent = appInfo.description;

const input = document.querySelector<TextArea>("#minutes-input")!;
const list = document.querySelector<HTMLUListElement>("#action-items")!;
const empty = document.querySelector<HTMLElement>("#action-items-empty")!;

function createItem(text: string, done = false): ListItemStandard {
  const li = document.createElement("ui5-li") as ListItemStandard;
  li.text = text;
  if (done) {
    li.className = "done";
  }
  return li;
}

function createList(): List {
  const items = document.createElement("ui5-list") as List;
  items.className = "items";
  return items;
}

function render(): void {
  const { items, unclear } = classifyActionItems(input.value);
  const unread = collectUnreadLines(input.value);
  const groupLis = groupByAssignee(items).map((group) => {
      const groupLi = document.createElement("li");
      groupLi.className = "group";
      const title = document.createElement("strong");
      title.textContent = group.assignee;
      title.className = "group-title";
      const sub = createList();
      sub.append(
        ...group.items.map((item) => {
          const due = item.due ? ` (${item.due})` : "";
          return createItem(`${item.done ? "[완료] " : ""}${item.task}${due}`, item.done);
        }),
      );
      const copyButton = document.createElement("ui5-button") as Button;
      copyButton.design = "Default";
      copyButton.accessibleName = `${group.assignee} 할 일 복사`;
      copyButton.setAttribute("aria-live", "polite");
      copyButton.textContent = "복사";
      copyButton.disabled = !hasCopyableItems(group);
      let manualCopy: HTMLTextAreaElement | undefined;
      copyButton.addEventListener("click", () => {
        const text = formatGroupForCopy(group);
        Promise.resolve()
          .then(() => navigator.clipboard.writeText(text))
          .then(
            () => {
              copyButton.textContent = "복사됨";
              setTimeout(() => {
                copyButton.textContent = "복사";
              }, 1500);
            },
            () => {
              copyButton.textContent = COPY_FAILED_LABEL;
              setTimeout(() => {
                copyButton.textContent = "복사";
              }, 1500);
              if (!manualCopy) {
                manualCopy = document.createElement("textarea");
                manualCopy.readOnly = true;
                manualCopy.className = "manual-copy";
                manualCopy.setAttribute("aria-label", "복사할 글");
                manualCopy.rows = text.split("\n").length;
                groupLi.append(manualCopy);
              }
              manualCopy.value = text;
              manualCopy.select();
            },
          );
      });
      groupLi.append(title, copyButton, sub);
      return groupLi;
  });
  const extra: HTMLLIElement[] = [];
  if (unclear.length > 0 || unread.length > 0) {
    const unclearLi = document.createElement("li");
    unclearLi.className = "group group-unclear";
    const title = document.createElement("strong");
    title.textContent = "확인이 필요한 줄";
    title.className = "group-title";
    const strip = document.createElement("ui5-message-strip") as MessageStrip;
    strip.design = "Critical";
    strip.hideCloseButton = true;
    const sub = createList();
    sub.append(
      ...unclear.map((item) => {
        const due = item.due ? ` (${item.due})` : "";
        return createItem(`${item.assignee}: ${item.task}${due}`);
      }),
    );
    sub.append(...unread.map((line) => createItem(line)));
    strip.append(title, sub);
    unclearLi.append(strip);
    extra.push(unclearLi);
  }
  list.replaceChildren(...groupLis, ...extra);
  if (items.length === 0 && input.value.trim() !== "") {
    empty.textContent = FORMAT_GUIDE;
    empty.hidden = false;
  } else {
    empty.textContent = "할 일이 없습니다.";
    empty.hidden = items.length > 0 || unclear.length > 0 || unread.length > 0;
  }
}

const formatHint = document.createElement("p");
formatHint.textContent = FORMAT_HINT;
formatHint.className = "hint";
input.insertAdjacentElement("afterend", formatHint);

input.addEventListener("input", render);
render();
