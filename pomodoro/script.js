// ======================== GLOBAL STATE & DOM ========================
let timerInterval = null;
let animationFrame = null;
let currentSessionType = 'work';
let sessionCount = 1;
let timeLeft = 25 * 60;
let isRunning = false;
let totalSessionTime = 25 * 60;
let tickingInterval = null;
let pendingInterruption = false;
let partialMode = null;
let partialElapsedLogged = false;
let currentSessionStart = null;
let pendingPartialAction = null;
let pendingPartialElapsed = 0;

// Extra time tracking
let extraTimeSeconds = 0;
let extraTimeInterval = null;
let isExtraTimeRunning = false;
let extraTimeAccumulated = 0;

let sharedAudioCtx = null;

let todayPomodoros = 0;
let halfPomodoros = 0;
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
  accentColor: '#e53935',
  logSkipped: true,
  tickingSound: false,
  taskCompleteSound: true,
  trackExtraTime: true
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

function $(id) { return document.getElementById(id); }

// DOM Elements (all with $)
const timerCanvas = $('timer-canvas');
const ctx = timerCanvas?.getContext('2d');
const minutesSpan = $('timer-minutes');
const secondsSpan = $('timer-seconds');
const sessionTypeLabel = $('session-type-label');
const sessionCounterSpan = $('session-counter');
const startPauseBtn = $('timer-start-pause');
const resetBtn = $('timer-reset');
const skipBtn = $('timer-skip');
const autoStartCheck = $('auto-start-checkbox');
const todayPomodorosSpan = $('today-pomodoros');
const halfPomodorosSpan = $('half-pomodoros');
const streakDaysSpan = $('streak-days');
const quoteText = $('quote-text');

const tasksListDiv = $('tasks-list');
const completedTasksDiv = $('completed-tasks-list');
const addTaskBtn = $('add-task-btn');
const tasksCompletedSpan = $('tasks-completed-count');
const toggleCompletedBtn = $('toggle-completed-btn');

const settingsModal = $('settings-modal');
const taskModal = $('task-modal');
const taskDetailModal = $('task-detail-modal');
const taskDetailBody = $('task-detail-body');
const interruptModal = $('interrupt-modal');
const breakOverlay = $('break-overlay');
const workOverlay = $('work-overlay');
const sessionDetailModal = $('session-detail-modal');
const sessionDetailBody = $('session-detail-body');
const partialOptionsModal = $('partial-options-modal');
const partialTimeLeftSpan = $('partial-time-left');
const partialResetOption = $('partial-reset-option');
const partialCompleteOption = $('partial-complete-option');
const partialTaskModal = $('partial-task-modal');

const extraTimeContainer = $('extra-time-container');
const extraTimeDisplay = $('extra-time-display');

// Settings inputs
const setWork = $('set-work');
const setShort = $('set-short');
const setLong = $('set-long');
const setIntervalInput = $('set-interval');
const setAccent = $('set-accent');
const colorBar = $('color-bar');
const setSound = $('set-sound');
const setVoice = $('set-voice');
const setDesktopNotify = $('set-desktop-notify');
const setFullscreenBreak = $('set-fullscreen-break');
const setFullscreenWork = $('set-fullscreen-work');
const setLogSkipped = $('set-log-skipped');
const setTickingSound = $('set-ticking-sound');
const setTaskCompleteSound = $('set-task-complete-sound');
const setTrackExtraTime = $('set-extra-time');
const saveSettingsBtn = $('save-settings-btn');

const workValue = $('work-value');
const shortValue = $('short-value');
const longValue = $('long-value');
const intervalValue = $('interval-value');
const editEstimateValue = $('edit-estimate-value');

const editTaskId = $('edit-task-id');
const editTaskTitle = $('edit-task-title');
const editTaskEstimate = $('edit-task-estimate');
const editTaskNotes = $('edit-task-notes');
const saveTaskBtn = $('save-task-btn');

const interruptReason = $('interrupt-reason');
const saveInterruptBtn = $('save-interrupt-btn');

const tabBtns = document.querySelectorAll('.tab-btn');
const historyPanel = $('history-log-panel');
const chartContainer = document.querySelector('.chart-container');
const historyListDiv = $('history-list');
const exportDataBtn = $('export-data-btn');
const focusToggle = $('focus-mode-toggle');
const exitFocusBtn = $('exit-focus-mode');
const themeToggle = $('theme-toggle');

const logPartialContainer = $('log-partial-container');
const logPartialBtn = $('log-partial-btn');

// ======================== HELPER ========================
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

// ======================== THEME ========================
function initTheme() {
  const savedTheme = localStorage.getItem('pomodoro_theme') || 'dark';
  document.body.classList.toggle('light-mode', savedTheme === 'light');
  if (themeToggle) themeToggle.textContent = savedTheme === 'light' ? '☀️' : '🌙';
}
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('pomodoro_theme', isLight ? 'light' : 'dark');
    themeToggle.textContent = isLight ? '☀️' : '🌙';
  });
}

// ======================== STORAGE ========================
function loadFromStorage() {
  const saved = localStorage.getItem('pomodoro_suite');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      settings = data.settings || settings;
      tasks = data.tasks || [];
      sessionsHistory = data.sessions || [];
      todayPomodoros = data.todayPomodoros || 0;
      halfPomodoros = data.halfPomodoros || 0;
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
  const data = { settings, tasks, sessions: sessionsHistory, todayPomodoros, halfPomodoros, streakDays, lastActiveDate, activeTaskId };
  localStorage.setItem('pomodoro_suite', JSON.stringify(data));
}

