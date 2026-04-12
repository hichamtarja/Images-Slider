// ======================== GLOBAL STATE & DOM ELEMENTS ========================
let timerInterval = null;
let currentSessionType = 'work';
let sessionCount = 1;
let timeLeft = 25 * 60;
let isRunning = false;
let totalSessionTime = 25 * 60;

let todayPomodoros = 0;
let streakDays = 0;
let lastActiveDate = null;
let sessionsHistory = [];
let tasks = [];
let activeTaskId = null;
let showCompleted = true;

let settings = {
  workDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
  autoStart: true,
  sound: 'bell',
  voiceEnabled: false,
  desktopNotify: true,
  fullscreenBreak: false,
  fullscreenWork: false,
  accentColor: '#ff6a00'
};

const quotes = [
  "Rest is not idleness.", 
  "Almost everything will work again if you unplug it for a few minutes.",
  "Your future self will thank you.",
  "Take a deep breath. You're doing great.",
  "Productivity is about sustainable rhythms.",
  "Step away to come back stronger."
];
const workQuotes = [
  "Let's get back to it!",
  "Time to focus.",
  "You've got this.",
  "One Pomodoro at a time.",
  "Deep work begins now."
];

let statsChart = null;
let currentChartTab = 'daily';

// DOM Elements
const timerCanvas = document.getElementById('timer-canvas');
const ctx = timerCanvas.getContext('2d');
const minutesSpan = document.getElementById('timer-minutes');
const secondsSpan = document.getElementById('timer-seconds');
const sessionTypeLabel = document.getElementById('session-type-label');
const sessionCounterSpan = document.getElementById('session-counter');
const startPauseBtn = document.getElementById('timer-start-pause');
const resetBtn = document.getElementById('timer-reset');
const skipBtn = document.getElementById('timer-skip');
const autoStartCheck = document.getElementById('auto-start-checkbox');
const todayPomodorosSpan = document.getElementById('today-pomodoros');
const streakDaysSpan = document.getElementById('streak-days');
const quoteText = document.getElementById('quote-text');

const tasksListDiv = document.getElementById('tasks-list');
const completedTasksDiv = document.getElementById('completed-tasks-list');
const addTaskBtn = document.getElementById('add-task-btn');
const tasksCompletedSpan = document.getElementById('tasks-completed-count');
const toggleCompletedBtn = document.getElementById('toggle-completed-btn');

const settingsModal = document.getElementById('settings-modal');
const taskModal = document.getElementById('task-modal');
const interruptModal = document.getElementById('interrupt-modal');
const breakOverlay = document.getElementById('break-overlay');
const workOverlay = document.getElementById('work-overlay');

// Settings inputs
const setWork = document.getElementById('set-work');
const setShort = document.getElementById('set-short');
const setLong = document.getElementById('set-long');
const setInterval = document.getElementById('set-interval');
const setAccent = document.getElementById('set-accent');
const colorBar = document.getElementById('color-bar');
const setSound = document.getElementById('set-sound');
const setVoice = document.getElementById('set-voice');
const setDesktopNotify = document.getElementById('set-desktop-notify');
const setFullscreenBreak = document.getElementById('set-fullscreen-break');
const setFullscreenWork = document.getElementById('set-fullscreen-work');
const saveSettingsBtn = document.getElementById('save-settings-btn');

// Value displays for sliders
const workValue = document.getElementById('work-value');
const shortValue = document.getElementById('short-value');
const longValue = document.getElementById('long-value');
const intervalValue = document.getElementById('interval-value');
const editEstimateValue = document.getElementById('edit-estimate-value');

// Task edit
const editTaskId = document.getElementById('edit-task-id');
const editTaskTitle = document.getElementById('edit-task-title');
const editTaskEstimate = document.getElementById('edit-task-estimate');
const editTaskNotes = document.getElementById('edit-task-notes');
const saveTaskBtn = document.getElementById('save-task-btn');
const deleteTaskBtn = document.getElementById('delete-task-btn');

const interruptReason = document.getElementById('interrupt-reason');
const saveInterruptBtn = document.getElementById('save-interrupt-btn');

