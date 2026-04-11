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

function getWidgetIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
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

function getStatusText(count) {
  if (count === 0) return { text: "Start your streak 🚀", color: "#aaa" };
  if (count < 5) return { text: "Getting started...", color: "#4caf50" };
  if (count < 10) return { text: "Nice consistency 👀", color: "#00bcd4" };
  if (count < 20) return { text: "Impressive 🔥", color: "#ff9800" };
  if (count < 50) return { text: "You're unstoppable 💪", color: "#ff5722" };
  return { text: "LEGEND STATUS 👑", color: "#ffd700" };
}

function updateWidgetTitle(id, newTitle) {
  const widgets = getWidgetList();
  const widget = widgets.find((w) => w.id === id);
  if (!widget) return;

  widget.title = newTitle;
  saveWidgetList(widgets);
}

/* Dashboard page */
const widgetListEl = document.getElementById("widget-list");
const createBtn = document.getElementById("create-widget-btn");

if (widgetListEl && createBtn) {
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return Promise.resolve(prompt("Copy this link:", text));
  }

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
        window.location.href = `widget.html?id=${encodeURIComponent(id)}`;
      });
    });

    widgetListEl.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-copy");
        const link = `${window.location.origin}${window.location.pathname.replace(/index\.html$/, "")}widget.html?id=${encodeURIComponent(id)}`;
        try {
          await copyText(link);
          btn.textContent = "Copied";
          setTimeout(() => (btn.textContent = "Copy link"), 1200);
        } catch {
          alert("Could not copy the link.");
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

    widgets.push({
      id,
      title: title.trim(),
    });

    saveWidgetList(widgets);
    renderDashboard();
    window.location.href = `widget.html?id=${encodeURIComponent(id)}`;
  });

  renderDashboard();
}

/* Widget page */
const counterEl = document.getElementById("counter");
const statusEl = document.getElementById("status");
const widgetTitleEl = document.getElementById("widget-title");

if (counterEl && statusEl && widgetTitleEl) {
  const widgetId = getWidgetIdFromUrl();

  if (!widgetId) {
    widgetTitleEl.textContent = "🔥 Streak";
    statusEl.textContent = "No widget selected.";
    counterEl.textContent = "—";
  } else {
    const widgets = getWidgetList();
    const widget = widgets.find((w) => w.id === widgetId);

    if (widget) {
      widgetTitleEl.textContent = `🔥 ${widget.title}`;

      widgetTitleEl.addEventListener("click", () => {
        const widgetsNow = getWidgetList();
        const currentWidget = widgetsNow.find((w) => w.id === widgetId);
        if (!currentWidget) return;

        const newTitle = prompt("Edit widget title:", currentWidget.title);
        if (!newTitle || !newTitle.trim()) return;

        currentWidget.title = newTitle.trim();
        saveWidgetList(widgetsNow);
        widgetTitleEl.textContent = `🔥 ${currentWidget.title}`;
      });
    } else {
      widgetTitleEl.textContent = "🔥 Streak";
    }
  }

  let count = widgetId ? getCount(widgetId) : 0;

  function updateUI() {
    counterEl.textContent = count;

    const state = getStatusText(count);
    statusEl.textContent = state.text;
    counterEl.style.color = state.color;

    if (widgetId) {
      setCount(widgetId, count);
    }
  }

  window.increase = function () {
    count++;
    updateUI();
  };

  window.decrease = function () {
    if (count > 0) {
      count--;
      updateUI();
    }
  };

  window.reset = function () {
    count = 0;
    updateUI();
  };

  updateUI();
}