function applySettingsToUI() {
  if (setWork) setWork.value = settings.workDuration;
  if (setShort) setShort.value = settings.shortBreak;
  if (setLong) setLong.value = settings.longBreak;
  if (setIntervalInput) setIntervalInput.value = settings.longBreakInterval;
  if (setAccent) setAccent.value = settings.accentColor;
  if (colorBar) colorBar.style.backgroundColor = settings.accentColor;
  if (setSound) setSound.value = settings.sound;
  if (setVoice) setVoice.checked = settings.voiceEnabled;
  if (setDesktopNotify) setDesktopNotify.checked = settings.desktopNotify;
  if (setFullscreenBreak) setFullscreenBreak.checked = settings.fullscreenBreak;
  if (setFullscreenWork) setFullscreenWork.checked = settings.fullscreenWork;
  if (setLogSkipped) setLogSkipped.checked = settings.logSkipped;
  if (setTickingSound) setTickingSound.checked = settings.tickingSound;
  if (setTaskCompleteSound) setTaskCompleteSound.checked = settings.taskCompleteSound;
  if (setTrackExtraTime) setTrackExtraTime.checked = settings.trackExtraTime;
  if (autoStartCheck) autoStartCheck.checked = settings.autoStart;
  document.documentElement.style.setProperty('--accent', settings.accentColor);
  document.documentElement.style.setProperty('--accent-glow', `${settings.accentColor}66`);
  if (workValue) workValue.textContent = settings.workDuration;
  if (shortValue) shortValue.textContent = settings.shortBreak;
  if (longValue) longValue.textContent = settings.longBreak;
  if (intervalValue) intervalValue.textContent = settings.longBreakInterval;
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
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      streakDays = (lastActiveDate === yesterday.toDateString()) ? streakDays + 1 : 1;
    } else streakDays = 1;
    lastActiveDate = today;
    todayPomodoros = 0;
    halfPomodoros = 0;
  }
  if (streakDaysSpan) streakDaysSpan.textContent = streakDays;
}

// ======================== AUDIO ========================
function initAudioContext() {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
}

// ======================== EXTRA TIME (persistent) ========================
function startExtraTime() {
  if (!settings.trackExtraTime) return;
  if (extraTimeInterval) clearInterval(extraTimeInterval);
  extraTimeSeconds = 0;
  isExtraTimeRunning = true;
  if (extraTimeContainer) extraTimeContainer.style.display = 'block';
  updateExtraTimeDisplay();
  extraTimeInterval = setInterval(() => {
    extraTimeSeconds++;
    updateExtraTimeDisplay();
  }, 1000);
}

function stopExtraTime() {
  if (extraTimeInterval) clearInterval(extraTimeInterval);
  extraTimeInterval = null;
  isExtraTimeRunning = false;
  if (extraTimeContainer) extraTimeContainer.style.display = 'none';
  extraTimeAccumulated += extraTimeSeconds;
  extraTimeSeconds = 0;
}

function pauseExtraTime() {
  if (extraTimeInterval) {
    clearInterval(extraTimeInterval);
    extraTimeInterval = null;
  }
}

function resumeExtraTime() {
  if (!isExtraTimeRunning || !settings.trackExtraTime) return;
  if (extraTimeInterval) return;
  extraTimeInterval = setInterval(() => {
    extraTimeSeconds++;
    updateExtraTimeDisplay();
  }, 1000);
}

function updateExtraTimeDisplay() {
  if (!extraTimeDisplay) return;
  const total = extraTimeAccumulated + extraTimeSeconds;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  extraTimeDisplay.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
}

function resetExtraTime() {
  stopExtraTime();
  extraTimeAccumulated = 0;
  extraTimeSeconds = 0;
  updateExtraTimeDisplay();
}

// ======================== TIMER ========================
function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  if (minutesSpan) minutesSpan.textContent = String(mins).padStart(2, '0');
  if (secondsSpan) secondsSpan.textContent = String(secs).padStart(2, '0');
  document.title = `${mins}:${String(secs).padStart(2,'0')} - ${currentSessionType}`;
}

