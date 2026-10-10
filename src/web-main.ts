import {
  FORMAT_GUIDE,
  FORMAT_HINT,
  classifyActionItems,
  collectUnreadLines,
} from "./action-items.js";
import { appInfo } from "./app-info.js";
import { COPY_FAILED_LABEL, formatGroupForCopy, hasCopyableItems } from "./copy-text.js";
import { groupByAssignee } from "./group-items.js";

document.querySelector<HTMLElement>("#app-title")!.textContent = appInfo.title;
document.querySelector<HTMLElement>("#app-description")!.textContent = appInfo.description;

const input = document.querySelector<HTMLTextAreaElement>("#minutes-input")!;
const list = document.querySelector<HTMLUListElement>("#action-items")!;
const empty = document.querySelector<HTMLElement>("#action-items-empty")!;

function render(): void {
  const { items, unclear } = classifyActionItems(input.value);
  const unread = collectUnreadLines(input.value);
  const groupLis = groupByAssignee(items).map((group) => {
      const groupLi = document.createElement("li");
      const title = document.createElement("strong");
      title.textContent = group.assignee;
      const sub = document.createElement("ul");
      sub.append(
        ...group.items.map((item) => {
          const li = document.createElement("li");
          const due = item.due ? ` (${item.due})` : "";
          li.textContent = `${item.done ? "[완료] " : ""}${item.task}${due}`;
          if (item.done) {
            li.className = "done";
            li.style.textDecoration = "line-through";
          }
          return li;
        }),
      );
      const copyButton = document.createElement("button");
      copyButton.type = "button";
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
    const title = document.createElement("strong");
    title.textContent = "확인이 필요한 줄";
    const sub = document.createElement("ul");
    sub.append(
      ...unclear.map((item) => {
        const li = document.createElement("li");
        const due = item.due ? ` (${item.due})` : "";
        li.textContent = `${item.assignee}: ${item.task}${due}`;
        return li;
      }),
    );
    sub.append(
      ...unread.map((line) => {
        const li = document.createElement("li");
        li.textContent = line;
        return li;
      }),
    );
    unclearLi.append(title, sub);
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
input.insertAdjacentElement("afterend", formatHint);

input.addEventListener("input", render);
render();
