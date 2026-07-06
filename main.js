const body = document.body;
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const navAnchors = [...document.querySelectorAll('[data-nav-link]')];
const sections = [...document.querySelectorAll('section[id]')];
const logoImages = [...document.querySelectorAll('[data-logo-img]')];

logoImages.forEach((img) => {
  const slot = img.closest('[data-logo-slot]');
  const fallback = slot ? slot.querySelector('.logo-fallback') : null;

  const showImage = () => {
    img.classList.add('is-loaded');
    if (fallback) fallback.style.display = 'none';
  };

  const showFallback = () => {
    img.classList.remove('is-loaded');
    if (fallback) fallback.style.display = 'grid';
  };

  img.addEventListener('load', showImage);
  img.addEventListener('error', showFallback);

  if (img.complete && img.naturalWidth > 0) showImage();
});

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    navLinks.classList.toggle('is-open', !isOpen);
    body.classList.toggle('nav-open', !isOpen);
  });

  navAnchors.forEach((link) => {
    link.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('is-open');
      body.classList.remove('nav-open');
    });
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const id = entry.target.getAttribute('id');
    navAnchors.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
    });
  });
}, { threshold: 0.38 });

sections.forEach((section) => observer.observe(section));

const vimeoCards = [...document.querySelectorAll('.js-vimeo-card')];

vimeoCards.forEach((card) => {
  const button = card.querySelector('.video-button');
  const frame = card.querySelector('.vimeo-frame');
  const videoId = card.dataset.vimeoId;

  if (!button || !frame || !videoId) return;

  button.addEventListener('click', () => {
    stopMusic();
    vimeoCards.forEach((otherCard) => {
      if (otherCard === card) return;
      otherCard.classList.remove('is-playing');
      const otherFrame = otherCard.querySelector('.vimeo-frame');
      if (otherFrame) {
        otherFrame.innerHTML = '';
        otherFrame.setAttribute('aria-hidden', 'true');
      }
    });

    frame.innerHTML = `<iframe src="https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Project H technical breakdown"></iframe>`;
    frame.setAttribute('aria-hidden', 'false');
    card.classList.add('is-playing');
  });
});

const accordionItems = [...document.querySelectorAll('.accordion-item')];

accordionItems.forEach((item) => {
  item.addEventListener('click', () => {
    const isOpen = item.classList.contains('is-open');
    accordionItems.forEach((other) => {
      other.classList.remove('is-open');
      other.setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      item.classList.add('is-open');
      item.setAttribute('aria-expanded', 'true');
    }
  });
});

const trackPlayers = [...document.querySelectorAll('.track-player')];
let activeAudio = new Audio();
let activePlayer = null;

function stopMusic() {
  if (!activeAudio.paused) activeAudio.pause();
  if (activePlayer) activePlayer.classList.remove('is-playing');
}

trackPlayers.forEach((player) => {
  const src = player.dataset.src;
  const fill = player.querySelector('.track-fill');

  player.addEventListener('click', () => {
    vimeoCards.forEach((card) => {
      card.classList.remove('is-playing');
      const frame = card.querySelector('.vimeo-frame');
      if (frame) {
        frame.innerHTML = '';
        frame.setAttribute('aria-hidden', 'true');
      }
    });

    if (activePlayer !== player) {
      if (activePlayer) {
        activePlayer.classList.remove('is-playing');
        const previousFill = activePlayer.querySelector('.track-fill');
        if (previousFill) previousFill.style.width = '0%';
      }
      activeAudio.src = src;
      activePlayer = player;
      player.classList.add('is-playing');
      activeAudio.play().catch(() => {});
      return;
    }

    if (activeAudio.paused) {
      player.classList.add('is-playing');
      activeAudio.play().catch(() => {});
    } else {
      activeAudio.pause();
      player.classList.remove('is-playing');
    }
  });

  player.addEventListener('pointerdown', (event) => {
    if (activePlayer !== player || !activeAudio.duration) return;
    const rect = player.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    activeAudio.currentTime = percentage * activeAudio.duration;
    if (fill) fill.style.width = `${percentage * 100}%`;
  });
});

activeAudio.addEventListener('timeupdate', () => {
  if (!activePlayer || !activeAudio.duration) return;
  const progress = (activeAudio.currentTime / activeAudio.duration) * 100;
  const fill = activePlayer.querySelector('.track-fill');
  const time = activePlayer.querySelector('em');
  if (fill) fill.style.width = `${progress}%`;
  if (time) {
    const minutes = Math.floor(activeAudio.currentTime / 60);
    const seconds = Math.floor(activeAudio.currentTime % 60).toString().padStart(2, '0');
    time.textContent = `${minutes}:${seconds}`;
  }
});

activeAudio.addEventListener('ended', () => {
  if (!activePlayer) return;
  activePlayer.classList.remove('is-playing');
  const fill = activePlayer.querySelector('.track-fill');
  const time = activePlayer.querySelector('em');
  if (fill) fill.style.width = '0%';
  if (time) time.textContent = '0:00';
  activePlayer = null;
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopMusic();
});
