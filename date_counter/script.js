/**
 * Date Counter Dashboard – Polished Edition
 * Features: stats, search, sort, export/import, modal create/edit
 */

const STORAGE_KEY = "date_widget_list";
const BASE_PATH = "date_counter_widgets/";

// DOM Elements
const widgetListEl = document.getElementById('widget-list');
const createBtn = document.getElementById('create-widget-btn');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const totalWidgetsEl = document.getElementById('total-widgets');
const activeCountersEl = document.getElementById('active-counters');
const exportBtn = document.getElementById('export-data-btn');
const importBtn = document.getElementById('import-data-btn');
const importFileInput = document.getElementById('import-file-input');

// Modals
const widgetModal = document.getElementById('widget-modal');
const modalTitle = document.getElementById('modal-title');
const widgetForm = document.getElementById('widget-form');
const widgetIdInput = document.getElementById('widget-id');
const widgetTitleInput = document.getElementById('widget-title-input');
const widgetQuoteInput = document.getElementById('widget-quote-input');
const startDateInput = document.getElementById('start-date-input');
const endDateInput = document.getElementById('end-date-input');
const modalCancel = document.getElementById('modal-cancel');

const confirmModal = document.getElementById('confirm-modal');
const confirmMessage = document.getElementById('confirm-message');
const confirmCancel = document.getElementById('confirm-cancel');
const confirmOk = document.getElementById('confirm-ok');

let pendingDeleteId = null;
let editingId = null;

// =============================================
// STORAGE HELPERS
// =============================================
function getWidgets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveWidgets(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function makeId(title) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + '_' + Date.now().toString(36);
}

// =============================================
// UTILITY: Calculate days difference
// =============================================
function getDaysBetween(start, end) {
  if (!start && !end) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  if (startDate && !endDate) {
    const diff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    return { value: Math.abs(diff), type: diff >= 0 ? 'since' : 'until' };
  }
  if (!startDate && endDate) {
    const diff = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
    return { value: Math.abs(diff), type: diff >= 0 ? 'until' : 'since' };
  }
  if (startDate && endDate) {
    const diff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    return { value: Math.abs(diff), type: 'total' };
  }
  return null;
}

function formatPreview(widget) {
  const diff = getDaysBetween(widget.startDate, widget.endDate);
  if (!diff) return { text: '—', label: 'No dates set' };
  if (diff.type === 'since') return { text: diff.value, label: `day${diff.value !== 1 ? 's' : ''} since` };
  if (diff.type === 'until') return { text: diff.value, label: `day${diff.value !== 1 ? 's' : ''} until` };
  return { text: diff.value, label: `total day${diff.value !== 1 ? 's' : ''}` };
}

// =============================================
// RENDER DASHBOARD
// =============================================
function updateStats(widgets) {
  totalWidgetsEl.textContent = widgets.length;
  const active = widgets.filter(w => w.startDate || w.endDate).length;
  activeCountersEl.textContent = active;
}