const tabBtns = document.querySelectorAll('.tab-btn');
const historyPanel = document.getElementById('history-log-panel');
const chartContainer = document.querySelector('.chart-container');
const historyListDiv = document.getElementById('history-list');
const exportDataBtn = document.getElementById('export-data-btn');
const focusToggle = document.getElementById('focus-mode-toggle');

// ======================== INITIALIZATION & STORAGE ========================
function loadFromStorage() {
  const saved = localStorage.getItem('pomodoro_suite');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      settings = data.settings || settings;
      tasks = data.tasks || [];
      sessionsHistory = data.sessions || [];
      todayPomodoros = data.todayPomodoros || 0;
      streakDays = data.streakDays || 0;
      lastActiveDate = data.lastActiveDate || null;
      activeTaskId = data.activeTaskId || null;
    } catch (e) {}
  }
  applySettingsToUI();
  updateStreak();
  renderTasks();
  updateQuickStats();
  drawTimer(1);
}

function saveToStorage() {
  const data = { settings, tasks, sessions: sessionsHistory, todayPomodoros, streakDays, lastActiveDate, activeTaskId };
  localStorage.setItem('pomodoro_suite', JSON.stringify(data));
}

function applySettingsToUI() {
  setWork.value = settings.workDuration;
  setShort.value = settings.shortBreak;
  setLong.value = settings.longBreak;
  setInterval.value = settings.longBreakInterval;
  setAccent.value = settings.accentColor;
  colorBar.style.backgroundColor = settings.accentColor;
  setSound.value = settings.sound;
  setVoice.checked = settings.voiceEnabled;
  setDesktopNotify.checked = settings.desktopNotify;
  setFullscreenBreak.checked = settings.fullscreenBreak;
  setFullscreenWork.checked = settings.fullscreenWork;
  autoStartCheck.checked = settings.autoStart;
  document.documentElement.style.setProperty('--accent', settings.accentColor);
  document.documentElement.style.setProperty('--accent-glow', `${settings.accentColor}66`);
  workValue.textContent = settings.workDuration;
  shortValue.textContent = settings.shortBreak;
  longValue.textContent = settings.longBreak;
  intervalValue.textContent = settings.longBreakInterval;
  if (!isRunning) {
    timeLeft = settings.workDuration * 60;
    totalSessionTime = timeLeft;
    updateTimerDisplay();
    drawTimer(1);
  }
}

function updateStreak() {
  const today = new Date().toDateString();
  if (lastActiveDate !== today) {
    if (lastActiveDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      streakDays = (lastActiveDate === yesterday.toDateString()) ? streakDays + 1 : 1;
    } else {
      streakDays = 1;
    }
    lastActiveDate = today;
    todayPomodoros = 0;
  }
  streakDaysSpan.textContent = streakDays;
}

// ======================== TIMER CORE ========================
function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  minutesSpan.textContent = String(mins).padStart(2, '0');
  secondsSpan.textContent = String(secs).padStart(2, '0');
  document.title = `${mins}:${String(secs).padStart(2,'0')} - ${currentSessionType}`;
}

function drawTimer(progress = null) {
  const w = timerCanvas.width, h = timerCanvas.height, radius = 120, centerX = w/2, centerY = h/2;
  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 12;
  ctx.stroke();
  if (progress === null) progress = timeLeft / totalSessionTime;
  const endAngle = (2 * Math.PI * progress) - (Math.PI / 2);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, -Math.PI/2, endAngle);
  ctx.strokeStyle = settings.accentColor;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function tick() {
  if (timeLeft <= 0) {
    completeSession();
    return;
  }
  timeLeft--;
  updateTimerDisplay();
  drawTimer(timeLeft / totalSessionTime);
  document.title = `${minutesSpan.textContent}:${secondsSpan.textContent} - ${currentSessionType}`;
}

