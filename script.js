/**
 * Widget Hub Dashboard – Fully Persistent Edition
 * All preferences (theme, accent, order, notes, usage, last opened, sound)
 * are saved to localStorage and restored on page reload.
 */

// =============================================
// 0. GLOBALS & CONFIGURATION
// =============================================

const widgetsData = [
  {
    id: 'image_slider',
    name: 'Image Slider',
    description: 'View your favorite GIFs in a clean slider.',
    icon: '🎞',
    url: 'image_slider/index.html',
    category: 'media',
    thumbnail: 'image_slider/preview.png'
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
  },
  {
    id: 'productivity_toolkit',
    name: 'Productivity Toolkit',
    description: 'Bookmarks, Password Gen, Link Checker, QR',
    icon: '🧰',
    url: 'productivity_toolkit/index.html',
    category: 'tools',
    thumbnail: 'productivity_toolkit/preview.png'
  }
];

const categories = [
  { id: 'all', label: 'All' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'media', label: 'Media' },
  { id: 'time', label: 'Time' },
  { id: 'tools', label: 'Tools' }
];

// Default order always includes all widget IDs
const defaultOrder = widgetsData.map(w => w.id);

const STORAGE_KEYS = {
  ORDER: 'widgetHub_order',
  THEME: 'widgetHub_theme',
  ACCENT: 'widgetHub_accent',
  NOTES: 'widgetHub_notes',
  USAGE: 'widgetHub_usage',
  LAST_OPENED: 'widgetHub_lastOpened',
  SOUND_ENABLED: 'widgetHub_soundEnabled'
};

let currentCategory = 'all';
let currentSort = 'default';
let soundEnabled = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED) === 'true';
let contextMenuTarget = null;

const cardsContainer = document.getElementById('cardsContainer');
const themeToggle = document.getElementById('themeToggle');
const accentPicker = document.getElementById('accentColor');
const greetingClock = document.getElementById('greetingClock');
const filterChips = document.getElementById('filterChips');
const contextMenu = document.getElementById('contextMenu');
const noteModal = document.getElementById('noteModal');
const noteInput = document.getElementById('noteInput');
const menuToggleBtn = document.getElementById('menuToggleBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const soundToggle = document.getElementById('soundToggle');
const exportBtn = document.getElementById('exportLayoutBtn');
const importBtn = document.getElementById('importLayoutBtn');
const importFileInput = document.getElementById('importFileInput');
const resetBtn = document.getElementById('resetLayoutBtn');

let sortableInstance = null;

// =============================================
// 1. UTILITY FUNCTIONS
// =============================================
function playSound(type = 'click') {
  if (!soundEnabled) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    const freq = type === 'click' ? 800 : (type === 'menu' ? 600 : 500);
    oscillator.frequency.value = freq;
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) {}
}

function updateSoundIcon() {
  const icon = soundToggle.querySelector('.sound-icon');
  if (icon) icon.textContent = soundEnabled ? '🔊' : '🔇';
}

// =============================================
// 2. GREETING & CLOCK
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
// 3. STORAGE HELPERS
// =============================================
function getSavedOrder() {
  const saved = localStorage.getItem(STORAGE_KEYS.ORDER);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure all widgets are present (in case new ones were added)
      const allIds = widgetsData.map(w => w.id);
      const missing = allIds.filter(id => !parsed.includes(id));
      return [...parsed, ...missing];
    } catch { return defaultOrder; }
  }
  return defaultOrder;
}

function saveOrder(orderArray) {
  localStorage.setItem(STORAGE_KEYS.ORDER, JSON.stringify(orderArray));
}

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

function getNotesData() {
  const stored = localStorage.getItem(STORAGE_KEYS.NOTES);
  return stored ? JSON.parse(stored) : {};
}

function saveNotesData(data) {
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(data));
}

// =============================================
// 4. USAGE TRACKING & SPARKLINE / LAST OPENED
// =============================================
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
// 5. NOTES (Editable)
// =============================================
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

