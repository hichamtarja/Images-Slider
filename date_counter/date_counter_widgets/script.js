// ======================== GLOBAL VARIABLES ========================
const STORAGE_KEY = "date_widget_list";
const CUSTOM_KEY_PREFIX = "date_counter_custom_";
const currentWidgetId = new URLSearchParams(window.location.search).get("id");

// DOM Elements
const inputSection = document.getElementById('input-section');
const counterSection = document.getElementById('counter-section');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const titleInput = document.getElementById('title');
const startInput = document.getElementById('start-datetime');
const endInput = document.getElementById('end-datetime');
const quoteInput = document.getElementById('quote');

const displayTitle = document.getElementById('display-title');
const displayQuote = document.getElementById('display-quote');

const yearsSpan = document.getElementById('years');
const monthsSpan = document.getElementById('months');
const weeksSpan = document.getElementById('weeks');
const daysSpan = document.getElementById('days');
const hoursSpan = document.getElementById('hours');
const minutesSpan = document.getElementById('minutes');
const secondsSpan = document.getElementById('seconds');

const progressFill = document.getElementById('progress-fill');
const runner = document.querySelector('.runner');
const progressContainer = document.querySelector('.progress-container');
const countdownDisplay = document.getElementById('countdown');

const addMsBtn = document.getElementById('add-milestone-btn');
const viewMsBtn = document.getElementById('view-milestones-btn');
const toggleToolsBtn = document.getElementById('toggle-tools-btn');
const modal = document.getElementById('milestone-modal');
const closeModal = document.querySelector('.modal .close');
const msTitle = document.getElementById('ms-title');
const msStart = document.getElementById('ms-start');
const msEnd = document.getElementById('ms-end');
const msSave = document.getElementById('ms-save');

// Customization Elements
const settingsToggle = document.getElementById('settings-toggle');
const settingsPanel = document.getElementById('settings-panel');
const closeSettings = document.getElementById('close-settings');
const accentColorInput = document.getElementById('accent-color');
const fontSelect = document.getElementById('font-select');
const textColorInput = document.getElementById('text-color');
const bgTypeSelect = document.getElementById('bg-type');
const solidBgItem = document.getElementById('solid-bg-item');
const gradientBgItem = document.getElementById('gradient-bg-item');
const bgColorInput = document.getElementById('bg-color');
const gradientStartInput = document.getElementById('gradient-start');
const gradientEndInput = document.getElementById('gradient-end');
const sizeSlider = document.getElementById('size-slider');
const sizeValue = document.getElementById('size-value');
const widgetWrapper = document.getElementById('widgetWrapper');
const mainContainer = document.getElementById('mainContainer');

let countdownInterval = null;
let milestones = [];
let showingMilestoneView = false;
let currentAccentColor = '#ff6a00';
let currentCustomization = {};

// ======================== HELPER: Prevent past dates ========================
function setMinDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
  
  if (startInput) startInput.min = minDateTime;
  if (endInput) endInput.min = minDateTime;
  if (msStart) msStart.min = minDateTime;
  if (msEnd) msEnd.min = minDateTime;
}
setMinDateTime();
startInput?.addEventListener('focus', setMinDateTime);
endInput?.addEventListener('focus', setMinDateTime);

