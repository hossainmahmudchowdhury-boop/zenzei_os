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
    terminal: { title: "Cosmic Terminal", icon: "fa-terminal", defaultWidth: 600, defaultHeight: 400 },
    notes:    { title: "Nebula Notes", icon: "fa-regular fa-clipboard", defaultWidth: 500, defaultHeight: 380 },
    asteroids:{ title: "Cosmic Asteroids", icon: "fa-solid fa-meteor", defaultWidth: 620, defaultHeight: 460 },
    draw:     { title: "Stellar Draw", icon: "fa-solid fa-wand-magic-sparkles", defaultWidth: 680, defaultHeight: 450 },
    explorer: { title: "Space Explorer", icon: "fa-solid fa-user-astronaut", defaultWidth: 600, defaultHeight: 420 },
    settings: { title: "Orion Control", icon: "fa-solid fa-sliders", defaultWidth: 420, defaultHeight: 380 }
  }
};
document.addEventListener("DOMContentLoaded", () => {
  OS.bootTime = Date.now();
  initBootSequence();
  initStarfield();
  initSystemUI();
});


// Boot Screen

function initBootSequence() {
  const progressBar = document.getElementById("boot-progress");
  const statusText  = document.getElementById("boot-status");
  const bootloader  = document.getElementById("bootloader");
  const lockscreen  = document.getElementById("lockscreen");

  const bootSteps = [
    { progress: 15,  message: "Starting ZenZei kernel..." },
    { progress: 30,  message: "Loading navigation modules..." },
    { progress: 55,  message: "Synchronizing shield matrix..." },
    { progress: 75,  message: "Connecting orbital network..." },
    { progress: 90,  message: "Preparing desktop..." },
    { progress: 100, message: "Welcome aboard." }
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
    statusText.textContent  = step.message;
    currentStep++;
    setTimeout(nextStep, 300 + Math.random() * 350);
  }
  setTimeout(nextStep, 300);
}


// Desktop UI

function initSystemUI() {
  const lockscreen  = document.getElementById("lockscreen");
  const desktop     = document.getElementById("desktop");
  const unlockBtn   = document.getElementById("btn-unlock");
  const startButton = document.getElementById("start-button");
  const startMenu   = document.getElementById("start-menu");
  function updateClock() {
    const now      = new Date();
    const lockTime = document.getElementById("lockscreen-time");
    const lockDate = document.getElementById("lockscreen-date");
    const trayTime = document.getElementById("tray-time");
    if (lockTime) lockTime.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    if (lockDate) lockDate.textContent = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    if (trayTime) trayTime.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  }
  updateClock();
  setInterval(updateClock, 1000);
  function unlockDesktop() {
    initAudioContext();
    playSystemSound("boot");
    lockscreen.style.transform = "translateY(-100vh)";
    lockscreen.style.opacity   = 0;
    setTimeout(() => {
      lockscreen.classList.add("hidden");
      desktop.classList.remove("hidden");
      startHardwareMetricsSim();
    }, 800);
  }
  unlockBtn.addEventListener("click", unlockDesktop);
  window.addEventListener("keydown", e => {
    if (!lockscreen.classList.contains("hidden") && (e.code === "Space" || e.code === "Enter")) {
      unlockDesktop();
    }
  });
  startButton.addEventListener("click", e => {
    e.stopPropagation();
    playSystemSound("click");
    startMenu.classList.toggle("hidden");
  });
  document.addEventListener("click", e => {
    if (startMenu.classList.contains("hidden")) return;
    if (startMenu.contains(e.target) || e.target === startButton) return;
    startMenu.classList.add("hidden");
  });

  document.getElementById("tray-audio").addEventListener("click", () => {
    OS.soundEnabled = !OS.soundEnabled;
    const icon = document.querySelector("#tray-audio i");
    if (OS.soundEnabled) {
      OS.soundVolume = 0.5;
      icon.className = "fa-solid fa-volume-high";
    } else {
      OS.soundVolume = 0;
      icon.className = "fa-solid fa-volume-xmark";
    }
    playSystemSound("click");
  });

  document.getElementById("btn-lock-os").addEventListener("click", () => {
    playSystemSound("click");
    startMenu.classList.add("hidden");
    lockscreen.classList.remove("hidden");
    lockscreen.style.opacity   = 1;
    lockscreen.style.transform = "translateY(0)";
  });

  document.getElementById("btn-restart-os").addEventListener("click", () => {
    playSystemSound("click");
    startMenu.classList.add("hidden");
    triggerPowerOverlay("Restarting ZenZei OS...", () => window.location.reload());
  });

  document.getElementById("btn-shutdown-os").addEventListener("click", () => {
    playSystemSound("click");
    startMenu.classList.add("hidden");
    triggerPowerOverlay("Shutting down...", () => {
      document.body.innerHTML = `
        <div style="height:100vh;display:flex;justify-content:center;align-items:center;
          background:#000;color:#333;font-family:'Space Grotesk',sans-serif;font-size:.9rem;">
          [ ZenZei OS Offline ]
        </div>`;
    });
  });
}


// Shutdown Overlay
function triggerPowerOverlay(message, callback) {
  const overlay = document.getElementById("shutdown-screen");
  const label   = document.getElementById("shutdown-text");
  label.textContent = message;
  overlay.classList.remove("hidden");
  overlay.style.opacity = 1;
  playSystemSound("shutdown");
  setTimeout(callback, 2500);
}


// Hardware Metrics Sim

function startHardwareMetricsSim() {
  const cpuBar = document.getElementById("cpu-loader");
  const ramBar = document.getElementById("ram-loader");

  OS.simulatedStatsTimer = setInterval(() => {
    if (!cpuBar || !ramBar) return;
    const openApps = Object.keys(OS.runningApps).length;
    let cpu = Math.min(6  + openApps * 6  + Math.floor(Math.random() * 10), 98);
    let ram = Math.min(38 + openApps * 4  + Math.floor(Math.random() * 6),  95);
    cpuBar.style.width = `${cpu}%`;
    ramBar.style.width = `${ram}%`;
  }, 3000);
}


// Starfield

function initStarfield() {
  const canvas = document.getElementById("starfield");
  const ctx    = canvas.getContext("2d");
  let width  = canvas.width  = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  window.addEventListener("resize", () => {
    width  = canvas.width  = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const stars = Array.from({ length: 180