// Modal events
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
// 6. RENDER CARDS
// =============================================
function createCardElement(widget) {
  const card = document.createElement('div');
  card.className = 'card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.dataset.url = widget.url;
  card.dataset.id = widget.id;
  card.dataset.category = widget.category;
  
  const badge = document.createElement('span');
  badge.className = 'status-badge';
  badge.dataset.status = 'unknown';
  badge.title = 'Checking availability...';
  
  const thumbnailDiv = document.createElement('div');
  thumbnailDiv.className = 'card-thumbnail';
  thumbnailDiv.style.backgroundImage = `url('${widget.thumbnail}')`;
  
  const iconSpan = document.createElement('div');
  iconSpan.className = 'icon';
  iconSpan.setAttribute('aria-hidden', 'true');
  iconSpan.textContent = widget.icon;
  iconSpan.style.display = 'none';
  
  const title = document.createElement('h2');
  title.textContent = widget.name;
  
  const desc = document.createElement('p');
  desc.textContent = widget.description;
  
  const sparklineDiv = document.createElement('div');
  sparklineDiv.className = 'sparkline';
  sparklineDiv.id = `sparkline-${widget.id}`;
  
  const lastOpenedSpan = document.createElement('div');
  lastOpenedSpan.className = 'last-opened';
  lastOpenedSpan.id = `last-opened-${widget.id}`;
  
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

function renderCards() {
  let order = getSavedOrder();
  
  let filteredWidgets = widgetsData.filter(w => 
    currentCategory === 'all' || w.category === currentCategory
  );
  
  if (currentSort === 'most-used') {
    const usage = getUsageData();
    filteredWidgets.sort((a, b) => (usage[b.id]?.total || 0) - (usage[a.id]?.total || 0));
  } else if (currentSort === 'recent') {
    const lastOpened = getLastOpenedData();
    filteredWidgets.sort((a, b) => (lastOpened[b.id] || 0) - (lastOpened[a.id] || 0));
  } else {
    filteredWidgets.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }
  
  cardsContainer.innerHTML = '';
  filteredWidgets.forEach(widget => {
    const card = createCardElement(widget);
    cardsContainer.appendChild(card);
  });
  
  attachCardListeners();
  updateAllSparklines();
  updateAllLastOpened();
  loadNotesIntoDOM();
  checkAllWidgetsAvailability();
}

// =============================================
// 7. CATEGORY FILTER CHIPS
// =============================================
function renderCategoryChips() {
  filterChips.innerHTML = '';
  categories.forEach(cat => {
    const chip = document.createElement('span');
    chip.className = `chip ${cat.id === currentCategory ? 'active' : ''}`;
    chip.textContent = cat.label;
    chip.dataset.category = cat.id;
    chip.addEventListener('click', () => {
      playSound('click');
      currentCategory = cat.id;
      renderCategoryChips();
      renderCards();
    });
    filterChips.appendChild(chip);
  });
}

// =============================================
// 8. SORTING
// =============================================
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    playSound('click');
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSort = btn.dataset.sort;
    renderCards();
  });
});

// =============================================
// 9. ACTIVITY BADGES
// =============================================
async function checkWidgetAvailability(card) {
  const url = card.dataset.url;
  const badge = card.querySelector('.status-badge');
  if (!badge) return;
  badge.dataset.status = 'unknown';
  badge.title = 'Checking availability...';
  try {
    const response = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
    if (response.ok) {
      badge.dataset.status = 'available';
      badge.title = 'Widget is available';
    } else {
      badge.dataset.status = 'unavailable';
      badge.title = `Widget unavailable (HTTP ${response.status})`;
    }
  } catch {
    badge.dataset.status = 'unavailable';
    badge.title = 'Cannot reach widget (network error)';
  }
}

function checkAllWidgetsAvailability() {
  document.querySelectorAll('.card').forEach(checkWidgetAvailability);
}

