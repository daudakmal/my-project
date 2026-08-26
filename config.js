// Tunable constants and data tables for The Last Village, plus the small
// derived-value/math helpers built directly from them (difficulty curve,
// tower spot layout, distance).

const WORLD_W = 1280;
const WORLD_H = 720;

const CORE_POS = { x: 640, y: 360 };
const CORE_RADIUS = 40;
const CORE_MAX_HP = 200;
const CORE_REPAIR_COST = 20;
const CORE_REPAIR_AMOUNT = 20;
const CORE_CLICK_RADIUS = 55;

const FORGE_POS = { x: 640, y: 160 };
const FORGE_RADIUS = 24;
const FORGE_CLICK_RADIUS = 36;

const TOWER_SPOT_RADIUS_FROM_CORE = 200;
const TOWER_SPOT_COUNT = 6;
const TOWER_VISUAL_RADIUS = 22;
const TOWER_CLICK_RADIUS = 32;
const TOWER_BUILD_COST = 40;
const TOWER_PROJECTILE_SPEED = 500;
const TOWER_PROJECTILE_RADIUS = 5;

// Index 0 = stats once built (level 1). Later entries are upgrade targets.
const TOWER_LEVELS = [
  { range: 160, damage: 8, fireRate: 1.2 }, // L1 (on build)
  { upgradeCost: 60, range: 170, damage: 14, fireRate: 1.3 }, // L2
  { upgradeCost: 100, range: 180, damage: 22, fireRate: 1.4 }, // L3
  { upgradeCost: 160, range: 190, damage: 32, fireRate: 1.5 }, // L4
  { upgradeCost: 250, range: 200, damage: 45, fireRate: 1.6 }, // L5 (max)
];

function computeTowerSpots() {
  const spots = [];
  for (let i = 0; i < TOWER_SPOT_COUNT; i++) {
    const angle = (Math.PI / 3) * i; // 60 degree increments starting at 0
    spots.push({
      x: CORE_POS.x + Math.cos(angle) * TOWER_SPOT_RADIUS_FROM_CORE,
      y: CORE_POS.y + Math.sin(angle) * TOWER_SPOT_RADIUS_FROM_CORE,
    });
  }
  return spots;
}
const TOWER_SPOTS = computeTowerSpots();

const PLAYER_START = { x: 640, y: 460 };
const PLAYER_SPEED = 220;
const PLAYER_RADIUS = 16;
const PLAYER_PICKUP_RADIUS = 70;
const PLAYER_PROJECTILE_SPEED = 600;
const PLAYER_PROJECTILE_RADIUS = 4;
const PLAYER_PROJECTILE_MAX_RANGE = 900;
const TOWER_PROJECTILE_MAX_RANGE = 700;

// Index 0 = starting weapon (free). Later entries are forge upgrade targets.
const WEAPON_LEVELS = [
  { damage: 10, fireRate: 3.0 }, // L1 (start)
  { cost: 50, damage: 14, fireRate: 3.3 }, // L2
  { cost: 90, damage: 19, fireRate: 3.6 }, // L3
  { cost: 140, damage: 25, fireRate: 4.0 }, // L4
  { cost: 210, damage: 32, fireRate: 4.4 }, // L5
  { cost: 300, damage: 40, fireRate: 5.0 }, // L6 (max)
];

const ENEMY_TYPES = {
  fast: { hp: 12, speed: 110, contactDamage: 4, radius: 12, goldMin: 2, goldMax: 4, damageInterval: 0.5, color: '#e0c341' },
  tank: { hp: 45, speed: 55, contactDamage: 10, radius: 18, goldMin: 6, goldMax: 10, damageInterval: 0.5, color: '#c0392b' },
};

const ENEMY_SPAWN_RADIUS = 550;

const MATCH_DURATION = 600; // seconds (10:00)

function spawnIntervalAt(t) {
  const clamped = Math.min(t, MATCH_DURATION);
  return Math.max(0.45, 2.2 - 1.75 * (clamped / MATCH_DURATION));
}

function tankChanceAt(t) {
  const clamped = Math.min(t, MATCH_DURATION);
  const v = 0.15 + 0.5 * (clamped / MATCH_DURATION);
  return Math.min(0.65, Math.max(0.15, v));
}

function statMultAt(t) {
  const clamped = Math.min(t, MATCH_DURATION);
  return 1 + 0.8 * (clamped / MATCH_DURATION);
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}
