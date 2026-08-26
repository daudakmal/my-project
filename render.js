// All drawing: canvas layers + HUD text. Takes game state as explicit
// parameters rather than reaching into game.js's globals, so this file only
// depends on config.js (for world/layout constants) and the DOM.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const hudTimer = document.getElementById('hudTimer');
const hudGold = document.getElementById('hudGold');
const hudWeapon = document.getElementById('hudWeapon');
const endOverlay = document.getElementById('endOverlay');
const endTitle = document.getElementById('endTitle');
const endSubtitle = document.getElementById('endSubtitle');
const restartBtn = document.getElementById('restartBtn');

function formatTime(t) {
  const s = Math.max(0, Math.ceil(t));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function fillCircle(x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawHpBar(x, y, w, h, ratio, fillColor) {
  ctx.fillStyle = '#222';
  ctx.fillRect(x - w / 2, y, w, h);
  ctx.fillStyle = fillColor;
  ctx.fillRect(x - w / 2, y, w * Math.max(0, Math.min(1, ratio)), h);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w / 2, y, w, h);
}

function drawBackground() {
  ctx.fillStyle = '#3c5a3c';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  ctx.fillStyle = '#4a6b3d';
  ctx.beginPath();
  ctx.arc(CORE_POS.x, CORE_POS.y, TOWER_SPOT_RADIUS_FROM_CORE + 60, 0, Math.PI * 2);
  ctx.fill();
}

function drawTowerSpots(towers) {
  for (const t of towers) {
    if (t.built) {
      fillCircle(t.x, t.y, TOWER_VISUAL_RADIUS, '#8a6d3b');
      ctx.fillStyle = '#f0e6c8';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(t.level), t.x, t.y + 5);
      if (t.nextUpgrade) {
        drawHpBar(t.x, t.y - TOWER_VISUAL_RADIUS - 12, 40, 5, t.level / TOWER_LEVELS.length, '#5fa8e0');
      }
    } else {
      ctx.strokeStyle = '#cfd8c4';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(t.x, t.y, TOWER_VISUAL_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', t.x, t.y + 7);
    }
  }
}

function drawForge(forge) {
  fillCircle(forge.x, forge.y, FORGE_RADIUS, '#555');
  fillCircle(forge.x, forge.y, FORGE_RADIUS * 0.5, '#ff8c3c');
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FORGE', forge.x, forge.y + FORGE_RADIUS + 16);
}

function drawCore(core) {
  fillCircle(core.x, core.y, CORE_RADIUS, '#7a7a9a');
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawHpBar(core.x, core.y - CORE_RADIUS - 16, 80, 8, core.hp / core.maxHp, '#4caf50');
}

function drawGoldPickups(goldPickups) {
  for (const g of goldPickups) {
    fillCircle(g.x, g.y, 6, '#f1c40f');
  }
}

function drawEnemies(enemies) {
  for (const e of enemies) {
    fillCircle(e.x, e.y, e.radius, e.color);
    drawHpBar(e.x, e.y - e.radius - 10, e.radius * 2, 4, e.hp / e.maxHp, '#e74c3c');
  }
}

function drawProjectiles(projectiles) {
  for (const p of projectiles) {
    fillCircle(p.x, p.y, p.radius, p.ownerType === 'player' ? '#fff' : '#5fa8e0');
  }
}

function drawPlayer(player) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.aimAngle);
  ctx.fillStyle = '#3498db';
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, -3, PLAYER_RADIUS + 10, 6);
  ctx.restore();
}

function drawHud(player, timeRemaining) {
  hudTimer.textContent = formatTime(timeRemaining);
  hudGold.textContent = String(player.gold);
  hudWeapon.textContent = String(player.weaponLevel + 1);
}

function render(state) {
  drawBackground();
  drawTowerSpots(state.towers);
  drawForge(state.forge);
  drawCore(state.core);
  drawGoldPickups(state.goldPickups);
  drawEnemies(state.enemies);
  drawProjectiles(state.projectiles);
  drawPlayer(state.player);
  drawHud(state.player, MATCH_DURATION - state.elapsed);
}
