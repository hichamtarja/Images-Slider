// Elements
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

let countdownInterval;

// Start Button
startBtn.addEventListener('click', () => {
  const startDate = new Date(startInput.value);
  const endDate = new Date(endInput.value);
  const title = titleInput.value || "Countdown Streak";
  const quote = quoteInput.value || "";

  if(!startInput.value || !endInput.value) {
    alert("Please enter start and end dates!");
    return;
  }

  // Show counter section
  inputSection.style.display = "none";
  counterSection.style.display = "block";

  counterTitle.textContent = title;
  displayStart.textContent = startDate.toDateString();
  displayEnd.textContent = endDate.toDateString();
  displayQuote.textContent = quote;

  updateCountdown(startDate, endDate);
  countdownInterval = setInterval(() => updateCountdown(startDate, endDate), 1000);
});

// Reset Button
resetBtn.addEventListener('click', () => {
  clearInterval(countdownInterval);
  inputSection.style.display = "block";
  counterSection.style.display = "none";
});

// Countdown Function
function updateCountdown(start, end) {
  const now = new Date();
  let diff = end - now;

  if(diff < 0) diff = 0;

  const totalSeconds = Math.floor(diff / 1000);

  const years = Math.floor(totalSeconds / (365*24*3600));
  const months = Math.floor((totalSeconds % (365*24*3600)) / (30*24*3600));
  const weeks = Math.floor((totalSeconds % (30*24*3600)) / (7*24*3600));
  const days = Math.floor((totalSeconds % (7*24*3600)) / (24*3600));
  const hours = Math.floor((totalSeconds % (24*3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  yearsSpan.textContent = years;
  monthsSpan.textContent = months;
  weeksSpan.textContent = weeks;
  daysSpan.textContent = days;
  hoursSpan.textContent = hours;
  minutesSpan.textContent = minutes;
  secondsSpan.textContent = seconds;
}
