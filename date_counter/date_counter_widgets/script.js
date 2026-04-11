const STORAGE_KEY = "date_widget_list";
const currentWidgetId = new URLSearchParams(window.location.search).get("id");

const inputSection = document.getElementById('input-section');
const counterSection = document.getElementById('counter-section');

const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');

const titleInput = document.getElementById('title');
const startInput = document.getElementById('start-date');
const endInput = document.getElementById('end-date');
const quoteInput = document.getElementById('quote');

const counterTitle = document.getElementById('counter-title');
const displayTitle = document.getElementById('display-title');
const displayStart = document.getElementById('display-start');
const displayEnd = document.getElementById('display-end');
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

let countdownInterval = null;
let milestones = [];
let showingMilestoneView = false;

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

function getCurrentWidget() {
  if (!currentWidgetId) return null;
  return getWidgets().find(w => String(w.id) === String(currentWidgetId)) || null;
}

function saveCurrentWidget(partial) {
  if (!currentWidgetId) return;

  const list = getWidgets();
  let widget = list.find(w => String(w.id) === String(currentWidgetId));

  if (!widget) {
    widget = {
      id: currentWidgetId,
      title: "",
      quote: "",
      startDate: "",
      endDate: "",
      milestones: []
    };
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

function animateValue(element, value) {
  element.classList.add('tick');
  setTimeout(() => element.classList.remove('tick'), 300);
  element.textContent = value;
}

function getTimeParts(totalMilliseconds) {
  const totalSeconds = Math.max(0, Math.floor(totalMilliseconds / 1000));

  const years = Math.floor(totalSeconds / (365 * 24 * 3600));
  const months = Math.floor((totalSeconds % (365 * 24 * 3600)) / (30 * 24 * 3600));
  const weeks = Math.floor((totalSeconds % (30 * 24 * 3600)) / (7 * 24 * 3600));
  const days = Math.floor((totalSeconds % (7 * 24 * 3600)) / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { years, months, weeks, days, hours, minutes, seconds };
}

function getRandomMilestonePalette() {
  const hue = Math.floor(Math.random() * 360);
  return {
    start: `hsl(${hue}, 85%, 60%)`,
    end: `hsl(${(hue + 35) % 360}, 85%, 68%)`
  };
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return map[ch] || ch;
  });
}

function injectRunnerAnimationStyle() {
  if (document.getElementById('runner-anim-style')) return;

  const style = document.createElement('style');
  style.id = 'runner-anim-style';
  style.textContent = `
    @keyframes runnerBounce {
      0% { transform: translateY(0px) rotate(-2deg); }
      100% { transform: translateY(-4px) rotate(2deg); }
    }
  `;
  document.head.appendChild(style);
}

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

function saveCurrentState() {
  saveCurrentWidget({
    title: titleInput.value.trim(),
    quote: quoteInput.value.trim(),
    startDate: startInput.value,
    endDate: endInput.value,
    milestones: serializeMilestones(milestones)
  });
}

function bindEditableTitle() {
  displayTitle.onclick = () => {
    const current = displayTitle.dataset.raw || displayTitle.textContent || "";
    const next = prompt("Edit title:", current);
    if (next === null) return;

    const value = next.trim();
    titleInput.value = value;
    displayTitle.dataset.raw = value;
    displayTitle.textContent = value;
    displayTitle.style.display = value ? 'block' : 'none';

    saveCurrentState();
  };
}

function bindEditableQuote() {
  displayQuote.onclick = () => {
    const current = displayQuote.dataset.raw || "";
    const next = prompt("Edit quote:", current);
    if (next === null) return;

    const value = next.trim();
    quoteInput.value = value;
    displayQuote.dataset.raw = value;
    displayQuote.textContent = value ? `“ ${value} ”` : '';
    displayQuote.style.display = value ? 'block' : 'none';

    saveCurrentState();
  };
}

function renderStartEndFlags() {
  if (!progressContainer) return;

  document.querySelectorAll('.flag-start, .flag-end').forEach(el => el.remove());

  const mainStart = new Date(startInput.value);
  const mainEnd = new Date(endInput.value);

  const startFlag = document.createElement('div');
  startFlag.className = 'flag flag-start';
  startFlag.innerHTML = `
    <span class="flag-anchor">🚩</span>
    <span class="flag-tooltip">Start: ${mainStart.toDateString()}</span>
  `;
  progressContainer.appendChild(startFlag);

  const endFlag = document.createElement('div');
  endFlag.className = 'flag flag-end';
  endFlag.innerHTML = `
    <span class="flag-anchor">🚩</span>
    <span class="flag-tooltip">End: ${mainEnd.toDateString()}</span>
  `;
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

  milestones
    .slice()
    .sort((a, b) => a.start - b.start || a.end - b.end || a.title.localeCompare(b.title))
    .forEach((ms) => {
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
    zIndex: `${20 + stackIndex}`
  });

  const dotColor = kind === 'start' ? ms.colors.start : ms.colors.end;

  pin.innerHTML = `
    <div class="pin-line" style="background:${dotColor}"></div>
    <div class="pin-dot" style="background:${dotColor}; box-shadow: 0 0 12px ${dotColor};"></div>
    <span class="flag-tooltip">${kind === 'start' ? ms.title + ' Start' : ms.title + ' End'}</span>
  `;

  progressContainer.appendChild(pin);
}

function getNextMilestone(now = new Date()) {
  const upcoming = milestones
    .filter((ms) => ms.end > now)
    .sort((a, b) => a.end - b.end || a.start - b.start || a.title.localeCompare(b.title));

  return upcoming[0] || null;
}

function updateMilestoneView(now = new Date()) {
  const view = ensureMilestoneView();
  const next = getNextMilestone(now);

  if (!next) {
    view.innerHTML = `
      <div style="font-size:18px;font-weight:700;margin-bottom:8px;">No upcoming milestone</div>
      <div style="opacity:.75;">Tap again to return to the main counter.</div>
    `;
    return;
  }

  const remaining = Math.max(0, next.end - now);
  const parts = getTimeParts(remaining);

  view.innerHTML = `
    <div style="font-size:14px;opacity:.75;margin-bottom:8px;">Next milestone completion</div>
    <div style="font-size:22px;font-weight:800;margin-bottom:10px;">${escapeHtml(next.title)}</div>
    <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
      <div style="min-width:74px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,0.06);">
        <div style="font-size:22px;font-weight:800;">${parts.years}</div><div style="font-size:12px;opacity:.8;">Years</div>
      </div>
      <div style="min-width:74px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,0.06);">
        <div style="font-size:22px;font-weight:800;">${parts.months}</div><div style="font-size:12px;opacity:.8;">Months</div>
      </div>
      <div style="min-width:74px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,0.06);">
        <div style="font-size:22px;font-weight:800;">${parts.weeks}</div><div style="font-size:12px;opacity:.8;">Weeks</div>
      </div>
      <div style="min-width:74px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,0.06);">
        <div style="font-size:22px;font-weight:800;">${parts.days}</div><div style="font-size:12px;opacity:.8;">Days</div>
      </div>
      <div style="min-width:74px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,0.06);">
        <div style="font-size:22px;font-weight:800;">${parts.hours}</div><div style="font-size:12px;opacity:.8;">Hours</div>
      </div>
      <div style="min-width:74px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,0.06);">
        <div style="font-size:22px;font-weight:800;">${parts.minutes}</div><div style="font-size:12px;opacity:.8;">Minutes</div>
      </div>
      <div style="min-width:74px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,0.06);">
        <div style="font-size:22px;font-weight:800;">${parts.seconds}</div><div style="font-size:12px;opacity:.8;">Seconds</div>
      </div>
    </div>
    <div style="font-size:13px;opacity:.75;">${next.start.toDateString()} → ${next.end.toDateString()}</div>
    <div style="margin-top:8px;font-size:12px;opacity:.65;">Tap again to go back.</div>
  `;
}

function toggleMilestoneView() {
  if (!milestones.length) return;

  const next = getNextMilestone(new Date());
  if (!next) return;

  const view = ensureMilestoneView();
  showingMilestoneView = !showingMilestoneView;

  if (showingMilestoneView) {
    countdownDisplay.style.display = 'none';
    view.style.display = 'block';
    updateMilestoneView(new Date());
  } else {
    view.style.display = 'none';
    countdownDisplay.style.display = 'flex';
  }
}

function updateCountdown(start, end) {
  const now = new Date();
  let diff = end - now;
  const deadlineMessage = ensureDeadlineMessage();

  if (diff <= 0) {
    diff = 0;
    clearInterval(countdownInterval);

    deadlineMessage.textContent = "⏳ Time's Up!";
    deadlineMessage.style.display = 'block';
    countdownDisplay.style.opacity = '0.35';
    progressFill.style.width = '100%';
    runner.style.left = '100%';
    runner.style.animation = 'runnerBounce 0.7s ease-in-out infinite alternate';
    return;
  }

  deadlineMessage.style.display = 'none';
  countdownDisplay.style.opacity = '1';

  const { years, months, weeks, days, hours, minutes, seconds } = getTimeParts(diff);

  animateValue(yearsSpan, years);
  animateValue(monthsSpan, months);
  animateValue(weeksSpan, weeks);
  animateValue(daysSpan, days);
  animateValue(hoursSpan, hours);
  animateValue(minutesSpan, minutes);
  animateValue(secondsSpan, seconds);

  if (diff < 86400000) {
    document.querySelectorAll('#countdown div').forEach((d) => d.classList.add('danger'));
  } else {
    document.querySelectorAll('#countdown div').forEach((d) => d.classList.remove('danger'));
  }

  const totalDuration = end - start;
  const elapsed = now - start;

  let progress = (elapsed / totalDuration) * 100;
  progress = Math.max(0, Math.min(100, progress));

  progressFill.style.width = progress + '%';
  runner.style.left = progress + '%';
  runner.style.transition = 'left 0.8s linear';
  runner.style.animation = 'runnerBounce 0.7s ease-in-out infinite alternate';

  if (showingMilestoneView) {
    updateMilestoneView(now);
  }
}

function applyToolsVisibility(hidden) {
  [addMsBtn, viewMsBtn].forEach(btn => {
    if (btn) btn.style.display = hidden ? 'none' : 'inline-block';
  });

  if (toggleToolsBtn) {
    toggleToolsBtn.textContent = hidden ? "Show Tools" : "Hide Tools";
  }
}

function showMilestoneList() {
  const overlay = document.createElement('div');

  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '9999'
  });

  const panel = document.createElement('div');

  Object.assign(panel.style, {
    background: '#222',
    padding: '20px',
    borderRadius: '15px',
    width: '320px',
    maxHeight: '420px',
    overflowY: 'auto',
    position: 'relative',
    textAlign: 'left'
  });

  const closeBtn = document.createElement('span');
  closeBtn.textContent = '✖';
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '10px',
    right: '15px',
    cursor: 'pointer',
    fontSize: '18px'
  });
  closeBtn.addEventListener('click', () => overlay.remove());

  const title = document.createElement('h3');
  title.textContent = 'Milestones';

  panel.appendChild(closeBtn);
  panel.appendChild(title);

  if (milestones.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No milestones yet';
    panel.appendChild(empty);
  } else {
    milestones.forEach((ms, index) => {
      const item = document.createElement('div');
      Object.assign(item.style, {
        marginBottom: '10px',
        padding: '10px 10px 42px',
        background: '#333',
        borderRadius: '10px',
        position: 'relative'
      });

      item.innerHTML = `
        <strong>${escapeHtml(ms.title)}</strong><br>
        <small>${ms.start.toDateString()} → ${ms.end.toDateString()}</small><br>
        <button class="ms-delete-btn" data-del="${index}">Delete</button>
      `;

      panel.appendChild(item);
    });

    panel.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
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

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function startCounter() {
  const startDate = new Date(startInput.value);
  const endDate = new Date(endInput.value);

  if (!startInput.value || !endInput.value) {
    alert('Please enter dates!');
    return;
  }

  if (isNaN(startDate) || isNaN(endDate)) {
    alert('Invalid dates!');
    return;
  }

  inputSection.style.display = 'none';
  counterSection.style.display = 'block';

  showingMilestoneView = false;

  const milestoneView = ensureMilestoneView();
  milestoneView.style.display = 'none';

  const deadlineMessage = ensureDeadlineMessage();
  deadlineMessage.style.display = 'none';

  countdownDisplay.style.display = 'flex';
  countdownDisplay.style.opacity = '1';

  const title = titleInput.value.trim();
  if (title === '') {
    displayTitle.style.display = 'none';
    displayTitle.dataset.raw = '';
  } else {
    displayTitle.style.display = 'block';
    displayTitle.textContent = title;
    displayTitle.dataset.raw = title;
  }

  const quote = quoteInput.value.trim();
  if (quote === '') {
    displayQuote.style.display = 'none';
    displayQuote.dataset.raw = '';
  } else {
    displayQuote.style.display = 'block';
    displayQuote.textContent = `“ ${quote} ”`;
    displayQuote.dataset.raw = quote;
  }

  displayStart.textContent = startDate.toDateString();
  displayEnd.textContent = endDate.toDateString();

  bindEditableTitle();
  bindEditableQuote();

  renderStartEndFlags();
  renderMilestones();

  saveCurrentState();

  runner.style.left = '0%';
  progressFill.style.width = '0%';

  updateCountdown(startDate, endDate);

  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    updateCountdown(startDate, endDate);
  }, 1000);
}