function drawTimer(progress = null) {
  if (!ctx) return;
  const w = timerCanvas.width, h = timerCanvas.height, radius = 120, centerX = w/2, centerY = h/2;
  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(128,128,128,0.2)';
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

function timerTick() {
  if (!isRunning) return;
  timeLeft = Math.max(0, timeLeft - 1);
  updateTimerDisplay();
  drawTimer(timeLeft / totalSessionTime);

  if (timeLeft <= 10 && timeLeft > 0) {
    if (settings.tickingSound) playTickSound();
  }

  if (timeLeft <= 0) {
    stopTimer();
    completeSession(false);
  }
}

function startTimer() {
  if (isRunning) return;
  resetExtraTime();
  isRunning = true;
  if (startPauseBtn) startPauseBtn.textContent = 'Pause';
  if (logPartialContainer) logPartialContainer.style.display = 'none';
  if (!currentSessionStart) currentSessionStart = Date.now();

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = window.setInterval(timerTick, 1000);

  function animate() {
    drawTimer(timeLeft / totalSessionTime);
    if (isRunning) {
      animationFrame = requestAnimationFrame(animate);
    }
  }
  animate();

  if (settings.desktopNotify && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function pauseTimer() {
  isRunning = false;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  if (animationFrame) cancelAnimationFrame(animationFrame);
  if (startPauseBtn) startPauseBtn.textContent = 'Resume';
  if (logPartialContainer) logPartialContainer.style.display = 'block';
  pendingInterruption = true;
}

function stopTimer() {
  isRunning = false;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  if (animationFrame) cancelAnimationFrame(animationFrame);
}

function resetTimer() {
  stopTimer();
  resetExtraTime();
  timeLeft = (currentSessionType === 'work' ? settings.workDuration : currentSessionType === 'shortBreak' ? settings.shortBreak : settings.longBreak) * 60;
  totalSessionTime = timeLeft;
  updateTimerDisplay();
  drawTimer(1);
  if (logPartialContainer) logPartialContainer.style.display = 'none';
  pendingInterruption = false;
  if (startPauseBtn) startPauseBtn.textContent = 'Start';
  currentSessionStart = null;
  partialMode = null;
  partialElapsedLogged = false;
}

function playTickSound() {
  try {
    initAudioContext();
    const osc = sharedAudioCtx.createOscillator();
    const gain = sharedAudioCtx.createGain();
    osc.connect(gain); gain.connect(sharedAudioCtx.destination);
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.08, sharedAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, sharedAudioCtx.currentTime + 0.15);
    osc.start(); osc.stop(sharedAudioCtx.currentTime + 0.15);
  } catch(e) {}
}

// ======================== SESSION HANDLING ========================
function handleResume() {
  if (pendingInterruption) {
    if (interruptModal) interruptModal.style.display = 'flex';
    pendingInterruption = false;
  } else {
    startTimer();
  }
}

function showPartialOptions() {
  if (!partialOptionsModal || !partialTimeLeftSpan) return;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  partialTimeLeftSpan.textContent = `${mins}:${String(secs).padStart(2,'0')}`;
  partialOptionsModal.style.display = 'flex';
}

function promptPartialTaskApplication(action, elapsed, callback) {
  pendingPartialAction = action;
  pendingPartialElapsed = elapsed;
  if (activeTaskId) {
    if (partialTaskModal) partialTaskModal.style.display = 'flex';
    window._partialCallback = callback;
  } else {
    callback('none');
  }
}

function applyPartialToTask(option) {
  const activeTask = activeTaskId ? tasks.find(t => t.id === activeTaskId) : null;
  if (activeTask && !activeTask.completed) {
    if (option === 'half') {
      activeTask.completedPomodoros = Math.min(activeTask.completedPomodoros + 0.5, activeTask.estimatedPomodoros);
    } else if (option === 'full') {
      activeTask.completedPomodoros = Math.min(activeTask.completedPomodoros + 1, activeTask.estimatedPomodoros);
    }
    if (activeTask.completedPomodoros >= activeTask.estimatedPomodoros) {
      activeTask.completed = true;
      if (settings.taskCompleteSound) playTaskCompleteSound();
      if (activeTaskId === activeTask.id) activeTaskId = null;
    }
  }
  saveToStorage();
  renderTasks();
  if (partialTaskModal) partialTaskModal.style.display = 'none';
  if (window._partialCallback) {
    window._partialCallback(option);
    window._partialCallback = null;
  }
}

function logElapsedPortion(elapsed, isHalf = true) {
  if (elapsed <= 0) return;
  const activeTask = activeTaskId ? tasks.find(t => t.id === activeTaskId) : null;
  const session = {
    id: Date.now().toString(),
    type: currentSessionType,
    duration: Math.floor(elapsed / 60),
    timestamp: new Date().toISOString(),
    taskName: (currentSessionType === 'work' && activeTask) ? activeTask.title : null,
    interruptions: [],
    partial: true,
    halfPomodoro: isHalf
  };
  sessionsHistory.push(session);
  if (currentSessionType === 'work') halfPomodoros++;
  saveToStorage();
  renderHistoryList();
  updateQuickStats();
}

function logPartialSessionAndReset() {
  const elapsed = totalSessionTime - timeLeft;
  promptPartialTaskApplication('reset', elapsed, (option) => {
    logElapsedPortion(elapsed, true);
    timeLeft = totalSessionTime;
    updateTimerDisplay();
    drawTimer(1);
    if (logPartialContainer) logPartialContainer.style.display = 'none';
    if (partialOptionsModal) partialOptionsModal.style.display = 'none';
    pendingInterruption = false;
    if (startPauseBtn) startPauseBtn.textContent = 'Start';
    currentSessionStart = null;
    partialMode = null;
    partialElapsedLogged = false;
  });
}

function setupPartialCompleteMode() {
  const elapsed = totalSessionTime - timeLeft;
  promptPartialTaskApplication('complete', elapsed, (option) => {
    // Log elapsed portion
    logElapsedPortion(elapsed, true);
    partialElapsedLogged = true;
    partialMode = 'complete';
    if (partialOptionsModal) partialOptionsModal.style.display = 'none';
    // Resume timer to complete the remaining time
    startTimer();
  });
}

function completeSession(isSkipped = false) {
  stopTimer();
  const sessionEndTime = new Date();
  
  // Attach accumulated extra time to this session
  const extra = extraTimeAccumulated + extraTimeSeconds;
  resetExtraTime();

  if (settings.sound !== 'none') playSound(settings.sound);
  if (settings.desktopNotify && Notification.permission === 'granted') {
    new Notification(`Pomodoro Suite`, { body: `${currentSessionType} session completed!` });
  }
  if (settings.voiceEnabled) {
    const msg = new SpeechSynthesisUtterance(currentSessionType === 'work' ? 'Time for a break.' : 'Back to work.');
    window.speechSynthesis.speak(msg);
  }

  const activeTask = activeTaskId ? tasks.find(t => t.id === activeTaskId) : null;
  const shouldLog = !isSkipped || settings.logSkipped;

  let isHalf = false;
  if (partialMode === 'complete' && partialElapsedLogged) {
    isHalf = true;
    const remaining = timeLeft;
    if (remaining > 0) {
      // Log remaining portion as half
      const remainingSession = {
        id: Date.now().toString(),
        type: currentSessionType,
        duration: Math.floor(remaining / 60),
        timestamp: sessionEndTime.toISOString(),
        taskName: (currentSessionType === 'work' && activeTask) ? activeTask.title : null,
        interruptions: window.pendingInterruptions ? [...window.pendingInterruptions] : [],
        partial: true,
        halfPomodoro: true,
        extraTime: 0
      };
      sessionsHistory.push(remainingSession);
      if (currentSessionType === 'work') halfPomodoros++;
      window.pendingInterruptions = [];
      
      // Prompt to assign this half to task if active
      if (activeTask) {
        pendingPartialAction = 'assign-remaining';
        if (partialTaskModal) partialTaskModal.style.display = 'flex';
        window._pendingRemainingSession = remainingSession;
        window._pendingRemainingSeconds = remaining;
        saveToStorage();
        renderHistoryList();
        updateQuickStats();
        return; // wait for user choice
      }
    }
    partialMode = null;
    partialElapsedLogged = false;
  } else if (shouldLog) {
    const session = {
      id: Date.now().toString(),
      type: currentSessionType,
      duration: totalSessionTime / 60,
      timestamp: sessionEndTime.toISOString(),
      taskName: (currentSessionType === 'work' && activeTask) ? activeTask.title : null,
      interruptions: window.pendingInterruptions ? [...window.pendingInterruptions] : [],
      extraTime: extra
    };
    sessionsHistory.push(session);
    window.pendingInterruptions = [];
  }

  if (currentSessionType === 'work' && !isSkipped && !isHalf) {
    todayPomodoros++;
    updateStreak();
    if (activeTask && !activeTask.completed) {
      activeTask.completedPomodoros = Math.min(activeTask.completedPomodoros + 1, activeTask.estimatedPomodoros);
      if (activeTask.completedPomodoros >= activeTask.estimatedPomodoros) {
        activeTask.completed = true;
        if (settings.taskCompleteSound) playTaskCompleteSound();
        if (activeTaskId === activeTask.id) activeTaskId = null;
      }
    }
  }

  finalizeSessionTransition(isSkipped);
}

function applyRemainingTaskOption(option) {
  const activeTask = activeTaskId ? tasks.find(t => t.id === activeTaskId) : null;
  const session = window._pendingRemainingSession;
  if (activeTask && session) {
    if (option === 'half') {
      activeTask.completedPomodoros = Math.min(activeTask.completedPomodoros + 0.5, activeTask.estimatedPomodoros);
    } else if (option === 'full') {
      activeTask.completedPomodoros = Math.min(activeTask.completedPomodoros + 1, activeTask.estimatedPomodoros);
    }
    if (activeTask.completedPomodoros >= activeTask.estimatedPomodoros) {
      activeTask.completed = true;
      if (settings.taskCompleteSound) playTaskCompleteSound();
      if (activeTaskId === activeTask.id) activeTaskId = null;
    }
    saveToStorage();
    renderTasks();
  }
  if (partialTaskModal) partialTaskModal.style.display = 'none';
  window._pendingRemainingSession = null;
  finalizeSessionTransition(false);
}

function finalizeSessionTransition(isSkipped) {
  if (settings.fullscreenBreak && currentSessionType === 'work' && breakOverlay) breakOverlay.style.display = 'flex';
  if (settings.fullscreenWork && currentSessionType !== 'work' && workOverlay) workOverlay.style.display = 'flex';
  if (quoteText) {
    quoteText.textContent = currentSessionType === 'work' ? `“${quotes[Math.floor(Math.random() * quotes.length)]}”` : `“${workQuotes[Math.floor(Math.random() * workQuotes.length)]}”`;
  }

  if (currentSessionType === 'work') {
    sessionCount++;
    if (sessionCount > settings.longBreakInterval) {
      currentSessionType = 'longBreak';
      sessionCount = 1;
    } else {
      currentSessionType = 'shortBreak';
    }
  } else {
    currentSessionType = 'work';
  }

  timeLeft = (currentSessionType === 'work' ? settings.workDuration : currentSessionType === 'shortBreak' ? settings.shortBreak : settings.longBreak) * 60;
  totalSessionTime = timeLeft;
  currentSessionStart = null;
  updateSessionLabel();
  updateTimerDisplay();
  drawTimer(1);
  updateQuickStats();
  renderTasks();
  saveToStorage();
  updateChart(currentChartTab);
  renderHistoryList();
  if (logPartialContainer) logPartialContainer.style.display = 'none';
  pendingInterruption = false;
  partialMode = null;
  partialElapsedLogged = false;
  if (startPauseBtn) startPauseBtn.textContent = 'Start';

  // Start extra time counter if auto-start is off and we finished a work session
  if (!settings.autoStart && currentSessionType !== 'work') {
    startExtraTime();
  } else if (settings.autoStart && !isSkipped) {
    startTimer();
  }
}

function skipSession() {
  completeSession(true);
}

function updateSessionLabel() {
  if (sessionTypeLabel) {
    sessionTypeLabel.textContent = currentSessionType === 'work' ? 'FOCUS' : (currentSessionType === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK');
  }
  if (sessionCounterSpan) {
    sessionCounterSpan.textContent = `${sessionCount} / ${settings.longBreakInterval}`;
  }
}

function playSound(type) {
  try {
    initAudioContext();
    const osc = sharedAudioCtx.createOscillator();
    const gain = sharedAudioCtx.createGain();
    osc.connect(gain); gain.connect(sharedAudioCtx.destination);
    let freq = type === 'bell' ? 1200 : type === 'chime' ? 1000 : type === 'digital' ? 600 : 800;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, sharedAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, sharedAudioCtx.currentTime + 0.5);
    osc.start(); osc.stop(sharedAudioCtx.currentTime + 0.5);
  } catch(e) {}
}

function playTaskCompleteSound() {
  if (!settings.taskCompleteSound) return;
  try {
    initAudioContext();
    const osc = sharedAudioCtx.createOscillator();
    const gain = sharedAudioCtx.createGain();
    osc.connect(gain); gain.connect(sharedAudioCtx.destination);
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.2, sharedAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, sharedAudioCtx.currentTime + 0.4);
    osc.start(); osc.stop(sharedAudioCtx.currentTime + 0.4);
  } catch(e) {}
}

// ======================== TASKS ========================
function renderTasks() {
  if (!tasksListDiv || !completedTasksDiv) return;
  if (activeTaskId) {
    const activeTask = tasks.find(t => t.id === activeTaskId);
    if (activeTask && activeTask.completed) activeTaskId = null;
  }
  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  tasksListDiv.innerHTML = '';
  activeTasks.forEach(task => renderTaskItem(task, tasksListDiv, false));
  completedTasksDiv.innerHTML = '';
  if (showCompleted) completedTasks.forEach(task => renderTaskItem(task, completedTasksDiv, true));
  const total = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  if (tasksCompletedSpan) tasksCompletedSpan.textContent = `${completedCount}/${total} completed`;
}

function renderTaskItem(task, container, isCompleted = false) {
  const taskEl = document.createElement('div');
  taskEl.className = `task-item ${activeTaskId === task.id ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
  const completedValue = task.completedPomodoros;
  const fullDots = Math.floor(completedValue);
  const hasHalf = (completedValue % 1) >= 0.5;
  const dotsHtml = Array.from({ length: task.estimatedPomodoros }, (_, i) => {
    if (i < fullDots) return '<span class="pomodoro-dot completed"></span>';
    if (i === fullDots && hasHalf) return '<span class="pomodoro-dot half"></span>';
    return '<span class="pomodoro-dot"></span>';
  }).join('');
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
    ${!isCompleted ? '<button class="task-edit-btn" title="Edit task">✎</button>' : ''}
    <button class="task-delete-btn" title="Delete task">✕</button>
  `;
  const deleteBtn = taskEl.querySelector('.task-delete-btn');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm(`Delete "${task.title}"?`)) {
      tasks = tasks.filter(t => t.id !== task.id);
      if (activeTaskId === task.id) activeTaskId = null;
      saveToStorage();
      renderTasks();
    }
  });
  const editBtn = taskEl.querySelector('.task-edit-btn');
  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openTaskModal(task);
    });
  }
  const checkbox = taskEl.querySelector('.task-checkbox');
  checkbox.addEventListener('change', (e) => {
    task.completed = e.target.checked;
    if (task.completed && activeTaskId === task.id) activeTaskId = null;
    saveToStorage();
    renderTasks();
  });
  
  taskEl.addEventListener('click', (e) => {
    if (e.target.type === 'checkbox' || e.target.classList.contains('task-delete-btn') || e.target.classList.contains('task-edit-btn')) return;
    if (isCompleted) {
      showTaskDetail(task);
    } else {
      activeTaskId = (activeTaskId === task.id) ? null : task.id;
      renderTasks();
      saveToStorage();
    }
  });
  
  container.appendChild(taskEl);
}

