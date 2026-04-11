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
