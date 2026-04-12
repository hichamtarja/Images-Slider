/**
 * Widget Hub Dashboard – Enhanced with 11 new features.
 * Features included:
 * - Widget Categories / Tags
 * - Recently Used / Most Used Sorting
 * - Right‑Click Context Menu
 * - Custom Background Images per Widget (Thumbnails)
 * - Dynamic Greeting & Time Widget
 * - Export / Import Layout Configuration
 * - Reset to Default Layout
 * - Widget Notes / Descriptions (Editable)
 * - Usage Heatmap / Sparkline
 * - "Last Opened" Timestamp
 * - Sound Effects (Optional)
 * Plus existing: Drag & Drop, Persistent Layout, Dark/Light Mode, Accent Color,
 * Activity Badges, Floating Emoji Parallax+Hover.
 */

// =============================================
// 0. GLOBALS & INITIAL DATA
// =============================================
// Define widgets with categories, default thumbnails, etc.
const widgetsData = [
  {
    id: 'image_slider',
    name: 'Image Slider',
    description: 'View your favorite GIFs in a clean slider.',
    icon: '🎞',
    url: 'image_slider/index.html',
    category: 'media',
    thumbnail: 'image_slider/preview.png' // You can add actual images later
  },
  {
    id: 'streak',
    name: 'Streak Counter',
    description: 'Track your daily consistency streak.',
    icon: '🔥',
    url: 'streak/index.html',
    category: 'productivity',
    thumbnail: 'streak/preview.png'
  },
  {
    id: 'date_counter',
    name: 'Date Counter',
    description: 'Live countdown between two dates.',
    icon: '⏳',
    url: 'date_counter/index.html',
    category: 'time',
    thumbnail: 'date_counter/preview.png'
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro Suite',
    description: 'Focus & Tasks · Time‑management',
    icon: '🍅',
    url: 'pomodoro/index.html',
    category: 'productivity',
    thumbnail: 'pomodoro/preview.png'
  }
];

// Categories for filter
const categories = [
  { id: 'all', label: 'All' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'media', label: 'Media' },
  { id: 'time', label: 'Time' }
];

// Default card order (fallback)
const defaultOrder = widgetsData.map(w => w.id);

// Storage keys
const STORAGE_KEYS = {
  ORDER: 'widgetHub_order',
  THEME: 'widgetHub_theme',
  ACCENT: 'widgetHub_accent',
  NOTES: 'widgetHub_notes',
  USAGE: 'widgetHub_usage',
  LAST_OPENED: 'widgetHub_lastOpened',
  SOUND_ENABLED: 'widgetHub_soundEnabled'
};

// Global state
let currentCategory = 'all';
let currentSort = 'default';
let soundEnabled = false;
let contextMenuTarget = null;

// DOM elements
const cardsContainer = document.getElementById('cardsContainer');
const themeToggle = document.getElementById('themeToggle');
const accentPicker = document.getElementById('accentColor');
const greetingClock = document.getElementById('greetingClock');
const filterChips = document.getElementById('filterChips');
const contextMenu = document.getElementById('contextMenu');
const noteModal = document.getElementById('noteModal');
const noteInput = document.getElementById('noteInput');
let sortableInstance = null;

// =============================================
// 1. DYNAMIC GREETING & CLOCK
// =============================================
function updateGreetingClock() {
  const now = new Date();
  const hours = now.getHours();
  let greeting = 'Good ';
  if (hours < 12) greeting += 'morning';
  else if (hours < 18) greeting += 'afternoon';
  else greeting += 'evening';
  
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  
  greetingClock.textContent = `${greeting} · ${timeStr} · ${dateStr}`;
}
setInterval(updateGreetingClock, 1000);
updateGreetingClock();

