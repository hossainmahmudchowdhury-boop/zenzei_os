// Key controls
  function handleKeyDown(e) {
    if (!state.running) return;
    if (e.key === 'p' || e.key === 'P') {
      state.paused = !state.paused;
      return;
    }
    state.keys[e.code] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      fireBullet();
    }
  }

  function handleKeyUp(e) {
    state.keys[e.code] = false;
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  function fireBullet() {
    if (!state.ship || state.paused) return;
    playSystemSound('laser');
    state.bullets.push({
      x: state.ship.x + Math.cos(state.ship.angle) * 15,
      y: state.ship.y + Math.sin(state.ship.angle) * 15,
      vx: state.ship.vx + Math.cos(state.ship.angle) * 8,
      vy: state.ship.vy + Math.sin(state.ship.angle) * 8,
      life: 50,
    });
  }

  function gameLoop() {
    if (!state.running) return;

    if (!state.paused) {
      updateGame();
      renderGame();
    }

    state.loopId = requestAnimationFrame(gameLoop);
    if (OS.runningApps[appId]) {
      OS.runningApps[appId].gameLoopId = state.loopId;
    }
  }

  function updateGame() {
    const ship = state.ship;
    if (!ship) return;

    // Rotation
    if (state.keys['ArrowLeft'] || state.keys['KeyA']) ship.angle -= 0.08;
    if (state.keys['ArrowRight'] || state.keys['KeyD']) ship.angle += 0.08;

    // Thrust
    if (state.keys['ArrowUp'] || state.keys['KeyW']) {
      ship.vx += Math.cos(ship.angle) * 0.15;
      ship.vy += Math.sin(ship.angle) * 0.15;
      // Thrust particles
      state.particles.push({
        x: ship.x - Math.cos(ship.angle) * 12,
        y: ship.y - Math.sin(ship.angle) * 12,
        vx: -Math.cos(ship.angle) * 2 + (Math.random() - 0.5),
        vy: -Math.sin(ship.angle) * 2 + (Math.random() - 0.5),
        life: 15,
        color: '#00f3ff',
      });
    }

    // Drag / Friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;

    // Update position
    ship.x += ship.vx;
    ship.y += ship.vy;

    // Screen wrap
    if (ship.x < 0) ship.x = canvas.width;
    if (ship.x > canvas.width) ship.x = 0;
    if (ship.y < 0) ship.y = canvas.height;
    if (ship.y > canvas.height) ship.y = 0;

    if (ship.invincible) {
      ship.invincibleTime--;
      if (ship.invincibleTime <= 0) ship.invincible = false;
    }

    // Bullets update
    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const b = state.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height || b.life <= 0) {
        state.bullets.splice(i, 1);
        continue;
      }

      // Check collision with asteroids
      for (let j = state.asteroids.length - 1; j >= 0; j--) {
        const ast = state.asteroids[j];
        if (Math.hypot(b.x - ast.x, b.y - ast.y) < ast.radius) {
          // Explosion particles
          createExplosion(ast.x, ast.y, ast.radius);
          playSystemSound('explosion');

          // Split asteroid if big enough
          if (ast.radius > 20) {
            for (let k = 0; k < 2; k++) {
              const newAngle = Math.random() * Math.PI * 2;
              state.asteroids.push({
                x: ast.x,
                y: ast.y,
                vx: Math.cos(newAngle) * (1.5 + Math.random() * state.level),
                vy: Math.sin(newAngle) * (1.5 + Math.random() * state.level),
                radius: ast.radius / 2,
                vertices: 6,
                offsets: Array.from({ length: 12 }, () => 0.8 + Math.random() * 0.4),
              });
            }
          }

          state.score += Math.floor(1000 / ast.radius);
          state.asteroids.splice(j, 1);
          state.bullets.splice(i, 1);
          updateHUD();
          break;
        }
      }
    }

    // Asteroids move & wrap
    for (const ast of state.asteroids) {
      ast.x += ast.vx;
      ast.y += ast.vy;

      if (ast.x < 0) ast.x = canvas.width;
      if (ast.x > canvas.width) ast.x = 0;
      if (ast.y < 0) ast.y = canvas.height;
      if (ast.y > canvas.height) ast.y = 0;

      // Ship collision
      if (!ship.invincible) {
        if (Math.hypot(ship.x - ast.x, ship.y - ast.y) < ast.radius + 10) {
          createExplosion(ship.x, ship.y, 30);
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
    }

    // Particles update
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) state.particles.splice(i, 1);
    }

    // Level clear check
    if (state.asteroids.length === 0) {
      state.level++;
      spawnAsteroids(3 + state.level);
      updateHUD();
    }
  }

  function createExplosion(x, y, size) {
    for (let i = 0; i < size; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4;
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 20 + Math.random() * 20,
        color: ['#ff0055', '#00f3ff', '#ffb700'][Math.floor(Math.random() * 3)],
      });
    }
  }

  function renderGame() {
    ctx.fillStyle = '#030308';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render Particles
    for (const p of state.particles) {
      ctx.fillStyle = p.color || '#00f3ff';
      ctx.globalAlpha = p.life / 30;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Render Bullets
    ctx.fillStyle = '#00f3ff';
    for (const b of state.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render Asteroids
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 1.5;
    for (const ast of state.asteroids) {
      ctx.beginPath();
      for (let i = 0; i < ast.vertices; i++) {
        const angle = (i / ast.vertices) * Math.PI * 2;
        const r = ast.radius * (ast.offsets[i] || 1);
        const x = ast.x + Math.cos(angle) * r;
        const y = ast.y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Render Ship
    const ship = state.ship;
    if (ship && (!ship.invincible || Math.floor(ship.invincibleTime / 10) % 2 === 0)) {
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
  }

  startBtn.addEventListener('click', startGame);
}


/* ── d. Stellar Draw ── */
function buildDraw(container) {
  container.innerHTML = `
    <div class="draw-app" style="display: flex; flex-direction: column; height: 100%; background: #0c0d14;">
      <div class="draw-toolbar" style="display: flex; gap: 10px; padding: 8px; background: rgba(255,255,255,0.05); align-items: center;">
        <input type="color" id="draw-color" value="#00f3ff" style="background: none; border: none; cursor: pointer; width: 28px; height: 28px;" />
        <label style="color: #aaa; font-size: 0.8rem;">Size:
          <input type="range" id="draw-size" min="1" max="30" value="4" style="vertical-align: middle; width: 80px;" />
        </label>
        <button id="draw-eraser" style="background: rgba(255,255,255,0.1); border: 1px solid #444; color: #fff; padding: 4px 10px; border-radius: 4px; cursor: pointer;">
          <i class="fa-solid fa-eraser"></i> Eraser
        </button>
        <button id="draw-clear" style="background: rgba(255,0,85,0.2); border: 1px solid #ff0055; color: #fff; padding: 4px 10px; border-radius: 4px; cursor: pointer; margin-left: auto;">
          <i class="fa-solid fa-trash"></i> Clear
        </button>
      </div>
      <div style="flex: 1; position: relative;">
        <canvas id="draw-canvas" style="position: absolute; top:0; left:0; width:100%; height:100%; cursor: crosshair;"></canvas>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#draw-canvas');
  const ctx = canvas.getContext('2d');
  const colorPicker = container.querySelector('#draw-color');
  const sizePicker = container.querySelector('#draw-size');
  const eraserBtn = container.querySelector('#draw-eraser');
  const clearBtn = container.querySelector('#draw-clear');

  let drawing = false;
  let isEraser = false;

  function resize() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
  }
  setTimeout(resize, 50);

  eraserBtn.addEventListener('click', () => {
    isEraser = !isEraser;
    eraserBtn.style.background = isEraser ? 'rgba(0,243,255,0.3)' : 'rgba(255,255,255,0.1)';
  });

  clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  canvas.addEventListener('mousedown', e => {
    drawing = true;
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  });

  canvas.addEventListener('mousemove', e => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = sizePicker.value;
    ctx.lineCap = 'round';

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = colorPicker.value;
    }

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  });

  canvas.addEventListener('mouseup', () => drawing = false);
  canvas.addEventListener('mouseleave', () => drawing = false);
}


/* ── e. Space Explorer ── */
function buildExplorer(container) {
  const files = [
    { name: 'System Logs', type: 'folder', items: '3 files' },
    { name: 'Star Maps', type: 'folder', items: '12 files' },
    { name: 'Mission_Brief.pdf', type: 'file', size: '2.4 MB', icon: 'fa-file-pdf' },
    { name: 'Telemetry_Data.csv', type: 'file', size: '840 KB', icon: 'fa-file-csv' },
    { name: 'Orbital_Parameters.json', type: 'file', size: '12 KB', icon: 'fa-file-code' },
    { name: 'ZenZei_Wallpaper.png', type: 'file', size: '4.1 MB', icon: 'fa-file-image' }
  ];

  container.innerHTML = `
    <div class="explorer-app" style="display: flex; flex-direction: column; height: 100%; color: #fff; font-family: sans-serif; background: #080912;">
      <div style="padding: 10px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; gap: 8px;">
        <button style="background: none; border: 1px solid #444; color: #fff; border-radius: 4px; padding: 2px 8px;"><i class="fa-solid fa-arrow-left"></i></button>
        <button style="background: none; border: 1px solid #444; color: #fff; border-radius: 4px; padding: 2px 8px;"><i class="fa-solid fa-arrow-right"></i></button>
        <span style="background: rgba(0,0,0,0.4); padding: 4px 12px; border-radius: 4px; flex: 1; border: 1px solid #333; font-size: 0.85rem; color: #00f3ff;">
          <i class="fa-solid fa-folder-open"></i> / home / guest / cosmic_drive
        </span>
      </div>
      <div style="flex: 1; padding: 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 110px)); gap: 16px; align-content: start;">
        ${files.map(f => `
          <div class="explorer-item" style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 10px; border-radius: 6px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,243,255,0.1)'" onmouseout="this.style.background='transparent'">
            <i class="fa-solid ${f.type === 'folder' ? 'fa-folder' : f.icon}" style="font-size: 2.2rem; color: ${f.type === 'folder' ? '#ffb700' : '#00f3ff'}; margin-bottom: 8px;"></i>
            <span style="font-size: 0.75rem; word-break: break-word;">${f.name}</span>
            <span style="font-size: 0.65rem; color: #888; margin-top: 2px;">${f.items || f.size}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}


/* ── f. Orion Control (Settings) ── */
function buildSettings(container) {
  container.innerHTML = `
    <div class="settings-app" style="padding: 20px; color: #fff; font-family: 'Orbitron', sans-serif; display: flex; flex-direction: column; gap: 20px; background: #070810; height: 100%;">
      <div style="font-size: 1.1rem; border-bottom: 1px solid rgba(0,243,255,0.3); padding-bottom: 8px; color: #00f3ff;">
        <i class="fa-solid fa-sliders"></i> Orion Control Panel
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px;">
        <span>Starfield Parallax</span>
        <input type="checkbox" id="set-starfield" ${OS.starfieldActive ? 'checked' : ''} style="cursor: pointer; width: 18px; height: 18px;" />
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px;">
        <span>System Audio Effects</span>
        <input type="checkbox" id="set-audio" ${OS.soundEnabled ? 'checked' : ''} style="cursor: pointer; width: 18px; height: 18px;" />
      </div>

      <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between;">
          <span>Master Volume</span>
          <span id="set-vol-lbl">${Math.round(OS.soundVolume * 100)}%</span>
        </div>
        <input type="range" id="set-volume" min="0" max="1" step="0.05" value="${OS.soundVolume}" style="width: 100%;" />
      </div>

      <div style="margin-top: auto; font-size: 0.75rem; color: #666; text-align: center;">
        ZenZei OS v1.0.0 (Build 2026.07)
      </div>
    </div>
  `;

  const starfieldToggle = container.querySelector('#set-starfield');
  const audioToggle = container.querySelector('#set-audio');
  const volumeSlider = container.querySelector('#set-volume');
  const volumeLbl = container.querySelector('#set-vol-lbl');

  starfieldToggle.addEventListener('change', e => {
    OS.starfieldActive = e.target.checked;
  });

  audioToggle.addEventListener('change', e => {
    OS.soundEnabled = e.target.checked;
    const icon = document.querySelector('#tray-audio i');
    if (icon) {
      icon.className = OS.soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
    }
  });

  volumeSlider.addEventListener('input', e => {
    OS.soundVolume = parseFloat(e.target.value);
    volumeLbl.textContent = `${Math.round(OS.soundVolume * 100)}%`;
  });
}


/* ============================================================
   9. AUDIO ENGINE
   Synthesizes procedural sound effects using Web Audio API.
============================================================ */
function initAudioContext() {
  if (!OS.audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) OS.audioCtx = new AudioContext();
  }
}

function playSystemSound(type) {
  if (!OS.soundEnabled || !OS.audioCtx) return;

  if (OS.audioCtx.state === 'suspended') {
    OS.audioCtx.resume();
  }

  const now = OS.audioCtx.currentTime;
  const masterGain = OS.audioCtx.createGain();
  masterGain.gain.setValueAtTime(OS.soundVolume, now);
  masterGain.connect(OS.audioCtx.destination);

  if (type === 'click') {
    const osc = OS.audioCtx.createOscillator();
    const gain = OS.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.04);
  } else if (type === 'open' || type === 'boot') {
    const osc = OS.audioCtx.createOscillator();
    const gain = OS.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === 'laser') {
    const osc = OS.audioCtx.createOscillator();
    const gain = OS.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'explosion') {
    const bufferSize = OS.audioCtx.sampleRate * 0.2;
    const buffer = OS.audioCtx.createBuffer(1, bufferSize, OS.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = OS.audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = OS.audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    noise.connect(gain);
    gain.connect(masterGain);
    noise.start(now);
  } else if (type === 'shutdown') {
    const osc = OS.audioCtx.createOscillator();
    const gain = OS.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.4);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }
}


/* ============================================================
   10. UTILITY HELPERS
============================================================ */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