// =============================================
// 10. NAVIGATION & RIPPLE
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

function handleCardClick(e) { navigateToWidget(e); }
function handleCardKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ') navigateToWidget(e);
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

// =============================================
// 11. RIGHT-CLICK CONTEXT MENU
// =============================================
function showContextMenu(e, card) {
  e.preventDefault();
  contextMenuTarget = card;
  contextMenu.style.display = 'block';
  contextMenu.style.left = e.pageX + 'px';
  contextMenu.style.top = e.pageY + 'px';
  playSound('menu');
}
function hideContextMenu() { contextMenu.style.display = 'none'; }
function attachContextMenu(card) { card.addEventListener('contextmenu', (e) => showContextMenu(e, card)); }

contextMenu.addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  if (!action || !contextMenuTarget) return;
  const card = contextMenuTarget;
  const url = card.dataset.url;
  const widgetId = card.dataset.id;
  playSound('click');
  switch (action) {
    case 'open': navigateToWidget({ currentTarget: card }, url); break;
    case 'open-new-tab':
      window.open(url, '_blank');
      recordUsage(widgetId);
      updateSparkline(card);
      updateLastOpened(card);
      break;
    case 'copy-link': navigator.clipboard?.writeText(new URL(url, window.location.href).href); break;
    case 'edit-note': openNoteEditor(widgetId); break;
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
document.addEventListener('contextmenu', (e) => { if (!e.target.closest('.card')) hideContextMenu(); });

// =============================================
// 12. THEME & ACCENT (WITH IMMEDIATE SAVE)
// =============================================
function updateThemeToggleText() {
  const isDark = document.body.classList.contains('dark');
  const icon = themeToggle.querySelector('.theme-icon');
  const text = themeToggle.querySelector('.theme-text');
  icon.textContent = isDark ? '☀️' : '🌙';
  text.textContent = isDark ? 'Light' : 'Dark';
}

function applyTheme(isDark) {
  if (isDark) document.body.classList.add('dark');
  else document.body.classList.remove('dark');
  updateThemeToggleText();
  localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
}

function loadThemePreference() {
  const saved = localStorage.getItem(STORAGE_KEYS.THEME);
  applyTheme(saved === 'dark');
}

themeToggle.addEventListener('click', () => {
  playSound('click');
  const isDark = !document.body.classList.contains('dark');
  applyTheme(isDark);
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
  playSound('menu');
  const color = e.target.value;
  applyAccentColor(color);
  localStorage.setItem(STORAGE_KEYS.ACCENT, color);
});

// =============================================
// 13. EXPORT / IMPORT / RESET
// =============================================
function exportLayout() {
  playSound('menu');
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
  playSound('menu');
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.order) saveOrder(data.order);
      if (data.theme) applyTheme(data.theme === 'dark');
      if (data.accent) {
        accentPicker.value = data.accent;
        applyAccentColor(data.accent);
        localStorage.setItem(STORAGE_KEYS.ACCENT, data.accent);
      }
      if (data.notes) saveNotesData(data.notes);
      if (data.soundEnabled !== undefined) {
        soundEnabled = data.soundEnabled;
        localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, soundEnabled);
        updateSoundIcon();
      }
      renderCards();
      if (sortableInstance) sortableInstance.destroy();
      initSortable();
    } catch { alert('Invalid layout file.'); }
  };
  reader.readAsDataURL(file);
}

exportBtn.addEventListener('click', exportLayout);
importBtn.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', (e) => { if (e.target.files[0]) importLayout(e.target.files[0]); });
resetBtn.addEventListener('click', () => {
  playSound('menu');
  if (confirm('Reset all layout and preferences to default?')) {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    location.reload();
  }
});

// =============================================
// 14. SOUND & DROPDOWN
// =============================================
soundToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  soundEnabled = !soundEnabled;
  localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, soundEnabled);
  updateSoundIcon();
  playSound('menu');
});
updateSoundIcon();

menuToggleBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  dropdownMenu.classList.toggle('show');
  playSound('menu');
});
document.addEventListener('click', (e) => {
  if (!menuToggleBtn.contains(e.target) && !dropdownMenu.contains(e.target))
    dropdownMenu.classList.remove('show');
});
dropdownMenu.addEventListener('click', (e) => {
  e.stopPropagation();
  if (e.target.classList.contains('dropdown-item')) dropdownMenu.classList.remove('show');
});

function attachGlobalSoundListeners() {
  document.querySelectorAll('.chip, .sort-btn, #themeToggle, .context-item').forEach(el => {
    el.addEventListener('click', () => playSound('click'));
  });
  document.querySelectorAll('.dropdown-item').forEach(el => {
    el.addEventListener('click', () => playSound('menu'));
  });
}

// =============================================
// 15. FLOATING EMOJIS
// =============================================
function initFloatingEmojis() {
  const emojis = document.querySelectorAll('.floating span');
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
    emoji.dataset.speed = 0.5 + Math.random() * 0.5;
  });
  
  let raf = null;
  window.addEventListener('mousemove', (e) => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const moveX = (e.clientX - centerX) * 0.01;
      const moveY = (e.clientY - centerY) * 0.01;
      emojis.forEach(emoji => {
        const speed = parseFloat(emoji.dataset.speed);
        const shiftX = moveX * speed;
        const shiftY = moveY * speed;
        const currentScale = emoji.style.transform.match(/scale\(([^)]+)\)/)?.[1] || '1';
        emoji.style.transform = `translate(${shiftX}px, ${shiftY}px) scale(${currentScale})`;
      });
      raf = null;
    });
  });
  
  window.addEventListener('mouseleave', () => {
    emojis.forEach(emoji => {
      emoji.style.transform = emoji.style.transform.replace(/translate\([^)]+\)/, 'translate(0px, 0px)');
    });
  });
  
  window.addEventListener('resize', () => {
    const newCellW = window.innerWidth / cols;
    const newCellH = window.innerHeight / rows;
    emojis.forEach((emoji, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      let x = col * newCellW + Math.random() * (newCellW - 60);
      let y = row * newCellH + Math.random() * (newCellH - 60);
      x = Math.max(10, Math.min(x, window.innerWidth - 60));
      y = Math.max(10, Math.min(y, window.innerHeight - 60));
      emoji.style.left = `${x}px`;
      emoji.style.top = `${y}px`;
      emoji.dataset.baseX = x;
      emoji.dataset.baseY = y;
    });
  });
}

// =============================================
// 16. SORTABLE
// =============================================
function initSortable() {
  sortableInstance = Sortable.create(cardsContainer, {
    animation: 200,
    ghostClass: 'sortable-ghost',
    dragClass: 'sortable-drag',
    onEnd: function() {
      const order = [...cardsContainer.querySelectorAll('.card')].map(c => c.dataset.id);
      saveOrder(order);
    }
  });
}

// =============================================
// 17. INIT – CRITICAL: LOAD PREFERENCES FIRST
// =============================================
window.addEventListener('pageshow', () => document.body.classList.remove('fade-out'));

// Immediately apply theme to avoid FOUC
(function() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  if (savedTheme === 'dark') document.body.classList.add('dark');
  else document.body.classList.remove('dark');
  const savedAccent = localStorage.getItem(STORAGE_KEYS.ACCENT);
  if (savedAccent) document.documentElement.style.setProperty('--accent-color', savedAccent);
})();

document.addEventListener('DOMContentLoaded', () => {
  // These will sync with the already-applied theme/accent
  loadThemePreference();
  loadAccentColor();
  renderCategoryChips();
  renderCards();
  initSortable();
  initFloatingEmojis();
  attachGlobalSoundListeners();
  
  new MutationObserver(() => attachCardListeners()).observe(cardsContainer, { childList: true, subtree: true });
});