function resetCounter() {
  clearInterval(countdownInterval);

  inputSection.style.display = 'block';
  counterSection.style.display = 'none';

  startInput.value = '';
  endInput.value = '';
  quoteInput.value = '';
  titleInput.value = '';

  displayTitle.textContent = '';
  displayTitle.dataset.raw = '';
  displayTitle.style.display = 'none';

  displayQuote.textContent = '';
  displayQuote.dataset.raw = '';
  displayQuote.style.display = 'none';

  milestones = [];
  showingMilestoneView = false;

  document.querySelectorAll('.flag-start, .flag-end, .ms-pin').forEach(el => el.remove());

  const milestoneView = document.getElementById('milestone-view');
  if (milestoneView) {
    milestoneView.style.display = 'none';
    milestoneView.innerHTML = '';
  }

  const deadlineMessage = document.getElementById('deadline-message');
  if (deadlineMessage) {
    deadlineMessage.style.display = 'none';
    deadlineMessage.innerHTML = '';
  }

  progressFill.style.width = '0%';
  runner.style.left = '0%';
  countdownDisplay.innerHTML = '';

  saveCurrentState();
}

function initFromSavedWidget() {
  const savedWidget = getCurrentWidget();

  if (savedWidget) {
    titleInput.value = savedWidget.title || '';
    quoteInput.value = savedWidget.quote || '';
    startInput.value = savedWidget.startDate || '';
    endInput.value = savedWidget.endDate || '';
    milestones = deserializeMilestones(savedWidget.milestones || []);
  }

  applyToolsVisibility(localStorage.getItem("date_counter_tools_hidden") === "true");

  if (savedWidget && savedWidget.startDate && savedWidget.endDate) {
    startCounter();
  } else {
    inputSection.style.display = 'block';
    counterSection.style.display = 'none';
  }
}

