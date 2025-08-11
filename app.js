// Quick content slots (edit here)
const CONTENT = {
  yourName: 'Shunsuke',
  phoneNumber: '+81-80-1234-5678',
  instagramHandle: 'sk.__nx',
};

// State
let currentSlide = 0;
let isTransitioning = false;
let prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let touchStartX = null;
let touchStartY = null;

const slides = () => Array.from(document.querySelectorAll('.slide'));
const dots = () => Array.from(document.querySelectorAll('.progress-dot'));

function updateCTAFromContent() {
  // phone links
  document.querySelectorAll('a[href^="tel:"]').forEach(a => a.href = `tel:${CONTENT.phoneNumber}`);
  // Instagram
  const insta = document.querySelector('.instagram-btn');
  if (insta) insta.href = `https://instagram.com/${CONTENT.instagramHandle}`;
  // Signature
  const sig = document.querySelector('.signature');
  if (sig) sig.textContent = `- ${CONTENT.yourName} 💖`;
}

function goToSlide(index) {
  const s = slides();
  if (index < 0 || index >= s.length) return;
  if (isTransitioning || index === currentSlide) return;
  isTransitioning = true;

  const from = s[currentSlide];
  const to = s[index];

  from.classList.remove('active');
  to.classList.add('active');

  // Update dots
  dots().forEach((d, i) => d.classList.toggle('active', i === index));

  currentSlide = index;

  // Trigger gentle haptic if supported
  try { if (window.navigator.vibrate) window.navigator.vibrate(10); } catch {}

  setTimeout(() => { isTransitioning = false; }, prefersReduced ? 0 : 420);

  // If we arrive at the question slide, optionally play chime if toggle is ON
  if (index === 5) maybePlayChime();
}

function nextSlide() { goToSlide(currentSlide + 1); }
function prevSlide() { goToSlide(currentSlide - 1); }

window.goToSlide = goToSlide;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;

// Keyboard navigation
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
  if (e.key === 'ArrowLeft') prevSlide();
});

// Swipe navigation
window.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0];
  touchStartX = t.screenX; touchStartY = t.screenY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  if (touchStartX === null) return;
  const t = e.changedTouches[0];
  const dx = t.screenX - touchStartX;
  const dy = t.screenY - touchStartY;
  if (Math.abs(dx) > 40 && Math.abs(dy) < 60) {
    if (dx < 0) nextSlide(); else prevSlide();
  }
  touchStartX = touchStartY = null;
}, { passive: true });

// Moments carousel logic
function showMoment(i) {
  const cards = Array.from(document.querySelectorAll('.moment-card'));
  const cdots = Array.from(document.querySelectorAll('.carousel-dots .dot'));
  cards.forEach((c, idx) => c.classList.toggle('active', idx === i));
  cdots.forEach((d, idx) => d.classList.toggle('active', idx === i));
}
window.showMoment = showMoment;

// Yes button -> confetti + hearts
function handleYes() {
  confettiBurst();
  const msg = document.getElementById('successMessage');
  if (msg) msg.classList.add('show');
  // create floating hearts
  spawnHearts();
}
window.handleYes = handleYes;

// Call button
function handleCall() {
  window.location.href = `tel:${CONTENT.phoneNumber}`;
}
window.handleCall = handleCall;

// Confetti (tiny, no dependency)
const confettiCanvas = document.getElementById('confettiCanvas');
const ctx = confettiCanvas.getContext('2d');
let confettiPieces = [];

function resizeCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function confettiBurst() {
  const colors = ['#ff7aa2', '#7aa8ff', '#ffd166', '#95e6a1'];
  for (let i = 0; i < 120; i++) {
    confettiPieces.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 1.2) * 7,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
    });
  }
  animateConfetti();
}

let confettiAnimating = false;
function animateConfetti() {
  if (confettiAnimating) return;
  confettiAnimating = true;
  const start = performance.now();
  (function frame(now){
    ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
    confettiPieces.forEach(p => {
      p.vy += 0.15; // gravity
      p.x += p.vx; p.y += p.vy; p.life += 1;
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.life * 0.1);
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      ctx.restore();
    });
    confettiPieces = confettiPieces.filter(p => p.y < window.innerHeight + 40 && p.life < 300);
    if (confettiPieces.length === 0 || (now - start) > 4000) {
      confettiAnimating = false;
      return;
    }
    requestAnimationFrame(frame);
  })(start);
}

// Floating hearts
function spawnHearts() {
  const container = document.querySelector('.floating-hearts');
  if (!container) return;
  for (let i = 0; i < 14; i++) {
    const span = document.createElement('span');
    span.textContent = '❤';
    span.style.position = 'absolute';
    span.style.left = Math.random() * 80 + 10 + '%';
    span.style.bottom = '-10px';
    span.style.fontSize = (Math.random()*18 + 14) + 'px';
    span.style.opacity = '0.9';
    span.style.transform = 'translateY(0)';
    span.style.transition = 'transform 4s linear, opacity 4s linear';
    container.appendChild(span);
    requestAnimationFrame(() => {
      span.style.transform = 'translateY(-240px)';
      span.style.opacity = '0';
    });
    setTimeout(() => span.remove(), 4200);
  }
}

// Audio toggle and gentle chime
const audioToggle = document.getElementById('audioToggle');
const audioIcon = audioToggle.querySelector('.audio-icon');
const audioMutedIcon = audioToggle.querySelector('.audio-muted-icon');
const chime = document.getElementById('chimeSound');
let audioEnabled = false;

audioToggle.addEventListener('click', () => {
  audioEnabled = !audioEnabled;
  audioIcon.style.display = audioEnabled ? 'none' : '';
  audioMutedIcon.style.display = audioEnabled ? '' : 'none';
  if (!audioEnabled) {
    try { chime.pause(); chime.currentTime = 0; } catch {}
  }
});

function maybePlayChime() {
  if (!audioEnabled) return;
  try { chime.currentTime = 0; chime.volume = 0.5; chime.play().catch(()=>{}); } catch {}
}

// Initialize
window.addEventListener('load', () => {
  updateCTAFromContent();
  // ensure first slide visible
  slides()[0].classList.add('active');
});

function beginIntro() {
  const firstSlide = document.querySelector('.slide[data-slide="0"] .slide-content');
  if (!firstSlide) { nextSlide(); return; }
  // add an exit animation class
  firstSlide.classList.add('intro-exit');
  // small delay then go to next slide
  setTimeout(() => {
    nextSlide();
  }, prefersReduced ? 0 : 480);
}
window.beginIntro = beginIntro;