function openTaskModal(task = null) {
  if (!taskModal) return;
  if (task) {
    if (editTaskId) editTaskId.value = task.id;
    if (editTaskTitle) editTaskTitle.value = task.title;
    if (editTaskEstimate) editTaskEstimate.value = task.estimatedPomodoros;
    if (editEstimateValue) editEstimateValue.textContent = task.estimatedPomodoros;
    if (editTaskNotes) editTaskNotes.value = task.notes || '';
    document.getElementById('task-modal-title').textContent = 'Edit Task';
  } else {
    if (editTaskId) editTaskId.value = '';
    if (editTaskTitle) editTaskTitle.value = '';
    if (editTaskEstimate) editTaskEstimate.value = 1;
    if (editEstimateValue) editEstimateValue.textContent = 1;
    if (editTaskNotes) editTaskNotes.value = '';
    document.getElementById('task-modal-title').textContent = 'New Task';
  }
  taskModal.style.display = 'flex';
}

function showTaskDetail(task) {
  if (!taskDetailModal || !taskDetailBody) return;
  let html = `<h3>${escapeHtml(task.title)}</h3>`;
  html += `<p><strong>Pomodoros:</strong> ${task.completedPomodoros}/${task.estimatedPomodoros}</p>`;
  if (task.notes) html += `<p><strong>Notes:</strong> ${escapeHtml(task.notes)}</p>`;
  html += `<p><strong>Created:</strong> ${new Date(task.createdAt).toLocaleString()}</p>`;
  taskDetailBody.innerHTML = html;
  taskDetailModal.style.display = 'flex';
}

