const STORAGE_KEY = "date_widget_list";

// =========================
// BASE PATH (IMPORTANT FIX)
// =========================

const BASE_PATH = "date_counter_widgets/";

// =========================
// STORAGE HELPERS
// =========================

function getWidgets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveWidgets(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function makeId(title) {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
  ) + "_" + Date.now().toString(36);
}

// =========================
// UI ELEMENTS
// =========================

const widgetListEl = document.getElementById("widget-list");
const createBtn = document.getElementById("create-widget-btn");

// =========================
// RENDER DASHBOARD
// =========================

function render() {
  const widgets = getWidgets();
  widgetListEl.innerHTML = "";

  if (widgets.length === 0) {
    widgetListEl.innerHTML = `
      <div class="widget-card">
        <h3>No counters yet</h3>
        <p>Create your first date counter.</p>
      </div>
    `;
    return;
  }

  widgets.forEach(w => {
    const card = document.createElement("div");
    card.className = "widget-card";

    card.innerHTML = `
      <h3>⏳ ${w.title}</h3>
      <p>${w.quote ? w.quote : "No quote set"}</p>

      <div class="widget-actions">
        <button class="small-btn" data-open="${w.id}">Open</button>
        <button class="small-btn" data-copy="${w.id}">Copy link</button>
        <button class="small-btn" data-edit="${w.id}">Edit</button>
        <button class="small-btn" data-delete="${w.id}">Delete</button>
      </div>
    `;

    widgetListEl.appendChild(card);
  });

  // =========================
  // OPEN WIDGET
  // =========================

  widgetListEl.querySelectorAll("[data-open]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.open;
      window.location.href = `${BASE_PATH}widget.html?id=${id}`;
    };
  });

  // =========================
  // COPY LINK
  // =========================

  widgetListEl.querySelectorAll("[data-copy]").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.copy;

      const link =
        `${window.location.origin}/${BASE_PATH}widget.html?id=${id}`;

      try {
        await navigator.clipboard.writeText(link);
        btn.textContent = "Copied!";
        setTimeout(() => (btn.textContent = "Copy link"), 1200);
      } catch {
        prompt("Copy link:", link);
      }
    };
  });

  // =========================
  // EDIT
  // =========================

  widgetListEl.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.edit;
      const widgets = getWidgets();

      const w = widgets.find(x => x.id === id);
      if (!w) return;

      const newTitle = prompt("Edit title:", w.title);
      if (newTitle && newTitle.trim()) w.title = newTitle.trim();

      const newQuote = prompt("Edit quote:", w.quote || "");
      w.quote = newQuote || "";

      saveWidgets(widgets);
      render();
    };
  });

  // =========================
  // DELETE
  // =========================

  widgetListEl.querySelectorAll("[data-delete]").forEach(btn => {
    btn.onclick = () => {
      if (!confirm("Delete this counter?")) return;

      const id = btn.dataset.delete;
      let widgets = getWidgets();

      widgets = widgets.filter(w => w.id !== id);

      saveWidgets(widgets);
      render();
    };
  });
}

// =========================
// CREATE WIDGET
// =========================

createBtn.addEventListener("click", () => {
  const title = prompt("Enter counter title:");
  if (!title || !title.trim()) return;

  const widgets = getWidgets();

  const newWidget = {
    id: makeId(title),
    title: title.trim(),
    quote: "",
    startDate: null,
    endDate: null,
    milestones: []
  };

  widgets.push(newWidget);
  saveWidgets(widgets);

  render();

  // FIXED PATH (NO 404 ANYMORE)
  window.location.href = `${BASE_PATH}widget.html?id=${newWidget.id}`;
});

// =========================
// INIT
// =========================

render();
