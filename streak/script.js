const WIDGET_LIST_KEY = "streak_widget_list";

function getWidgetList() {
  try {
    return JSON.parse(localStorage.getItem(WIDGET_LIST_KEY)) || [];
  } catch {
    return [];
  }
}

function saveWidgetList(list) {
  localStorage.setItem(WIDGET_LIST_KEY, JSON.stringify(list));
}

function makeId(title) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  return `${base || "widget"}_${Date.now().toString(36)}`;
}

function getCountKey(id) {
  return `streak_count_${id}`;
}

function getCount(id) {
  const raw = localStorage.getItem(getCountKey(id));
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function setCount(id, value) {
  localStorage.setItem(getCountKey(id), String(value));
}

/* Dashboard page */
const widgetListEl = document.getElementById("widget-list");
const createBtn = document.getElementById("create-widget-btn");

if (widgetListEl && createBtn) {
  function renderDashboard() {
    const widgets = getWidgetList();
    widgetListEl.innerHTML = "";

    if (widgets.length === 0) {
      widgetListEl.innerHTML = `
        <div class="widget-card">
          <h3>No widgets yet</h3>
          <p>Create your first streak widget.</p>
        </div>
      `;
      return;
    }

    widgets.forEach((widget) => {
      const count = getCount(widget.id);

      const card = document.createElement("div");
      card.className = "widget-card";
      card.innerHTML = `
        <h3>🔥 ${widget.title}</h3>
        <p>Current streak: ${count}</p>
        <div class="widget-actions">
          <button class="small-btn" data-open="${widget.id}">Open</button>
          <button class="small-btn" data-copy="${widget.id}">Copy link</button>
          <button class="small-btn" data-edit="${widget.id}">Edit</button>
          <button class="small-btn" data-delete="${widget.id}">Delete</button>
        </div>
      `;
      widgetListEl.appendChild(card);
    });

    widgetListEl.querySelectorAll("[data-open]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-open");
        window.location.href = `streaks_widgets/widget.html?id=${encodeURIComponent(id)}`;
      });
    });

    widgetListEl.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-copy");
        const link = `${window.location.origin}${window.location.pathname.replace(/index\.html$/, "")}streaks_widgets/widget.html?id=${encodeURIComponent(id)}`;

        try {
          await navigator.clipboard.writeText(link);
          btn.textContent = "Copied";
          setTimeout(() => (btn.textContent = "Copy link"), 1200);
        } catch {
          prompt("Copy this link:", link);
        }
      });
    });

    widgetListEl.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-edit");
        const widgets = getWidgetList();
        const widget = widgets.find((w) => w.id === id);
        if (!widget) return;

        const newTitle = prompt("Edit widget name:", widget.title);
        if (!newTitle || !newTitle.trim()) return;

        widget.title = newTitle.trim();
        saveWidgetList(widgets);
        renderDashboard();
      });
    });

    widgetListEl.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-delete");

        if (!confirm("Delete this widget?")) return;

        let widgets = getWidgetList();
        widgets = widgets.filter((w) => w.id !== id);

        localStorage.removeItem(getCountKey(id));
        saveWidgetList(widgets);
        renderDashboard();
      });
    });
  }

  createBtn.addEventListener("click", () => {
    const title = prompt("Enter widget title:");
    if (!title || !title.trim()) return;

    const widgets = getWidgetList();
    const id = makeId(title);

    widgets.push({ id, title: title.trim() });
    saveWidgetList(widgets);

    renderDashboard();
    window.location.href = `streaks_widgets/widget.html?id=${encodeURIComponent(id)}`;
  });

  renderDashboard();
}