// ======================== STORAGE HELPERS ========================
function getWidgets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveWidgets(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function getCurrentWidget() {
  if (!currentWidgetId) return null;
  return getWidgets().find(w => String(w.id) === String(currentWidgetId)) || null;
}
function saveCurrentWidget(partial) {
  if (!currentWidgetId) return;
  const list = getWidgets();
  let widget = list.find(w => String(w.id) === String(currentWidgetId));
  if (!widget) {
    widget = { id: currentWidgetId, title: "", quote: "", startDate: "", endDate: "", milestones: [], accentColor: currentAccentColor };
    list.push(widget);
  }
  Object.assign(widget, partial);
  saveWidgets(list);
}

function serializeMilestones(list) {
  return list.map(ms => ({
    title: ms.title,
    start: ms.start instanceof Date ? ms.start.toISOString() : ms.start,
    end: ms.end instanceof Date ? ms.end.toISOString() : ms.end,
    colors: ms.colors
  }));
}
function deserializeMilestones(list) {
  if (!Array.isArray(list)) return [];
  return list.map(ms => ({
    title: ms.title,
    start: new Date(ms.start),
    end: new Date(ms.end),
    colors: ms.colors || getRandomMilestonePalette()
  }));
}

// ======================== CUSTOMIZATION STORAGE ========================
function getCustomizationKey() {
  return `${CUSTOM_KEY_PREFIX}${currentWidgetId}`;
}
function loadCustomization() {
  if (!currentWidgetId) return {};
  const saved = localStorage.getItem(getCustomizationKey());
  return saved ? JSON.parse(saved) : {};
}
function saveCustomization(settings) {
  if (!currentWidgetId) return;
  localStorage.setItem(getCustomizationKey(), JSON.stringify(settings));
}

// ======================== APPLY CUSTOMIZATION ========================
function adjustColor(hex, percent) {
  let R = parseInt(hex.substring(1,3),16);
  let G = parseInt(hex.substring(3,5),16);
  let B = parseInt(hex.substring(5,7),16);
  R = Math.min(255, Math.max(0, R + percent));
  G = Math.min(255, Math.max(0, G + percent));
  B = Math.min(255, Math.max(0, B + percent));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

function updateButtonGradients() {
  const accent = currentAccentColor;
  const secondary = adjustColor(accent, 20);
  const buttons = document.querySelectorAll('button:not(#reset-btn):not(.icon-btn)');
  buttons.forEach(btn => {
    btn.style.background = `linear-gradient(135deg, ${accent}, ${secondary})`;
  });
}

function applyCustomization(settings) {
  currentCustomization = settings;
  
  // Accent color
  if (settings.accent) {
    currentAccentColor = settings.accent;
    document.documentElement.style.setProperty('--accent', settings.accent);
    document.documentElement.style.setProperty('--accent-secondary', adjustColor(settings.accent, 20));
    if (accentColorInput) accentColorInput.value = settings.accent;
  }
  
  // Font family
  if (settings.fontFamily) {
    document.body.style.fontFamily = settings.fontFamily;
    if (fontSelect) fontSelect.value = settings.fontFamily;
  }
  
  // Text color
  if (settings.textColor) {
    mainContainer.style.color = settings.textColor;
    if (textColorInput) textColorInput.value = settings.textColor;
  }
  
  // Background
  if (settings.bgType === 'gradient') {
    const start = settings.gradientStart || '#191919';
    const end = settings.gradientEnd || '#2a2a2a';
    mainContainer.style.background = `linear-gradient(135deg, ${start}, ${end})`;
    if (gradientStartInput) gradientStartInput.value = start;
    if (gradientEndInput) gradientEndInput.value = end;
    if (bgTypeSelect) bgTypeSelect.value = 'gradient';
    if (solidBgItem) solidBgItem.classList.add('hidden');
    if (gradientBgItem) gradientBgItem.classList.remove('hidden');
  } else {
    const bg = settings.bgColor || '#191919';
    mainContainer.style.background = bg;
    if (bgColorInput) bgColorInput.value = bg;
    if (bgTypeSelect) bgTypeSelect.value = 'solid';
    if (solidBgItem) solidBgItem.classList.remove('hidden');
    if (gradientBgItem) gradientBgItem.classList.add('hidden');
  }
  
  // Size
  if (settings.size) {
    const scale = settings.size / 100;
    widgetWrapper.style.transform = `scale(${scale})`;
    if (sizeSlider) sizeSlider.value = settings.size;
    if (sizeValue) sizeValue.textContent = settings.size;
  }
  
  updateButtonGradients();
}

function gatherAndSaveCustomization() {
  const settings = {
    accent: accentColorInput.value,
    fontFamily: fontSelect.value,
    textColor: textColorInput.value,
    bgType: bgTypeSelect.value,
    bgColor: bgColorInput.value,
    gradientStart: gradientStartInput.value,
    gradientEnd: gradientEndInput.value,
    size: parseInt(sizeSlider.value)
  };
  saveCustomization(settings);
  applyCustomization(settings);
}

// ======================== COLOR & MILESTONE UTILITIES ========================
function getRandomMilestonePalette() {
  const hue = Math.floor(Math.random() * 360);
  return {
    start: `hsl(${hue}, 85%, 60%)`,
    end: `hsl(${(hue + 35) % 360}, 85%, 68%)`
  };
}

// ======================== UI UTILITIES ========================
function animateValue(element, value) {
  element.classList.add('tick');
  setTimeout(() => element.classList.remove('tick'), 300);
  element.textContent = value;
}
function getTimeParts(totalMilliseconds) {
  const totalSeconds = Math.max(0, Math.floor(totalMilliseconds / 1000));
  return {
    years: Math.floor(totalSeconds / (365 * 24 * 3600)),
    months: Math.floor((totalSeconds % (365 * 24 * 3600)) / (30 * 24 * 3600)),
    weeks: Math.floor((totalSeconds % (30 * 24 * 3600)) / (7 * 24 * 3600)),
    days: Math.floor((totalSeconds % (7 * 24 * 3600)) / (24 * 3600)),
    hours: Math.floor((totalSeconds % (24 * 3600)) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  };
}
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch] || ch));
}