// =============================================
// 2. RENDER CARDS (with all dynamic elements)
// =============================================
function renderCards() {
  // Get saved order or default
  let order = getSavedOrder();
  
  // Filter by category
  let filteredWidgets = widgetsData.filter(w => 
    currentCategory === 'all' || w.category === currentCategory
  );
  
  // Sort
  if (currentSort === 'most-used') {
    const usage = getUsageData();
    filteredWidgets.sort((a, b) => (usage[b.id]?.total || 0) - (usage[a.id]?.total || 0));
  } else if (currentSort === 'recent') {
    const lastOpened = getLastOpenedData();
    filteredWidgets.sort((a, b) => (lastOpened[b.id] || 0) - (lastOpened[a.id] || 0));
  } else {
    // Default: use saved order
    filteredWidgets.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }
  
  // Generate HTML
  cardsContainer.innerHTML = '';
  filteredWidgets.forEach(widget => {
    const card = createCardElement(widget);
    cardsContainer.appendChild(card);
  });
  
  // Re-attach listeners and update dynamic elements
  attachCardListeners();
  updateAllSparklines();
  updateAllLastOpened();
  loadNotesIntoDOM();
  checkAllWidgetsAvailability();
}

function createCardElement(widget) {
  const card = document.createElement('div');
  card.className = 'card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.dataset.url = widget.url;
  card.dataset.id = widget.id;
  card.dataset.category = widget.category;
  
  // Status badge
  const badge = document.createElement('span');
  badge.className = 'status-badge';
  badge.dataset.status = 'unknown';
  badge.title = 'Checking availability...';
  
  // Thumbnail (attempt to load image, fallback to icon)
  const thumbnailDiv = document.createElement('div');
  thumbnailDiv.className = 'card-thumbnail';
  thumbnailDiv.style.backgroundImage = `url('${widget.thumbnail}')`;
  // If image fails, we'll show icon instead via JS later
  
  const iconSpan = document.createElement('div');
  iconSpan.className = 'icon';
  iconSpan.setAttribute('aria-hidden', 'true');
  iconSpan.textContent = widget.icon;
  iconSpan.style.display = 'none'; // hidden by default, shown if thumbnail fails
  
  const title = document.createElement('h2');
  title.textContent = widget.name;
  
  const desc = document.createElement('p');
  desc.textContent = widget.description;
  
  // Sparkline container
  const sparklineDiv = document.createElement('div');
  sparklineDiv.className = 'sparkline';
  sparklineDiv.id = `sparkline-${widget.id}`;
  
  // Last opened
  const lastOpenedSpan = document.createElement('div');
  lastOpenedSpan.className = 'last-opened';
  lastOpenedSpan.id = `last-opened-${widget.id}`;
  
  // Note display
  const noteDiv = document.createElement('div');
  noteDiv.className = 'card-note';
  noteDiv.id = `note-${widget.id}`;
  
  card.appendChild(badge);
  card.appendChild(thumbnailDiv);
  card.appendChild(iconSpan);
  card.appendChild(title);
  card.appendChild(desc);
  card.appendChild(sparklineDiv);
  card.appendChild(lastOpenedSpan);
  card.appendChild(noteDiv);
  
  // Handle thumbnail load error -> show icon
  const img = new Image();
  img.onload = () => {
    thumbnailDiv.style.display = 'block';
    iconSpan.style.display = 'none';
  };
  img.onerror = () => {
    thumbnailDiv.style.display = 'none';
    iconSpan.style.display = 'block';
  };
  img.src = widget.thumbnail;
  
  return card;
}

// =============================================
// 3. CATEGORY FILTER CHIPS
// =============================================
function renderCategoryChips() {
  filterChips.innerHTML = '';
  categories.forEach(cat => {
    const chip = document.createElement('span');
    chip.className = `chip ${cat.id === currentCategory ? 'active' : ''}`;
    chip.textContent = cat.label;
    chip.dataset.category = cat.id;
    chip.addEventListener('click', () => {
      currentCategory = cat.id;
      renderCategoryChips();
      renderCards();
    });
    filterChips.appendChild(chip);
  });
}

