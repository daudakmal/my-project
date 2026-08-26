// Main orchestration: game state, update loop, win/lose, bootstrap.
// Depends on globals from config.js, entities.js, render.js, and input.js.

let player, core, forge, towers, enemies, projectiles, goldPickups;
let elapsed, spawnTimer, state; // state: 'playing' | 'won' | 'lost'
let lastTime = null;

function resetGame() {
  player = new Player();
  core = new TownCore();
  forge = new Forge();
  towers = TOWER_SPOTS.map((p, i) => new Tower(p.x, p.y, i));
  enemies = [];
  projectiles = [];
  goldPickups = [];
  elapsed = 0;
  spawnTimer = spawnIntervalAt(0);
  state = 'playing';
  mouseDown = false;
  suppressFireThisPress = false;
  endOverlay.classList.add('hidden');
}

function spawnEnemy() {
  const angle = Math.random() * Math.PI * 2;
  const x = CORE_POS.x + Math.cos(angle) * ENEMY_SPAWN_RADIUS;
  const y = CORE_POS.y + Math.sin(angle) * ENEMY_SPAWN_RADIUS;
  const typeKey = Math.random() < tankChanceAt(elapsed) ? 'tank' : 'fast';
  const mult = statMultAt(elapsed);
  enemies.push(new Enemy(x, y, typeKey, mult));
}

function update(dt) {
  if (state !== 'playing') return;

  elapsed += dt;

  player.move(dt, keys);
  player.aimAt(mouse.x, mouse.y);
  if (!suppressFireThisPress) {
    player.tryFire(dt, mouseDown, projectiles);
  }

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = spawnIntervalAt(elapsed);
  }

  for (const e of enemies) e.update(dt, core);
  for (const t of towers) t.update(dt, enemies, projectiles);
  for (const p of projectiles) p.update(dt);

  // Projectiles vs enemies (only player/tower projectiles hit enemies).
  for (const p of projectiles) {
    if (p.dead) continue;
    for (const e of enemies) {
      if (e.dead) continue;
      if (dist(p.x, p.y, e.x, e.y) < p.radius + e.radius) {
        e.takeDamage(p.damage);
        p.dead = true;
        if (e.dead) {
          goldPickups.push({ x: e.x, y: e.y, value: e.goldDrop });
        }
        break;
      }
    }
  }

  // Gold pickup.
  goldPickups = goldPickups.filter((g) => {
    if (dist(player.x, player.y, g.x, g.y) < PLAYER_PICKUP_RADIUS) {
      player.addGold(g.value);
      return false;
    }
    return true;
  });

  enemies = enemies.filter((e) => !e.dead);
  projectiles = projectiles.filter((p) => !p.dead);

  if (core.hp <= 0) {
    endGame('lost');
  } else if (elapsed >= MATCH_DURATION) {
    endGame('won');
  }
}

function endGame(result) {
  state = result;
  endOverlay.classList.remove('hidden');
  if (result === 'won') {
    endTitle.textContent = 'Village Saved!';
    endSubtitle.textContent = 'You survived the full 10 minutes.';
  } else {
    endTitle.textContent = 'The Village Has Fallen';
    endSubtitle.textContent = `You lasted ${formatTime(elapsed)}.`;
  }
}

function currentState() {
  return { player, core, forge, towers, enemies, projectiles, goldPickups, elapsed };
}

function loop(now) {
  if (lastTime === null) lastTime = now;
  let dt = (now - lastTime) / 1000;
  lastTime = now;
  dt = Math.min(dt, 0.05);

  if (!document.hidden) {
    update(dt);
    render(currentState());
  }

  requestAnimationFrame(loop);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    lastTime = null; // avoid a huge dt jump after returning to the tab
  }
});

resetGame();
requestAnimationFrame(loop);