injectRunnerAnimationStyle();
initFromSavedWidget();

startBtn.addEventListener('click', startCounter);

if (resetBtn) {
  resetBtn.addEventListener('click', resetCounter);
}

if (toggleToolsBtn) {
  toggleToolsBtn.addEventListener('click', () => {
    const hidden = !(localStorage.getItem("date_counter_tools_hidden") === "true");
    localStorage.setItem("date_counter_tools_hidden", String(hidden));
    applyToolsVisibility(hidden);
  });
}

if (viewMsBtn) {
  viewMsBtn.addEventListener('click', showMilestoneList);
}

if (addMsBtn && modal && closeModal && msTitle && msStart && msEnd && msSave) {
  addMsBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  msSave.addEventListener('click', () => {
    const title = msTitle.value.trim();
    const start = new Date(msStart.value);
    const end = new Date(msEnd.value);
    const mainStart = new Date(startInput.value);
    const mainEnd = new Date(endInput.value);

    if (!title || isNaN(start.getTime()) || isNaN(end.getTime())) {
      alert('Fill all fields correctly!');
      return;
    }

    if (start < mainStart || end > mainEnd || start > end) {
      alert('Milestone must be within countdown start & end!');
      return;
    }

    milestones.push({
      title,
      start,
      end,
      colors: getRandomMilestonePalette()
    });

    modal.style.display = 'none';
    msTitle.value = '';
    msStart.value = '';
    msEnd.value = '';

    renderMilestones();
    saveCurrentState();

    if (showingMilestoneView) {
      updateMilestoneView(new Date());
    }
  });
}

countdownDisplay.addEventListener('click', toggleMilestoneView);