// ======================== FLAGS & MILESTONE RENDERING ========================
function renderStartEndFlags() {
  if (!progressContainer) return;
  document.querySelectorAll('.flag-start, .flag-end').forEach(el => el.remove());

  const mainStart = new Date(startInput.value);
  const mainEnd = new Date(endInput.value);

  const startFlag = document.createElement('div');
  startFlag.className = 'flag flag-start';
  startFlag.style.pointerEvents = 'auto';
  startFlag.style.cursor = 'help';
  startFlag.innerHTML = `<span class="flag-anchor">🚩</span><span class="flag-tooltip">Start: ${mainStart.toLocaleString()}</span>`;
  progressContainer.appendChild(startFlag);

  const endFlag = document.createElement('div');
  endFlag.className = 'flag flag-end';
  endFlag.style.pointerEvents = 'auto';
  endFlag.style.cursor = 'help';
  endFlag.innerHTML = `<span class="flag-anchor">🏁</span><span class="flag-tooltip">End: ${mainEnd.toLocaleString()}</span>`;
  progressContainer.appendChild(endFlag);
}

function renderMilestones() {
  if (!progressContainer) return;
  document.querySelectorAll('.ms-pin').forEach(el => el.remove());
  if (!milestones.length || !startInput.value || !endInput.value) return;

  const mainStart = new Date(startInput.value);
  const mainEnd = new Date(endInput.value);
  const totalDuration = mainEnd - mainStart;
  if (totalDuration <= 0) return;

  const stackCounts = {};
  milestones.slice().sort((a,b) => a.start - b.start).forEach(ms => {
    const startPerc = ((ms.start - mainStart) / totalDuration) * 100;
    const endPerc = ((ms.end - mainStart) / totalDuration) * 100;
    createMilestonePin(startPerc, ms, 'start', stackCounts);
    createMilestonePin(endPerc, ms, 'end', stackCounts);
  });
}

function createMilestonePin(percent, ms, kind, stackCounts) {
  const key = percent.toFixed(2);
  const stackIndex = stackCounts[key] || 0;
  stackCounts[key] = stackIndex + 1;

  const pin = document.createElement('div');
  pin.className = 'ms-pin';
  Object.assign(pin.style, {
    left: `calc(${percent}% + 5px)`,
    top: `${-6 - stackIndex * 16}px`,
    zIndex: 20 + stackIndex
  });

  const dotColor = kind === 'start' ? ms.colors.start : ms.colors.end;
  const labelDate = kind === 'start' ? ms.start.toLocaleString() : ms.end.toLocaleString();
  pin.innerHTML = `
    <div class="pin-line" style="background:${dotColor}"></div>
    <div class="pin-dot" style="background:${dotColor}; box-shadow: 0 0 12px ${dotColor};"></div>
    <span class="flag-tooltip">${kind==='start' ? ms.title + ' Start' : ms.title + ' End'}<br>${labelDate}</span>
  `;
  progressContainer.appendChild(pin);
}

