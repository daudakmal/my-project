// Keyboard/mouse capture and the click-to-purchase dispatch. Reads game
// state (player, core, forge, towers, state, resetGame) from game.js, which
// loads after this file — those are only touched inside event callbacks,
// which fire well after game.js has finished setting them up.

let keys = {};
let mouse = { x: 0, y: 0 };
let mouseDown = false;
let suppressFireThisPress = false;

function canvasPosFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

// Any entity in this list can be clicked to spend gold on it in-world
// (build/upgrade tower, repair core, upgrade weapon at forge). Checked in
// this priority order since forge/core/tower click radii don't overlap.
function clickableTargets() {
  return [forge, core, ...towers];
}

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
  const p = canvasPosFromEvent(e);
  mouse.x = p.x;
  mouse.y = p.y;
});

canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0 || state !== 'playing') return;
  const p = canvasPosFromEvent(e);
  mouse.x = p.x;
  mouse.y = p.y;

  const target = clickableTargets().find((t) => dist(p.x, p.y, t.x, t.y) < t.clickRadius);
  if (target) {
    target.tryPurchase(player);
    suppressFireThisPress = true;
    mouseDown = false;
    return;
  }

  suppressFireThisPress = false;
  mouseDown = true;
});

window.addEventListener('mouseup', (e) => {
  if (e.button !== 0) return;
  mouseDown = false;
  suppressFireThisPress = false;
});

restartBtn.addEventListener('click', () => {
  resetGame();
});