function completeSession() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  startPauseBtn.textContent = 'Start';
  playSound(settings.sound);
  if (settings.desktopNotify && Notification.permission === 'granted') {
    new Notification(`Pomodoro Suite`, { body: `${currentSessionType} session completed!` });
  }
  if (settings.voiceEnabled) {
    const msg = new SpeechSynthesisUtterance(currentSessionType === 'work' ? 'Time for a break.' : 'Back to work.');
    window.speechSynthesis.speak(msg);
  }
  const session = { type: currentSessionType, duration: totalSessionTime / 60, timestamp: new Date().toISOString(), interruptions: [] };
  sessionsHistory.push(session);
  if (currentSessionType === 'work') {
    todayPomodoros++;
    updateStreak();
    if (activeTaskId) {
      const task = tasks.find(t => t.id === activeTaskId);
      if (task && !task.completed) {
        task.completedPomodoros = Math.min(task.completedPomodoros + 1, task.estimatedPomodoros);
        if (task.completedPomodoros >= task.estimatedPomodoros) task.completed = true;
      }
    }
  }
  if (settings.fullscreenBreak && currentSessionType === 'work') breakOverlay.style.display = 'flex';
  if (settings.fullscreenWork && currentSessionType !== 'work') workOverlay.style.display = 'flex';
  quoteText.textContent = currentSessionType === 'work' ? `“${quotes[Math.floor(Math.random() * quotes.length)]}”` : `“${workQuotes[Math.floor(Math.random() * workQuotes.length)]}”`;
  if (currentSessionType === 'work') {
    sessionCount++;
    if (sessionCount > settings.longBreakInterval) { currentSessionType = 'longBreak'; sessionCount = 1; }
    else currentSessionType = 'shortBreak';
  } else {
    currentSessionType = 'work';
  }
  timeLeft = (currentSessionType === 'work' ? settings.workDuration : currentSessionType === 'shortBreak' ? settings.shortBreak : settings.longBreak) * 60;
  totalSessionTime = timeLeft;
  updateSessionLabel();
  updateTimerDisplay();
  drawTimer(1);
  updateQuickStats();
  renderTasks();
  saveToStorage();
  updateChart(currentChartTab);
  renderHistoryList();
  if (settings.autoStart) startTimer();
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startPauseBtn.textContent = 'Pause';
  timerInterval = setInterval(tick, 1000);
  if (settings.desktopNotify && Notification.permission === 'default') Notification.requestPermission();
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  startPauseBtn.textContent = 'Start';
}

function resetTimer() {
  pauseTimer();
  timeLeft = (currentSessionType === 'work' ? settings.workDuration : currentSessionType === 'shortBreak' ? settings.shortBreak : settings.longBreak) * 60;
  totalSessionTime = timeLeft;
  updateTimerDisplay();
  drawTimer(1);
}

function skipSession() {
  pauseTimer();
  completeSession();
}

function updateSessionLabel() {
  sessionTypeLabel.textContent = currentSessionType === 'work' ? 'FOCUS' : (currentSessionType === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK');
  sessionCounterSpan.textContent = `${sessionCount} / ${settings.longBreakInterval}`;
}

function playSound(type) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    let freq = type === 'bell' ? 1200 : type === 'chime' ? 1000 : type === 'digital' ? 600 : 800;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.start(); osc.stop(audioCtx.currentTime + 0.5);
  } catch(e) {}
}

// ======================== TASKS ========================
function renderTasks() {
  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  tasksListDiv.innerHTML = '';
  activeTasks.forEach(task => renderTaskItem(task, tasksListDiv));
  completedTasksDiv.innerHTML = '';
  if (showCompleted) completedTasks.forEach(task => renderTaskItem(task, completedTasksDiv, true));
  const total = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  tasksCompletedSpan.textContent = `${completedCount}/${total} completed`;
}

function renderTaskItem(task, container, isCompleted = false) {
  const taskEl = document.createElement('div');
  taskEl.className = `task-item ${activeTaskId === task.id ? 'active' : ''}`;
  const dotsHtml = Array.from({ length: task.estimatedPomodoros }, (_, i) => `<span class="pomodoro-dot ${i < task.completedPomodoros ? 'completed' : ''}"></span>`).join('');
  taskEl.innerHTML = `
    <div class="task-header">
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
      <div class="task-info">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-pomodoros">
          <span>🍅 ${task.completedPomodoros}/${task.estimatedPomodoros}</span>
          <div class="pomodoro-progress">${dotsHtml}</div>
        </div>
        ${task.notes ? `<small>📝 ${escapeHtml(task.notes.substring(0,30))}...</small>` : ''}
      </div>
    </div>
  `;
  taskEl.addEventListener('click', (e) => {
    if (e.target.type === 'checkbox') {
      task.completed = e.target.checked;
      saveToStorage(); renderTasks();
    } else {
      activeTaskId = task.id; renderTasks(); saveToStorage();
    }
  });
  taskEl.addEventListener('dblclick', () => openTaskModal(task));
  container.appendChild(taskEl);
}

