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
      s.x     += s.vx;
      s.y     += s.vy;
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
    ██║   ███████╗██║ ╚███║  ██║   ███████╗██║
    ╚═╝   ╚══════╝╚═╝  ╚══╝  ╚═╝   ╚══════╝╚═╝
  </span>`);
  printLine('ZenZei OS Terminal v1.0   type "help" for commands.');
  printLine('');

  // Command definitions
  const commands = {

    help() {
      printLine('Available commands:');
      printLine('  help        — show this list');
      printLine('  clear       — clear the terminal');
      printLine('  date        — print current date & time');
      printLine('  whoami      — display current user');
      printLine('  uname       — system information');
      printLine('  ls          — list virtual files');
      printLine('  echo <msg>  — print a message');
      printLine('  uptime      — time since boot');
      printLine('  apps        — list installed apps');
      printLine('  open <app>  — launch an app');
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

    const raw   = input.value.trim();
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
      x:              canvas.width  / 2,
      y:              canvas.height / 2,
      angle:          -Math.PI / 2,      // pointing up
      vx:             0,
      vy:             0,
      thrusting:      false,
      invincible:     true,
      invincibleTime: 180,               // frames
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
        vx:       Math.cos(angle) * speed,
        vy:       Math.sin(angle) * speed,
        radius:   35 + Math.random() * 20,
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
    livesEl.textContent = `Lives: ${'♥ '.repeat(Math.max(0, state.lives)).trim()}`;
    levelEl.textContent = `Level: ${state.level}`;
  }

  // Key controls
  const handleKeyDown = e => {
    if (OS.activeAppId !== appId) return;
    state.keys[e.code] = true;

    if (e.code === 'KeyP' && state.running) {
      state.paused = !state.paused;
    }

    if (e.code === 'Space' && state.running && !state.paused) {
      // Fire bullet
      const noseX = state.ship.x + Math.cos(state.ship.angle) * 15;
      const noseY = state.ship.y + Math.sin(state.ship.angle) * 15;
      state.bullets.push({
        x: noseX,
        y: noseY,
        vx: state.ship.vx + Math.cos(state.ship.angle) * 7,
        vy: state.ship.vy + Math.sin(state.ship.angle) * 7,
        life: 60,
      });
      playSystemSound('laser');
    }
  };

  const handleKeyUp = e => {
    state.keys[e.code] = false;
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  // Store cleanup listener for when window closes
  if (OS.runningApps[appId]) {
    OS.runningApps[appId].gameLoopId = state.loopId;
  }

  startBtn.addEventListener('click', startGame);

  function explode(x, y, count = 15, color = '#ff0055') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
      });
    }
  }

  function update() {
    const ship = state.ship;

    // Ship Rotation
    if (state.keys['ArrowLeft'] || state.keys['KeyA']) ship.angle -= 0.08;
    if (state.keys['ArrowRight'] || state.keys['KeyD']) ship.angle += 0.08;

    // Ship Thrust
    ship.thrusting = state.keys['ArrowUp'] || state.keys['KeyW'];
    if (ship.thrusting) {
      ship.vx += Math.cos(ship.angle) * 0.15;
      ship.vy += Math.sin(ship.angle) * 0.15;

      // Exhaust particles
      state.particles.push({
        x: ship.x - Math.cos(ship.angle) * 12,
        y: ship.y - Math.sin(ship.angle) * 12,
        vx: -Math.cos(ship.angle) * 2 + (Math.random() - 0.5),
        vy: -Math.sin(ship.angle) * 2 + (Math.random() - 0.5),
        alpha: 0.8,
        color: '#00f3ff',
      });
    }

    // Drag / Friction
    ship.vx *= 0.985;
    ship.vy *= 0.985;

    // Move Ship
    ship.x += ship.vx;
    ship.y += ship.vy;

    // Screen Wrap (Ship)
    if (ship.x < 0) ship.x = canvas.width;
    if (ship.x > canvas.width) ship.x = 0;
    if (ship.y < 0) ship.y = canvas.height;
    if (ship.y > canvas.height) ship.y = 0;

    if (ship.invincibleTime > 0) ship.invincibleTime--;

    // Update Bullets
    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const b = state.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      if (b.x < 0) b.x = canvas.width;
      if (b.x > canvas.width) b.x = 0;
      if (b.y < 0) b.y = canvas.height;
      if (b.y > canvas.height) b.y = 0;

      if (b.life <= 0) state.bullets.splice(i, 1);
    }

    // Update Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.02;
      if (p.alpha <= 0) state.particles.splice(i, 1);
    }

    // Update Asteroids & Collisions
    for (let i = state.asteroids.length - 1; i >= 0; i--) {
      const a = state.asteroids[i];
      a.x += a.vx;
      a.y += a.vy;

      if (a.x < -a.radius) a.x = canvas.width + a.radius;
      if (a.x > canvas.width + a.radius) a.x = -a.radius;
      if (a.y < -a.radius) a.y = canvas.height + a.radius;
      if (a.y > canvas.height + a.radius) a.y = -a.radius;

      // Bullet - Asteroid Collision
      for (let j = state.bullets.length - 1; j >= 0; j--) {
        const b = state.bullets[j];
        if (Math.hypot(b.x - a.x, b.y - a.y) < a.radius) {
          explode(a.x, a.y, 12, '#ffb700');
          playSystemSound('explosion');

          state.score += Math.floor(100 / a.radius * 10);
          state.bullets.splice(j, 1);

          // Split Asteroid
          if (a.radius > 18) {
            for (let k = 0; k < 2; k++) {
              const angle = Math.random() * Math.PI * 2;
              state.asteroids.push({
                x: a.x, y: a.y,
                vx: Math.cos(angle) * (1.5 + state.level),
                vy: Math.sin(angle) * (1.5 + state.level),
                radius: a.radius / 2,
                vertices: 6,
                offsets: Array.from({ length: 12 }, () => 0.8 + Math.random() * 0.4),
              });
            }
          }

          state.asteroids.splice(i, 1);
          updateHUD();
          break;
        }
      }

      // Ship - Asteroid Collision
      if (ship.invincibleTime <= 0 && Math.hypot(ship.x - a.x, ship.y - a.y) < a.radius + 10) {
        explode(ship.x, ship.y, 25, '#ff0055');
        playSystemSound('explosion');
        state.lives--;
        updateHUD();

        if (state.lives <= 0) {
          state.running = false;
          menu.classList.remove('hidden');
          menu.querySelector('.asteroids-title').textContent = 'GAME OVER';
          return;
        } else {
          state.ship = createShip();
        }
      }
    }

    // Level Cleared
    if (state.asteroids.length === 0) {
      state.level++;
      spawnAsteroids(4 + state.level * 2);
      updateHUD();
    }
  }

  function render() {
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render Ship
    const ship = state.ship;
    if (state.running && (ship.invincibleTime % 10 < 5)) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-10, -10);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-10, 10);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    // Render Bullets
    ctx.fillStyle = '#ff0055';
    for (const b of state.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render Asteroids
    ctx.strokeStyle = '#b8c7e0';
    ctx.lineWidth = 1.5;
    for (const a of state.asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.beginPath();
      for (let i = 0; i < a.vertices; i++) {
        const angle = (i / a.vertices) * Math.PI * 2;
        const r = a.radius * (a.offsets[i] || 1);
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    // Render Particles
    for (const p of state.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  function gameLoop() {
    if (!state.running) return;
    state.loopId = requestAnimationFrame(gameLoop);
    if (!state.paused) {
      update();
      render();
    }
  }
}


/* ── d. Stellar Draw ── */
function buildDraw(container) {
  container.innerHTML = `
    <div class="draw-app" style="display:flex; flex-direction:column; height:100%; background:#0a0a10;">
      <div class="draw-toolbar" style="padding:8px; display:flex; gap:10px; background:#12121c; border-bottom:1px solid rgba(255,255,255,0.1); align-items:center;">
        <input type="color" id="draw-color" value="#00f3ff" style="border:none; background:none; width:28px; height:28px; cursor:pointer;" />
        <input type="range" id="draw-size" min="1" max="50" value="4" style="width:100px;" />
        <button id="draw-clear" class="notes-btn-save"><i class="fa-solid fa-trash"></i> Clear</button>
      </div>
      <canvas id="draw-canvas" style="flex:1; cursor:crosshair;"></canvas>
    </div>
  `;

  const canvas = container.querySelector('#draw-canvas');
  const ctx = canvas.getContext('2d');
  const colorPicker = container.querySelector('#draw-color');
  const sizePicker = container.querySelector('#draw-size');
  const clearBtn = container.querySelector('#draw-clear');

  function resize() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
  }
  resize();
  new ResizeObserver(resize).observe(canvas.parentElement);

  let drawing = false;

  canvas.addEventListener('mousedown', e => {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  });

  canvas.addEventListener('mousemove', e => {
    if (!drawing) return;
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = sizePicker.value;
    ctx.lineCap = 'round';
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  });

  window.addEventListener('mouseup', () => drawing = false);
  clearBtn.addEventListener('click', () => ctx.clearRect(0, 0, canvas.width, canvas.height));
}


/* ── e. Space Explorer ── */
function buildExplorer(container) {
  const fs = {
    'Documents': ['Mission_Log_042.txt', 'Orbit_Coordinates.csv', 'Shield_Specs.pdf'],
    'Downloads': ['Cosmic_Symphony.mp3', 'Star_Chart_v2.png'],
    'Pictures': ['Nebula_Alpha.jpg', 'Deep_Space_9.png'],
    'Music': ['Solar_Winds.wav']
  };

  container.innerHTML = `
    <div style="display:flex; height:100%; color:#fff; font-family:sans-serif;">
      <div style="width:150px; background:#0d0d16; border-right:1px solid rgba(255,255,255,0.1); padding:10px;">
        <div style="font-size:0.8rem; color:#888; margin-bottom:10px;">FOLDERS</div>
        ${Object.keys(fs).map(folder => `<div class="explorer-folder" style="padding:6px; cursor:pointer; font-size:0.9rem;" data-folder="${folder}"><i class="fa-solid fa-folder" style="color:#00f3ff; margin-right:6px;"></i>${folder}</div>`).join('')}
      </div>
      <div style="flex:1; padding:15px; background:#05050a;" id="explorer-files">
        <div style="color:#888;">Select a folder to inspect...</div>
      </div>
    </div>
  `;

  const fileArea = container.querySelector('#explorer-files');
  container.querySelectorAll('.explorer-folder').forEach(el => {
    el.addEventListener('click', () => {
      const folder = el.dataset.folder;
      fileArea.innerHTML = `
        <h4 style="margin-top:0; color:#00f3ff;">${folder}</h4>
        <div style="display:flex; gap:15px; flex-wrap:wrap;">
          ${fs[folder].map(file => `
            <div style="width:80px; text-align:center; font-size:0.8rem;">
              <i class="fa-solid fa-file" style="font-size:2rem; color:#b8c7e0; margin-bottom:5px;"></i>
              <div style="word-break:break-word;">${file}</div>
            </div>
          `).join('')}
        </div>
      `;
    });
  });
}


/* ── f. Orion Control (Settings) ── */
function buildSettings(container) {
  container.innerHTML = `
    <div style="padding:20px; color:#fff; font-family:sans-serif;">
      <h3 style="margin-top:0; color:#00f3ff;">Orion Control Settings</h3>
      <div style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
        <span>Starfield Background</span>
        <input type="checkbox" id="set-starfield" ${OS.starfieldActive ? 'checked' : ''} />
      </div>
      <div style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
        <span>System Sound Effects</span>
        <input type="checkbox" id="set-sound" ${OS.soundEnabled ? 'checked' : ''} />
      </div>
    </div>
  `;

  container.querySelector('#set-starfield').addEventListener('change', e => {
    OS.starfieldActive = e.target.checked;
  });

  container.querySelector('#set-sound').addEventListener('change', e => {
    OS.soundEnabled = e.target.checked;
    OS.soundVolume = OS.soundEnabled ? 0.5 : 0;
  });
}


/* ============================================================
   9. AUDIO ENGINE
   Web Audio API sound generator for system audio effects.
============================================================ */
function initAudioContext() {
  if (!OS.audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) OS.audioCtx = new AudioCtx();
  }
}

function playSystemSound(type) {
  if (!OS.soundEnabled || !OS.audioCtx) return;

  const ctx = OS.audioCtx;
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  switch (type) {
    case 'click':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05 * OS.soundVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;

    case 'open':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
      gain.gain.setValueAtTime(0.1 * OS.soundVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
      break;

    case 'boot':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.6);
      gain.gain.setValueAtTime(0.15 * OS.soundVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
      break;

    case 'laser':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.1 * OS.soundVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;

    case 'explosion':
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
      gain.gain.setValueAtTime(0.2 * OS.soundVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;

    case 'shutdown':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.8);
      gain.gain.setValueAtTime(0.15 * OS.soundVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
      break;
  }
}


/* ============================================================
   10. UTILITY HELPERS
============================================================ */
/** Utility wrapper for safely fetching elements */
function $(id) {
  return document.getElementById(id);
}
