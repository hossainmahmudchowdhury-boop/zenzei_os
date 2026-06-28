/* ============================================================
   ZENZEI OS — app.js
   Core application logic for the web-based desktop environment.

   Sections
   --------
   1. OS State Object
   2. Entry Point (DOMContentLoaded)
   3. Boot Sequence
   4. Starfield Background
   5. System UI (Clock, Unlock, Start Menu, Power Actions)
   6. Window Manager (open, close, minimize, maximize, drag, resize)
   7. App Builders (Terminal, Notes, Asteroids, Draw, Explorer, Settings)
   8. Taskbar Helpers
   9. Audio Engine
   10. Utility Helpers
============================================================ */


/* ============================================================
   1. OS STATE OBJECT
   Single source of truth for everything that changes at runtime.
============================================================ */
const OS = {

  // Tracks all open windows: { appId -> { windowEl, pinEl, isMinimized, isMaximized, ... } }
  runningApps: {},

  // ID of the currently focused window
  activeAppId: null,

  // Stack that records focus order so we can restore z-index correctly
  windowStack: [],

  // ── Feature Flags ──
  starfieldActive: true,

  // ── Audio ──
  soundEnabled:  true,
  soundVolume:   0.5,
  audioCtx:      null,

  // ── Misc ──
  bootTime:            null,
  simulatedStatsTimer: null,

  // ── App Metadata ──
  // Each entry describes a launchable application.
  appConfig: {

    terminal: {
      title:         'Cosmic Terminal',
      icon:          'fa-terminal',
      defaultWidth:  600,
      defaultHeight: 420,
    },

    notes: {
      title:         'Nebula Notes',
      icon:          'fa-regular fa-clipboard',
      defaultWidth:  500,
      defaultHeight: 380,
    },

    asteroids: {
      title:         'Cosmic Asteroids',
      icon:          'fa-solid fa-meteor',
      defaultWidth:  640,
      defaultHeight: 480,
    },

    draw: {
      title:         'Stellar Draw',
      icon:          'fa-solid fa-wand-magic-sparkles',
      defaultWidth:  700,
      defaultHeight: 480,
    },

    explorer: {
      title:         'Space Explorer',
      icon:          'fa-solid fa-user-astronaut',
      defaultWidth:  620,
      defaultHeight: 440,
    },

    settings: {
      title:         'Orion Control',
      icon:          'fa-solid fa-sliders',
      defaultWidth:  440,
      defaultHeight: 400,
    },

  },

  // Opens an app by ID (creates window if not running, restores if minimised)
  openApp(id) {
    openApp(id);
  },

};


/* ============================================================
   2. ENTRY POINT
============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  OS.bootTime = Date.now();

  initBootSequence();   // animated progress bar before lock screen
  initStarfield();      // parallax star canvas
  initSystemUI();       // clock, unlock button, taskbar, start menu

});


/* ============================================================
   3. BOOT SEQUENCE
   Animates a fake progress bar, then fades to the lock screen.
============================================================ */
function initBootSequence() {

  const progressBar = document.getElementById('boot-progress');
  const statusText  = document.getElementById('boot-status');
  const bootloader  = document.getElementById('bootloader');
  const lockscreen  = document.getElementById('lockscreen');

  // Messages that appear as the bar advances
  const bootSteps = [
    { progress: 15,  message: 'Starting ZenZei kernel...'       },
    { progress: 30,  message: 'Loading navigation modules...'   },
    { progress: 55,  message: 'Synchronising shield matrix...'  },
    { progress: 75,  message: 'Connecting orbital network...'   },
    { progress: 90,  message: 'Preparing desktop...'            },
    { progress: 100, message: 'Welcome aboard.'                 },
  ];

  let currentStep = 0;

  function runNextStep() {

    // All steps done — fade out the bootloader and show the lock screen
    if (currentStep >= bootSteps.length) {
      setTimeout(() => {

        bootloader.style.opacity = '0';

        setTimeout(() => {
          bootloader.classList.add('hidden');
          lockscreen.classList.remove('hidden');
          lockscreen.style.opacity = '1';
        }, 800);

      }, 500);
      return;
    }

    const step = bootSteps[currentStep];
    progressBar.style.width = `${step.progress}%`;
    statusText.textContent  = step.message;

    currentStep++;

    // Add a bit of randomness so it feels more "real"
    setTimeout(runNextStep, 280 + Math.random() * 350);
  }

  setTimeout(runNextStep, 400);
}


