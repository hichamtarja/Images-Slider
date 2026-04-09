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

const progressFill = document.getElementById('progress-fill');
const runner = document.querySelector(".runner");
const progressContainer = document.querySelector(".progress-container");

let countdownInterval;
let milestones = [];

// Number animation
function animateValue(element, value){
  element.classList.add("tick");
  setTimeout(()=> element.classList.remove("tick"),300);
  element.textContent = value;
}

// --- Countdown Start ---
startBtn.addEventListener('click', () => {
  const startDate = new Date(startInput.value);
  const endDate = new Date(endInput.value);

  if(!startInput.value || !endInput.value) { alert("Please enter dates!"); return; }
  if(isNaN(startDate) || isNaN(endDate)) { alert("Invalid dates!"); return; }

  inputSection.style.display = "none";
  counterSection.style.display = "block";

  // Title
  const title = titleInput.value.trim();
  if(title==="") counterTitle.style.display="none";
  else { counterTitle.style.display="block"; counterTitle.textContent = title; }

  // Dates
  displayStart.textContent = startDate.toDateString();
  displayEnd.textContent = endDate.toDateString();

  // Quote
  const quote = quoteInput.value.trim();
  if(quote==="") displayQuote.style.display="none";
  else { displayQuote.style.display="block"; displayQuote.textContent = "“ "+quote+" ”"; }

  // Render start/end flags
  renderStartEndFlags();

  // Render milestones
  renderMilestones();

  // Start countdown
  updateCountdown(startDate,endDate);
  clearInterval(countdownInterval);
  countdownInterval = setInterval(()=> updateCountdown(startDate,endDate),1000);
});

// --- Reset Button ---
resetBtn.addEventListener('click', () => {
  clearInterval(countdownInterval);
  inputSection.style.display="block";
  counterSection.style.display="none";
  titleInput.value=""; startInput.value=""; endInput.value=""; quoteInput.value="";
  milestones = [];
  document.querySelectorAll(".flag, .ms-flag").forEach(f=>f.remove());
});

// --- Countdown Function ---
function updateCountdown(start,end){
  const now = new Date();
  let diff = end - now;

  if(diff<=0){
    diff=0;
    clearInterval(countdownInterval);
    document.getElementById("countdown").innerHTML = `<h2 style="color:#ff6a00;">⏳ Time's Up!</h2>`;
    progressFill.style.width="100%";
    runner.style.left="100%";
    return;
  }

  const totalSeconds = Math.floor(diff/1000);
  const years = Math.floor(totalSeconds / (365*24*3600));
  const months = Math.floor((totalSeconds % (365*24*3600)) / (30*24*3600));
  const weeks = Math.floor((totalSeconds % (30*24*3600)) / (7*24*3600));
  const days = Math.floor((totalSeconds % (7*24*3600)) / (24*3600));
  const hours = Math.floor((totalSeconds % (24*3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600)/60);
  const seconds = totalSeconds % 60;

  // Animate numbers
  animateValue(yearsSpan, years);
  animateValue(monthsSpan, months);
  animateValue(weeksSpan, weeks);
  animateValue(daysSpan, days);
  animateValue(hoursSpan, hours);
  animateValue(minutesSpan, minutes);
  animateValue(secondsSpan, seconds);

  // Glow panels if < 1 day
  if(diff < 86400000){
    document.querySelectorAll("#countdown div").forEach(d=>d.classList.add("danger"));
  } else {
    document.querySelectorAll("#countdown div").forEach(d=>d.classList.remove("danger"));
  }

  // Progress bar & runner
  const totalDuration = end-start;
  const elapsed = now-start;
  let progress = (elapsed/totalDuration)*100;
  progress = Math.max(0,Math.min(100,progress));
  progressFill.style.width = progress+"%";
  runner.style.left = progress+"%";
}

// --- Start/End Flags ---
function renderStartEndFlags(){
  if(!progressContainer) return;
  
  // Remove old main flags first
  document.querySelectorAll(".flag-start, .flag-end").forEach(f=>f.remove());

  const mainStart = new Date(startInput.value);
  const mainEnd = new Date(endInput.value);

  // Start flag
  const startFlag = document.createElement("div");
  startFlag.classList.add("flag","flag-start");
  startFlag.style.left = "0%";
  startFlag.innerHTML = `<span class="flag-tooltip">Start: ${mainStart.toDateString()}</span>🚩`;
  progressContainer.appendChild(startFlag);

  // End flag
  const endFlag = document.createElement("div");
  endFlag.classList.add("flag","flag-end");
  endFlag.style.left = "100%";
  endFlag.innerHTML = `<span class="flag-tooltip">End: ${mainEnd.toDateString()}</span>🚩`;
  progressContainer.appendChild(endFlag);
}

// --- Milestones ---
const addMsBtn = document.getElementById("add-milestone-btn");
const modal = document.getElementById("milestone-modal");
const closeModal = document.querySelector(".modal .close");
const msTitle = document.getElementById("ms-title");
const msStart = document.getElementById("ms-start");
const msEnd = document.getElementById("ms-end");
const msSave = document.getElementById("ms-save");

// Open/close modal
addMsBtn.addEventListener("click", ()=>modal.style.display="flex");
closeModal.addEventListener("click", ()=>modal.style.display="none");
window.addEventListener("click", e=>{if(e.target==modal) modal.style.display="none";});

// Save milestone
msSave.addEventListener("click", ()=>{
  const title = msTitle.value.trim();
  const start = new Date(msStart.value);
  const end = new Date(msEnd.value);
  const mainStart = new Date(startInput.value);
  const mainEnd = new Date(endInput.value);

  if(!title || isNaN(start.getTime()) || isNaN(end.getTime())){
    alert("Fill all fields correctly!");
    return;
  }
  if(start<mainStart || end>mainEnd || start>end){
    alert("Milestone must be within countdown start & end!");
    return;
  }

  milestones.push({title,start,end});
  modal.style.display="none";
  msTitle.value=""; msStart.value=""; msEnd.value="";

  renderMilestones();
});

// Render milestones as flags
function renderMilestones(){
  if(!progressContainer) return;

  // Remove old milestone flags
  document.querySelectorAll(".ms-flag").forEach(f=>f.remove());

  const mainStart = new Date(startInput.value);
  const mainEnd = new Date(endInput.value);
  const totalDuration = mainEnd - mainStart;

  milestones.forEach(ms => {
    // Start flag
    const startPerc = ((ms.start - mainStart) / totalDuration) * 100;
    const startFlag = document.createElement("div");
    startFlag.classList.add("flag","ms-flag");
    startFlag.style.left = startPerc + "%";
    startFlag.innerHTML = `<span class="flag-tooltip">${ms.title} Start: ${ms.start.toDateString()}</span>🚩`;
    progressContainer.appendChild(startFlag);

    // End flag
    const endPerc = ((ms.end - mainStart) / totalDuration) * 100;
    const endFlag = document.createElement("div");
    endFlag.classList.add("flag","ms-flag");
    endFlag.style.left = endPerc + "%";
    endFlag.innerHTML = `<span class="flag-tooltip">${ms.title} End: ${ms.end.toDateString()}</span>🚩`;
    progressContainer.appendChild(endFlag);
  });
}
