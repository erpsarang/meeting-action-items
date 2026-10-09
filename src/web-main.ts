import { appInfo } from "./app-info.js";

document.querySelector<HTMLElement>("#app-title")!.textContent = appInfo.title;
document.querySelector<HTMLElement>("#app-description")!.textContent = appInfo.description;