function openTaskModal(task = null) {
  if (task) {
    editTaskId.value = task.id;
    editTaskTitle.value = task.title;
    editTaskEstimate.value = task.estimatedPomodoros;
    editEstimateValue.textContent = task.estimatedPomodoros;
    editTaskNotes.value = task.notes || '';
    document.getElementById('task-modal-title').textContent = 'Edit Task';
    deleteTaskBtn.style.display = 'block';
  } else {
    editTaskId.value = ''; editTaskTitle.value = ''; editTaskEstimate.value = 1; editEstimateValue.textContent = 1; editTaskNotes.value = '';
    document.getElementById('task-modal-title').textContent = 'New Task';
    deleteTaskBtn.style.display = 'none';
  }
  taskModal.style.display = 'flex';
}

function saveTask() {
  const id = editTaskId.value;
  const title = editTaskTitle.value.trim();
  if (!title) return alert('Title required');
  const estimate = parseInt(editTaskEstimate.value);
  const notes = editTaskNotes.value.trim();
  if (id) {
    const task = tasks.find(t => t.id === id);
    if (task) { task.title = title; task.estimatedPomodoros = estimate; task.notes = notes; }
  } else {
    tasks.push({ id: Date.now().toString(), title, estimatedPomodoros: estimate, completedPomodoros: 0, notes, completed: false });
  }
  saveToStorage(); renderTasks(); taskModal.style.display = 'none';
}

function deleteTask() {
  const id = editTaskId.value;
  if (id && confirm('Delete this task?')) {
    tasks = tasks.filter(t => t.id !== id);
    if (activeTaskId === id) activeTaskId = null;
    saveToStorage(); renderTasks(); taskModal.style.display = 'none';
  }
}

// ======================== STATISTICS ========================
function getChartData(tab) {
  const workSessions = sessionsHistory.filter(s => s.type === 'work');
  const now = new Date();
  if (tab === 'daily') {
    const days = [], counts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      counts.push(workSessions.filter(s => s.timestamp.startsWith(dateStr)).length);
    }
    return { labels: days, data: counts };
  } else if (tab === 'weekly') {
    const weeks = [], counts = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now); start.setDate(now.getDate() - i*7);
      const end = new Date(start); end.setDate(start.getDate() + 6);
      weeks.push(`W${4-i}`);
      counts.push(workSessions.filter(s => { const d = new Date(s.timestamp); return d >= start && d <= end; }).length);
    }
    return { labels: weeks, data: counts };
  } else {
    const months = [], counts = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now); d.setMonth(now.getMonth() - i);
      const monthStr = d.toISOString().slice(0,7);
      months.push(d.toLocaleDateString('en-US', { month: 'short' }));
      counts.push(workSessions.filter(s => s.timestamp.startsWith(monthStr)).length);
    }
    return { labels: months, data: counts };
  }
}