/* ============================================================
   4. STARFIELD BACKGROUND
   Draws a parallax star canvas with occasional shooting stars.
============================================================ */
function initStarfield() {

  const canvas = document.getElementById('starfield');
  const ctx    = canvas.getContext('2d');

  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  // ── Regular Stars ──
  const STAR_COUNT = 180;
  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x:      Math.random() * W,
    y:      Math.random() * H,
    radius: 0.3 + Math.random() * 1.5,
    speed:  0.02 + Math.random() * 0.15,
    alpha:  0.3  + Math.random() * 0.7,
    layer:  Math.random() * 2,       // parallax depth (0 = foreground, 2 = background)
  }));

  // ── Shooting Stars ──
  const shootingStars = [];

  function spawnShootingStar() {
    if (!OS.starfieldActive) return;

    shootingStars.push({
      x:      Math.random() * W,
      y:      Math.random() * H * 0.5,
      vx:     10 + Math.random() * 15,
      vy:     3  + Math.random() * 5,
      length: 40 + Math.random() * 80,
      alpha:  1,
    });

    // Schedule the next one at a random interval (6–18 s)
    setTimeout(spawnShootingStar, 6000 + Math.random() * 12000);
  }

  setTimeout(spawnShootingStar, 5000);  // first one after 5 s

  // ── Mouse Parallax ──
  let offsetX = 0, offsetY = 0;
  let targetX = 0, targetY = 0;

  window.addEventListener('mousemove', e => {
    targetX = (e.clientX - W / 2) * 0.05;
    targetY = (e.clientY - H / 2) * 0.05;
  });

  // ── Render Loop ──
  function drawFrame() {
    requestAnimationFrame(drawFrame);

    if (!OS.starfieldActive) return;

    // Clear
    ctx.fillStyle = '#030307';
    ctx.fillRect(0, 0, W, H);

    // Ease toward mouse target (smooth parallax)
    offsetX += (targetX - offsetX) * 0.08;
    offsetY += (targetY - offsetY) * 0.08;

    // Draw regular stars
    ctx.fillStyle = '#fff';
    for (const star of stars) {
      star.x += star.speed;
      if (star.x > W) star.x = 0;

      // Apply parallax based on the star's depth layer
      let sx = star.x - offsetX * star.layer;
      let sy = star.y - offsetY * star.layer;

      // Wrap around edges
      if (sx < 0)  sx += W;
      if (sx > W)  sx -= W;
      if (sy < 0)  sy += H;
      if (sy > H)  sy -= H;

      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(sx, sy, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    // Draw and age shooting stars
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const s = shootingStars[i];
      s.x    += s.vx;
      s.y    += s.vy;
      s.alpha -= 0.04;

      if (s.alpha <= 0) {
        shootingStars.splice(i, 1);
        continue;
      }

      ctx.globalAlpha  = s.alpha;
      ctx.strokeStyle  = 'rgba(0, 243, 255, 0.8)';
      ctx.lineWidth    = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 1.5, s.y - s.vy * 1.5);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  drawFrame();
}


/* ============================================================
   5. SYSTEM UI — CLOCK, UNLOCK, TASKBAR, START MENU, POWER
============================================================ */
function initSystemUI() {

  const lockscreen  = document.getElementById('lockscreen');
  const desktop     = document.getElementById('desktop');
  const unlockBtn   = document.getElementById('btn-unlock');
  const startButton = document.getElementById('start-button');
  const startMenu   = document.getElementById('start-menu');

  // ── Live Clock ──
  function updateClock() {
    const now = new Date();

    const lockTime = document.getElementById('lockscreen-time');
    const lockDate = document.getElementById('lockscreen-date');
    const trayTime = document.getElementById('tray-time');

    if (lockTime) {
      lockTime.textContent = now.toLocaleTimeString([], {
        hour:   '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    if (lockDate) {
      lockDate.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        month:   'long',
        day:     'numeric',
      });
    }

    if (trayTime) {
      trayTime.textContent = now.toLocaleTimeString([], {
        hour:   '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    }
  }

  updateClock();
  setInterval(updateClock, 1000);

  // ── Unlock ──
  function unlockDesktop() {
    initAudioContext();
    playSystemSound('boot');

    // Slide the lock screen upward and fade it
    lockscreen.style.transform = 'translateY(-100vh)';
    lockscreen.style.opacity   = '0';

    setTimeout(() => {
      lockscreen.classList.add('hidden');
      desktop.classList.remove('hidden');
      startHardwareMetricsSim();
    }, 800);
  }

  unlockBtn.addEventListener('click', unlockDesktop);

  // Also unlock on Space or Enter
  window.addEventListener('keydown', e => {
    if (!lockscreen.classList.contains('hidden') &&
        (e.code === 'Space' || e.code === 'Enter')) {
      unlockDesktop();
    }
  });

  // ── Start Menu Toggle ──
  startButton.addEventListener('click', e => {
    e.stopPropagation();
    playSystemSound('click');
    startMenu.classList.toggle('hidden');
  });

  // Close start menu when clicking anywhere else on the desktop
  document.addEventListener('click', e => {
    if (startMenu.classList.contains('hidden')) return;
    if (startMenu.contains(e.target) || startButton.contains(e.target)) return;
    startMenu.classList.add('hidden');
  });

  // ── Audio Toggle (tray icon) ──
  document.getElementById('tray-audio').addEventListener('click', () => {
    OS.soundEnabled = !OS.soundEnabled;
    OS.soundVolume  = OS.soundEnabled ? 0.5 : 0;

    const icon = document.querySelector('#tray-audio i');
    icon.className = OS.soundEnabled
      ? 'fa-solid fa-volume-high'
      : 'fa-solid fa-volume-xmark';

    playSystemSound('click');
  });

  // ── Power Actions ──
  document.getElementById('btn-lock-os').addEventListener('click', () => {
    playSystemSound('click');
    startMenu.classList.add('hidden');

    // Restore the lock screen in place
    lockscreen.classList.remove('hidden');
    lockscreen.style.opacity   = '1';
    lockscreen.style.transform = 'translateY(0)';
  });

  document.getElementById('btn-restart-os').addEventListener('click', () => {
    playSystemSound('click');
    startMenu.classList.add('hidden');
    triggerPowerOverlay('Restarting ZenZei OS...', () => window.location.reload());
  });

  document.getElementById('btn-shutdown-os').addEventListener('click', () => {
    playSystemSound('click');
    startMenu.classList.add('hidden');
    triggerPowerOverlay('Shutting down...', () => {
      document.body.innerHTML = `
        <div style="
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #000;
          color: #333;
          font-family: 'Orbitron', sans-serif;
          font-size: 0.9rem;
        ">
          [ ZenZei OS Offline ]
        </div>
      `;
    });
  });
}


/* ============================================================
   SHUTDOWN / RESTART OVERLAY
============================================================ */
function triggerPowerOverlay(message, callback) {

  const overlay = document.getElementById('shutdown-screen');
  const label   = document.getElementById('shutdown-text');

  label.textContent = message;
  overlay.classList.remove('hidden');
  overlay.style.opacity = '1';

  playSystemSound('shutdown');

  setTimeout(callback, 2500);
}


/* ============================================================
   HARDWARE METRICS SIMULATION
   Fake CPU and RAM bars that respond to open apps.
============================================================ */
function startHardwareMetricsSim() {

  const cpuBar = document.getElementById('cpu-loader');
  const ramBar = document.getElementById('ram-loader');

  OS.simulatedStatsTimer = setInterval(() => {

    if (!cpuBar || !ramBar) return;

    const openCount = Object.keys(OS.runningApps).length;

    let cpu = 6  + openCount * 6  + Math.floor(Math.random() * 10);
    let ram = 38 + openCount * 4  + Math.floor(Math.random() * 6);

    // Cap at realistic-looking maximums
    cpu = Math.min(cpu, 98);
    ram = Math.min(ram, 95);

    cpuBar.style.width = `${cpu}%`;
    ramBar.style.width = `${ram}%`;

  }, 3000);
}


/* ============================================================
   6. WINDOW MANAGER
============================================================ */

/**
 * Opens an app by its configuration key.
 * If the app is already open, restores/focuses it instead.
 */
function openApp(appId) {

  // If already running, just restore and focus
  if (OS.runningApps[appId]) {
    const state = OS.runningApps[appId];

    if (state.isMinimized) {
      state.windowEl.classList.remove('minimized');
      state.isMinimized = false;
    }

    focusWindow(appId);
    return;
  }

  playSystemSound('open');

  const config = OS.appConfig[appId];
  if (!config) return;

  // ── Build the window element ──
  const win = document.createElement('div');
  win.className  = 'window';
  win.dataset.id = appId;

  // Initial position: slightly offset from any existing windows
  const offset = Object.keys(OS.runningApps).length * 30;
  win.style.width  = `${config.defaultWidth}px`;
  win.style.height = `${config.defaultHeight}px`;
  win.style.top    = `${80  + offset}px`;
  win.style.left   = `${160 + offset}px`;

  // ── Titlebar ──
  win.innerHTML = `
    <div class="window-titlebar" data-id="${appId}">
      <div class="window-title">
        <i class="fa-solid ${config.icon}"></i>
        ${config.title}
      </div>
      <div class="window-actions">
        <button class="win-btn win-btn-minimize" title="Minimise"></button>
        <button class="win-btn win-btn-maximize" title="Maximise"></button>
        <button class="win-btn win-btn-close"    title="Close"></button>
      </div>
    </div>
    <div class="window-content" id="window-content-${appId}"></div>
    <div class="window-resizer"></div>
  `;

  document.getElementById('windows-container').appendChild(win);

  // ── Register in state ──
  OS.runningApps[appId] = {
    windowEl:    win,
    pinEl:       null,
    isMinimized: false,
    isMaximized: false,

    // Store pre-maximise dimensions for restore
    savedWidth:  config.defaultWidth,
    savedHeight: config.defaultHeight,
    savedTop:    80  + offset,
    savedLeft:   160 + offset,
  };

  // ── Wire up titlebar buttons ──
  win.querySelector('.win-btn-close').addEventListener('click', e => {
    e.stopPropagation();
    closeWindow(appId);
  });

  win.querySelector('.win-btn-minimize').addEventListener('click', e => {
    e.stopPropagation();
    minimizeWindow(appId);
  });

  win.querySelector('.win-btn-maximize').addEventListener('click', e => {
    e.stopPropagation();
    toggleMaximize(appId);
  });

  // Double-click titlebar to toggle maximise
  win.querySelector('.window-titlebar').addEventListener('dblclick', () => {
    toggleMaximize(appId);
  });

  // Focus on click anywhere in the window
  win.addEventListener('mousedown', () => focusWindow(appId));

  // ── Drag (move) ──
  makeDraggable(win, win.querySelector('.window-titlebar'));

  // ── Resize ──
  makeResizable(win, win.querySelector('.window-resizer'));

  // ── Populate app content ──
  const contentEl = document.getElementById(`window-content-${appId}`);
  buildAppContent(appId, contentEl);

  // ── Taskbar pin ──
  addTaskbarPin(appId, config);

  // Focus the newly opened window
  focusWindow(appId);
}


/** Remove a window from the DOM and all tracking state. */
function closeWindow(appId) {

  const state = OS.runningApps[appId];
  if (!state) return;

  playSystemSound('click');

  // Cleanup any game loops the app may have started
  if (state.gameLoopId) cancelAnimationFrame(state.gameLoopId);

  state.windowEl.remove();
  state.pinEl?.remove();

  delete OS.runningApps[appId];

  // Focus the next window in the stack
  OS.windowStack = OS.windowStack.filter(id => id !== appId);
  if (OS.windowStack.length > 0) {
    focusWindow(OS.windowStack[OS.windowStack.length - 1]);
  } else {
    OS.activeAppId = null;
  }
}


/** Slide the window down to the taskbar (hide it). */
function minimizeWindow(appId) {

  const state = OS.runningApps[appId];
  if (!state) return;

  playSystemSound('click');

  state.windowEl.classList.add('minimized');
  state.isMinimized = true;
  state.pinEl?.classList.remove('active-pin');

  // Focus the next available window
  const nextId = OS.windowStack.find(id => id !== appId && !OS.runningApps[id]?.isMinimized);
  if (nextId) focusWindow(nextId);
}


/** Toggle between maximised and its previous size/position. */
function toggleMaximize(appId) {

  const state = OS.runningApps[appId];
  if (!state) return;

  playSystemSound('click');

  const win = state.windowEl;

  if (state.isMaximized) {
    // Restore
    win.classList.remove('maximized');
    win.style.width  = `${state.savedWidth}px`;
    win.style.height = `${state.savedHeight}px`;
    win.style.top    = `${state.savedTop}px`;
    win.style.left   = `${state.savedLeft}px`;
    state.isMaximized = false;
  } else {
    // Save current geometry, then maximise
    state.savedWidth  = win.offsetWidth;
    state.savedHeight = win.offsetHeight;
    state.savedTop    = parseInt(win.style.top,  10);
    state.savedLeft   = parseInt(win.style.left, 10);
    win.classList.add('maximized');
    state.isMaximized = true;
  }
}


/** Bring a window to the front and mark it active. */
function focusWindow(appId) {

  // Deactivate the previously active window
  if (OS.activeAppId && OS.runningApps[OS.activeAppId]) {
    OS.runningApps[OS.activeAppId].windowEl.classList.remove('active-window');
    OS.runningApps[OS.activeAppId].pinEl?.classList.remove('active-pin');
  }

  OS.activeAppId = appId;

  // Remove from stack then push to top
  OS.windowStack = OS.windowStack.filter(id => id !== appId);
  OS.windowStack.push(appId);

  // Re-assign z-index values based on stack order
  OS.windowStack.forEach((id, i) => {
    if (OS.runningApps[id]) {
      OS.runningApps[id].windowEl.style.zIndex = 100 + i;
    }
  });

  const state = OS.runningApps[appId];
  if (!state) return;

  state.windowEl.classList.add('active-window');
  state.pinEl?.classList.add('active-pin');
}


/* ── Drag Implementation ── */
function makeDraggable(win, handle) {

  let startX, startY, startLeft, startTop;
  let dragging = false;

  handle.addEventListener('mousedown', e => {

    // Ignore clicks on the control buttons
    if (e.target.classList.contains('win-btn')) return;

    // Can't drag a maximised window
    const id = win.dataset.id;
    if (OS.runningApps[id]?.isMaximized) return;

    dragging  = true;
    startX    = e.clientX;
    startY    = e.clientY;
    startLeft = parseInt(win.style.left, 10) || 0;
    startTop  = parseInt(win.style.top,  10) || 0;

    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // Keep window header always reachable
    const maxTop  = window.innerHeight - 48 - 38;
    const maxLeft = window.innerWidth  - 40;

    win.style.left = `${Math.max(-win.offsetWidth + 80, Math.min(maxLeft, startLeft + dx))}px`;
    win.style.top  = `${Math.max(0, Math.min(maxTop, startTop + dy))}px`;
  });

  document.addEventListener('mouseup', () => { dragging = false; });
}


/* ── Resize Implementation ── */
function makeResizable(win, handle) {

  let startX, startY, startW, startH;
  let resizing = false;

  handle.addEventListener('mousedown', e => {
    resizing = true;
    startX   = e.clientX;
    startY   = e.clientY;
    startW   = win.offsetWidth;
    startH   = win.offsetHeight;
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('mousemove', e => {
    if (!resizing) return;
    win.style.width  = `${Math.max(320, startW + (e.clientX - startX))}px`;
    win.style.height = `${Math.max(240, startH + (e.clientY - startY))}px`;
  });

  document.addEventListener('mouseup', () => { resizing = false; });
}


/* ============================================================
   8. TASKBAR HELPERS
============================================================ */
function addTaskbarPin(appId, config) {

  const container = document.getElementById('taskbar-apps-container');

  const pin = document.createElement('div');
  pin.className   = 'taskbar-app-pin';
  pin.dataset.id  = appId;
  pin.innerHTML   = `<i class="fa-solid ${config.icon}"></i><span>${config.title}</span>`;

  pin.addEventListener('click', () => {
    const state = OS.runningApps[appId];
    if (!state) return;

    if (state.isMinimized) {
      state.windowEl.classList.remove('minimized');
      state.isMinimized = false;
      focusWindow(appId);
    } else if (OS.activeAppId === appId) {
      minimizeWindow(appId);
    } else {
      focusWindow(appId);
    }
  });

  container.appendChild(pin);
  OS.runningApps[appId].pinEl = pin;
}


/* ============================================================
   7. APP BUILDERS
   Each function populates the window-content div for its app.
============================================================ */
function buildAppContent(appId, container) {
  switch (appId) {
    case 'terminal':  buildTerminal(container);  break;
    case 'notes':     buildNotes(container);     break;
    case 'asteroids': buildAsteroids(container, appId); break;
    case 'draw':      buildDraw(container);      break;
    case 'explorer':  buildExplorer(container);  break;
    case 'settings':  buildSettings(container);  break;
    default:          container.textContent = 'App not found.';
  }
}


/* ── a. Cosmic Terminal ── */
function buildTerminal(container) {

  container.innerHTML = `
    <div class="terminal-app" id="terminal-inner">
      <div class="terminal-output" id="terminal-output"></div>
      <div class="terminal-input-row">
        <span class="terminal-prompt">guest@zenzei:~$</span>
        <input class="terminal-input-field" id="terminal-input" type="text" autocomplete="off" spellcheck="false" />
      </div>
    </div>
  `;

  const output = container.querySelector('#terminal-output');
  const input  = container.querySelector('#terminal-input');

  // Command history
  const history = [];
  let historyIdx = -1;

  function printLine(text, cssClass = '') {
    const line = document.createElement('div');
    line.className   = `terminal-line${cssClass ? ' ' + cssClass : ''}`;
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  function printHTML(html) {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML  = html;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  // Welcome banner
  printHTML(`<span style="color:var(--neon-cyan)">
  ███████╗███████╗███╗  ██╗███████╗███████╗██╗
  ╚════██║██╔════╝████╗ ██║╚════██║██╔════╝██║
      ██╔╝█████╗  ██╔██╗██║    ██╔╝█████╗  ██║
     ██╔╝ ██╔══╝  ██║╚████║   ██╔╝ ██╔══╝  ██║
     ██║  ███████╗██║ ╚███║   ██║  ███████╗██║
     ╚═╝  ╚══════╝╚═╝  ╚══╝   ╚═╝  ╚══════╝╚═╝
  </span>`);
  printLine('ZenZei OS Terminal v1.0   type "help" for commands.');
  printLine('');

  // Command definitions
  const commands = {

    help() {
      printLine('Available commands:');
      printLine('  help       — show this list');
      printLine('  clear      — clear the terminal');
      printLine('  date       — print current date & time');
      printLine('  whoami     — display current user');
      printLine('  uname      — system information');
      printLine('  ls         — list virtual files');
      printLine('  echo <msg> — print a message');
      printLine('  uptime     — time since boot');
      printLine('  apps       — list installed apps');
      printLine('  open <app> — launch an app');
    },

    clear() {
      output.innerHTML = '';
    },

    date() {
      printLine(new Date().toString());
    },

    whoami() {
      printLine('guest — Cosmic Explorer');
    },

    uname() {
      printLine('ZenZei OS 1.0 (Celestial Edition)  x86_64  Warp-9 kernel');
    },

    ls() {
      printLine('Documents/   Downloads/   Music/   Pictures/   README.txt');
    },

    uptime() {
      const seconds = Math.floor((Date.now() - OS.bootTime) / 1000);
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      printLine(`up ${m}m ${s}s  |  1 user  |  load avg: 0.42, 0.35, 0.28`);
    },

    apps() {
      Object.entries(OS.appConfig).forEach(([id, cfg]) => {
        printLine(`  ${id.padEnd(12)} — ${cfg.title}`);
      });
    },

    open(args) {
      const appId = args[0];
      if (!appId) { printLine('Usage: open <appId>', 'text-orange'); return; }
      if (!OS.appConfig[appId]) { printLine(`Unknown app: ${appId}`, 'text-pink'); return; }
      OS.openApp(appId);
      printLine(`Launching ${OS.appConfig[appId].title}...`, 'text-cyan');
    },

    echo(args) {
      printLine(args.join(' '));
    },

  };

  // Input handler
  input.addEventListener('keydown', e => {

    if (e.key === 'ArrowUp') {
      if (historyIdx < history.length - 1) historyIdx++;
      input.value = history[history.length - 1 - historyIdx] || '';
      return;
    }

    if (e.key === 'ArrowDown') {
      if (historyIdx > 0) historyIdx--;
      input.value = history[history.length - 1 - historyIdx] || '';
      return;
    }

    if (e.key !== 'Enter') return;

    const raw  = input.value.trim();
    input.value = '';
    historyIdx  = -1;

    if (!raw) return;

    history.push(raw);
    printLine(`guest@zenzei:~$ ${raw}`, 'text-dim');

    const [cmd, ...args] = raw.split(/\s+/);

    if (commands[cmd]) {
      commands[cmd](args);
    } else {
      printLine(`${cmd}: command not found`, 'text-pink');
    }
  });

  // Auto-focus the input when the terminal is visible
  setTimeout(() => input.focus(), 50);
}


/* ── b. Nebula Notes ── */
function buildNotes(container) {

  const saved = localStorage.getItem('zenzei-notes') || '';

  container.innerHTML = `
    <div class="notes-app">
      <div class="notes-toolbar">
        <span class="notes-save-indicator" id="notes-status">Unsaved</span>
        <button class="notes-btn-save" id="notes-save-btn">
          <i class="fa-solid fa-floppy-disk"></i> Save
        </button>
      </div>
      <textarea class="notes-textarea" id="notes-text" placeholder="Start typing your cosmic thoughts...">${saved}</textarea>
    </div>
  `;

  const textarea  = container.querySelector('#notes-text');
  const statusEl  = container.querySelector('#notes-status');
  const saveBtn   = container.querySelector('#notes-save-btn');

  // Allow the user to select and type inside the notes
  textarea.style.userSelect = 'text';

  function save() {
    localStorage.setItem('zenzei-notes', textarea.value);
    statusEl.textContent = `Saved at ${new Date().toLocaleTimeString()}`;
  }

  textarea.addEventListener('input', () => {
    statusEl.textContent = 'Unsaved changes';
  });

  saveBtn.addEventListener('click', save);

  // Auto-save on Ctrl+S / Cmd+S
  textarea.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      save();
    }
  });
}


/* ── c. Cosmic Asteroids ── */
function buildAsteroids(container, appId) {

  container.innerHTML = `
    <div class="asteroids-app">
      <canvas class="asteroids-game-canvas" id="asteroids-canvas"></canvas>
      <div class="asteroids-hud">
        <span id="ast-score">Score: 0</span>
        <span id="ast-lives">Lives: ♥ ♥ ♥</span>
        <span id="ast-level">Level: 1</span>
      </div>
      <div class="asteroids-screen" id="asteroids-menu">
        <div class="asteroids-title">⎍ COSMIC ASTEROIDS</div>
        <div class="asteroids-instructions">
          Arrow Keys / WASD — Thrust &amp; Rotate<br>
          Spacebar — Fire<br>
          P — Pause
        </div>
        <button class="btn-galaxy" id="ast-start-btn">
          <i class="fa-solid fa-rocket"></i> Launch Mission
        </button>
      </div>
    </div>
  `;

  const canvas   = container.querySelector('#asteroids-canvas');
  const ctx      = canvas.getContext('2d');
  const menu     = container.querySelector('#asteroids-menu');
  const startBtn = container.querySelector('#ast-start-btn');
  const scoreEl  = container.querySelector('#ast-score');
  const livesEl  = container.querySelector('#ast-lives');
  const levelEl  = container.querySelector('#ast-level');

  // Resize canvas to fill its container
  function resizeCanvas() {
    const parent   = canvas.parentElement;
    canvas.width   = parent.clientWidth;
    canvas.height  = parent.clientHeight;
  }

  resizeCanvas();
  new ResizeObserver(resizeCanvas).observe(canvas.parentElement);

  // ── Game State ──
  const state = {
    running:    false,
    paused:     false,
    score:      0,
    lives:      3,
    level:      1,
    ship:       null,
    bullets:    [],
    asteroids:  [],
    particles:  [],
    keys:       {},
    loopId:     null,
  };

  function createShip() {
    return {
      x:     canvas.width  / 2,
      y:     canvas.height / 2,
      angle: -Math.PI / 2,      // pointing up
      vx:    0,
      vy:    0,
      thrusting:     false,
      invincible:    true,
      invincibleTime: 180,       // frames
    };
  }

  function spawnAsteroids(count) {
    for (let i = 0; i < count; i++) {
      // Spawn away from the ship
      let x, y;
      do {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
      } while (Math.hypot(x - state.ship.x, y - state.ship.y) < 120);

      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * state.level;

      state.asteroids.push({
        x, y,
        vx:     Math.cos(angle) * speed,
        vy:     Math.sin(angle) * speed,
        radius: 35 + Math.random() * 20,
        vertices: 7 + Math.floor(Math.random() * 5),
        offsets:  Array.from({ length: 12 }, () => 0.8 + Math.random() * 0.4),
      });
    }
  }

  function startGame() {
    menu.classList.add('hidden');
    state.score     = 0;
    state.lives     = 3;
    state.level     = 1;
    state.bullets   = [];
    state.particles = [];
    state.asteroids = [];
    state.ship      = createShip();
    spawnAsteroids(4);
    updateHUD();

    state.running = true;
    if (state.loopId) cancelAnimationFrame(state.loopId);
    gameLoop();
  }

  function updateHUD() {
    scoreEl.textContent = `Score: ${state.score}`;
    livesEl.textContent = `Lives: ${'♥ '.repeat(state.lives).trim()}`;
    levelEl.textContent = `Level: ${state.level}`;
  }

  function gameLoop() {
    state.loopId = requestAnimationFrame(gameLoop);

    if (state.paused) return;

    update();
    render();
  }

  // Store loop id so closeWindow can cancel it
  startBtn.addEventListener('click', () => {
    startGame();
    OS.runningApps[appId].gameLoopId = state.loopId;
  });

  // ── Input ──
  container.addEventListener('keydown', e => { state.keys[e.code] = true; });
  container.addEventListener('keyup',   e => { state.keys[e.code] = false; });

  // Also listen globally while this app is active
  function onKeyDown(e) {
    if (OS.activeAppId !== appId) return;
    state.keys[e.code] = true;

    if (e.code === 'Space' && state.running && !state.paused) {
      fireBullet();
      e.preventDefault();
    }

    if (e.code === 'KeyP' && state.running) {
      state.paused = !state.paused;
    }
  }

  function onKeyUp(e) { state.keys[e.code] = false; }

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup',   onKeyUp);

  // Cleanup listeners when window closes
  const origClose = closeWindow;
  // (cleanup is handled via the gameLoopId stored above)

  let lastShot = 0;

  function fireBullet() {
    const now = Date.now();
    if (now - lastShot < 250) return;   // rate-limit
    lastShot = now;

    const ship = state.ship;
    state.bullets.push({
      x:  ship.x + Math.cos(ship.angle) * 16,
      y:  ship.y + Math.sin(ship.angle) * 16,
      vx: Math.cos(ship.angle) * 9 + ship.vx,
      vy: Math.sin(ship.angle) * 9 + ship.vy,
      life: 55,
    });
  }

  // ── Update ──
  function update() {

    const ship = state.ship;
    const DRAG = 0.98;
    const THRUST = 0.25;
    const ROT   = 0.055;

    // Rotate
    if (state.keys['ArrowLeft']  || state.keys['KeyA']) ship.angle -= ROT;
    if (state.keys['ArrowRight'] || state.keys['KeyD']) ship.angle += ROT;

    // Thrust
    ship.thrusting = state.keys['ArrowUp'] || state.keys['KeyW'];
    if (ship.thrusting) {
      ship.vx += Math.cos(ship.angle) * THRUST;
      ship.vy += Math.sin(ship.angle) * THRUST;
    }

    // Speed limit
    const speed = Math.hypot(ship.vx, ship.vy);
    if (speed > 7) {
      ship.vx = (ship.vx / speed) * 7;
      ship.vy = (ship.vy / speed) * 7;
    }

    ship.vx *= DRAG;
    ship.vy *= DRAG;

    ship.x = (ship.x + ship.vx + canvas.width)  % canvas.width;
    ship.y = (ship.y + ship.vy + canvas.height)  % canvas.height;

    // Invincibility timer
    if (ship.invincible) {
      ship.invincibleTime--;
      if (ship.invincibleTime <= 0) ship.invincible = false;
    }

    // Bullets
    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const b = state.bullets[i];
      b.x    = (b.x + b.vx + canvas.width)  % canvas.width;
      b.y    = (b.y + b.vy + canvas.height) % canvas.height;
      b.life--;
      if (b.life <= 0) state.bullets.splice(i, 1);
    }

    // Asteroids
    for (const a of state.asteroids) {
      a.x = (a.x + a.vx + canvas.width)  % canvas.width;
      a.y = (a.y + a.vy + canvas.height) % canvas.height;
    }

    // Bullet–Asteroid collisions
    for (let bi = state.bullets.length - 1; bi >= 0; bi--) {
      const b = state.bullets[bi];
      for (let ai = state.asteroids.length - 1; ai >= 0; ai--) {
        const a = state.asteroids[ai];
        if (Math.hypot(b.x - a.x, b.y - a.y) < a.radius) {
          state.bullets.splice(bi, 1);

          // Spawn particles
          for (let p = 0; p < 8; p++) {
            const ang = Math.random() * Math.PI * 2;
            state.particles.push({
              x:     a.x,
              y:     a.y,
              vx:    Math.cos(ang) * (1 + Math.random() * 3),
              vy:    Math.sin(ang) * (1 + Math.random() * 3),
              life:  30 + Math.random() * 20,
              alpha: 1,
            });
          }

          // Split if large enough
          if (a.radius > 18) {
            for (let k = 0; k < 2; k++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 1.5 + Math.random() * state.level;
              state.asteroids.push({
                x:        a.x,
                y:        a.y,
                vx:       Math.cos(ang) * spd,
                vy:       Math.sin(ang) * spd,
                radius:   a.radius * 0.55,
                vertices: 6 + Math.floor(Math.random() * 4),
                offsets:  Array.from({ length: 12 }, () => 0.8 + Math.random() * 0.4),
              });
            }
            state.score += 20;
          } else {
            state.score += 50;
          }

          state.asteroids.splice(ai, 1);
          updateHUD();
          break;
        }
      }
    }

    // Ship–Asteroid collision
    if (!ship.invincible) {
      for (const a of state.asteroids) {
        if (Math.hypot(ship.x - a.x, ship.y - a.y) < a.radius + 10) {
          state.lives--;
          updateHUD();

          if (state.lives <= 0) {
            endGame();
            return;
          }

          // Respawn ship
          state.ship = createShip();
          return;
        }
      }
    }

    // Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x    += p.vx;
      p.y    += p.vy;
      p.life--;
      p.alpha = p.life / 50;
      if (p.life <= 0) state.particles.splice(i, 1);
    }

    // Next level when all asteroids cleared
    if (state.asteroids.length === 0) {
      state.level++;
      spawnAsteroids(3 + state.level);
      state.score += 100;
      updateHUD();
    }
  }

  function endGame() {
    state.running = false;
    cancelAnimationFrame(state.loopId);

    menu.classList.remove('hidden');
    menu.innerHTML = `
      <div class="asteroids-title">GAME OVER</div>
      <p style="font-size:1.1rem;margin:10px 0;color:var(--neon-cyan)">Score: ${state.score}</p>
      <p style="font-size:0.8rem;color:var(--starlight-dim);margin-bottom:20px">Level reached: ${state.level}</p>
      <button class="btn-galaxy" id="ast-start-btn">
        <i class="fa-solid fa-rotate-right"></i> Try Again
      </button>
    `;

    menu.querySelector('#ast-start-btn').addEventListener('click', startGame);
  }

  // ── Render ──
  function render() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ship = state.ship;

    // Ship
    const blinkVisible = !ship.invincible || Math.floor(Date.now() / 100) % 2 === 0;

    if (blinkVisible) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);

      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth   = 2;
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur  = 8;

      ctx.beginPath();
      ctx.moveTo(16,  0);
      ctx.lineTo(-10,  8);
      ctx.lineTo(-6,  0);
      ctx.lineTo(-10, -8);
      ctx.closePath();
      ctx.stroke();

      // Thruster flame
      if (ship.thrusting) {
        ctx.strokeStyle = '#ff7f00';
        ctx.shadowColor = '#ff7f00';
        ctx.beginPath();
        ctx.moveTo(-6,  3);
        ctx.lineTo(-16 - Math.random() * 6, 0);
        ctx.lineTo(-6, -3);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Asteroids
    for (const a of state.asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.strokeStyle = '#a985ff';
      ctx.lineWidth   = 2;
      ctx.shadowColor = '#a985ff';
      ctx.shadowBlur  = 6;

      ctx.beginPath();
      for (let v = 0; v < a.vertices; v++) {
        const ang = (v / a.vertices) * Math.PI * 2;
        const r   = a.radius * a.offsets[v % a.offsets.length];
        const px  = Math.cos(ang) * r;
        const py  = Math.sin(ang) * r;
        v === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    // Bullets
    for (const b of state.bullets) {
      ctx.save();
      ctx.fillStyle   = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur  = 10;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Particles
    for (const p of state.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = '#ffd700';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}


/* ── d. Stellar Draw ── */
function buildDraw(container) {

  container.innerHTML = `
    <div class="draw-app">

      <div class="draw-sidebar">

        <div class="draw-tool-item">
          <input type="color" class="draw-color-picker" id="draw-color" value="#00f3ff" title="Brush Colour" />
        </div>

        <div class="draw-tool-item">
          <div class="draw-brush-icon active-tool" id="draw-tool-brush" title="Brush">
            <i class="fa-solid fa-paintbrush"></i>
          </div>
        </div>

        <div class="draw-tool-item">
          <div class="draw-brush-icon" id="draw-tool-eraser" title="Eraser">
            <i class="fa-solid fa-eraser"></i>
          </div>
        </div>

        <div class="draw-tool-item">
          <input
            type="range"
            class="draw-size-slider"
            id="draw-size"
            min="1" max="40" value="6"
            title="Brush Size"
          />
        </div>

        <div class="draw-tool-item">
          <div class="draw-btn-clear" id="draw-clear" title="Clear Canvas">
            <i class="fa-solid fa-trash"></i>
          </div>
        </div>

        <div class="draw-tool-item">
          <div class="draw-btn-save" id="draw-save" title="Download as PNG">
            <i class="fa-solid fa-download"></i>
          </div>
        </div>

      </div>

      <div class="draw-canvas-container" id="draw-canvas-container">
        <canvas class="draw-canvas" id="draw-canvas"></canvas>
      </div>

    </div>
  `;

  const canvas    = container.querySelector('#draw-canvas');
  const ctx       = canvas.getContext('2d');
  const colorPick = container.querySelector('#draw-color');
  const sizePick  = container.querySelector('#draw-size');
  const brushBtn  = container.querySelector('#draw-tool-brush');
  const eraserBtn = container.querySelector('#draw-tool-eraser');
  const clearBtn  = container.querySelector('#draw-clear');
  const saveBtn   = container.querySelector('#draw-save');

  let tool     = 'brush';
  let painting = false;
  let lastX    = 0;
  let lastY    = 0;

  function resizeCanvas() {
    const parent = canvas.parentElement;
    // Preserve existing drawing across resizes
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width  = parent.clientWidth;
    canvas.height = parent.clientHeight;
    ctx.putImageData(imgData, 0, 0);
  }

  resizeCanvas();
  new ResizeObserver(resizeCanvas).observe(canvas.parentElement);

  // Fill with dark background so the first save looks good
  ctx.fillStyle = '#020205';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  function startDraw(e) {
    painting = true;
    const { x, y } = getPos(e);
    lastX = x;
    lastY = y;
  }

  function draw(e) {
    if (!painting) return;
    e.preventDefault();

    const { x, y } = getPos(e);

    ctx.lineWidth   = parseInt(sizePick.value, 10);
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#020205' : colorPick.value;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
  }

  function stopDraw() { painting = false; }

  canvas.addEventListener('mousedown',  startDraw);
  canvas.addEventListener('mousemove',  draw);
  canvas.addEventListener('mouseup',    stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);

  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove',  draw,       { passive: false });
  canvas.addEventListener('touchend',   stopDraw);

  brushBtn.addEventListener('click', () => {
    tool = 'brush';
    brushBtn.classList.add('active-tool');
    eraserBtn.classList.remove('active-tool');
  });

  eraserBtn.addEventListener('click', () => {
    tool = 'eraser';
    eraserBtn.classList.add('active-tool');
    brushBtn.classList.remove('active-tool');
  });

  clearBtn.addEventListener('click', () => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#020205';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });

  saveBtn.addEventListener('click', () => {
    const link    = document.createElement('a');
    link.download = `stellar-draw-${Date.now()}.png`;
    link.href     = canvas.toDataURL('image/png');
    link.click();
  });
}


/* ── e. Space Explorer ── */
function buildExplorer(container) {

  // Data for each celestial entry
  const entries = [
    {
      id:    'mercury',
      label: 'Mercury',
      color: '#b5a59a',
      description: 'The smallest planet in our solar system and closest to the Sun. A year on Mercury lasts just 88 Earth days, yet a single day stretches nearly 59 Earth days.',
      data: [
        ['Type',        'Rocky planet'],
        ['Distance',    '77 million km (min from Earth)'],
        ['Diameter',    '4,879 km'],
        ['Moons',       '0'],
        ['Orbit period','88 Earth days'],
        ['Surface',     '-180 °C to 430 °C'],
      ],
    },
    {
      id:    'venus',
      label: 'Venus',
      color: '#e8c97e',
      description: 'Often called Earth\'s twin due to similar size, Venus hides beneath a thick toxic atmosphere. It is the hottest planet in the solar system, averaging 465 °C.',
      data: [
        ['Type',        'Rocky planet'],
        ['Distance',    '38 million km (min from Earth)'],
        ['Diameter',    '12,104 km'],
        ['Moons',       '0'],
        ['Orbit period','225 Earth days'],
        ['Surface',     '~465 °C (avg)'],
      ],
    },
    {
      id:    'earth',
      label: 'Earth',
      color: '#4a9fe0',
      description: 'Our home — the only known world teeming with life. Earth\'s magnetic field and atmosphere protect us from harmful solar radiation.',
      data: [
        ['Type',        'Rocky planet'],
        ['Distance',    '0 km (home)'],
        ['Diameter',    '12,742 km'],
        ['Moons',       '1'],
        ['Orbit period','365.25 days'],
        ['Surface',     '-88 °C to 58 °C'],
      ],
    },
    {
      id:    'mars',
      label: 'Mars',
      color: '#c1440e',
      description: 'The Red Planet — home to Olympus Mons, the tallest volcano in the solar system. Scientists believe liquid water once flowed across its surface.',
      data: [
        ['Type',        'Rocky planet'],
        ['Distance',    '55 million km (min from Earth)'],
        ['Diameter',    '6,779 km'],
        ['Moons',       '2 (Phobos, Deimos)'],
        ['Orbit period','687 Earth days'],
        ['Surface',     '-60 °C avg'],
      ],
    },
    {
      id:    'jupiter',
      label: 'Jupiter',
      color: '#c88b3a',
      description: 'A gas giant so massive it could swallow all other planets combined. Its Great Red Spot is a storm that has raged for at least 350 years.',
      data: [
        ['Type',        'Gas giant'],
        ['Distance',    '588 million km (min from Earth)'],
        ['Diameter',    '139,820 km'],
        ['Moons',       '95 (known)'],
        ['Orbit period','11.9 Earth years'],
        ['Composition', 'H₂, He, CH₄, NH₃'],
      ],
    },
    {
      id:    'saturn',
      label: 'Saturn',
      color: '#e4d191',
      description: 'Ringed jewel of the solar system. Saturn\'s rings are made of ice and rock, stretching up to 282,000 km from the planet\'s centre.',
      data: [
        ['Type',        'Gas giant'],
        ['Distance',    '1.2 billion km (min from Earth)'],
        ['Diameter',    '116,460 km'],
        ['Moons',       '146 (known)'],
        ['Orbit period','29.5 Earth years'],
        ['Ring width',  'Up to 282,000 km'],
      ],
    },
  ];

  // Build sidebar HTML
  const sidebarItems = entries
    .map(e => `<div class="explorer-list-item${e.id === 'earth' ? ' active-item' : ''}" data-entry="${e.id}">${e.label}</div>`)
    .join('');

  container.innerHTML = `
    <div class="explorer-app">
      <div class="explorer-list">${sidebarItems}</div>
      <div class="explorer-details" id="explorer-details"></div>
    </div>
  `;

  function renderEntry(entry) {
    const detailsEl = container.querySelector('#explorer-details');

    const rows = entry.data
      .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
      .join('');

    detailsEl.innerHTML = `
      <div class="explorer-hero" style="background: radial-gradient(circle at 40% 50%, ${entry.color}33 0%, #06060c 70%);">
        <div class="explorer-hero-title" style="color:${entry.color}">${entry.label.toUpperCase()}</div>
      </div>
      <div class="explorer-title" style="color:${entry.color}">${entry.label}</div>
      <div class="explorer-desc">${entry.description}</div>
      <table class="explorer-meta-table"><tbody>${rows}</tbody></table>
    `;
  }

  // Wire up sidebar clicks
  container.querySelectorAll('.explorer-list-item').forEach(item => {
    item.addEventListener('click', () => {
      container.querySelectorAll('.explorer-list-item').forEach(i => i.classList.remove('active-item'));
      item.classList.add('active-item');
      const entry = entries.find(e => e.id === item.dataset.entry);
      if (entry) renderEntry(entry);
    });
  });

  // Render the default entry
  renderEntry(entries.find(e => e.id === 'earth'));
}


/* ── f. Orion Settings ── */
function buildSettings(container) {

  const wallpapers = [
    { id: 'default',  label: 'Default',    bg: 'radial-gradient(circle at 80% 20%, rgba(72,20,139,0.5) 0%, #05050b 60%), radial-gradient(circle at 20% 80%, rgba(112,16,163,0.5) 0%, #05050b 70%)' },
    { id: 'aurora',   label: 'Aurora',     bg: 'linear-gradient(135deg, #001a1f 0%, #003d2e 40%, #00613f 100%)' },
    { id: 'crimson',  label: 'Crimson',    bg: 'linear-gradient(135deg, #1a0005 0%, #5b0010 50%, #8b0020 100%)' },
    { id: 'midnight', label: 'Midnight',   bg: 'linear-gradient(135deg, #000010 0%, #001040 50%, #002070 100%)' },
    { id: 'solar',    label: 'Solar Wind', bg: 'linear-gradient(135deg, #0a0000 0%, #3d0e00 40%, #7a2600 100%)' },
  ];

  const thumbs = wallpapers
    .map(w => `
      <div class="wallpaper-card${w.id === 'default' ? ' active-wallpaper' : ''}"
           data-wp="${w.id}"
           style="background: ${w.bg};">
        <span>${w.label}</span>
      </div>
    `)
    .join('');

  container.innerHTML = `
    <div class="settings-app">

      <div class="settings-section">
        <div class="settings-heading">🎨 Appearance</div>
        <div class="settings-wallpaper-grid">${thumbs}</div>
      </div>

      <div class="settings-section">
        <div class="settings-heading">🔊 System Audio</div>
        <div class="settings-row">
          <span>System Sounds</span>
          <label class="settings-toggle">
            <input type="checkbox" id="setting-sound" ${OS.soundEnabled ? 'checked' : ''} />
            <span class="slider-switch"></span>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-heading">✨ Effects</div>
        <div class="settings-row">
          <span>Starfield Animation</span>
          <label class="settings-toggle">
            <input type="checkbox" id="setting-starfield" ${OS.starfieldActive ? 'checked' : ''} />
            <span class="slider-switch"></span>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-heading">ℹ️ System Information</div>
        <div class="settings-row"><span>OS Name</span>      <span class="text-cyan">ZenZei OS 1.0</span></div>
        <div class="settings-row"><span>Edition</span>      <span class="text-cyan">Celestial</span></div>
        <div class="settings-row"><span>Kernel</span>       <span class="text-cyan">WebKit Warp-9</span></div>
        <div class="settings-row"><span>Architecture</span> <span class="text-cyan">x86_64 (Browser)</span></div>
        <div class="settings-row"><span>Build</span>        <span class="text-cyan" id="build-date"></span></div>
      </div>

    </div>
  `;

  // Build date
  container.querySelector('#build-date').textContent = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Wallpaper switcher
  const nebula = document.getElementById('nebula-overlay');

  container.querySelectorAll('.wallpaper-card').forEach(card => {
    card.addEventListener('click', () => {
      container.querySelectorAll('.wallpaper-card').forEach(c => c.classList.remove('active-wallpaper'));
      card.classList.add('active-wallpaper');

      const wp = wallpapers.find(w => w.id === card.dataset.wp);
      if (wp && nebula) {
        nebula.style.background = wp.bg;
        nebula.style.opacity    = '0.6';
      }
    });
  });

  // Sound toggle
  container.querySelector('#setting-sound').addEventListener('change', e => {
    OS.soundEnabled = e.target.checked;
    OS.soundVolume  = OS.soundEnabled ? 0.5 : 0;
    const icon = document.querySelector('#tray-audio i');
    if (icon) icon.className = OS.soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
  });

  // Starfield toggle
  container.querySelector('#setting-starfield').addEventListener('change', e => {
    OS.starfieldActive = e.target.checked;
    const canvas = document.getElementById('starfield');
    if (canvas) canvas.style.opacity = OS.starfieldActive ? '1' : '0';
  });
}


/* ============================================================
   9. AUDIO ENGINE
   Synthesises all UI sounds procedurally with the Web Audio API.
============================================================ */
function initAudioContext() {

  if (OS.audioCtx) return;

  const AudioAPI = window.AudioContext || window.webkitAudioContext;
  if (AudioAPI) OS.audioCtx = new AudioAPI();
}

function playSystemSound(type) {

  if (!OS.soundEnabled) return;
  if (!OS.audioCtx)     return;

  if (OS.audioCtx.state === 'suspended') OS.audioCtx.resume();

  const ctx  = OS.audioCtx;
  const now  = ctx.currentTime;

  const master      = ctx.createGain();
  master.gain.value = OS.soundVolume;
  master.connect(ctx.destination);

  switch (type) {

    // Short click (UI interaction)
    case 'click': {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain); gain.connect(master);
      osc.start(now); osc.stop(now + 0.06);
      break;
    }

    // Boot-up chime (layered harmonics)
    case 'boot': {
      const root     = 146.83;
      const duration = 2;
      [1, 1.5, 2, 2.5, 3].forEach((mult, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i === 0 ? 'sawtooth' : 'sine';
        osc.frequency.value = root * mult;

        if (i === 0) {
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(100, now);
          filter.frequency.exponentialRampToValueAtTime(400, now + duration);
          osc.connect(filter); filter.connect(gain);
        } else {
          osc.connect(gain);
        }

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06 / 5, now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        gain.connect(master);
        osc.start(now); osc.stop(now + duration);
      });
      break;
    }

    // App open (rising tone)
    case 'open': {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 440;
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.18);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain); gain.connect(master);
      osc.start(now); osc.stop(now + 0.18);
      break;
    }

    // Shutdown (descending hum)
    case 'shutdown': {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 1.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain); gain.connect(master);
      osc.start(now); osc.stop(now + 1.2);
      break;
    }

    // Alert (double blip)
    case 'alert': {
      [0, 0.15].forEach(delay => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        const t    = now + delay;
        osc.type = 'triangle';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain); gain.connect(master);
        osc.start(t); osc.stop(t + 0.12);
      });
      break;
    }

  }
}


/* ============================================================
   10. UTILITY HELPERS
============================================================ */

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Clamps a value between lo and hi.
 */
function clamp(value, lo, hi) {
  return Math.max(lo, Math.min(hi, value));
}};

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
