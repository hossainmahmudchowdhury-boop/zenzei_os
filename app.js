// =======================
// ZenZei OS Core
// =======================

const OS = {
  runningApps: {},
  activeAppId: null,
  windowStack: [],

  starfieldActive: true,

  soundEnabled: true,
  soundVolume: 0.5,
  audioCtx: null,

  bootTime: null,
  simulatedStatsTimer: null,

  appConfig: {
    terminal: {
      title: "Cosmic Terminal",
      icon: "fa-terminal",
      defaultWidth: 600,
      defaultHeight: 400
    },

    notes: {
      title: "Nebula Notes",
      icon: "fa-regular fa-clipboard",
      defaultWidth: 500,
      defaultHeight: 380
    },

    asteroids: {
      title: "Cosmic Asteroids",
      icon: "fa-solid fa-meteor",
      defaultWidth: 620,
      defaultHeight: 460
    },

    draw: {
      title: "Stellar Draw",
      icon: "fa-solid fa-wand-magic-sparkles",
      defaultWidth: 680,
      defaultHeight: 450
    },

    explorer: {
      title: "Space Explorer",
      icon: "fa-solid fa-user-astronaut",
      defaultWidth: 600,
      defaultHeight: 420
    },

    settings: {
      title: "Orion Control",
      icon: "fa-solid fa-sliders",
      defaultWidth: 420,
      defaultHeight: 380
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  OS.bootTime = Date.now();

  initBootSequence();
  initStarfield();
  initSystemUI();
});

// =======================
// Boot Screen
// =======================

function initBootSequence() {

  const progressBar = document.getElementById("boot-progress");
  const statusText = document.getElementById("boot-status");

  const bootloader = document.getElementById("bootloader");
  const lockscreen = document.getElementById("lockscreen");

  const bootSteps = [
    {
      progress: 15,
      message: "Starting ZenZei kernel..."
    },
    {
      progress: 30,
      message: "Loading navigation modules..."
    },
    {
      progress: 55,
      message: "Synchronizing shield matrix..."
    },
    {
      progress: 75,
      message: "Connecting orbital network..."
    },
    {
      progress: 90,
      message: "Preparing desktop..."
    },
    {
      progress: 100,
      message: "Welcome aboard."
    }
  ];

  let currentStep = 0;

  function nextStep() {

    if (currentStep >= bootSteps.length) {

      setTimeout(() => {

        bootloader.style.opacity = 0;

        setTimeout(() => {

          bootloader.classList.add("hidden");

          lockscreen.classList.remove("hidden");
          lockscreen.style.opacity = 1;

        }, 800);

      }, 500);

      return;
    }

    const step = bootSteps[currentStep];

    progressBar.style.width = `${step.progress}%`;
    statusText.textContent = step.message;

    currentStep++;

    setTimeout(nextStep, 300 + Math.random() * 350);
  }

  setTimeout(nextStep, 300);
}

// =======================
// Desktop UI
// =======================

function initSystemUI() {

  const lockscreen = document.getElementById("lockscreen");
  const desktop = document.getElementById("desktop");

  const unlockBtn = document.getElementById("btn-unlock");

  const startButton = document.getElementById("start-button");
  const startMenu = document.getElementById("start-menu");

  function updateClock() {

    const now = new Date();

    const lockTime = document.getElementById("lockscreen-time");
    const lockDate = document.getElementById("lockscreen-date");
    const trayTime = document.getElementById("tray-time");

    if (lockTime) {
      lockTime.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    }

    if (lockDate) {
      lockDate.textContent = now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric"
      });
    }

    if (trayTime) {
      trayTime.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
    }
  }

  updateClock();
  setInterval(updateClock, 1000);

  function unlockDesktop() {

    initAudioContext();
    playSystemSound("boot");

    lockscreen.style.transform = "translateY(-100vh)";
    lockscreen.style.opacity = 0;

    setTimeout(() => {

      lockscreen.classList.add("hidden");
      desktop.classList.remove("hidden");

      startHardwareMetricsSim();

    }, 800);
  }

  unlockBtn.addEventListener("click", unlockDesktop);

  window.addEventListener("keydown", e => {

    const allowed =
      e.code === "Space" ||
      e.code === "Enter";

    if (
      !lockscreen.classList.contains("hidden") &&
      allowed
    ) {
      unlockDesktop();
    }

  });

  startButton.addEventListener("click", e => {

    e.stopPropagation();

    playSystemSound("click");

    startMenu.classList.toggle("hidden");

    if (!startMenu.classList.contains("hidden")) {
      startMenu.classList.add("active-start");
    }

  });

  document.addEventListener("click", e => {

    if (
      startMenu.classList.contains("hidden")
    ) return;

    if (
      startMenu.contains(e.target) ||
      e.target === startButton
    ) return;

    startMenu.classList.add("hidden");

  });

  document
    .getElementById("tray-audio")
    .addEventListener("click", () => {

      OS.soundEnabled = !OS.soundEnabled;

      const icon =
        document.querySelector("#tray-audio i");

      if (OS.soundEnabled) {

        OS.soundVolume = 0.5;

        icon.className =
          "fa-solid fa-volume-high";

      } else {

        OS.soundVolume = 0;

        icon.className =
          "fa-solid fa-volume-xmark";

      }

      playSystemSound("click");

    });

  document
    .getElementById("btn-lock-os")
    .addEventListener("click", () => {

      playSystemSound("click");

      startMenu.classList.add("hidden");

      lockscreen.classList.remove("hidden");
      lockscreen.style.opacity = 1;
      lockscreen.style.transform = "translateY(0)";

    });

  document
    .getElementById("btn-restart-os")
    .addEventListener("click", () => {

      playSystemSound("click");

      startMenu.classList.add("hidden");

      triggerPowerOverlay(
        "Restarting ZenZei OS...",
        () => window.location.reload()
      );

    });

  document
    .getElementById("btn-shutdown-os")
    .addEventListener("click", () => {

      playSystemSound("click");

      startMenu.classList.add("hidden");

      triggerPowerOverlay(
        "Shutting down...",
        () => {

          document.body.innerHTML = `
          <div style="
              height:100vh;
              display:flex;
              justify-content:center;
              align-items:center;
              background:#000;
              color:#333;
              font-family:'Orbitron';
              font-size:.9rem;
          ">
            [ ZenZei OS Offline ]
          </div>
          `;

        }
      );

    });

}

