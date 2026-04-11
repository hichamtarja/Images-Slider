// =========================
// ELEMENTS
// =========================

const inputSection = document.getElementById('input-section');
const counterSection = document.getElementById('counter-section');

const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');

const titleInput = document.getElementById('title');
const startInput = document.getElementById('start-date');
const endInput = document.getElementById('end-date');
const quoteInput = document.getElementById('quote');

const counterTitle = document.getElementById('counter-title');
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
const modal = document.getElementById('milestone-modal');
const closeModal = document.querySelector('.modal .close');
const msTitle = document.getElementById('ms-title');
const msStart = document.getElementById('ms-start');
const msEnd = document.getElementById('ms-end');
const msSave = document.getElementById('ms-save');

let countdownInterval = null;
let milestones = [];
let showingMilestoneView = false;

// =========================
// UTILITIES
// =========================

function animateValue(element, value) {
  element.classList.add('tick');
  setTimeout(() => element.classList.remove('tick'), 300);
  element.textContent = value;
}

function getTimeParts(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));

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

function getRandomMilestonePalette() {
  const hue = Math.floor(Math.random() * 360);
  return {
    start: `hsl(${hue}, 85%, 60%)`,
    end: `hsl(${(hue + 30) % 360}, 85%, 65%)`
  };
}

// =========================
// FLAGS
// =========================

function renderStartEndFlags() {
  document.querySelectorAll('.flag-start, .flag-end').forEach(el => el.remove());

  const start = new Date(startInput.value);
  const end = new Date(endInput.value);

  const startFlag = document.createElement('div');
  startFlag.className = 'flag flag-start';
  startFlag.style.left = '0%';
  startFlag.innerHTML = `🚩<span class="flag-tooltip">${start.toDateString()}</span>`;
  progressContainer.appendChild(startFlag);

  const endFlag = document.createElement('div');
  endFlag.className = 'flag flag-end';
  endFlag.style.left = '100%';
  endFlag.innerHTML = `🚩<span class="flag-tooltip">${end.toDateString()}</span>`;
  progressContainer.appendChild(endFlag);
}

// =========================
// MILESTONES
// =========================

function renderMilestones() {
  document.querySelectorAll('.ms-pin').forEach(el => el.remove());

  if (!milestones.length) return;

  const start = new Date(startInput.value);
  const end = new Date(endInput.value);
  const total = end - start;

  milestones.forEach((ms, index) => {
    const percent = ((ms.start - start) / total) * 100;

    const pin = document.createElement('div');
    pin.className = 'ms-pin';
    pin.style.left = percent + '%';

    pin.innerHTML = `
      <div class="pin-dot" style="background:${ms.colors.start}"></div>
      <span class="flag-tooltip">${ms.title}</span>
    `;

    // DELETE ON CLICK
    pin.onclick = () => {
      if (confirm("Delete this milestone?")) {
        milestones.splice(index, 1);
        renderMilestones();
      }
    };

    progressContainer.appendChild(pin);
  });
}

// =========================
// COUNTDOWN
// =========================

function updateCountdown(start, end) {
  const now = new Date();
  let diff = end - now;

  if (diff <= 0) diff = 0;

  const t = getTimeParts(diff);

  animateValue(yearsSpan, t.years);
  animateValue(monthsSpan, t.months);
  animateValue(weeksSpan, t.weeks);
  animateValue(daysSpan, t.days);
  animateValue(hoursSpan, t.hours);
  animateValue(minutesSpan, t.minutes);
  animateValue(secondsSpan, t.seconds);

  const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));

  progressFill.style.width = progress + '%';
  runner.style.left = progress + '%';
}

// =========================
// START
// =========================

startBtn.addEventListener('click', () => {
  const startDate = new Date(startInput.value);
  const endDate = new Date(endInput.value);

  if (!startInput.value || !endInput.value) {
    alert("Enter dates");
    return;
  }

  inputSection.style.display = 'none';
  counterSection.style.display = 'block';

  // TITLE
  if (titleInput.value.trim()) {
    counterTitle.textContent = titleInput.value;
  }

  counterTitle.onclick = () => {
    const newTitle = prompt("Edit title:", counterTitle.textContent);
    if (newTitle) counterTitle.textContent = newTitle;
  };

  // QUOTE
  if (quoteInput.value.trim()) {
    displayQuote.textContent = `“ ${quoteInput.value} ”`;
  }

  displayQuote.onclick = () => {
    const newQuote = prompt("Edit quote:", displayQuote.textContent);
    if (newQuote) displayQuote.textContent = `“ ${newQuote} ”`;
  };

  displayStart.textContent = startDate.toDateString();
  displayEnd.textContent = endDate.toDateString();

  renderStartEndFlags();
  renderMilestones();

  updateCountdown(startDate, endDate);

  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    updateCountdown(startDate, endDate);
  }, 1000);
});

// =========================
// RESET
// =========================

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    clearInterval(countdownInterval);
    location.reload();
  });
}

// =========================
// MODAL
// =========================

if (addMsBtn && modal) {
  addMsBtn.onclick = () => modal.style.display = 'flex';

  closeModal.onclick = () => modal.style.display = 'none';

  window.onclick = e => {
    if (e.target === modal) modal.style.display = 'none';
  };

  msSave.onclick = () => {
    const title = msTitle.value.trim();
    const start = new Date(msStart.value);
    const end = new Date(msEnd.value);

    if (!title || isNaN(start) || isNaN(end)) {
      alert("Invalid milestone");
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
  };
}
