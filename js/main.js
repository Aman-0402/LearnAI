// js/main.js
import { renderTopbar } from "./modules/shell/topbar.js";
import { renderSidebar, setActiveLink } from "./modules/shell/sidebar.js";
import { createEl } from "./utils/dom.js";

async function bootstrap() {
  const app = document.getElementById("app");

  let sidebarOpen = false;

  const shell = createEl("div", { className: "app-shell" });
  const scrim = createEl("div", { className: "sidebar-scrim" });
  const skipLink = createEl("a", { className: "skip-link", attrs: { href: "#main-content" }, text: "Skip to content" });

  const topbar = renderTopbar({
    onHamburgerClick: () => {
      sidebarOpen = !sidebarOpen;
      sidebarEl.setAttribute("data-open", String(sidebarOpen));
      scrim.setAttribute("data-open", String(sidebarOpen));
    }
  });
  topbar.classList.add("app-topbar");

  const initialRoute = (location.hash.replace(/^#\//, "") || "dashboard");
  const sidebarEl = await renderSidebar({ activeRoute: initialRoute });
  sidebarEl.classList.add("app-sidebar");

  scrim.addEventListener("click", () => {
    sidebarOpen = false;
    sidebarEl.setAttribute("data-open", "false");
    scrim.setAttribute("data-open", "false");
  });

  window.addEventListener("hashchange", () => {
    sidebarOpen = false;
    sidebarEl.setAttribute("data-open", "false");
    scrim.setAttribute("data-open", "false");
  });

  const main = createEl("main", { className: "app-main", attrs: { id: "main-content" } });

  shell.appendChild(topbar);
  shell.appendChild(sidebarEl);
  shell.appendChild(main);

  app.innerHTML = "";
  app.appendChild(skipLink);
  app.appendChild(shell);
  app.appendChild(scrim);

  const { initRouter } = await import("./router.js");
  initRouter(main, (activeRoute) => setActiveLink(sidebarEl, activeRoute));
}

bootstrap().catch((err) => {
  console.error("Failed to bootstrap app:", err);
  const app = document.getElementById("app");
  app.innerHTML = '<p style="padding: 24px;">Something went wrong loading the app. Please refresh the page.</p>';
});
