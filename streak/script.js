/**
 * Streak Counter Dashboard – Enhanced
 * Features:
 * - CRUD operations for widgets
 * - Stats dashboard
 * - Search & Sort
 * - Export/Import data
 * - Inline editing
 * - Custom confirmation modal
 * - Modern glass UI
 */

const WIDGET_LIST_KEY = "streak_widget_list";
const WIDGET_COUNT_PREFIX = "streak_count_";

// DOM elements
const widgetListEl = document.getElementById("widget-list");
const createBtn = document.getElementById("create-widget-btn");
const searchInput = document.getElementById("search-input");
const sortSelect = document.getElementById("sort-select");
const totalWidgetsEl = document.getElementById("total-widgets");
const totalStreaksEl = document.getElementById("total-streaks");
const longestStreakEl = document.getElementById("longest-streak");
const exportBtn = document.getElementById("export-data-btn");
const importBtn = document.getElementById("import-data-btn");
const importFileInput = document.getElementById("import-file-input");
const confirmModal = document.getElementById("confirm-modal");
const confirmMessage = document.getElementById("confirm-message");
const confirmCancel = document.getElementById("confirm-cancel");
const confirmOk = document.getElementById("confirm-ok");

// State
let currentWidgets = [];
let deleteResolve = null;

// =============================================
// STORAGE HELPERS
// =============================================
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

function getCountKey(id) {
  return `${WIDGET_COUNT_PREFIX}${id}`;
}

function getCount(id) {
  const raw = localStorage.getItem(getCountKey(id));
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function setCount(id, value) {
  localStorage.setItem(getCountKey(id), String(value));
}

// Generate unique ID
function makeId(title) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return `${base || "widget"}_${Date.now().toString(36)}`;
}

// =============================================
// STATS UPDATE
// =============================================
function updateStats(widgets) {
  const total = widgets.length;
  let sum = 0;
  let max = 0;
  widgets.forEach(w => {
    const count = getCount(w.id);
    sum += count;
    if (count > max) max = count;
  });
  totalWidgetsEl.textContent = total;
  totalStreaksEl.textContent = sum;
  longestStreakEl.textContent = max;
}

// =============================================
// RENDER DASHBOARD
// =============================================
let editingWidgetId = null; // track which card is in edit mode

function renderDashboard() {
  const widgets = getWidgetList();
  currentWidgets = widgets;
  updateStats(widgets);

  if (widgets.length === 0) {
    widgetListEl.innerHTML = `
      <div class="empty-state">
        <h3>✨ No widgets yet</h3>
        <p>Click "Create New Widget" to start tracking your streaks.</p>
      </div>
    `;
    return;
  }

  // Apply search filter
  const searchTerm = searchInput.value.toLowerCase();
  let filtered = widgets.filter(w => w.title.toLowerCase().includes(searchTerm));

  // Apply sort
  const sortValue = sortSelect.value;
  filtered.sort((a, b) => {
    const countA = getCount(a.id);
    const countB = getCount(b.id);
    const dateA = parseInt(a.id.split('_').pop(), 36) || 0;
    const dateB = parseInt(b.id.split('_').pop(), 36) || 0;
    switch (sortValue) {
      case 'name-asc': return a.title.localeCompare(b.title);
      case 'name-desc': return b.title.localeCompare(a.title);
      case 'streak-desc': return countB - countA;
      case 'streak-asc': return countA - countB;
      case 'date-desc': return dateB - dateA;
      case 'date-asc': return dateA - dateB;
      default: return 0;
    }
  });

  widgetListEl.innerHTML = '';
  filtered.forEach(widget => {
    const count = getCount(widget.id);
    const isEditing = (editingWidgetId === widget.id);
    const card = document.createElement('div');
    card.className = 'widget-card';
    card.dataset.id = widget.id;

    if (isEditing) {
      card.innerHTML = `
        <div class="widget-header">
          <span class="widget-icon">${widget.icon || '🔥'}</span>
          <div class="widget-info">
            <div class="edit-form">
              <input type="text" id="edit-title-${widget.id}" value="${escapeHtml(widget.title)}" placeholder="Widget name">
              <input type="text" id="edit-icon-${widget.id}" value="${escapeHtml(widget.icon || '🔥')}" placeholder="Icon (emoji)" maxlength="2">
              <div class="edit-actions">
                <button class="small-btn save-edit" data-id="${widget.id}">Save</button>
                <button class="small-btn cancel-edit" data-id="${widget.id}">Cancel</button>
              </div>
            </div>
          </div>
        </div>
        <div class="widget-streak">${count} <span>day streak</span></div>
      `;
    } else {
      card.innerHTML = `
        <div class="widget-header">
          <span class="widget-icon">${widget.icon || '🔥'}</span>
          <div class="widget-info">
            <h3>${escapeHtml(widget.title)}</h3>
          </div>
        </div>
        <div class="widget-streak">${count} <span>day streak</span></div>
        <div class="widget-actions">
          <button class="small-btn" data-open="${widget.id}">Open</button>
          <button class="small-btn" data-copy="${widget.id}">Copy Link</button>
          <button class="small-btn" data-edit="${widget.id}">Edit</button>
          <button class="small-btn" data-delete="${widget.id}">Delete</button>
        </div>
      `;
    }
    widgetListEl.appendChild(card);
  });

  // Attach event listeners
  attachCardEvents();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function attachCardEvents() {
  // Open
  widgetListEl.querySelectorAll('[data-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.open;
      window.location.href = `streaks_widgets/widget.html?id=${encodeURIComponent(id)}`;
    });
  });

  // Copy link
  widgetListEl.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.copy;
      const link = `${window.location.origin}${window.location.pathname.replace(/index\.html$/, '')}streaks_widgets/widget.html?id=${encodeURIComponent(id)}`;
      try {
        await navigator.clipboard.writeText(link);
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => btn.textContent = originalText, 1500);
      } catch {
        prompt('Copy this link:', link);
      }
    });
  });

  // Edit (enter edit mode)
  widgetListEl.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      editingWidgetId = btn.dataset.edit;
      renderDashboard();
    });
  });

  // Save edit
  widgetListEl.querySelectorAll('.save-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const titleInput = document.getElementById(`edit-title-${id}`);
      const iconInput = document.getElementById(`edit-icon-${id}`);
      const newTitle = titleInput.value.trim();
      const newIcon = iconInput.value.trim() || '🔥';
      if (!newTitle) return;

      const widgets = getWidgetList();
      const widget = widgets.find(w => w.id === id);
      if (widget) {
        widget.title = newTitle;
        widget.icon = newIcon;
        saveWidgetList(widgets);
      }
      editingWidgetId = null;
      renderDashboard();
    });
  });

  // Cancel edit
  widgetListEl.querySelectorAll('.cancel-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      editingWidgetId = null;
      renderDashboard();
    });
  });

  // Delete (custom confirm)
  widgetListEl.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delete;
      const widgets = getWidgetList();
      const widget = widgets.find(w => w.id === id);
      confirmMessage.textContent = `Delete "${widget?.title || 'this widget'}"? This cannot be undone.`;
      showConfirmModal().then(confirmed => {
        if (confirmed) {
          let updated = widgets.filter(w => w.id !== id);
          localStorage.removeItem(getCountKey(id));
          saveWidgetList(updated);
          renderDashboard();
        }
      });
    });
  });
}