// =============================================
// 4. SORTING
// =============================================
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSort = btn.dataset.sort;
    renderCards();
  });
});

// =============================================
// 5. USAGE TRACKING & HEATMAP / LAST OPENED
// =============================================
function getUsageData() {
  const stored = localStorage.getItem(STORAGE_KEYS.USAGE);
  return stored ? JSON.parse(stored) : {};
}

function saveUsageData(data) {
  localStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(data));
}

function getLastOpenedData() {
  const stored = localStorage.getItem(STORAGE_KEYS.LAST_OPENED);
  return stored ? JSON.parse(stored) : {};
}

function saveLastOpenedData(data) {
  localStorage.setItem(STORAGE_KEYS.LAST_OPENED, JSON.stringify(data));
}

function recordUsage(widgetId) {
  const usage = getUsageData();
  const today = new Date().toISOString().split('T')[0];
  if (!usage[widgetId]) usage[widgetId] = { total: 0, daily: {} };
  usage[widgetId].total += 1;
  usage[widgetId].daily[today] = (usage[widgetId].daily[today] || 0) + 1;
  saveUsageData(usage);
  
  const lastOpened = getLastOpenedData();
  lastOpened[widgetId] = Date.now();
  saveLastOpenedData(lastOpened);
}

function updateSparkline(card) {
  const widgetId = card.dataset.id;
  const usage = getUsageData();
  const sparklineDiv = card.querySelector('.sparkline');
  if (!sparklineDiv) return;
  sparklineDiv.innerHTML = '';
  
  const daily = usage[widgetId]?.daily || {};
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  const max = Math.max(...dates.map(d => daily[d] || 0), 1);
  
  dates.forEach(date => {
    const count = daily[date] || 0;
    const bar = document.createElement('div');
    bar.className = 'sparkline-bar';
    const heightPercent = (count / max) * 100;
    bar.style.height = `${Math.max(4, heightPercent)}%`;
    bar.title = `${date}: ${count} opens`;
    sparklineDiv.appendChild(bar);
  });
}

function updateAllSparklines() {
  document.querySelectorAll('.card').forEach(card => updateSparkline(card));
}

function updateLastOpened(card) {
  const widgetId = card.dataset.id;
  const lastOpened = getLastOpenedData();
  const timestamp = lastOpened[widgetId];
  const span = card.querySelector('.last-opened');
  if (span) {
    if (timestamp) {
      const diff = Date.now() - timestamp;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      let text;
      if (minutes < 1) text = 'Just now';
      else if (minutes < 60) text = `${minutes}m ago`;
      else if (hours < 24) text = `${hours}h ago`;
      else text = `${days}d ago`;
      span.textContent = `Last: ${text}`;
    } else {
      span.textContent = 'Never opened';
    }
  }
}

function updateAllLastOpened() {
  document.querySelectorAll('.card').forEach(card => updateLastOpened(card));
}

// =============================================
// 6. NOTES (Editable)
// =============================================
function getNotesData() {
  const stored = localStorage.getItem(STORAGE_KEYS.NOTES);
  return stored ? JSON.parse(stored) : {};
}

function saveNotesData(data) {
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(data));
}

function loadNotesIntoDOM() {
  const notes = getNotesData();
  document.querySelectorAll('.card').forEach(card => {
    const widgetId = card.dataset.id;
    const noteDiv = card.querySelector(`.card-note`);
    if (noteDiv) {
      noteDiv.textContent = notes[widgetId] || '';
    }
  });
}

function openNoteEditor(widgetId) {
  const notes = getNotesData();
  noteInput.value = notes[widgetId] || '';
  noteModal.style.display = 'block';
  noteModal.dataset.widgetId = widgetId;
}

