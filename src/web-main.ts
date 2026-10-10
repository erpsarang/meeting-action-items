import { parseActionItems } from "./action-items.js";
import { appInfo } from "./app-info.js";

document.querySelector<HTMLElement>("#app-title")!.textContent = appInfo.title;
document.querySelector<HTMLElement>("#app-description")!.textContent = appInfo.description;

const input = document.querySelector<HTMLTextAreaElement>("#minutes-input")!;
const list = document.querySelector<HTMLUListElement>("#action-items")!;
const empty = document.querySelector<HTMLElement>("#action-items-empty")!;

function render(): void {
  const items = parseActionItems(input.value);
  list.replaceChildren(
    ...items.map((item) => {
      const li = document.createElement("li");
      const due = item.due ? ` (${item.due})` : "";
      li.textContent = `${item.done ? "[완료] " : ""}${item.assignee}: ${item.task}${due}`;
      if (item.done) {
        li.className = "done";
        li.style.textDecoration = "line-through";
      }
      return li;
    }),
  );
  empty.hidden = items.length > 0;
}

input.addEventListener("input", render);
render();