// =============================================
// CUSTOM CONFIRM MODAL
// =============================================
function showConfirmModal() {
  return new Promise(resolve => {
    confirmModal.classList.remove('hidden');
    deleteResolve = resolve;
  });
}

confirmCancel.addEventListener('click', () => {
  confirmModal.classList.add('hidden');
  if (deleteResolve) deleteResolve(false);
  deleteResolve = null;
});

confirmOk.addEventListener('click', () => {
  confirmModal.classList.add('hidden');
  if (deleteResolve) deleteResolve(true);
  deleteResolve = null;
});

// Close modal on overlay click
confirmModal.addEventListener('click', (e) => {
  if (e.target === confirmModal) {
    confirmModal.classList.add('hidden');
    if (deleteResolve) deleteResolve(false);
    deleteResolve = null;
  }
});

// =============================================
// CREATE NEW WIDGET
// =============================================
createBtn.addEventListener('click', () => {
  const title = prompt('Enter widget title:');
  if (!title || !title.trim()) return;

  const widgets = getWidgetList();
  const id = makeId(title);
  const icon = prompt('Choose an emoji icon (optional):', '🔥') || '🔥';

  widgets.push({ id, title: title.trim(), icon });
  saveWidgetList(widgets);
  renderDashboard();
  window.location.href = `streaks_widgets/widget.html?id=${encodeURIComponent(id)}`;
});

// =============================================
// SEARCH & SORT
// =============================================
searchInput.addEventListener('input', renderDashboard);
sortSelect.addEventListener('change', renderDashboard);

// =============================================
// EXPORT / IMPORT
// =============================================
exportBtn.addEventListener('click', () => {
  const data = {
    widgets: getWidgetList(),
    counts: Object.fromEntries(
      getWidgetList().map(w => [w.id, getCount(w.id)])
    )
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `streak_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener('click', () => importFileInput.click());

importFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.widgets) {
        saveWidgetList(data.widgets);
        if (data.counts) {
          Object.entries(data.counts).forEach(([id, count]) => setCount(id, count));
        }
        renderDashboard();
        alert('Data imported successfully!');
      } else {
        alert('Invalid backup file.');
      }
    } catch (err) {
      alert('Failed to parse file.');
    }
  };
  reader.readAsText(file);
  importFileInput.value = '';
});

// =============================================
// INIT
// =============================================
renderDashboard();