// ======================== MILESTONE VIEW (Next milestone) ========================
function ensureMilestoneView() {
  let view = document.getElementById('milestone-view');
  if (!view) {
    view = document.createElement('div');
    view.id = 'milestone-view';
    view.addEventListener('click', toggleMilestoneView);
    countdownDisplay.insertAdjacentElement('beforebegin', view);
  }
  return view;
}
function ensureDeadlineMessage() {
  let msg = document.getElementById('deadline-message');
  if (!msg) {
    msg = document.createElement('div');
    msg.id = 'deadline-message';
    msg.style.display = 'none';
    countdownDisplay.insertAdjacentElement('beforebegin', msg);
  }
  return msg;
}

function getNextMilestone(now = new Date()) {
  return milestones.filter(ms => ms.end > now).sort((a,b) => a.end - b.end)[0] || null;
}

function updateMilestoneView(now = new Date()) {
  const view = ensureMilestoneView();
  const next = getNextMilestone(now);
  if (!next) {
    view.innerHTML = `<div style="font-size:18px;">No upcoming milestone</div><div style="opacity:.7;">Tap to return</div>`;
    return;
  }
  const remaining = Math.max(0, next.end - now);
  const parts = getTimeParts(remaining);
  view.innerHTML = `
    <div style="font-size:14px;opacity:.7;">Next milestone completion</div>
    <div style="font-size:24px;font-weight:800;margin:10px 0;">${escapeHtml(next.title)}</div>
    <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:8px;">
      ${Object.entries(parts).map(([unit,val]) => `<div style="min-width:70px;"><span style="font-size:24px;">${val}</span><br>${unit}</div>`).join('')}
    </div>
    <div style="margin-top:15px;">${next.start.toLocaleString()} → ${next.end.toLocaleString()}</div>
    <div style="margin-top:10px;font-size:13px;">Tap again to go back</div>
  `;
}

function toggleMilestoneView() {
  if (!milestones.length) return;
  const view = ensureMilestoneView();
  showingMilestoneView = !showingMilestoneView;
  if (showingMilestoneView) {
    countdownDisplay.style.display = 'none';
    view.style.display = 'block';
    updateMilestoneView();
  } else {
    view.style.display = 'none';
    countdownDisplay.style.display = 'flex';
  }
}

// ======================== COUNTDOWN UPDATE ========================
function updateCountdown(start, end) {
  const now = new Date();
  let diff = end - now;
  const deadlineMessage = ensureDeadlineMessage();

  if (diff <= 0) {
    diff = 0;
    clearInterval(countdownInterval);
    deadlineMessage.textContent = "⏳ Time's Up!";
    deadlineMessage.style.display = 'block';
    countdownDisplay.style.opacity = '0.4';
    progressFill.style.width = '100%';
    runner.style.left = '100%';
    return;
  }

  deadlineMessage.style.display = 'none';
  countdownDisplay.style.opacity = '1';

  const parts = getTimeParts(diff);
  animateValue(yearsSpan, parts.years);
  animateValue(monthsSpan, parts.months);
  animateValue(weeksSpan, parts.weeks);
  animateValue(daysSpan, parts.days);
  animateValue(hoursSpan, parts.hours);
  animateValue(minutesSpan, parts.minutes);
  animateValue(secondsSpan, parts.seconds);

  const danger = diff < 86400000;
  document.querySelectorAll('#countdown div').forEach(d => d.classList.toggle('danger', danger));

  const total = end - start;
  const elapsed = now - start;
  let progress = (elapsed / total) * 100;
  progress = Math.min(100, Math.max(0, progress));

  progressFill.style.width = progress + '%';
  runner.style.left = progress + '%';
  runner.style.transition = 'left 0.8s cubic-bezier(0.2,0.9,0.4,1)';

  if (showingMilestoneView) updateMilestoneView(now);
}

