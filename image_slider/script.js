/**
 * Image Slider Dashboard
 * Manages multiple slider widgets (title + image URLs)
 */

const WIDGET_LIST_KEY = "image_slider_list";

// DOM Elements
const widgetListEl = document.getElementById('widget-list');
const createBtn = document.getElementById('create-widget-btn');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const totalWidgetsEl = document.getElementById('total-widgets');
const totalImagesEl = document.getElementById('total-images');
const exportBtn = document.getElementById('export-data-btn');
const importBtn = document.getElementById('import-data-btn');
const importFileInput = document.getElementById('import-file-input');

// Modals
const widgetModal = document.getElementById('widget-modal');
const modalTitle = document.getElementById('modal-title');
const widgetForm = document.getElementById('widget-form');
const widgetIdInput = document.getElementById('widget-id');
const widgetTitleInput = document.getElementById('widget-title-input');
const widgetImagesInput = document.getElementById('widget-images-input');
const modalCancel = document.getElementById('modal-cancel');

const confirmModal = document.getElementById('confirm-modal');
const confirmMessage = document.getElementById('confirm-message');
const confirmCancel = document.getElementById('confirm-cancel');
const confirmOk = document.getElementById('confirm-ok');

let pendingDeleteId = null;
let editingId = null;

// =============================================
// STORAGE
// =============================================
function getWidgetList() {
  try { return JSON.parse(localStorage.getItem(WIDGET_LIST_KEY)) || []; }
  catch { return []; }
}
function saveWidgetList(list) {
  localStorage.setItem(WIDGET_LIST_KEY, JSON.stringify(list));
}
function generateId(title) {
  const base = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return `${base || 'slider'}_${Date.now().toString(36)}`;
}

// =============================================
// RENDER
// =============================================
function updateStats(widgets) {
  totalWidgetsEl.textContent = widgets.length;
  const totalImages = widgets.reduce((sum, w) => sum + (w.images?.length || 0), 0);
  totalImagesEl.textContent = totalImages;
}

function renderDashboard() {
  let widgets = getWidgetList();
  updateStats(widgets);

  if (widgets.length === 0) {
    widgetListEl.innerHTML = `<div class="empty-state"><h3>🖼️ No sliders yet</h3><p>Click "Create New Slider" to build your first image slideshow.</p></div>`;
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
      case 'images-desc': return (b.images?.length || 0) - (a.images?.length || 0);
      case 'images-asc': return (a.images?.length || 0) - (b.images?.length || 0);
      default: return 0;
    }
  });

  widgetListEl.innerHTML = widgets.map(widget => {
    const imageCount = widget.images?.length || 0;
    const firstImage = widget.images?.[0] || '';
    const previewStyle = firstImage ? `background-image: url('${firstImage}')` : '';
    return `
      <div class="widget-card" data-id="${widget.id}">
        <div class="widget-preview" style="${previewStyle}; background-size: cover;"></div>
        <div class="widget-header">
          <span class="widget-icon">🖼️</span>
          <div class="widget-info"><h3>${escapeHtml(widget.title)}</h3></div>
        </div>
        <div class="widget-meta"><span>📸 ${imageCount} image${imageCount !== 1 ? 's' : ''}</span></div>
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
  document.querySelectorAll('[data-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.open;
      window.location.href = `../image_slider_widget/index.html?id=${encodeURIComponent(id)}`;
    });
  });
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.copy;
      const link = `${window.location.origin}${window.location.pathname.replace(/index\.html$/, '')}../image_slider_widget/index.html?id=${encodeURIComponent(id)}`;
      try {
        await navigator.clipboard.writeText(link);
        const original = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => btn.textContent = original, 1500);
      } catch { prompt('Copy this link:', link); }
    });
  });
  document.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.edit;
      const widgets = getWidgetList();
      const widget = widgets.find(w => w.id === id);
      if (!widget) return;
      editingId = id;
      modalTitle.textContent = 'Edit Slider';
      widgetIdInput.value = widget.id;
      widgetTitleInput.value = widget.title;
      widgetImagesInput.value = (widget.images || []).join('\n');
      widgetModal.classList.remove('hidden');
    });
  });
  document.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delete;
      const widgets = getWidgetList();
      const widget = widgets.find(w => w.id === id);
      confirmMessage.textContent = `Delete "${widget?.title || 'this slider'}"? This cannot be undone.`;
      pendingDeleteId = id;
      confirmModal.classList.remove('hidden');
    });
  });
}

// =============================================
// CREATE / EDIT MODAL
// =============================================
createBtn.addEventListener('click', () => {
  editingId = null;
  modalTitle.textContent = 'Create New Slider';
  widgetForm.reset();
  widgetIdInput.value = '';
  widgetModal.classList.remove('hidden');
});

modalCancel.addEventListener('click', () => widgetModal.classList.add('hidden'));

widgetForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = widgetTitleInput.value.trim();
  const imagesText = widgetImagesInput.value.trim();
  if (!title) return;

  const images = imagesText.split('\n').map(line => line.trim()).filter(url => url.length > 0 && (url.startsWith('http://') || url.startsWith('https://')));
  const widgets = getWidgetList();

  if (editingId) {
    const widget = widgets.find(w => w.id === editingId);
    if (widget) { widget.title = title; widget.images = images; }
  } else {
    const id = generateId(title);
    widgets.push({ id, title, images });
  }

  saveWidgetList(widgets);
  widgetModal.classList.add('hidden');
  renderDashboard();
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
    let widgets = getWidgetList();
    widgets = widgets.filter(w => w.id !== pendingDeleteId);
    saveWidgetList(widgets);
    renderDashboard();
  }
  confirmModal.classList.add('hidden');
  pendingDeleteId = null;
});

// =============================================
// SEARCH, SORT, EXPORT, IMPORT
// =============================================
searchInput.addEventListener('input', renderDashboard);
sortSelect.addEventListener('change', renderDashboard);

exportBtn.addEventListener('click', () => {
  const data = getWidgetList();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `image_sliders_backup_${new Date().toISOString().slice(0,10)}.json`;
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
        saveWidgetList(data);
        renderDashboard();
        alert('Data imported successfully!');
      } else alert('Invalid backup file.');
    } catch { alert('Failed to parse file.'); }
  };
  reader.readAsText(file);
  importFileInput.value = '';
});

// Init
renderDashboard();