function saveTask() {
  const id = editTaskId?.value;
  const title = editTaskTitle?.value.trim();
  if (!title) return alert('Title required');
  const estimate = parseInt(editTaskEstimate?.value) || 1;
  const notes = editTaskNotes?.value.trim() || '';
  if (id) {
    const task = tasks.find(t => t.id === id);
    if (task) { task.title = title; task.estimatedPomodoros = estimate; task.notes = notes; }
  } else {
    tasks.push({ id: Date.now().toString(), title, estimatedPomodoros: estimate, completedPomodoros: 0, notes, completed: false, createdAt: new Date().toISOString() });
  }
  saveToStorage(); renderTasks(); if (taskModal) taskModal.style.display = 'none';
}

// ======================== STATISTICS ========================
function getChartData(tab) {
  const fullSessions = sessionsHistory.filter(s => s.type === 'work' && !s.halfPomodoro);
  const halfSessions = sessionsHistory.filter(s => s.type === 'work' && s.halfPomodoro);
  const now = new Date();
  if (tab === 'daily') {
    const days = [], fullCounts = [], halfCounts = [], taskCounts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      fullCounts.push(fullSessions.filter(s => s.timestamp.startsWith(dateStr)).length);
      halfCounts.push(halfSessions.filter(s => s.timestamp.startsWith(dateStr)).length);
      const daySessions = sessionsHistory.filter(s => s.type === 'work' && s.timestamp.startsWith(dateStr) && s.taskName);
      const uniqueTasks = new Set(daySessions.map(s => s.taskName));
      taskCounts.push(uniqueTasks.size);
    }
    return { labels: days, datasets: [
      { label: 'Full 🍅', data: fullCounts, backgroundColor: '#8B0000' },
      { label: 'Half 🍅', data: halfCounts, backgroundColor: '#ff9999' },
      { label: 'Tasks', data: taskCounts, backgroundColor: '#4caf50' }
    ]};
  } else if (tab === 'weekly') {
    const weeks = [], fullCounts = [], halfCounts = [], taskCounts = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now); start.setDate(now.getDate() - i*7);
      const end = new Date(start); end.setDate(start.getDate() + 6);
      weeks.push(`W${4-i}`);
      fullCounts.push(fullSessions.filter(s => { const d = new Date(s.timestamp); return d >= start && d <= end; }).length);
      halfCounts.push(halfSessions.filter(s => { const d = new Date(s.timestamp); return d >= start && d <= end; }).length);
      const weekSessions = sessionsHistory.filter(s => s.type === 'work' && s.taskName && (() => { const d = new Date(s.timestamp); return d >= start && d <= end; })());
      const uniqueTasks = new Set(weekSessions.map(s => s.taskName));
      taskCounts.push(uniqueTasks.size);
    }
    return { labels: weeks, datasets: [
      { label: 'Full 🍅', data: fullCounts, backgroundColor: '#8B0000' },
      { label: 'Half 🍅', data: halfCounts, backgroundColor: '#ff9999' },
      { label: 'Tasks', data: taskCounts, backgroundColor: '#4caf50' }
    ]};
  } else if (tab === 'monthly') {
    const months = [], fullCounts = [], halfCounts = [], taskCounts = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now); d.setMonth(now.getMonth() - i);
      const monthStr = d.toISOString().slice(0,7);
      months.push(d.toLocaleDateString('en-US', { month: 'short' }));
      fullCounts.push(fullSessions.filter(s => s.timestamp.startsWith(monthStr)).length);
      halfCounts.push(halfSessions.filter(s => s.timestamp.startsWith(monthStr)).length);
      const monthSessions = sessionsHistory.filter(s => s.type === 'work' && s.taskName && s.timestamp.startsWith(monthStr));
      const uniqueTasks = new Set(monthSessions.map(s => s.taskName));
      taskCounts.push(uniqueTasks.size);
    }
    return { labels: months, datasets: [
      { label: 'Full 🍅', data: fullCounts, backgroundColor: '#8B0000' },
      { label: 'Half 🍅', data: halfCounts, backgroundColor: '#ff9999' },
      { label: 'Tasks', data: taskCounts, backgroundColor: '#4caf50' }
    ]};
  } else if (tab === 'tasks') {
    const completed = tasks.filter(t => t.completed).length;
    const active = tasks.filter(t => !t.completed).length;
    return { labels: ['Completed', 'Active'], datasets: [{ data: [completed, active], backgroundColor: ['#4caf50', settings.accentColor] }] };
  }
}

