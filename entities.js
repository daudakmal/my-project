// Entity classes for The Last Village. Depends on globals defined in config.js.

class Player {
  constructor() {
    this.x = PLAYER_START.x;
    this.y = PLAYER_START.y;
    this.aimAngle = 0;
    this.speed = PLAYER_SPEED;
    this.gold = 0;
    this.weaponLevel = 0;
    this.fireCooldown = 0;
  }

  get weapon() {
    return WEAPON_LEVELS[this.weaponLevel];
  }

  move(dt, keys) {
    let dx = 0, dy = 0;
    if (keys['w']) dy -= 1;
    if (keys['s']) dy += 1;
    if (keys['a']) dx -= 1;
    if (keys['d']) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len; dy /= len;
      this.x += dx * this.speed * dt;
      this.y += dy * this.speed * dt;
      this.x = Math.max(PLAYER_RADIUS, Math.min(WORLD_W - PLAYER_RADIUS, this.x));
      this.y = Math.max(PLAYER_RADIUS, Math.min(WORLD_H - PLAYER_RADIUS, this.y));
    }
  }

  aimAt(mx, my) {
    this.aimAngle = Math.atan2(my - this.y, mx - this.x);
  }

  tryFire(dt, mouseDown, projectiles) {
    this.fireCooldown -= dt;
    if (!mouseDown || this.fireCooldown > 0) return;
    const weapon = this.weapon;
    this.fireCooldown = 1 / weapon.fireRate;
    const vx = Math.cos(this.aimAngle) * PLAYER_PROJECTILE_SPEED;
    const vy = Math.sin(this.aimAngle) * PLAYER_PROJECTILE_SPEED;
    projectiles.push(new Projectile(this.x, this.y, vx, vy, weapon.damage, PLAYER_PROJECTILE_RADIUS, 'player', PLAYER_PROJECTILE_MAX_RANGE));
  }

  addGold(n) {
    this.gold += n;
  }
}

class Projectile {
  constructor(x, y, vx, vy, damage, radius, ownerType, maxRange) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = radius;
    this.ownerType = ownerType; // 'player' or 'tower'
    this.traveled = 0;
    this.maxRange = maxRange;
    this.dead = false;
  }

  update(dt) {
    const dx = this.vx * dt;
    const dy = this.vy * dt;
    this.x += dx;
    this.y += dy;
    this.traveled += Math.hypot(dx, dy);
    if (this.traveled >= this.maxRange || this.x < -20 || this.x > WORLD_W + 20 || this.y < -20 || this.y > WORLD_H + 20) {
      this.dead = true;
    }
  }
}

class Enemy {
  constructor(x, y, typeKey, mult) {
    const base = ENEMY_TYPES[typeKey];
    this.type = typeKey;
    this.x = x;
    this.y = y;
    this.radius = base.radius;
    this.speed = base.speed;
    this.maxHp = base.hp * mult;
    this.hp = this.maxHp;
    this.contactDamage = base.contactDamage * mult;
    this.damageInterval = base.damageInterval;
    this.goldDrop = Math.round(base.goldMin + Math.random() * (base.goldMax - base.goldMin));
    this.color = base.color;
    this.damageTimer = 0;
    this.dead = false;
  }

  update(dt, core) {
    const dx = CORE_POS.x - this.x;
    const dy = CORE_POS.y - this.y;
    const dist = Math.hypot(dx, dy);
    const touchDist = this.radius + CORE_RADIUS;
    if (dist > touchDist) {
      const nx = dx / dist, ny = dy / dist;
      this.x += nx * this.speed * dt;
      this.y += ny * this.speed * dt;
    } else {
      this.damageTimer -= dt;
      if (this.damageTimer <= 0) {
        core.takeDamage(this.contactDamage);
        this.damageTimer = this.damageInterval;
      }
    }
  }

  takeDamage(n) {
    this.hp -= n;
    if (this.hp <= 0) this.dead = true;
  }
}

class Tower {
  constructor(x, y, spotIndex) {
    this.x = x;
    this.y = y;
    this.spotIndex = spotIndex;
    this.level = 0; // 0 = empty
    this.fireCooldown = 0;
    this.clickRadius = TOWER_CLICK_RADIUS;
  }

  get built() {
    return this.level > 0;
  }

  get stats() {
    return TOWER_LEVELS[this.level - 1];
  }

  get nextUpgrade() {
    return TOWER_LEVELS[this.level];
  }

  // Spends the player's gold to build (if empty) or upgrade (if built and
  // a next level exists), when affordable. Returns true if a purchase happened.
  tryPurchase(player) {
    if (!this.built) {
      if (player.gold < TOWER_BUILD_COST) return false;
      player.gold -= TOWER_BUILD_COST;
      this.level = 1;
      this.fireCooldown = 0;
      return true;
    }
    const next = this.nextUpgrade;
    if (!next || player.gold < next.upgradeCost) return false;
    player.gold -= next.upgradeCost;
    this.level += 1;
    this.fireCooldown = 0;
    return true;
  }

  update(dt, enemies, projectiles) {
    if (!this.built) return;
    this.fireCooldown -= dt;
    if (this.fireCooldown > 0) return;
    const stats = this.stats;
    let target = null;
    let bestDist = stats.range;
    for (const e of enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d <= bestDist) {
        bestDist = d;
        target = e;
      }
    }
    if (!target) return;
    this.fireCooldown = 1 / stats.fireRate;
    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    const vx = Math.cos(angle) * TOWER_PROJECTILE_SPEED;
    const vy = Math.sin(angle) * TOWER_PROJECTILE_SPEED;
    projectiles.push(new Projectile(this.x, this.y, vx, vy, stats.damage, TOWER_PROJECTILE_RADIUS, 'tower', TOWER_PROJECTILE_MAX_RANGE));
  }
}

class TownCore {
  constructor() {
    this.x = CORE_POS.x;
    this.y = CORE_POS.y;
    this.maxHp = CORE_MAX_HP;
    this.hp = CORE_MAX_HP;
    this.clickRadius = CORE_CLICK_RADIUS;
  }

  takeDamage(n) {
    this.hp = Math.max(0, this.hp - n);
  }

  // Spends the player's gold to repair if damaged and affordable.
  // Returns true if a purchase happened.
  tryPurchase(player) {
    if (this.hp >= this.maxHp || player.gold < CORE_REPAIR_COST) return false;
    player.gold -= CORE_REPAIR_COST;
    this.hp = Math.min(this.maxHp, this.hp + CORE_REPAIR_AMOUNT);
    return true;
  }
}

class Forge {
  constructor() {
    this.x = FORGE_POS.x;
    this.y = FORGE_POS.y;
    this.clickRadius = FORGE_CLICK_RADIUS;
  }

  // Spends the player's gold and upgrades the weapon if a next level exists
  // and is affordable. Returns true if a purchase happened.
  tryPurchase(player) {
    const nextLevel = WEAPON_LEVELS[player.weaponLevel + 1];
    if (!nextLevel || player.gold < nextLevel.cost) return false;
    player.gold -= nextLevel.cost;
    player.weaponLevel += 1;
    return true;
  }
}