// ======================== MAIN ACTIONS ========================
function startCounter() {
  const startDate = new Date(startInput.value);
  const endDate = new Date(endInput.value);

  if (!startInput.value || !endInput.value) return alert('Please set start and end times.');
  if (isNaN(startDate) || isNaN(endDate)) return alert('Invalid date/time.');
  if (endDate <= startDate) return alert('End must be after start.');

  // Apply saved customization (if any)
  const savedCustom = loadCustomization();
  if (Object.keys(savedCustom).length === 0) {
    // Default settings
    savedCustom.accent = '#ff6a00';
    savedCustom.fontFamily = "'Segoe UI', 'Arial', sans-serif";
    savedCustom.textColor = '#f0f0f0';
    savedCustom.bgType = 'solid';
    savedCustom.bgColor = '#191919';
    savedCustom.size = 100;
  }
  applyCustomization(savedCustom);
  currentAccentColor = savedCustom.accent || '#ff6a00';

  inputSection.style.display = 'none';
  counterSection.style.display = 'block';
  showingMilestoneView = false;
  ensureMilestoneView().style.display = 'none';
  ensureDeadlineMessage().style.display = 'none';
  countdownDisplay.style.display = 'flex';

  const title = titleInput.value.trim();
  displayTitle.textContent = title || 'Untitled Event';
  displayTitle.dataset.raw = title;
  displayTitle.style.display = 'block';

  const quote = quoteInput.value.trim();
  if (quote) {
    displayQuote.textContent = `“${quote}”`;
    displayQuote.dataset.raw = quote;
    displayQuote.style.display = 'block';
  } else {
    displayQuote.style.display = 'none';
  }

  bindEditableTitle();
  bindEditableQuote();

  renderStartEndFlags();
  renderMilestones();

  runner.style.left = '0%';
  progressFill.style.width = '0%';

  saveCurrentState();

  updateCountdown(startDate, endDate);
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => updateCountdown(startDate, endDate), 1000);
}

function resetCounter() {
  clearInterval(countdownInterval);
  inputSection.style.display = 'block';
  counterSection.style.display = 'none';
  titleInput.value = '';
  quoteInput.value = '';
  startInput.value = '';
  endInput.value = '';
  milestones = [];
  showingMilestoneView = false;

  document.querySelectorAll('.flag-start, .flag-end, .ms-pin').forEach(el => el.remove());
  const mv = document.getElementById('milestone-view');
  if (mv) { mv.style.display = 'none'; mv.innerHTML = ''; }
  const dm = document.getElementById('deadline-message');
  if (dm) { dm.style.display = 'none'; }

  yearsSpan.textContent = monthsSpan.textContent = weeksSpan.textContent = daysSpan.textContent = hoursSpan.textContent = minutesSpan.textContent = secondsSpan.textContent = '0';
  progressFill.style.width = '0%';
  runner.style.left = '0%';

  saveCurrentState();
}

function bindEditableTitle() {
  displayTitle.onclick = () => {
    const newTitle = prompt('Edit title:', displayTitle.dataset.raw || '');
    if (newTitle !== null) {
      displayTitle.textContent = newTitle.trim() || 'Untitled Event';
      displayTitle.dataset.raw = newTitle.trim();
      titleInput.value = newTitle.trim();
      saveCurrentState();
    }
  };
}
function bindEditableQuote() {
  displayQuote.onclick = () => {
    const newQuote = prompt('Edit quote:', displayQuote.dataset.raw || '');
    if (newQuote !== null) {
      const trimmed = newQuote.trim();
      displayQuote.textContent = trimmed ? `“${trimmed}”` : '';
      displayQuote.dataset.raw = trimmed;
      quoteInput.value = trimmed;
      displayQuote.style.display = trimmed ? 'block' : 'none';
      saveCurrentState();
    }
  };
}