function updateChart(tab) {
  currentChartTab = tab;
  const ctxChart = document.getElementById('stats-chart').getContext('2d');
  if (statsChart) statsChart.destroy();
  const { labels, data } = getChartData(tab);
  statsChart = new Chart(ctxChart, {
    type: 'bar', data: { labels, datasets: [{ label: 'Pomodoros', data, backgroundColor: settings.accentColor, borderRadius: 8 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

function renderHistoryList() {
  historyListDiv.innerHTML = sessionsHistory.slice(-20).reverse().map(s => `<div class="history-item"><span>${s.type} · ${s.duration} min</span><span>${new Date(s.timestamp).toLocaleString()}</span></div>`).join('');
}

function updateQuickStats() {
  todayPomodorosSpan.textContent = todayPomodoros;
  streakDaysSpan.textContent = streakDays;
}

function escapeHtml(text) { return String(text).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// ======================== EVENT LISTENERS ========================
function init() {
  loadFromStorage();
  updateSessionLabel();
  updateTimerDisplay();
  drawTimer(1);
  updateChart('daily');
  renderHistoryList();
  
  startPauseBtn.addEventListener('click', () => isRunning ? pauseTimer() : startTimer());
  resetBtn.addEventListener('click', resetTimer);
  skipBtn.addEventListener('click', skipSession);
  autoStartCheck.addEventListener('change', e => { settings.autoStart = e.target.checked; saveToStorage(); });
  
  document.getElementById('settings-toggle').addEventListener('click', () => settingsModal.style.display = 'flex');
  
  // Slider value updates
  setWork.addEventListener('input', () => workValue.textContent = setWork.value);
  setShort.addEventListener('input', () => shortValue.textContent = setShort.value);
  setLong.addEventListener('input', () => longValue.textContent = setLong.value);
  setInterval.addEventListener('input', () => intervalValue.textContent = setInterval.value);
  editTaskEstimate.addEventListener('input', () => editEstimateValue.textContent = editTaskEstimate.value);
  
  // Color bar click triggers color input
  colorBar.addEventListener('click', () => setAccent.click());
  setAccent.addEventListener('input', e => {
    colorBar.style.backgroundColor = e.target.value;
    document.documentElement.style.setProperty('--accent', e.target.value);
    document.documentElement.style.setProperty('--accent-glow', e.target.value + '66');
  });
  
  saveSettingsBtn.addEventListener('click', () => {
    settings.workDuration = parseInt(setWork.value);
    settings.shortBreak = parseInt(setShort.value);
    settings.longBreak = parseInt(setLong.value);
    settings.longBreakInterval = parseInt(setInterval.value);
    settings.accentColor = setAccent.value;
    settings.sound = setSound.value;
    settings.voiceEnabled = setVoice.checked;
    settings.desktopNotify = setDesktopNotify.checked;
    settings.fullscreenBreak = setFullscreenBreak.checked;
    settings.fullscreenWork = setFullscreenWork.checked;
    applySettingsToUI();
    if (!isRunning) resetTimer();
    saveToStorage();
    settingsModal.style.display = 'none';
    updateChart(currentChartTab);
  });
  
  document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', () => {
    settingsModal.style.display = 'none'; taskModal.style.display = 'none'; interruptModal.style.display = 'none';
  }));
  window.addEventListener('click', e => { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; });
  
  addTaskBtn.addEventListener('click', () => openTaskModal(null));
  saveTaskBtn.addEventListener('click', saveTask);
  deleteTaskBtn.addEventListener('click', deleteTask);
  
  document.getElementById('log-interruption-btn').addEventListener('click', () => interruptModal.style.display = 'flex');
  saveInterruptBtn.addEventListener('click', () => {
    const reason = interruptReason.value.trim();
    if (reason && sessionsHistory.length) {
      const last = sessionsHistory[sessionsHistory.length-1];
      if (!last.interruptions) last.interruptions = [];
      last.interruptions.push({ reason, time: new Date().toISOString() });
      saveToStorage();
    }
    interruptModal.style.display = 'none';
    interruptReason.value = '';
  });
  
  document.getElementById('close-break-overlay').addEventListener('click', () => breakOverlay.style.display = 'none');
  document.getElementById('close-work-overlay').addEventListener('click', () => workOverlay.style.display = 'none');
  
  tabBtns.forEach(btn => btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active');
    const tab = btn.dataset.tab;
    if (tab === 'history') { chartContainer.style.display = 'none'; historyPanel.style.display = 'block'; renderHistoryList(); }
    else { chartContainer.style.display = 'block'; historyPanel.style.display = 'none'; updateChart(tab); }
  }));
  
  exportDataBtn.addEventListener('click', () => {
    let csv = "Type,Duration,Timestamp\n";
    sessionsHistory.forEach(s => csv += `${s.type},${s.duration},${s.timestamp}\n`);
    const blob = new Blob([csv], { type: 'text/csv' }), url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pomodoro_sessions.csv'; a.click();
  });
  
  focusToggle.addEventListener('click', () => document.body.classList.toggle('focus-mode'));
  
  toggleCompletedBtn.addEventListener('click', () => {
    showCompleted = !showCompleted;
    toggleCompletedBtn.textContent = showCompleted ? '▼' : '▶';
    renderTasks();
  });
  
  if (Notification.permission === 'default') Notification.requestPermission();
}

init();
