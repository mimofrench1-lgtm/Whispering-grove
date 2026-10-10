const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const statusPanel = document.getElementById("statusPanel");
const menuPanel = document.getElementById("menuPanel");
const inventoryPanel = document.getElementById("inventoryPanel");
const inventoryItems = document.getElementById("inventoryItems");
const dialogueBox = document.getElementById("dialogueBox");
const speaker = document.getElementById("speaker");
const dialogueText = document.getElementById("dialogueText");
const toast = document.getElementById("toast");

let width = 0;
let height = 0;
let lastTime = 0;
let toastTimer;

const world = {
  width: 1800,
  height: 1200
};

const player = {
  x: 900,
  y: 600,
  size: 28,
  speed: 220,
  color: "#f2c879"
};

const keys = {};
const joystick = {
  active: false,
  x: 0,
  y: 0,
  power: 0
};

const camera = {
  x: 0,
  y: 0
};

const gameState = {
  inventory: ["Small Lantern"],
  score: 0,
  dialogueOpen: false,
  dialogueIndex: 0,
  dialogueLines: [
    ["Guide", "Welcome to Whispering Grove."],
    ["Guide", "Explore the forest and find the hidden crystal."],
    ["Guide", "Use the joystick or keyboard to move."]
  ]
};

const trees = [
  { x: 180, y: 180 }, { x: 420, y: 260 },
  { x: 700, y: 150 }, { x: 1050, y: 220 },
  { x: 1350, y: 170 }, { x: 1600, y: 350 },
  { x: 260, y: 850 }, { x: 620, y: 980 },
  { x: 1100, y: 900 }, { x: 1500, y: 850 }
];

const crystal = {
  x: 1250,
  y: 620,
  collected: false
};

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;

  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function showToast(message) {
  toast.textContent = message;
  toast.style.display = "block";

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 2200);
}

function updateStatus() {
  statusPanel.textContent =
    "Score: " + gameState.score +
    " | Items: " + gameState.inventory.length;
}

function drawBackground() {
  ctx.fillStyle = "#182c35";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  ctx.fillStyle = "#315947";
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.fillStyle = "#3f6b4e";
  for (let x = 0; x < world.width; x += 80) {
    for (let y = 0; y < world.height; y += 80) {
      ctx.fillRect(x + 8, y + 8, 3, 3);
      ctx.fillRect(x + 42, y + 44, 3, 3);
    }
  }

  ctx.fillStyle = "#886b4a";
  ctx.fillRect(0, 540, world.width, 120);
  ctx.fillRect(820, 0, 120, world.height);

  ctx.restore();
}

function drawTrees() {
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  for (const tree of trees) {
    ctx.fillStyle = "#543b2d";
    ctx.fillRect(tree.x - 12, tree.y + 20, 24, 55);

    ctx.fillStyle = "#193f35";
    ctx.fillRect(tree.x - 42, tree.y - 18, 84, 54);

    ctx.fillStyle = "#286047";
    ctx.fillRect(tree.x - 30, tree.y - 42, 60, 42);

    ctx.fillStyle = "#43815a";
    ctx.fillRect(tree.x - 16, tree.y - 55, 32, 30);
  }

  ctx.restore();
}

function drawCrystal() {
  if (crystal.collected) return;

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  ctx.fillStyle = "#9cf6ff";
  ctx.beginPath();
  ctx.moveTo(crystal.x, crystal.y - 28);
  ctx.lineTo(crystal.x + 22, crystal.y);
  ctx.lineTo(crystal.x, crystal.y + 32);
  ctx.lineTo(crystal.x - 22, crystal.y);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(player.x - 18, player.y + 16, 36, 8);

  ctx.fillStyle = player.color;
  ctx.fillRect(
    player.x - player.size / 2,
    player.y - player.size / 2,
    player.size,
    player.size
  );

  ctx.fillStyle = "#263238";
  ctx.fillRect(player.x - 8, player.y - 5, 5, 5);
  ctx.fillRect(player.x + 3, player.y - 5, 5, 5);

  ctx.restore();
}

function updateCamera() {
  camera.x = player.x - width / 2;
  camera.y = player.y - height / 2;

  camera.x = Math.max(0, Math.min(camera.x, world.width - width));
  camera.y = Math.max(0, Math.min(camera.y, world.height - height));
}

function getMovement() {
  let x = joystick.x;
  let y = joystick.y;

  if (keys.ArrowLeft || keys.a) x -= 1;
  if (keys.ArrowRight || keys.d) x += 1;
  if (keys.ArrowUp || keys.w) y -= 1;
  if (keys.ArrowDown || keys.s) y += 1;

  const length = Math.hypot(x, y);

  if (length > 1) {
    x /= length;
    y /= length;
  }

  return { x, y };
}