// Modal close
document.querySelector('.close').onclick = () => noteModal.style.display = 'none';
window.onclick = (e) => { if (e.target === noteModal) noteModal.style.display = 'none'; };
document.getElementById('saveNoteBtn').onclick = () => {
  const widgetId = noteModal.dataset.widgetId;
  if (widgetId) {
    const notes = getNotesData();
    notes[widgetId] = noteInput.value;
    saveNotesData(notes);
    loadNotesIntoDOM();
  }
  noteModal.style.display = 'none';
};

// =============================================
// 7. RIGHT-CLICK CONTEXT MENU
// =============================================
function showContextMenu(e, card) {
  e.preventDefault();
  contextMenuTarget = card;
  contextMenu.style.display = 'block';
  contextMenu.style.left = e.pageX + 'px';
  contextMenu.style.top = e.pageY + 'px';
}

function hideContextMenu() {
  contextMenu.style.display = 'none';
}

contextMenu.addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  if (!action || !contextMenuTarget) return;
  const card = contextMenuTarget;
  const url = card.dataset.url;
  const widgetId = card.dataset.id;
  
  switch (action) {
    case 'open':
      navigateToWidget({ currentTarget: card }, url);
      break;
    case 'open-new-tab':
      window.open(url, '_blank');
      recordUsage(widgetId);
      updateSparkline(card);
      updateLastOpened(card);
      break;
    case 'copy-link':
      navigator.clipboard?.writeText(new URL(url, window.location.href).href);
      break;
    case 'edit-note':
      openNoteEditor(widgetId);
      break;
    case 'clear-note':
      const notes = getNotesData();
      delete notes[widgetId];
      saveNotesData(notes);
      loadNotesIntoDOM();
      break;
  }
  hideContextMenu();
});

document.addEventListener('click', hideContextMenu);
document.addEventListener('contextmenu', (e) => {
  if (!e.target.closest('.card')) hideContextMenu();
});

// Attach context menu to cards
function attachContextMenu(card) {
  card.addEventListener('contextmenu', (e) => showContextMenu(e, card));
}

// =============================================
// 8. SOUND EFFECTS (Optional)
// =============================================
function playSound(type) {
  if (!soundEnabled) return;
  // Simple Web Audio API beep
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.value = type === 'click' ? 800 : 600;
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) { /* Ignore autoplay restrictions */ }
}

document.getElementById('soundToggle').addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, soundEnabled);
  document.querySelector('.sound-icon').textContent = soundEnabled ? '🔊' : '🔇';
  if (soundEnabled) playSound('click');
});

// Load sound pref
soundEnabled = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED) === 'true';
document.querySelector('.sound-icon').textContent = soundEnabled ? '🔊' : '🔇';

