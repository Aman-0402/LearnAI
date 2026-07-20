// js/main.js
import { renderTopbar } from "./modules/shell/topbar.js";
import { renderSidebar, setActiveLink } from "./modules/shell/sidebar.js";
import { createEl } from "./utils/dom.js";
import { getSettings } from "./storage/settings-store.js";

const isDesktop = () => window.matchMedia("(min-width: 1025px)").matches;

async function bootstrap() {
  const app = document.getElementById("app");

  const settings = getSettings();
  document.documentElement.setAttribute("data-reduced-motion", String(settings.reducedMotion));

  let sidebarOpen = isDesktop();

  const shell = createEl("div", { className: "app-shell" });
  const scrim = createEl("div", { className: "sidebar-scrim" });
  const skipLink = createEl("a", { className: "skip-link", attrs: { href: "#main-content" }, text: "Skip to content" });

  const setSidebarOpen = (open) => {
    sidebarOpen = open;
    sidebarEl.setAttribute("data-open", String(open));
    scrim.setAttribute("data-open", String(open));
    shell.setAttribute("data-sidebar-open", String(open));
  };

  const topbar = renderTopbar({
    onHamburgerClick: () => {
      setSidebarOpen(!sidebarOpen);
    }
  });
  topbar.classList.add("app-topbar");

  const initialRoute = (location.hash.replace(/^#\//, "") || "dashboard");
  const sidebarEl = await renderSidebar({ activeRoute: initialRoute });
  sidebarEl.classList.add("app-sidebar");

  setSidebarOpen(sidebarOpen);

  scrim.addEventListener("click", () => {
    setSidebarOpen(false);
  });

  window.addEventListener("hashchange", () => {
    if (!isDesktop()) {
      setSidebarOpen(false);
    }
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
