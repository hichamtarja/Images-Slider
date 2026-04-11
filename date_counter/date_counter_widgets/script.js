// ================== ELEMENTS ==================
const inputSection = document.getElementById('input-section');
const counterSection = document.getElementById('counter-section');

const startBtn = document.getElementById('start-btn');

const startInput = document.getElementById('start-date');
const endInput = document.getElementById('end-date');
const quoteInput = document.getElementById('quote');

const displayTitle = document.getElementById('display-title');
const displayStart = document.getElementById('display-start');
const displayEnd = document.getElementById('display-end');
const displayQuote = document.getElementById('display-quote');

const progressFill = document.getElementById('progress-fill');
const runner = document.querySelector('.runner');
const progressContainer = document.querySelector('.progress-container');
const countdownDisplay = document.getElementById('countdown');

const addMsBtn = document.getElementById('add-milestone-btn');
const viewMsBtn = document.getElementById('view-milestones-btn');
const toggleBtn = document.getElementById('toggle-tools-btn');

// ================== STATE ==================
let countdownInterval = null;
let milestones = [];
let showingMilestoneView = false;

// ================== TIME LOGIC ==================
function getTimeParts(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));

  return {
    years: Math.floor(total / (365 * 24 * 3600)),
    months: Math.floor((total % (365 * 24 * 3600)) / (30 * 24 * 3600)),
    weeks: Math.floor((total % (30 * 24 * 3600)) / (7 * 24 * 3600)),
    days: Math.floor((total % (7 * 24 * 3600)) / (24 * 3600)),
    hours: Math.floor((total % (24 * 3600)) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60
  };
}

// ================== COUNTDOWN ==================
function updateCountdown(start, end) {
  const now = new Date();
  let diff = end - now;

  if (diff <= 0) {
    diff = 0;
    clearInterval(countdownInterval);
  }

  const parts = getTimeParts(diff);

  countdownDisplay.innerHTML = `
    <div><span>${parts.years}</span> Years</div>
    <div><span>${parts.months}</span> Months</div>
    <div><span>${parts.weeks}</span> Weeks</div>
    <div><span>${parts.days}</span> Days</div>
    <div><span>${parts.hours}</span> Hours</div>
    <div><span>${parts.minutes}</span> Minutes</div>
    <div><span>${parts.seconds}</span> Seconds</div>
  `;

  const total = end - start;
  const elapsed = now - start;

  let progress = (elapsed / total) * 100;
  progress = Math.max(0, Math.min(100, progress));

  progressFill.style.width = progress + '%';
  runner.style.left = progress + '%';
}

// ================== TITLE EDIT ==================
function enableTitleEditing() {
  displayTitle.addEventListener('click', () => {
    const current = displayTitle.textContent;

    const input = document.createElement('input');
    input.value = current;
    input.style.textAlign = 'center';

    displayTitle.replaceWith(input);
    input.focus();

    function save() {
      const val = input.value.trim();

      const h1 = document.createElement('h1');
      h1.id = 'display-title';
      h1.textContent = val;
      if (!val) h1.style.display = 'none';

      input.replaceWith(h1);
      enableTitleEditing();
    }

    input.addEventListener('blur', save);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') input.blur();
    });
  });
}

// ================== QUOTE EDIT ==================
function enableQuoteEditing() {
  displayQuote.addEventListener('click', () => {
    const current = displayQuote.textContent.replace(/[“”]/g, '');

    const input = document.createElement('textarea');
    input.value = current;

    displayQuote.replaceWith(input);
    input.focus();

    function save() {
      const val = input.value.trim();

      const p = document.createElement('p');
      p.id = 'display-quote';
      p.textContent = val ? `“ ${val} ”` : '';

      input.replaceWith(p);
      enableQuoteEditing();
    }

    input.addEventListener('blur', save);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') input.blur();
    });
  });
}

// ================== MILESTONES ==================
function getRandomColor() {
  return `hsl(${Math.random() * 360}, 80%, 60%)`;
}

function renderMilestones() {
  document.querySelectorAll('.ms-pin').forEach(el => el.remove());

  if (!milestones.length) return;

  const start = new Date(startInput.value);
  const end = new Date(endInput.value);
  const total = end - start;

  milestones.forEach(ms => {
    const percent = ((ms.start - start) / total) * 100;

    const pin = document.createElement('div');
    pin.className = 'ms-pin';

    pin.style.left = percent + '%';
    pin.style.background = ms.color;

    progressContainer.appendChild(pin);
  });
}

function deleteMilestone(index) {
  milestones.splice(index, 1);
  renderMilestones();
}

// ================== MILESTONE MODAL ==================
function showMilestoneList() {
  const overlay = document.createElement('div');

  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  });

  const panel = document.createElement('div');

  Object.assign(panel.style, {
    background: '#222',
    padding: '20px',
    borderRadius: '12px',
    width: '300px'
  });

  panel.innerHTML = `<h3>Milestones</h3>`;

  milestones.forEach((ms, i) => {
    const item = document.createElement('div');
    item.innerHTML = `
      ${ms.title}
      <button data-i="${i}">Delete</button>
    `;
    panel.appendChild(item);
  });

  panel.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      deleteMilestone(btn.dataset.i);
      overlay.remove();
      showMilestoneList();
    };
  });

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  overlay.onclick = e => {
    if (e.target === overlay) overlay.remove();
  };
}

// ================== TOGGLE TOOLS ==================
const TOOLS_KEY = "tools_hidden";

function applyTools(hidden) {
  [addMsBtn, viewMsBtn].forEach(btn => {
    if (btn) btn.style.display = hidden ? 'none' : 'inline-block';
  });

  if (toggleBtn) {
    toggleBtn.textContent = hidden ? "Show Tools" : "Hide Tools";
  }
}

if (toggleBtn) {
  let hidden = localStorage.getItem(TOOLS_KEY) === "true";
  applyTools(hidden);

  toggleBtn.onclick = () => {
    hidden = !hidden;
    localStorage.setItem(TOOLS_KEY, hidden);
    applyTools(hidden);
  };
}

// ================== EVENTS ==================
startBtn.addEventListener('click', () => {
  const start = new Date(startInput.value);
  const end = new Date(endInput.value);

  if (!startInput.value || !endInput.value) return alert("Enter dates");

  inputSection.style.display = 'none';
  counterSection.style.display = 'block';

  displayStart.textContent = start.toDateString();
  displayEnd.textContent = end.toDateString();

  displayTitle.textContent = "My Counter";

  const quote = quoteInput.value.trim();
  displayQuote.textContent = quote ? `“ ${quote} ”` : '';

  enableTitleEditing();
  enableQuoteEditing();

  renderMilestones();

  updateCountdown(start, end);

  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => updateCountdown(start, end), 1000);
});

// View milestones
if (viewMsBtn) {
  viewMsBtn.onclick = showMilestoneList;
}