// =============================================
// 9. EXPORT / IMPORT / RESET LAYOUT
// =============================================
function exportLayout() {
  const data = {
    order: getSavedOrder(),
    theme: document.body.classList.contains('dark') ? 'dark' : 'light',
    accent: accentPicker.value,
    notes: getNotesData(),
    soundEnabled
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `widget-hub-layout-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importLayout(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.order) localStorage.setItem(STORAGE_KEYS.ORDER, JSON.stringify(data.order));
      if (data.theme) {
        if (data.theme === 'dark') document.body.classList.add('dark');
        else document.body.classList.remove('dark');
        updateThemeToggleText();
      }
      if (data.accent) {
        accentPicker.value = data.accent;
        applyAccentColor(data.accent);
        localStorage.setItem(STORAGE_KEYS.ACCENT, data.accent);
      }
      if (data.notes) localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(data.notes));
      if (data.soundEnabled !== undefined) {
        soundEnabled = data.soundEnabled;
        localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, soundEnabled);
        document.querySelector('.sound-icon').textContent = soundEnabled ? '🔊' : '🔇';
      }
      renderCards();
    } catch (err) { alert('Invalid layout file'); }
  };
  reader.readAsDataURL(file);
}

document.getElementById('exportLayoutBtn').addEventListener('click', exportLayout);
document.getElementById('importLayoutBtn').addEventListener('click', () => {
  document.getElementById('importFileInput').click();
});
document.getElementById('importFileInput').addEventListener('change', (e) => {
  if (e.target.files[0]) importLayout(e.target.files[0]);
});
document.getElementById('resetLayoutBtn').addEventListener('click', () => {
  if (confirm('Reset all layout and preferences to default?')) {
    localStorage.removeItem(STORAGE_KEYS.ORDER);
    localStorage.removeItem(STORAGE_KEYS.THEME);
    localStorage.removeItem(STORAGE_KEYS.ACCENT);
    localStorage.removeItem(STORAGE_KEYS.NOTES);
    localStorage.removeItem(STORAGE_KEYS.USAGE);
    localStorage.removeItem(STORAGE_KEYS.LAST_OPENED);
    localStorage.removeItem(STORAGE_KEYS.SOUND_ENABLED);
    location.reload();
  }
});

// =============================================
// 10. THEME & ACCENT PERSISTENCE
// =============================================
function updateThemeToggleText() {
  const isDark = document.body.classList.contains('dark');
  const icon = themeToggle.querySelector('.theme-icon');
  const text = themeToggle.querySelector('.theme-text');
  icon.textContent = isDark ? '☀️' : '🌙';
  text.textContent = isDark ? 'Light' : 'Dark';
}

function loadThemePreference() {
  const saved = localStorage.getItem(STORAGE_KEYS.THEME);
  if (saved === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
  updateThemeToggleText();
}

themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
  updateThemeToggleText();
});

function applyAccentColor(color) {
  document.documentElement.style.setProperty('--accent-color', color);
}

function loadAccentColor() {
  const saved = localStorage.getItem(STORAGE_KEYS.ACCENT);
  if (saved) {
    accentPicker.value = saved;
    applyAccentColor(saved);
  }
}

accentPicker.addEventListener('input', (e) => {
  const color = e.target.value;
  applyAccentColor(color);
  localStorage.setItem(STORAGE_KEYS.ACCENT, color);
});

// =============================================
// 11. NAVIGATION & RIPPLE (with usage tracking)
// =============================================
function navigateToWidget(event, url) {
  if (event.type === 'keydown') event.preventDefault();
  const targetUrl = url || event.currentTarget.dataset.url;
  if (!targetUrl) return;
  
  const card = event.currentTarget;
  const widgetId = card.dataset.id;
  
  recordUsage(widgetId);
  updateSparkline(card);
  updateLastOpened(card);
  playSound('click');
  createRipple(event);
  
  document.body.classList.add('fade-out');
  setTimeout(() => {
    window.location.href = targetUrl;
  }, 400);
}

function createRipple(event) {
  const card = event.currentTarget;
  const existing = card.querySelector('.ripple');
  if (existing) existing.remove();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const diameter = Math.max(card.clientWidth, card.clientHeight);
  ripple.style.width = ripple.style.height = `${diameter}px`;
  let clientX, clientY;
  if (event instanceof MouseEvent) {
    clientX = event.clientX;
    clientY = event.clientY;
  } else {
    const rect = card.getBoundingClientRect();
    clientX = rect.left + rect.width / 2;
    clientY = rect.top + rect.height / 2;
  }
  const rect = card.getBoundingClientRect();
  const left = clientX - rect.left - diameter / 2;
  const top = clientY - rect.top - diameter / 2;
  ripple.style.left = `${left}px`;
  ripple.style.top = `${top}px`;
  card.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

function attachCardListeners() {
  document.querySelectorAll('.card').forEach(card => {
    card.removeEventListener('click', handleCardClick);
    card.removeEventListener('keydown', handleCardKeydown);
    card.addEventListener('click', handleCardClick);
    card.addEventListener('keydown', handleCardKeydown);
    attachContextMenu(card);
  });
}

function handleCardClick(e) { navigateToWidget(e); }
function handleCardKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ') navigateToWidget(e);
}

// =============================================
// 12. ACTIVITY BADGES (unchanged)
// =============================================
async function checkWidgetAvailability(card) {
  const url = card.dataset.url;
  const badge = card.querySelector('.status-badge');
  if (!badge) return;
  badge.dataset.status = 'unknown';
  try {
    const response = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
    badge.dataset.status = response.ok ? 'available' : 'unavailable';
    badge.title = response.ok ? 'Widget is available' : `HTTP ${response.status}`;
  } catch {
    badge.dataset.status = 'unavailable';
    badge.title = 'Cannot reach widget';
  }
}

function checkAllWidgetsAvailability() {
  document.querySelectorAll('.card').forEach(checkWidgetAvailability);
}

// =============================================
// 13. FLOATING EMOJIS (Parallax + Hover)
// =============================================
function initFloatingEmojis() {
  const emojis = document.querySelectorAll('.floating span');
  // Grid positioning
  const count = emojis.length;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellW = window.innerWidth / cols;
  const cellH = window.innerHeight / rows;
  
  emojis.forEach((emoji, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    let x = col * cellW + Math.random() * (cellW - 60);
    let y = row * cellH + Math.random() * (cellH - 60);
    x = Math.max(10, Math.min(x, window.innerWidth - 60));
    y = Math.max(10, Math.min(y, window.innerHeight - 60));
    emoji.style.left = `${x}px`;
    emoji.style.top = `${y}px`;
    emoji.style.animationDelay = `${Math.random() * 6}s`;
    emoji.style.transform = `scale(${0.8 + Math.random() * 0.8})`;
    emoji.dataset.baseX = x;
    emoji.dataset.baseY = y;
  });
  
  // Parallax on mousemove
  let raf = null;
  window.addEventListener('mousemove', (e) => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const moveX = (e.clientX - centerX) * 0.01;
      const moveY = (e.clientY - centerY) * 0.01;
      emojis.forEach(emoji => {
        const baseX = parseFloat(emoji.dataset.baseX);
        const baseY = parseFloat(emoji.dataset.baseY);
        const speed = 0.5 + (emoji.dataset.speed || Math.random() * 0.5);
        const shiftX = moveX * speed;
        const shiftY = moveY * speed;
        // Preserve hover effect: we need to apply transform without overriding hover
        // We'll use a custom property approach, but simpler: just add translate
        const currentScale = emoji.style.transform.match(/scale\(([^)]+)\)/)?.[1] || '1';
        emoji.style.transform = `translate(${shiftX}px, ${shiftY}px) scale(${currentScale})`;
      });
      raf = null;
    });
  });
  
  // Reset on mouse leave
  window.addEventListener('mouseleave', () => {
    emojis.forEach(emoji => {
      emoji.style.transform = emoji.style.transform.replace(/translate\([^)]+\)/, 'translate(0px, 0px)');
    });
  });
}

// =============================================
// 14. INITIALIZATION
// =============================================
function getSavedOrder() {
  const saved = localStorage.getItem(STORAGE_KEYS.ORDER);
  return saved ? JSON.parse(saved) : defaultOrder;
}

function initSortable() {
  sortableInstance = Sortable.create(cardsContainer, {
    animation: 200,
    ghostClass: 'sortable-ghost',
    dragClass: 'sortable-drag',
    onEnd: function() {
      const order = [...cardsContainer.querySelectorAll('.card')].map(c => c.dataset.id);
      localStorage.setItem(STORAGE_KEYS.ORDER, JSON.stringify(order));
    }
  });
}

window.addEventListener('pageshow', () => document.body.classList.remove('fade-out'));

document.addEventListener('DOMContentLoaded', () => {
  loadThemePreference();
  loadAccentColor();
  renderCategoryChips();
  renderCards();
  initSortable();
  initFloatingEmojis();
  
  // Observer to re-attach listeners if cards change
  new MutationObserver(() => attachCardListeners()).observe(cardsContainer, { childList: true, subtree: true });
});