function saveCurrentState() {
  saveCurrentWidget({
    title: titleInput.value.trim(),
    quote: quoteInput.value.trim(),
    startDate: startInput.value,
    endDate: endInput.value,
    milestones: serializeMilestones(milestones),
    accentColor: currentAccentColor
  });
}

// ======================== MILESTONE LIST MODAL ========================
function showMilestoneList() {
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: '9999'
  });

  const panel = document.createElement('div');
  Object.assign(panel.style, {
    background: '#1e1e1e', padding: '25px', borderRadius: '28px', width: '360px',
    maxHeight: '450px', overflowY: 'auto', position: 'relative', textAlign: 'left',
    border: '1px solid #444', boxShadow: '0 20px 35px rgba(0,0,0,0.6)'
  });

  const closeBtn = document.createElement('span');
  closeBtn.textContent = '✖';
  Object.assign(closeBtn.style, { position: 'absolute', top: '12px', right: '18px', cursor: 'pointer', fontSize: '20px', opacity: '0.7' });
  closeBtn.addEventListener('click', () => overlay.remove());

  const title = document.createElement('h3');
  title.textContent = '📋 All Milestones';
  title.style.marginTop = '0';
  panel.appendChild(closeBtn);
  panel.appendChild(title);

  if (milestones.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No milestones yet.';
    empty.style.opacity = '0.7';
    panel.appendChild(empty);
  } else {
    milestones.forEach((ms, index) => {
      const item = document.createElement('div');
      Object.assign(item.style, { marginBottom: '12px', padding: '15px 15px 45px', background: '#2a2a2a', borderRadius: '16px', position: 'relative' });
      item.innerHTML = `
        <strong style="font-size:16px;">${escapeHtml(ms.title)}</strong><br>
        <small style="opacity:0.8;">${ms.start.toLocaleString()} → ${ms.end.toLocaleString()}</small><br>
        <button class="ms-delete-btn" data-del="${index}">Delete</button>
      `;
      panel.appendChild(item);
    });
    panel.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = Number(btn.getAttribute('data-del'));
        milestones.splice(index, 1);
        renderMilestones();
        saveCurrentState();
        overlay.remove();
        showMilestoneList();
      });
    });
  }

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ======================== TOOLS VISIBILITY ========================
function applyToolsVisibility(hidden) {
  [addMsBtn, viewMsBtn].forEach(btn => { if(btn) btn.style.display = hidden ? 'none' : 'inline-block'; });
  if (toggleToolsBtn) toggleToolsBtn.textContent = hidden ? "👁️ Show Tools" : "👁️ Hide Tools";
}

// ======================== INITIALIZATION ========================
function initFromSavedWidget() {
  const saved = getCurrentWidget();
  if (saved) {
    titleInput.value = saved.title || '';
    quoteInput.value = saved.quote || '';
    startInput.value = saved.startDate || '';
    endInput.value = saved.endDate || '';
    milestones = deserializeMilestones(saved.milestones || []);
    if (saved.accentColor) {
      currentAccentColor = saved.accentColor;
    }
  }

  const savedCustom = loadCustomization();
  if (Object.keys(savedCustom).length > 0) {
    applyCustomization(savedCustom);
  } else {
    // Default customization
    applyCustomization({ accent: '#ff6a00', fontFamily: "'Segoe UI', 'Arial', sans-serif", textColor: '#f0f0f0', bgType: 'solid', bgColor: '#191919', size: 100 });
  }

  applyToolsVisibility(localStorage.getItem("date_counter_tools_hidden") === "true");

  if (saved && saved.startDate && saved.endDate) {
    startCounter();
  } else {
    inputSection.style.display = 'block';
    counterSection.style.display = 'none';
  }
}

