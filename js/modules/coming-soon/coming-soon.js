// js/modules/coming-soon/coming-soon.js
import { createEl } from "../../utils/dom.js";

export function mount(container, meta = {}) {
  const { title = "This section", phase = "a future phase" } = meta;

  const icon = createEl("div", { className: "coming-soon__icon" });
  icon.innerHTML = '<i data-lucide="hammer"></i>';

  const heading = createEl("h2", { text: title });
  const body = createEl("p", {
    text: `${title} is being built in ${phase}. Check back soon.`
  });
  const badge = createEl("div", { className: "coming-soon__phase", text: phase });

  const card = createEl("div", {
    className: "coming-soon",
    children: [icon, heading, body, badge]
  });

  container.innerHTML = "";
  container.appendChild(card);

  if (window.lucide) window.lucide.createIcons();
}

export function unmount() {
  /* no listeners/timers to clean up */
}
