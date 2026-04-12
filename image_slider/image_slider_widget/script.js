const WIDGET_LIST_KEY = "image_slider_list";

const slidesContainer = document.getElementById('slides-container');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');
const currentSpan = document.getElementById('current-slide');
const totalSpan = document.getElementById('total-slides');
const dotsContainer = document.getElementById('dots-container');
const slider = document.getElementById('slider');
const errorMsg = document.getElementById('error-message');

let currentIndex = 0, totalSlides = 0, slides = [], autoInterval = null;
const AUTO_DELAY = 4000;

function getWidgetId() { return new URLSearchParams(window.location.search).get('id'); }
function getWidgetList() { try { return JSON.parse(localStorage.getItem(WIDGET_LIST_KEY)) || []; } catch { return []; } }

const widgetId = getWidgetId();
const widget = getWidgetList().find(w => w.id === widgetId);

if (!widget || !widget.images || widget.images.length === 0) {
  slider.style.display = 'none';
  errorMsg.classList.remove('hidden');
} else {
  document.title = `${widget.title} · Image Slider`;

  // Build slides
  widget.images.forEach((url, i) => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = `Slide ${i+1}`;
    img.className = 'slide' + (i === 0 ? ' active' : '');
    // Handle broken images
    img.onerror = () => {
      img.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect width=\'200\' height=\'200\' fill=\'%23333\'/%3E%3Ctext x=\'50%%\' y=\'50%%\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23aaa\' font-size=\'16\'%3EImage not found%3C/text%3E%3C/svg%3E';
    };
    slidesContainer.appendChild(img);
  });

  slides = document.querySelectorAll('.slide');
  totalSlides = slides.length;
  totalSpan.textContent = totalSlides;

  function createDots() {
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement('button');
      dot.className = 'dot';
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    }
    updateDots();
  }

  function updateDots() {
    document.querySelectorAll('.dot').forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
  }

  function goToSlide(i) {
    slides.forEach(s => s.classList.remove('active'));
    slides[i].classList.add('active');
    currentIndex = i;
    currentSpan.textContent = i + 1;
    updateDots();
  }

  function nextSlide() { goToSlide((currentIndex + 1) % totalSlides); }
  function prevSlide() { goToSlide((currentIndex - 1 + totalSlides) % totalSlides); }
  function startAuto() { stopAuto(); autoInterval = setInterval(nextSlide, AUTO_DELAY); }
  function stopAuto() { if (autoInterval) clearInterval(autoInterval); }

  nextBtn.addEventListener('click', () => { nextSlide(); stopAuto(); startAuto(); });
  prevBtn.addEventListener('click', () => { prevSlide(); stopAuto(); startAuto(); });
  slider.addEventListener('mouseenter', stopAuto);
  slider.addEventListener('mouseleave', startAuto);
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { prevSlide(); stopAuto(); startAuto(); }
    if (e.key === 'ArrowRight') { nextSlide(); stopAuto(); startAuto(); }
  });

  let touchStart = 0;
  slider.addEventListener('touchstart', e => { touchStart = e.changedTouches[0].screenX; stopAuto(); }, { passive: true });
  slider.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].screenX - touchStart;
    if (Math.abs(diff) > 50) diff < 0 ? nextSlide() : prevSlide();
    startAuto();
  }, { passive: true });

  createDots();
  goToSlide(0);
  startAuto();
  window.addEventListener('beforeunload', stopAuto);
}