function updateChart(tab) {
  currentChartTab = tab;
  const ctxChart = document.getElementById('stats-chart')?.getContext('2d');
  if (!ctxChart) return;
  if (statsChart) statsChart.destroy();
  const chartData = getChartData(tab);
  statsChart = new Chart(ctxChart, {
    type: 'bar',
    data: { labels: chartData.labels, datasets: chartData.datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: tab !== 'tasks' } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function renderHistoryList() {
  if (!historyListDiv) return;
  historyListDiv.innerHTML = sessionsHistory.slice(-30).reverse().map((s, idx) => {
    const displayType = s.taskName ? s.taskName : s.type;
    const halfMark = s.halfPomodoro ? ' ½' : '';
    const partialMark = s.partial ? ' ⏸️' : '';
    let durationText = `${s.duration} min`;
    if (s.extraTime) {
      durationText = `${s.duration} min + ${Math.floor(s.extraTime / 60)} min (Extra)`;
    }
    return `<div class="history-item" data-session-index="${idx}">
      <span>${displayType} · ${durationText}${halfMark}${partialMark}</span>
      <span>${new Date(s.timestamp).toLocaleString()}</span>
    </div>`;
  }).join('');
}

function showSessionDetail(session) {
  if (!sessionDetailBody || !sessionDetailModal) return;
  let html = `<p><strong>Type:</strong> ${session.type}</p>`;
  let durationText = `${session.duration} min`;
  if (session.extraTime) {
    durationText += ` + ${Math.floor(session.extraTime / 60)} min (Extra time)`;
  }
  html += `<p><strong>Duration:</strong> ${durationText} ${session.halfPomodoro ? '(½ Pomodoro)' : ''}</p>`;
  html += `<p><strong>Time:</strong> ${new Date(session.timestamp).toLocaleString()}</p>`;
  if (session.taskName) html += `<p><strong>Task:</strong> ${escapeHtml(session.taskName)}</p>`;
  if (session.interruptions?.length) {
    html += `<p><strong>Interruptions:</strong></p><ul>`;
    session.interruptions.forEach(i => html += `<li>${escapeHtml(i.reason)} (${new Date(i.time).toLocaleTimeString()})</li>`);
    html += `</ul>`;
  } else {
    html += `<p>No interruptions recorded.</p>`;
  }
  sessionDetailBody.innerHTML = html;
  sessionDetailModal.style.display = 'flex';
}

function updateQuickStats() {
  if (todayPomodorosSpan) todayPomodorosSpan.textContent = todayPomodoros;
  if (halfPomodorosSpan) halfPomodorosSpan.textContent = halfPomodoros;
  if (streakDaysSpan) streakDaysSpan.textContent = streakDays;
}

// ======================== EVENT LISTENERS & INIT ========================
function init() {
  initTheme();
  loadFromStorage();
  updateSessionLabel();
  updateTimerDisplay();
  drawTimer(1);
  updateChart('daily');
  renderHistoryList();

  // Pause/resume extra time on modal open/close
  const modals = [settingsModal, taskModal, taskDetailModal, interruptModal, sessionDetailModal, partialOptionsModal, partialTaskModal];
  modals.forEach(m => {
    if (m) {
      m.addEventListener('click', (e) => {
        if (e.target === m) {
          m.style.display = 'none';
          resumeExtraTime();
        }
      });
    }
  });
  const observer = new MutationObserver(() => {
    const anyOpen = modals.some(m => m && m.style.display === 'flex');
    if (anyOpen) pauseExtraTime();
    else resumeExtraTime();
  });
  modals.forEach(m => m && observer.observe(m, { attributes: true, attributeFilter: ['style'] }));

  if (startPauseBtn) startPauseBtn.addEventListener('click', () => isRunning ? pauseTimer() : handleResume());
  if (resetBtn) resetBtn.addEventListener('click', resetTimer);
  if (skipBtn) skipBtn.addEventListener('click', skipSession);
  if (autoStartCheck) autoStartCheck.addEventListener('change', e => { settings.autoStart = e.target.checked; saveToStorage(); });
  if ($('settings-toggle')) $('settings-toggle').addEventListener('click', () => { if (settingsModal) settingsModal.style.display = 'flex'; });

  if (setWork) setWork.addEventListener('input', () => { if (workValue) workValue.textContent = setWork.value; });
  if (setShort) setShort.addEventListener('input', () => { if (shortValue) shortValue.textContent = setShort.value; });
  if (setLong) setLong.addEventListener('input', () => { if (longValue) longValue.textContent = setLong.value; });
  if (setIntervalInput) setIntervalInput.addEventListener('input', () => { if (intervalValue) intervalValue.textContent = setIntervalInput.value; });
  if (editTaskEstimate) editTaskEstimate.addEventListener('input', () => { if (editEstimateValue) editEstimateValue.textContent = editTaskEstimate.value; });

  if (colorBar) colorBar.addEventListener('click', () => setAccent?.click());
  if (setAccent) setAccent.addEventListener('input', e => {
    if (colorBar) colorBar.style.backgroundColor = e.target.value;
    document.documentElement.style.setProperty('--accent', e.target.value);
    document.documentElement.style.setProperty('--accent-glow', e.target.value + '66');
  });

  if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => {
    settings.workDuration = parseInt(setWork?.value) || 25;
    settings.shortBreak = parseInt(setShort?.value) || 5;
    settings.longBreak = parseInt(setLong?.value) || 15;
    settings.longBreakInterval = parseInt(setIntervalInput?.value) || 4;
    if (setAccent) settings.accentColor = setAccent.value;
    if (setSound) settings.sound = setSound.value;
    if (setVoice) settings.voiceEnabled = setVoice.checked;
    if (setDesktopNotify) settings.desktopNotify = setDesktopNotify.checked;
    if (setFullscreenBreak) settings.fullscreenBreak = setFullscreenBreak.checked;
    if (setFullscreenWork) settings.fullscreenWork = setFullscreenWork.checked;
    if (setLogSkipped) settings.logSkipped = setLogSkipped.checked;
    if (setTickingSound) settings.tickingSound = setTickingSound.checked;
    if (setTaskCompleteSound) settings.taskCompleteSound = setTaskCompleteSound.checked;
    if (setTrackExtraTime) settings.trackExtraTime = setTrackExtraTime.checked;
    applySettingsToUI();
    if (!isRunning) resetTimer();
    saveToStorage();
    if (settingsModal) settingsModal.style.display = 'none';
    updateChart(currentChartTab);
    // Extra time persists
  });

  document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', () => {
    if (settingsModal) settingsModal.style.display = 'none';
    if (taskModal) taskModal.style.display = 'none';
    if (taskDetailModal) taskDetailModal.style.display = 'none';
    if (interruptModal) interruptModal.style.display = 'none';
    if (sessionDetailModal) sessionDetailModal.style.display = 'none';
    if (partialOptionsModal) partialOptionsModal.style.display = 'none';
    if (partialTaskModal) partialTaskModal.style.display = 'none';
    resumeExtraTime();
  }));
  window.addEventListener('click', e => { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; });

  if (addTaskBtn) addTaskBtn.addEventListener('click', () => openTaskModal(null));
  if (saveTaskBtn) saveTaskBtn.addEventListener('click', saveTask);

  $('log-interruption-btn')?.addEventListener('click', () => { if (interruptModal) interruptModal.style.display = 'flex'; });
  if (saveInterruptBtn) saveInterruptBtn.addEventListener('click', () => {
    const reason = interruptReason?.value.trim();
    if (reason) {
      if (!window.pendingInterruptions) window.pendingInterruptions = [];
      window.pendingInterruptions.push({ reason, time: new Date().toISOString() });
    }
    if (interruptModal) interruptModal.style.display = 'none';
    if (interruptReason) interruptReason.value = '';
    if (!isRunning && !pendingInterruption) startTimer();
  });

  const originalComplete = completeSession;
  completeSession = function(isSkipped) {
    originalComplete.call(this, isSkipped);
    if (window.pendingInterruptions && sessionsHistory.length) {
      const last = sessionsHistory[sessionsHistory.length-1];
      if (!last.interruptions) last.interruptions = [];
      last.interruptions.push(...window.pendingInterruptions);
      window.pendingInterruptions = [];
      saveToStorage();
      renderHistoryList();
    }
  };

  if (logPartialBtn) logPartialBtn.addEventListener('click', showPartialOptions);
  if (partialResetOption) partialResetOption.addEventListener('click', logPartialSessionAndReset);
  if (partialCompleteOption) partialCompleteOption.addEventListener('click', setupPartialCompleteMode);

  $('partial-half-btn')?.addEventListener('click', () => {
    if (pendingPartialAction === 'assign-remaining') {
      applyRemainingTaskOption('half');
    } else {
      applyPartialToTask('half');
    }
  });
  $('partial-full-btn')?.addEventListener('click', () => {
    if (pendingPartialAction === 'assign-remaining') {
      applyRemainingTaskOption('full');
    } else {
      applyPartialToTask('full');
    }
  });
  $('partial-none-btn')?.addEventListener('click', () => {
    if (pendingPartialAction === 'assign-remaining') {
      applyRemainingTaskOption('none');
    } else {
      applyPartialToTask('none');
    }
  });

  $('close-break-overlay')?.addEventListener('click', () => { if (breakOverlay) breakOverlay.style.display = 'none'; });
  $('close-work-overlay')?.addEventListener('click', () => { if (workOverlay) workOverlay.style.display = 'none'; });

  tabBtns.forEach(btn => btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    if (tab === 'history') {
      if (chartContainer) chartContainer.style.display = 'none';
      if (historyPanel) historyPanel.style.display = 'block';
      renderHistoryList();
    } else {
      if (chartContainer) chartContainer.style.display = 'block';
      if (historyPanel) historyPanel.style.display = 'none';
      updateChart(tab);
    }
  }));

  if (exportDataBtn) exportDataBtn.addEventListener('click', () => {
    let csv = "Type,Duration,Timestamp,Task,Partial,Half,ExtraTime\n";
    sessionsHistory.forEach(s => csv += `${s.type},${s.duration},${s.timestamp},${s.taskName || ''},${s.partial ? 'Yes' : 'No'},${s.halfPomodoro ? 'Yes' : 'No'},${s.extraTime || 0}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pomodoro_sessions.csv';
    a.click();
  });

  if (historyListDiv) historyListDiv.addEventListener('click', (e) => {
    const item = e.target.closest('.history-item');
    if (item) {
      const idx = parseInt(item.dataset.sessionIndex);
      if (!isNaN(idx) && sessionsHistory[idx]) showSessionDetail(sessionsHistory[idx]);
    }
  });

  if (focusToggle) focusToggle.addEventListener('click', () => {
    document.body.classList.add('focus-mode');
    if (exitFocusBtn) exitFocusBtn.style.display = 'flex';
  });
  if (exitFocusBtn) exitFocusBtn.addEventListener('click', () => {
    document.body.classList.remove('focus-mode');
    exitFocusBtn.style.display = 'none';
  });

  if (toggleCompletedBtn) toggleCompletedBtn.addEventListener('click', () => {
    showCompleted = !showCompleted;
    toggleCompletedBtn.textContent = showCompleted ? '▼' : '▶';
    renderTasks();
  });

  if (Notification.permission === 'default') Notification.requestPermission();
  initAudioContext();
}

// Start
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