// ======================== EVENT LISTENERS ========================
// Customization panel events
settingsToggle.addEventListener('click', () => settingsPanel.classList.remove('hidden'));
closeSettings.addEventListener('click', () => {
  settingsPanel.classList.add('hidden');
  gatherAndSaveCustomization();
});
bgTypeSelect.addEventListener('change', () => {
  if (bgTypeSelect.value === 'gradient') {
    solidBgItem.classList.add('hidden');
    gradientBgItem.classList.remove('hidden');
  } else {
    solidBgItem.classList.remove('hidden');
    gradientBgItem.classList.add('hidden');
  }
});
sizeSlider.addEventListener('input', () => {
  sizeValue.textContent = sizeSlider.value;
  widgetWrapper.style.transform = `scale(${sizeSlider.value / 100})`;
});
[accentColorInput, fontSelect, textColorInput, bgColorInput, gradientStartInput, gradientEndInput].forEach(el => {
  el.addEventListener('input', () => {
    if (el === accentColorInput) {
      currentAccentColor = el.value;
      document.documentElement.style.setProperty('--accent', el.value);
      document.documentElement.style.setProperty('--accent-secondary', adjustColor(el.value, 20));
      updateButtonGradients();
    }
    if (el === fontSelect) document.body.style.fontFamily = el.value;
    if (el === textColorInput) mainContainer.style.color = el.value;
    if (el === bgColorInput && bgTypeSelect.value === 'solid') mainContainer.style.background = el.value;
    if ((el === gradientStartInput || el === gradientEndInput) && bgTypeSelect.value === 'gradient') {
      mainContainer.style.background = `linear-gradient(135deg, ${gradientStartInput.value}, ${gradientEndInput.value})`;
    }
  });
  el.addEventListener('change', gatherAndSaveCustomization);
});
sizeSlider.addEventListener('change', gatherAndSaveCustomization);

// Draggable panel
const settingsHeader = document.getElementById('settings-header');
let isDragging = false, offsetX, offsetY;
settingsHeader.addEventListener('mousedown', (e) => {
  isDragging = true;
  const rect = settingsPanel.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  settingsPanel.style.transition = 'none';
  settingsPanel.style.transform = 'none';
  settingsPanel.style.left = rect.left + 'px';
  settingsPanel.style.top = rect.top + 'px';
  e.preventDefault();
});
document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  let left = e.clientX - offsetX;
  let top = e.clientY - offsetY;
  left = Math.max(0, Math.min(left, window.innerWidth - settingsPanel.offsetWidth));
  top = Math.max(0, Math.min(top, window.innerHeight - settingsPanel.offsetHeight));
  settingsPanel.style.left = left + 'px';
  settingsPanel.style.top = top + 'px';
});
document.addEventListener('mouseup', () => { isDragging = false; settingsPanel.style.transition = ''; });

// Other event listeners
startBtn.addEventListener('click', startCounter);
resetBtn.addEventListener('click', resetCounter);
toggleToolsBtn.addEventListener('click', () => {
  const hidden = !(localStorage.getItem("date_counter_tools_hidden") === "true");
  localStorage.setItem("date_counter_tools_hidden", hidden);
  applyToolsVisibility(hidden);
});
viewMsBtn.addEventListener('click', showMilestoneList);
addMsBtn.addEventListener('click', () => modal.style.display = 'flex');
closeModal.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
msSave.addEventListener('click', () => {
  const title = msTitle.value.trim();
  const start = new Date(msStart.value);
  const end = new Date(msEnd.value);
  const mainStart = new Date(startInput.value);
  const mainEnd = new Date(endInput.value);
  if (!title || isNaN(start) || isNaN(end)) return alert('Fill all fields.');
  if (start < mainStart || end > mainEnd || start >= end) return alert('Milestone must be within the main interval.');
  milestones.push({ title, start, end, colors: getRandomMilestonePalette() });
  modal.style.display = 'none';
  msTitle.value = msStart.value = msEnd.value = '';
  renderMilestones();
  saveCurrentState();
  if (showingMilestoneView) updateMilestoneView();
});
countdownDisplay.addEventListener('click', toggleMilestoneView);

// Initialize
initFromSavedWidget();