function update(delta) {
  const movement = getMovement();

  player.x += movement.x * player.speed * delta;
  player.y += movement.y * player.speed * delta;

  player.x = Math.max(20, Math.min(world.width - 20, player.x));
  player.y = Math.max(20, Math.min(world.height - 20, player.y));

  const distance = Math.hypot(
    player.x - crystal.x,
    player.y - crystal.y
  );

  if (!crystal.collected && distance < 55) {
    crystal.collected = true;
    gameState.inventory.push("Forest Crystal");
    gameState.score += 100;
    updateStatus();
    showToast("You found the Forest Crystal!");
  }

  updateCamera();
}

function draw() {
  drawBackground();
  drawTrees();
  drawCrystal();
  drawPlayer();
}

function gameLoop(time) {
  const delta = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  update(delta);
  draw();

  requestAnimationFrame(gameLoop);
}

function openMenu() {
  menuPanel.style.display = "block";
}

function closeMenu() {
  menuPanel.style.display = "none";
}

function openInventory() {
  inventoryItems.innerHTML = "";

  if (gameState.inventory.length === 0) {
    inventoryItems.textContent = "Inventory is empty.";
  } else {
    gameState.inventory.forEach(item => {
      const div = document.createElement("div");
      div.textContent = "• " + item;
      inventoryItems.appendChild(div);
    });
  }

  inventoryPanel.style.display = "block";
}

function closeInventory() {
  inventoryPanel.style.display = "none";
}

function startDialogue() {
  gameState.dialogueOpen = true;
  gameState.dialogueIndex = 0;
  dialogueBox.style.display = "block";
  showDialogueLine();
}

function showDialogueLine() {
  const line = gameState.dialogueLines[gameState.dialogueIndex];

  if (!line) {
    dialogueBox.style.display = "none";
    gameState.dialogueOpen = false;
    return;
  }

  speaker.textContent = line[0];
  dialogueText.textContent = line[1];
}

function nextDialogue() {
  gameState.dialogueIndex++;
  showDialogueLine();
}

function saveGame() {
  localStorage.setItem(
    "whisperingGroveSave",
    JSON.stringify(gameState)
  );
  showToast("Game saved.");
}

function loadGame() {
  const saved = localStorage.getItem("whisperingGroveSave");

  if (!saved) {
    updateStatus();
    return;
  }

  try {
    const data = JSON.parse(saved);

    if (Array.isArray(data.inventory)) {
      gameState.inventory = data.inventory;
    }

    if (typeof data.score === "number") {
      gameState.score = data.score;
    }

    updateStatus();
  } catch {
    showToast("Could not load save data.");
  }
}

function resetGame() {
  localStorage.removeItem("whisperingGroveSave");
  location.reload();
}

document.addEventListener("keydown", event => {
  keys[event.key] = true;
});

document.addEventListener("keyup", event => {
  keys[event.key] = false;
});

document.getElementById("menuButton").addEventListener("click", openMenu);
document.getElementById("closeMenu").addEventListener("click", closeMenu);
document.getElementById("bagButton").addEventListener("click", openInventory);
document.getElementById("closeInventory").addEventListener("click", closeInventory);
document.getElementById("inventoryMenuButton").addEventListener("click", () => {
  closeMenu();
  openInventory();
});
document.getElementById("saveButton").addEventListener("click", saveGame);
document.getElementById("resetButton").addEventListener("click", resetGame);
document.getElementById("talkButton").addEventListener("click", startDialogue);
document.getElementById("dialogueNext").addEventListener("click", nextDialogue);

const joystickElement = document.getElementById("joystick");
const joystickKnob = document.getElementById("joystickKnob");

function updateJoystick(event) {
  const rect = joystickElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let x = event.clientX - centerX;
  let y = event.clientY - centerY;

  const distance = Math.hypot(x, y);
  const maxDistance = rect.width / 2 - 30;

  if (distance > maxDistance) {
    x = (x / distance) * maxDistance;
    y = (y / distance) * maxDistance;
  }

  joystickKnob.style.transform = `translate(${x}px, ${y}px)`;
  joystick.x = x / maxDistance;
  joystick.y = y / maxDistance;
}

joystickElement.addEventListener("pointerdown", event => {
  joystick.active = true;
  joystickElement.setPointerCapture(event.pointerId);
  updateJoystick(event);
});

joystickElement.addEventListener("pointermove", event => {
  if (joystick.active) updateJoystick(event);
});

function stopJoystick() {
  joystick.active = false;
  joystick.x = 0;
  joystick.y = 0;
  joystickKnob.style.transform = "translate(0, 0)";
}

joystickElement.addEventListener("pointerup", stopJoystick);
joystickElement.addEventListener("pointercancel", stopJoystick);

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
loadGame();
updateCamera();
requestAnimationFrame(gameLoop);