function render() {
  let widgets = getWidgets();
  updateStats(widgets);

  if (widgets.length === 0) {
    widgetListEl.innerHTML = `<div class="empty-state"><h3>⏳ No counters yet</h3><p>Click "Create New Counter" to start tracking dates.</p></div>`;
    return;
  }

  const searchTerm = searchInput.value.toLowerCase();
  widgets = widgets.filter(w => w.title.toLowerCase().includes(searchTerm));

  const sortValue = sortSelect.value;
  widgets.sort((a, b) => {
    const dateA = parseInt(a.id.split('_').pop(), 36) || 0;
    const dateB = parseInt(b.id.split('_').pop(), 36) || 0;
    switch (sortValue) {
      case 'name-asc': return a.title.localeCompare(b.title);
      case 'name-desc': return b.title.localeCompare(a.title);
      case 'date-desc': return dateB - dateA;
      case 'date-asc': return dateA - dateB;
      default: return 0;
    }
  });

  widgetListEl.innerHTML = widgets.map(widget => {
    const preview = formatPreview(widget);
    return `
      <div class="widget-card" data-id="${widget.id}">
        <div class="widget-icon">⏳</div>
        <div class="widget-header">
          <h3>${escapeHtml(widget.title)}</h3>
        </div>
        <div class="widget-quote">${escapeHtml(widget.quote || 'No quote set')}</div>
        <div class="widget-preview">
          <div class="preview-value">${preview.text}</div>
          <div class="preview-label">${preview.label}</div>
        </div>
        <div class="widget-actions">
          <button class="small-btn" data-open="${widget.id}">Open</button>
          <button class="small-btn" data-copy="${widget.id}">Copy Link</button>
          <button class="small-btn" data-edit="${widget.id}">Edit</button>
          <button class="small-btn" data-delete="${widget.id}">Delete</button>
        </div>
      </div>
    `;
  }).join('');

  attachCardEvents();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function attachCardEvents() {
  // Open
  document.querySelectorAll('[data-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = `${BASE_PATH}widget.html?id=${btn.dataset.open}`;
    });
  });
  // Copy
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.copy;
      const link = `${window.location.origin}/${BASE_PATH}widget.html?id=${id}`;
      try {
        await navigator.clipboard.writeText(link);
        const original = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => btn.textContent = original, 1500);
      } catch { prompt('Copy link:', link); }
    });
  });
  // Edit
  document.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.edit;
      const widgets = getWidgets();
      const widget = widgets.find(w => w.id === id);
      if (!widget) return;
      editingId = id;
      modalTitle.textContent = 'Edit Counter';
      widgetIdInput.value = widget.id;
      widgetTitleInput.value = widget.title;
      widgetQuoteInput.value = widget.quote || '';
      startDateInput.value = widget.startDate || '';
      endDateInput.value = widget.endDate || '';
      widgetModal.classList.remove('hidden');
    });
  });
  // Delete
  document.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingDeleteId = btn.dataset.delete;
      const widgets = getWidgets();
      const widget = widgets.find(w => w.id === pendingDeleteId);
      confirmMessage.textContent = `Delete "${widget?.title || 'this counter'}"? This cannot be undone.`;
      confirmModal.classList.remove('hidden');
    });
  });
}

// =============================================
// CREATE / EDIT MODAL
// =============================================
createBtn.addEventListener('click', () => {
  editingId = null;
  modalTitle.textContent = 'Create New Counter';
  widgetForm.reset();
  widgetIdInput.value = '';
  widgetModal.classList.remove('hidden');
});

modalCancel.addEventListener('click', () => widgetModal.classList.add('hidden'));

widgetForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = widgetTitleInput.value.trim();
  if (!title) return;

  const quote = widgetQuoteInput.value.trim();
  const startDate = startDateInput.value || null;
  const endDate = endDateInput.value || null;

  const widgets = getWidgets();

  if (editingId) {
    const widget = widgets.find(w => w.id === editingId);
    if (widget) {
      widget.title = title;
      widget.quote = quote;
      widget.startDate = startDate;
      widget.endDate = endDate;
    }
  } else {
    const id = makeId(title);
    widgets.push({ id, title, quote, startDate, endDate, milestones: [] });
  }

  saveWidgets(widgets);
  widgetModal.classList.add('hidden');
  render();
});

// =============================================
// DELETE CONFIRMATION
// =============================================
confirmCancel.addEventListener('click', () => {
  confirmModal.classList.add('hidden');
  pendingDeleteId = null;
});
confirmOk.addEventListener('click', () => {
  if (pendingDeleteId) {
    let widgets = getWidgets();
    widgets = widgets.filter(w => w.id !== pendingDeleteId);
    saveWidgets(widgets);
    render();
  }
  confirmModal.classList.add('hidden');
  pendingDeleteId = null;
});

// =============================================
// SEARCH, SORT, EXPORT, IMPORT
// =============================================
searchInput.addEventListener('input', render);
sortSelect.addEventListener('change', render);

exportBtn.addEventListener('click', () => {
  const data = getWidgets();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `date_counters_backup_${new Date().toISOString().slice(0,10)}.json`;
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
      if (Array.isArray(data)) {
        saveWidgets(data);
        render();
        alert('Data imported successfully!');
      } else alert('Invalid backup file.');
    } catch { alert('Failed to parse file.'); }
  };
  reader.readAsText(file);
  importFileInput.value = '';
});

// Init
render();