// =======================
// Shutdown Overlay
// =======================

function triggerPowerOverlay(message, callback) {

  const overlay =
    document.getElementById("shutdown-screen");

  const label =
    document.getElementById("shutdown-text");

  label.textContent = message;

  overlay.classList.remove("hidden");
  overlay.style.opacity = 1;

  playSystemSound("shutdown");

  setTimeout(callback, 2500);

}

// =======================
// Fake CPU / RAM monitor
// =======================

function startHardwareMetricsSim() {

  const cpuBar =
    document.getElementById("cpu-loader");

  const ramBar =
    document.getElementById("ram-loader");

  OS.simulatedStatsTimer = setInterval(() => {

    if (!cpuBar || !ramBar) return;

    const openApps =
      Object.keys(OS.runningApps).length;

    let cpu =
      6 +
      openApps * 6 +
      Math.floor(Math.random() * 10);

    let ram =
      38 +
      openApps * 4 +
      Math.floor(Math.random() * 6);

    cpu = Math.min(cpu, 98);
    ram = Math.min(ram, 95);

    cpuBar.style.width = `${cpu}%`;
    ramBar.style.width = `${ram}%`;

  }, 3000);

}

// =======================
// Starfield Background
// =======================

function initStarfield() {

    const canvas = document.getElementById("starfield");
    const ctx = canvas.getContext("2d");

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const STAR_COUNT = 180;

    const stars = [];
    const shootingStars = [];

    for (let i = 0; i < STAR_COUNT; i++) {

        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,

            radius: 0.3 + Math.random() * 1.5,
            speed: 0.02 + Math.random() * 0.15,

            alpha: 0.3 + Math.random() * 0.7,
            layer: Math.random() * 2
        });

    }

    function spawnShootingStar() {

        if (!OS.starfieldActive) return;

        shootingStars.push({

            x: Math.random() * width,
            y: Math.random() * height * 0.5,

            vx: 10 + Math.random() * 15,
            vy: 3 + Math.random() * 5,

            length: 40 + Math.random() * 80,

            alpha: 1
        });

        setTimeout(
            spawnShootingStar,
            6000 + Math.random() * 12000
        );
    }

    setTimeout(spawnShootingStar, 5000);

    let offsetX = 0;
    let offsetY = 0;

    let targetOffsetX = 0;
    let targetOffsetY = 0;

    window.addEventListener("mousemove", e => {

        targetOffsetX =
            (e.clientX - width / 2) * 0.05;

        targetOffsetY =
            (e.clientY - height / 2) * 0.05;

    });

    function drawFrame() {

        requestAnimationFrame(drawFrame);

        if (!OS.starfieldActive) return;

        ctx.fillStyle = "#030307";
        ctx.fillRect(0, 0, width, height);

        offsetX += (targetOffsetX - offsetX) * 0.08;
        offsetY += (targetOffsetY - offsetY) * 0.08;

        ctx.fillStyle = "#fff";

        for (const star of stars) {

            star.x += star.speed;

            if (star.x > width)
                star.x = 0;

            let x =
                star.x - offsetX * star.layer;

            let y =
                star.y - offsetY * star.layer;

            if (x < 0) x += width;
            if (x > width) x -= width;

            if (y < 0) y += height;
            if (y > height) y -= height;

            ctx.globalAlpha = star.alpha;

            ctx.beginPath();
            ctx.arc(
                x,
                y,
                star.radius,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        ctx.globalAlpha = 1;

        for (let i = shootingStars.length - 1; i >= 0; i--) {

            const s = shootingStars[i];

            s.x += s.vx;
            s.y += s.vy;

            s.alpha -= 0.04;

            if (s.alpha <= 0) {
                shootingStars.splice(i, 1);
                continue;
            }

            ctx.globalAlpha = s.alpha;

            ctx.strokeStyle = "rgba(0,243,255,.8)";
            ctx.lineWidth = 1.5;

            ctx.beginPath();

            ctx.moveTo(s.x, s.y);

            ctx.lineTo(
                s.x - s.vx * 1.5,
                s.y - s.vy * 1.5
            );

            ctx.stroke();
        }

        ctx.globalAlpha = 1;
    }

    drawFrame();
}

//
// Audio
//

function initAudioContext() {

    if (OS.audioCtx) return;

    const AudioAPI =
        window.AudioContext ||
        window.webkitAudioContext;

    if (AudioAPI) {
        OS.audioCtx = new AudioAPI();
    }

}

function playSystemSound(type) {

    if (!OS.soundEnabled) return;
    if (!OS.audioCtx) return;

    if (OS.audioCtx.state === "suspended") {
        OS.audioCtx.resume();
    }

    const ctx = OS.audioCtx;
    const now = ctx.currentTime;

    const master = ctx.createGain();

    master.gain.value = OS.soundVolume;
    master.connect(ctx.destination);

    switch (type) {

        case "click": {

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";

            osc.frequency.setValueAtTime(
                1200,
                now
            );

            osc.frequency.exponentialRampToValueAtTime(
                150,
                now + .06
            );

            gain.gain.setValueAtTime(.08, now);

            gain.gain.exponentialRampToValueAtTime(
                .001,
                now + .06
            );

            osc.connect(gain);
            gain.connect(master);

            osc.start(now);
            osc.stop(now + .06);

            break;
        }

        case "boot": {

            const root = 146.83;
            const duration = 2;

            [1, 1.5, 2, 2.5, 3].forEach((mult, i) => {

                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type =
                    i === 0
                        ? "sawtooth"
                        : "sine";

                osc.frequency.value =
                    root * mult;

                if (i === 0) {

                    const filter =
                        ctx.createBiquadFilter();

                    filter.type = "lowpass";

                    filter.frequency.setValueAtTime(
                        100,
                        now
                    );

                    filter.frequency.exponentialRampToValueAtTime(
                        400,
                        now + duration
                    );

                    osc.connect(filter);
                    filter.connect(gain);

                } else {

                    osc.connect(gain);

                }

                gain.gain.setValueAtTime(
                    0,
                    now
                );

                gain.gain.linearRampToValueAtTime(
                    .06 / 5,
                    now + .6
                );

                gain.gain.exponentialRampToValueAtTime(
                    .001,
                    now + duration
                );

                gain.connect(master);

                osc.start(now);
                osc.stop(now + duration);

            });

            break;
        }

        case "open": {

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";

            osc.frequency.value = 440;

            osc.frequency.exponentialRampToValueAtTime(
                1200,
                now + .18
            );

            gain.gain.setValueAtTime(
                0,
                now
            );

            gain.gain.linearRampToValueAtTime(
                .12,
                now + .05
            );

            gain.gain.exponentialRampToValueAtTime(
                .001,
                now + .18
            );

            osc.connect(gain);
            gain.connect(master);

            osc.start(now);
            osc.stop(now + .18);

            break;
        }

        case "shutdown": {

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";

            osc.frequency.setValueAtTime(
                600,
                now
            );

            osc.frequency.exponentialRampToValueAtTime(
                80,
                now + 1.2
            );

            gain.gain.setValueAtTime(
                .15,
                now
            );

            gain.gain.exponentialRampToValueAtTime(
                .001,
                now + 1.2
            );

            osc.connect(gain);
            gain.connect(master);

            osc.start(now);
            osc.stop(now + 1.2);

            break;
        }

        case "alert": {

            [0, .15].forEach(delay => {

                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                const start =
                    now + delay;

                osc.type = "triangle";

                osc.frequency.value = 880;

                gain.gain.setValueAtTime(
                    .08,
                    start
                );

                gain.gain.exponentialRampToValueAtTime(
                    .001,
                    start + .12
                );

                osc.connect(gain);
                gain.connect(master);

                osc.start(start);
                osc.stop(start + .12);

            });

            break;
        }

    }

}
