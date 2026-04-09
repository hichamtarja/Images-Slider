// Navigate with animation + ripple
function goTo(event, url) {
  createRipple(event);

  document.body.classList.add("fade-out");

  setTimeout(() => {
    window.location.href = url;
  }, 400);
}

// Ripple effect
function createRipple(event) {
  const button = event.currentTarget;

  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - button.offsetLeft - diameter / 2}px`;
  circle.style.top = `${event.clientY - button.offsetTop - diameter / 2}px`;
  circle.classList.add("ripple");

  const ripple = button.getElementsByClassName("ripple")[0];
  if (ripple) ripple.remove();

  button.appendChild(circle);
}

// Better floating emojis distribution
const floatingEmojis = document.querySelectorAll('.floating span');

const cols = Math.ceil(Math.sqrt(floatingEmojis.length));
const rows = Math.ceil(floatingEmojis.length / cols);

const cellWidth = window.innerWidth / cols;
const cellHeight = window.innerHeight / rows;

floatingEmojis.forEach((el, index) => {
  const col = index % cols;
  const row = Math.floor(index / cols);

  // Base position (grid)
  let x = col * cellWidth;
  let y = row * cellHeight;

  // Add randomness inside each cell
  x += Math.random() * (cellWidth - 40);
  y += Math.random() * (cellHeight - 40);

  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  // Random animation delay
  el.style.animationDelay = `${Math.random() * 5}s`;

  // Slight random scale for more life
  el.style.transform = `scale(${0.8 + Math.random() * 0.6})`;
});
