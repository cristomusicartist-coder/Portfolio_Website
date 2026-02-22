/**
 * CONFIGURAZIONE E STATO GLOBALE
 */

const btnHome = document.querySelector('btn_home');
const socialItems = document.querySelectorAll('social.item');
const btnClickSound = new Audio("sounds/click.wav");
btnClickSound.volume = 0.01;
const players = document.querySelectorAll('.liquid-player');
let activeAudio = new Audio();
let activePlayer = null;

const navItems = document.querySelectorAll('.nav-links li');
const sections = document.querySelectorAll('section');
const root = document.documentElement;

// Stati per il controllo incrociato
let isVideoPlaying = false;
let isMutedByUser = false;

// Elementi Sound Design / Sipario
const ambientSound = new Audio('sounds/background_wind_mobile.mp3');
ambientSound.loop = true;
ambientSound.volume = 0;

const curtainBtn = document.getElementById('open-curtain-btn');
const curtainSection = document.getElementById('sound_design');
const curtainOverlay = document.getElementById('curtain_mechanism');

let soundFadeInterval = null;


function playClick() {
    btnClickSound.currentTime = 0;
    btnClickSound.play();
}

if (btnHome) {
    addEventListener("click", () => {
        playClick();
        if (navigator.vibrate) navigator.vibrate(50);
    });
}

if (socialItems) {
    addEventListener("click", () => {
        playClick();
        if (navigator.vibrate) navigator.vibrate(50);
    })
}

/**
 * 1. GESTIONE AUDIO AMBIENTALE (FADE IN/OUT)
 */




function fadeOutAudio(audio) {
    if (!audio) return;
    clearInterval(soundFadeInterval);
    soundFadeInterval = setInterval(() => {
        if (audio.volume > 0.02) {
            audio.volume = (audio.volume - 0.02).toFixed(2);
        } else {
            audio.volume = 0;
            audio.pause();
            clearInterval(soundFadeInterval);
        }
    }, 30);
}

function fadeInAudio(audio, targetVolume) {
    if (!audio || isMutedByUser) return;
    clearInterval(soundFadeInterval);

    if (audio.paused) audio.volume = 0;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            soundFadeInterval = setInterval(() => {
                let currentVol = parseFloat(audio.volume);
                if (currentVol < targetVolume) {
                    audio.volume = Math.min(targetVolume, currentVol + 0.02).toFixed(2);
                } else {
                    audio.volume = targetVolume;
                    clearInterval(soundFadeInterval);
                }
            }, 30);
        }).catch(err => console.log("Autoplay preventivo: in attesa di interazione."));
    }
}

/**
 * 2. GESTIONE VIDEO REELS (VIMEO)
 */
function loadVimeoVideo(container, videoId) {
    const card = container.closest('.reel-card');
    if (card.classList.contains('is-playing')) return;



    // Priorità sonora: spegniamo tutto il resto
    isVideoPlaying = true;
    ambientSound.pause();
    ambientSound.volume = 0;

    // Iniezione Iframe
    const wrapper = card.querySelector('.vimeo-wrapper');
    wrapper.innerHTML = `
        <iframe src="https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0" 
                frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen>
        </iframe>`;

    wrapper.style.display = 'block';
    card.classList.add('is-playing');
}

function resetAllVideos() {

    // Se c'è un video a tutto schermo, non toccare nulla!
    if (document.fullscreenElement || document.webkitFullscreenElement) return;


    const playingCards = document.querySelectorAll('.reel-card.is-playing');

    if (playingCards.length > 0) {

        playingCards.forEach(card => {

            card.classList.remove('is-playing');
            const wrapper = card.querySelector('.vimeo-wrapper');
            if (wrapper) {
                wrapper.innerHTML = "";
                wrapper.style.display = "none"; // Risolto bug virgolette
            }
        });

    }


    isVideoPlaying = false;
}


/**
 * 3. INTERSECTION OBSERVER (NAVBAR & AUDIO CONTEXT)
 */
const observerOptions = {
    root: null,
    threshold: 0.4 // Reattività ottimale per il cambio sezione
};


navItems.forEach(li => {
    const link = li.querySelector('a');
    if (link) {
        link.addEventListener("click", () => {
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        });
    }
});

