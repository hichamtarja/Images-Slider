// Navigation to widget pages
function goTo(url) {
  window.location.href = url;
}

// Optional: update badge dynamically (example for streak)
const streakBadge = document.getElementById('streak-badge');
if(streakBadge){
  let streakDays = 3; // this could be dynamically fetched from your streak widget in the future
  streakBadge.textContent = `${streakDays} days`;
}

// Floating emojis
const floatingEmojis = document.querySelectorAll('.floating span');

floatingEmojis.forEach((el) => {
  // Random position within viewport
  const x = Math.random() * (window.innerWidth - 30); // 30 is approx emoji width
  const y = Math.random() * (window.innerHeight - 30);
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  // Random animation delay to make them float independently
  el.style.animationDelay = `${Math.random() * 5}s`;
});
