const progressFill = document.getElementById('progress-fill');
const runner = document.querySelector(".runner");
const progressContainer = document.querySelector(".progress-container");

let countdownInterval;
let milestones = [];
let showMilestoneMode = false;

// ---------- ANIMATION ----------
function animateValue(element, value){
  element.classList.add("tick");
  setTimeout(()=> element.classList.remove("tick"),300);
  element.textContent = value;
}

// ---------- START ----------
startBtn.addEventListener('click', () => {
  const startDate = new Date(startInput.value);
  const endDate = new Date(endInput.value);

  if(!startInput.value || !endInput.value) return alert("Enter dates!");

  inputSection.style.display = "none";
  counterSection.style.display = "block";

  displayStart.textContent = startDate.toDateString();
  displayEnd.textContent = endDate.toDateString();

  renderStartEndFlags();
  renderMilestones();

  updateCountdown(startDate,endDate);

  clearInterval(countdownInterval);
  countdownInterval = setInterval(()=> updateCountdown(startDate,endDate),1000);
});

// ---------- COUNTDOWN ----------
function updateCountdown(start,end){
  const now = new Date();

  let targetEnd = end;

  if(showMilestoneMode && milestones.length > 0){
    const future = milestones
      .map(m => m.start)
      .filter(d => d > now)
      .sort((a,b)=>a-b);

    if(future.length > 0){
      targetEnd = future[0];
    }
  }

  let diff = targetEnd - now;

  if(diff <= 0){
    diff = 0;
  }

  const totalSeconds = Math.floor(diff/1000);

  const years = Math.floor(totalSeconds / (365*24*3600));
  const months = Math.floor((totalSeconds % (365*24*3600)) / (30*24*3600));
  const weeks = Math.floor((totalSeconds % (30*24*3600)) / (7*24*3600));
  const days = Math.floor((totalSeconds % (7*24*3600)) / (24*3600));
  const hours = Math.floor((totalSeconds % (24*3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600)/60);
  const seconds = totalSeconds % 60;

  animateValue(yearsSpan, years);
  animateValue(monthsSpan, months);
  animateValue(weeksSpan, weeks);
  animateValue(daysSpan, days);
  animateValue(hoursSpan, hours);
  animateValue(minutesSpan, minutes);
  animateValue(secondsSpan, seconds);

  // Progress
  const totalDuration = end-start;
  const elapsed = now-start;
  let progress = (elapsed/totalDuration)*100;
  progress = Math.max(0,Math.min(100,progress));

  progressFill.style.width = progress+"%";
  runner.style.left = progress+"%";

  runner.style.transform = "translateY(-3px)";
  setTimeout(()=> runner.style.transform="translateY(0px)",300);
}

// ---------- CLICK TO TOGGLE ----------
document.getElementById("countdown").addEventListener("click", ()=>{
  if(milestones.length === 0) return;
  showMilestoneMode = !showMilestoneMode;
});

// ---------- FLAGS ----------
function renderStartEndFlags(){
  document.querySelectorAll(".flag-start, .flag-end").forEach(f=>f.remove());

  const startFlag = document.createElement("div");
  startFlag.className = "flag flag-start";
  startFlag.style.left = "0px";
  startFlag.innerHTML = `<span class="flag-tooltip">${startInput.value}</span>🚩`;

  const endFlag = document.createElement("div");
  endFlag.className = "flag flag-end";
  endFlag.style.right = "0px"; // FIXED POSITION
  endFlag.innerHTML = `<span class="flag-tooltip">${endInput.value}</span>🚩`;

  progressContainer.appendChild(startFlag);
  progressContainer.appendChild(endFlag);
}

// ---------- RANDOM COLOR ----------
function randomColor(){
  const colors = ["#ff6a00","#ee0979","#00c6ff","#00ff94","#ffd700","#9b59b6"];
  return colors[Math.floor(Math.random()*colors.length)];
}

// ---------- MILESTONES ----------
msSave.addEventListener("click", ()=>{
  const title = msTitle.value.trim();
  const start = new Date(msStart.value);
  const end = new Date(msEnd.value);

  if(!title || isNaN(start) || isNaN(end)) return alert("Fill all fields!");

  milestones.push({
    title,
    start,
    end,
    color: randomColor()
  });

  renderMilestones();
  modal.style.display="none";
});

// ---------- RENDER ----------
function renderMilestones(){
  document.querySelectorAll(".ms-pin").forEach(p=>p.remove());

  const mainStart = new Date(startInput.value);
  const mainEnd = new Date(endInput.value);
  const totalDuration = mainEnd - mainStart;

  let samePositionCount = {};

  milestones.forEach(ms=>{
    const perc = ((ms.start - mainStart)/totalDuration)*100;

    const key = Math.round(perc);
    if(!samePositionCount[key]) samePositionCount[key]=0;
    samePositionCount[key]++;

    const offset = samePositionCount[key] * 20;

    const pin = document.createElement("div");
    pin.className = "ms-pin";
    pin.style.left = perc + "%";
    pin.style.bottom = offset + "px";

    pin.innerHTML = `
      <div class="pin-line"></div>
      <div class="pin-dot" style="background:${ms.color}"></div>
      <span class="flag-tooltip">
        ${ms.title}<br>
        ${ms.start.toDateString()}
      </span>
    `;

    progressContainer.appendChild(pin);
  });
}