const observer = new IntersectionObserver((entries) => {
    // 1. PROTEZIONE FULLSCREEN
    if (document.fullscreenElement || document.webkitFullscreenElement) return;

    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('id');
            index = Array.from(sections).indexOf(entry.target);

            if (entry.isIntersecting) {

                index = Array.from(sections).indexOf(entry.target);
            }

            // 2. LOGICA SOUND DESIGN
            if (sectionId === 'sound_design') {

                const isAnyVideoActive = !!document.querySelector('.reel-card.is-playing');

                if (curtainSection.classList.contains('is-open') && !isVideoPlaying && !isAnyVideoActive) {
                    fadeInAudio(ambientSound, 0.1);
                }
            } else {
                if (ambientSound.volume > 0) {
                    fadeOutAudio(ambientSound);
                }
                // Se la sezione che sta entrando NON è sound_design, spegniamo tutto

                resetAllVideos();
            }

            // B. Gestione Musica (Liquid Player)
            if (sectionId !== 'music') {
                if (!activeAudio.paused) {
                    activeAudio.pause();
                    if (activePlayer) activePlayer.classList.remove('is-playing');
                }
            }

            // C. UI Navbar: Colori e Stato Active
            navItems.forEach(li => {
                li.classList.remove('active');
                const link = li.querySelector('a');
                if (link && link.getAttribute('href') === `#${sectionId}`) {
                    li.classList.add('active');
                }
            });

            // Logica Colori Dinamici (Pari/Dispari)
            if (index % 2 !== 0) {
                root.style.setProperty('--nav-color', 'white');

            } else {
                root.style.setProperty('--nav-color', '#a4161a');

            }
        }
    });
}, observerOptions);

sections.forEach(section => observer.observe(section));

/**
 * 4. LOGICA LIQUID PLAYER (AUDIO MUSIC SECTION)
 */
players.forEach(player => {
    const audioSrc = player.getAttribute('data-src');
    let isDragging = false;
    let startX = 0;

    const updateTimeline = (clientX) => {
        const rect = player.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        if (activePlayer === player && activeAudio.duration) {
            activeAudio.currentTime = percentage * activeAudio.duration;
        }
    };

    player.addEventListener('pointerdown', (e) => {
        isDragging = false;
        startX = e.clientX;
        const onPointerMove = (moveEvent) => {
            if (Math.abs(moveEvent.clientX - startX) > 10) {
                isDragging = true;
                if (activePlayer === player) updateTimeline(moveEvent.clientX);
            }
        };
        const onPointerUp = () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    });

    player.addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(100);
        if (isDragging) return;
        if (activePlayer !== player) {
            if (activePlayer) {
                activePlayer.classList.remove('is-playing');
                activePlayer.querySelector('.progress-fill').style.width = '0%';
            }
            activeAudio.src = audioSrc;
            activePlayer = player;
            player.classList.add('is-playing');
            activeAudio.play().catch(err => console.error("Errore Play:", err));
        } else {
            activeAudio.paused ? activeAudio.play() : activeAudio.pause();
        }
    });
});

// Sincronizzazione barra progresso Liquid Player
activeAudio.addEventListener('timeupdate', () => {
    if (activePlayer && activeAudio.duration) {
        const fill = activePlayer.querySelector('.progress-fill');
        const timeDisplay = activePlayer.querySelector('.track-time');
        const progress = (activeAudio.currentTime / activeAudio.duration) * 100;
        fill.style.width = `${progress}%`;
        const mins = Math.floor(activeAudio.currentTime / 60);
        const secs = Math.floor(activeAudio.currentTime % 60);
        timeDisplay.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
});

activeAudio.addEventListener('ended', () => {
    if (activePlayer) {
        activePlayer.classList.remove('is-playing');
        activePlayer.querySelector('.progress-fill').style.width = '0%';
        activePlayer = null;
    }
});

/**
 * 5. EVENTI INTERFACCIA (SIPARIO)
 */
curtainBtn.addEventListener('click', () => {
    playClick();
    if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
    curtainSection.classList.add('is-open');
    if (curtainOverlay) curtainOverlay.classList.add('pointer-none');
    fadeInAudio(ambientSound, 0.1);
});

const handleExitFullscreen = () => {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        // Forza il browser a ignorare lo scroll per un istante finché non si stabilizza
        setTimeout(() => {
            window.scrollTo({
                top: curtainSection.offsetTop,
                behavior: 'instant'
            });
        }, 50);
    }
};

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        fadeOutAudio(ambientSound);

        if (!activeAudio.paused) {
            activeAudio.pause();

            if (activePlayer) activePlayer.classList.remove('is-playing');
        }

        resetAllVideos();
    } else {

        // --- LOGICA DI RIENTRO ---

        // Verifichiamo se siamo effettivamente nella sezione Sound Design
        // usando getBoundingClientRect che è più affidabile di :hover
        const rect = curtainSection.getBoundingClientRect();
        const isInSoundSection = rect.top < window.innerHeight && rect.bottom > 0;



        // ACCENDIAMO L'AMBIENT SOLO SE:
        // 1. Siamo nella sezione corretta
        // 2. Il sipario è aperto
        // 3. NON sta andando un video (isVideoPlaying deve essere false)
        const isAnyVideoActive = !!document.querySelector('.reel-card.is-playing');

        if (isInSoundSection && curtainSection.classList.contains('is-open') && !isAnyVideoActive && !isVideoPlaying) {
            fadeInAudio(ambientSound, 0.1)
        }
    }
})

document.addEventListener('fullscreenchange', handleExitFullscreen);
document.addEventListener('webkitfullscreenchange', handleExitFullscreen);