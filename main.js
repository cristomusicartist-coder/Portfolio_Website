const clickSound = new Audio("sounds/click.wav");
clickSound.volume = 0.025;

function playClick() {
  try {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  } catch (_) {}
}

function vibrate(pattern = 30) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

const navLinks = [...document.querySelectorAll(".nav-link")];
const sections = [...document.querySelectorAll(".page-section")];

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    playClick();
    vibrate(25);
  });
});

function pauseActiveTrack() {
  if (!activeAudio.paused) activeAudio.pause();
  if (activePlayer) activePlayer.classList.remove("is-playing");
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const id = entry.target.getAttribute("id");

      navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("is-active", isActive);
      });

      if (id !== "music") pauseActiveTrack();
    });
  },
  {
    root: null,
    threshold: 0.42,
  }
);

sections.forEach((section) => sectionObserver.observe(section));

function createVimeoIframe(videoId) {
  return `
    <iframe
      src="https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen>
    </iframe>
  `;
}

function hasUsableVideoId(videoId) {
  return videoId && videoId.trim().length > 0 && !videoId.includes("PASTE");
}

const featuredVideoCards = document.querySelectorAll(".js-vimeo-card");

featuredVideoCards.forEach((card) => {
  card.addEventListener("click", () => {
    const videoId = card.dataset.vimeoId;
    if (!hasUsableVideoId(videoId)) return;

    const frame = card.querySelector(".vimeo-frame");
    if (!frame) return;

    pauseActiveTrack();
    frame.innerHTML = createVimeoIframe(videoId);
    card.classList.add("is-playing");
  });
});

const modal = document.getElementById("video-modal");
const modalFrame = document.getElementById("modal-frame");
const modalClose = document.querySelector(".modal-close");
const videoTriggers = document.querySelectorAll(".js-video-trigger");

function openVideoModal(videoId) {
  if (!hasUsableVideoId(videoId) || !modal || !modalFrame) return;

  pauseActiveTrack();
  modalFrame.innerHTML = createVimeoIframe(videoId);
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeVideoModal() {
  if (!modal || !modalFrame) return;

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  modalFrame.innerHTML = "";
  document.body.style.overflow = "";
}

videoTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    playClick();
    vibrate(25);

    const videoId = trigger.dataset.vimeoId;
    if (!hasUsableVideoId(videoId)) return;

    openVideoModal(videoId);
  });
});

if (modalClose) modalClose.addEventListener("click", closeVideoModal);

if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeVideoModal();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeVideoModal();
});

const memorySteps = [...document.querySelectorAll(".memory-step")];

memorySteps.forEach((step) => {
  step.addEventListener("click", () => {
    const isAlreadyActive = step.classList.contains("is-active");

    memorySteps.forEach((item) => {
      item.classList.remove("is-active");
      item.setAttribute("aria-expanded", "false");
    });

    if (!isAlreadyActive) {
      step.classList.add("is-active");
      step.setAttribute("aria-expanded", "true");
    }

    playClick();
    vibrate(25);
  });
});

const players = [...document.querySelectorAll(".liquid-player")];
const activeAudio = new Audio();
let activePlayer = null;

function resetPlayerUI(player) {
  if (!player) return;
  player.classList.remove("is-playing");

  const fill = player.querySelector(".progress-fill");
  const time = player.querySelector(".track-time");

  if (fill) fill.style.width = "0%";
  if (time) time.textContent = "0:00";
}

function stopActiveTrack() {
  activeAudio.pause();
  activeAudio.removeAttribute("src");
  activeAudio.load();
  resetPlayerUI(activePlayer);
  activePlayer = null;
}

players.forEach((player) => {
  const audioSrc = player.dataset.src;
  let isDragging = false;
  let pointerStartX = 0;

  function seekFromPointer(clientX) {
    if (activePlayer !== player || !activeAudio.duration) return;

    const rect = player.getBoundingClientRect();
    const x = clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));
    activeAudio.currentTime = progress * activeAudio.duration;
  }

  player.addEventListener("pointerdown", (event) => {
    isDragging = false;
    pointerStartX = event.clientX;

    const onPointerMove = (moveEvent) => {
      if (Math.abs(moveEvent.clientX - pointerStartX) > 10) {
        isDragging = true;
        seekFromPointer(moveEvent.clientX);
      }
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  });

  player.addEventListener("click", () => {
    if (isDragging) return;
    if (!audioSrc) return;

    playClick();
    vibrate(40);

    if (activePlayer !== player) {
      resetPlayerUI(activePlayer);
      activeAudio.src = audioSrc;
      activePlayer = player;
      player.classList.add("is-playing");
      activeAudio.play().catch(() => {
        resetPlayerUI(player);
      });
      return;
    }

    if (activeAudio.paused) {
      activeAudio.play().then(() => {
        player.classList.add("is-playing");
      }).catch(() => {});
    } else {
      activeAudio.pause();
      player.classList.remove("is-playing");
    }
  });
});

activeAudio.addEventListener("timeupdate", () => {
  if (!activePlayer || !activeAudio.duration) return;

  const fill = activePlayer.querySelector(".progress-fill");
  const time = activePlayer.querySelector(".track-time");
  const progress = (activeAudio.currentTime / activeAudio.duration) * 100;

  if (fill) fill.style.width = `${progress}%`;

  if (time) {
    const mins = Math.floor(activeAudio.currentTime / 60);
    const secs = Math.floor(activeAudio.currentTime % 60);
    time.textContent = `${mins}:${secs.toString().padStart(2, "0")}`;
  }
});

activeAudio.addEventListener("ended", () => {
  resetPlayerUI(activePlayer);
  activePlayer = null;
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    closeVideoModal();
    stopActiveTrack();
  }
});
