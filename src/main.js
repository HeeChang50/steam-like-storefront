import "./styles.css";
import { supabase } from "./supabaseClient";

const COLS = 40;
const ROWS = 30;
const CELL = 16;
const TICK_MS = 140;
const CHANNEL_NAME = "snake-arena";

const COLORS = ["#ff5b8a", "#ffbe58", "#55e6a5", "#44d8ff", "#a979ff", "#ff8a3d"];

const app = document.querySelector("#app");

app.innerHTML = `
  <div class="arena-page">
    <header class="arena-top">
      <h1>Snake Arena</h1>
      <p>실시간 멀티플레이어 뱀 게임 · 방향키로 조종하세요</p>
    </header>

    <div class="nickname-gate" id="nicknameGate">
      <input id="nicknameInput" type="text" maxlength="12" placeholder="닉네임 입력 (예: 초록뱀)" />
      <button class="primary-button" type="button" id="nicknameSubmit">입장하기</button>
    </div>

    <div class="arena-body" id="arenaBody" hidden>
      <div class="arena-canvas-wrap">
        <canvas id="arenaCanvas" width="${COLS * CELL}" height="${ROWS * CELL}"></canvas>
        <div class="game-over-overlay" id="gameOverOverlay" hidden>
          <p>게임 오버</p>
          <span>스페이스바를 눌러 다시 시작</span>
        </div>
      </div>
      <div class="arena-side">
        <div class="my-status">
          <span id="myNicknameLabel"></span>
          <strong id="myScore">3</strong>
        </div>
        <div class="leaderboard">
          <h3>실시간 순위</h3>
          <ol id="leaderboardList" class="leaderboard-list"></ol>
        </div>
      </div>
    </div>
  </div>
`;

const nicknameGate = document.querySelector("#nicknameGate");
const nicknameInput = document.querySelector("#nicknameInput");
const nicknameSubmit = document.querySelector("#nicknameSubmit");
const arenaBody = document.querySelector("#arenaBody");
const canvas = document.querySelector("#arenaCanvas");
const ctx = canvas.getContext("2d");
const gameOverOverlay = document.querySelector("#gameOverOverlay");
const myNicknameLabel = document.querySelector("#myNicknameLabel");
const myScoreEl = document.querySelector("#myScore");
const leaderboardList = document.querySelector("#leaderboardList");

const playerId = crypto.randomUUID();
const myColor = COLORS[Math.floor(Math.random() * COLORS.length)];

let nickname = "";
let mySnake = [];
let myDir = { x: 1, y: 0 };
let nextDir = { x: 1, y: 0 };
let myAlive = true;
let myFood = null;

const remotePlayers = new Map();
let channel = null;
let tickTimer = null;

function randomCell() {
  return {
    x: Math.floor(Math.random() * COLS),
    y: Math.floor(Math.random() * ROWS),
  };
}

function cellKey(cell) {
  return `${cell.x},${cell.y}`;
}

function spawnFood() {
  const occupied = new Set(mySnake.map(cellKey));
  let cell = randomCell();
  let attempts = 0;
  while (occupied.has(cellKey(cell)) && attempts < 30) {
    cell = randomCell();
    attempts += 1;
  }
  myFood = cell;
}

function resetMySnake() {
  const occupiedByOthers = new Set();
  remotePlayers.forEach((p) => {
    if (p.alive) p.segments.forEach((seg) => occupiedByOthers.add(cellKey(seg)));
  });

  let start = randomCell();
  let attempts = 0;
  while (occupiedByOthers.has(cellKey(start)) && attempts < 30) {
    start = randomCell();
    attempts += 1;
  }

  mySnake = [start, { x: start.x - 1, y: start.y }, { x: start.x - 2, y: start.y }].map((c) => ({
    x: (c.x + COLS) % COLS,
    y: (c.y + ROWS) % ROWS,
  }));
  myDir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  myAlive = true;
  spawnFood();
  gameOverOverlay.hidden = true;
  updateMyScore();
}

function updateMyScore() {
  myScoreEl.textContent = mySnake.length;
}

function handleKeydown(event) {
  const key = event.key;
  const map = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  };

  if (map[key]) {
    event.preventDefault();
    const candidate = map[key];
    const isReverse = candidate.x === -myDir.x && candidate.y === -myDir.y;
    if (!isReverse) nextDir = candidate;
    return;
  }

  if (key === " " && !myAlive) {
    event.preventDefault();
    resetMySnake();
  }
}

function stepMySnake() {
  if (!myAlive) return;

  myDir = nextDir;
  const head = mySnake[0];
  const newHead = {
    x: (head.x + myDir.x + COLS) % COLS,
    y: (head.y + myDir.y + ROWS) % ROWS,
  };

  if (mySnake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
    myAlive = false;
    return;
  }

  for (const player of remotePlayers.values()) {
    if (!player.alive) continue;
    if (player.segments.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
      myAlive = false;
      return;
    }
  }

  mySnake.unshift(newHead);

  if (myFood && newHead.x === myFood.x && newHead.y === myFood.y) {
    spawnFood();
    updateMyScore();
  } else {
    mySnake.pop();
  }
}

function broadcastState() {
  if (!channel) return;
  channel.send({
    type: "broadcast",
    event: "state",
    payload: {
      id: playerId,
      nickname,
      color: myColor,
      alive: myAlive,
      segments: mySnake,
    },
  });
}

function render() {
  ctx.fillStyle = "#0b1420";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  for (let x = 0; x <= COLS; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, ROWS * CELL);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(COLS * CELL, y * CELL);
    ctx.stroke();
  }

  if (myFood) {
    ctx.fillStyle = "#ffe5a8";
    ctx.beginPath();
    ctx.arc(
      myFood.x * CELL + CELL / 2,
      myFood.y * CELL + CELL / 2,
      CELL / 2.6,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  remotePlayers.forEach((player) => {
    if (!player.alive) return;
    ctx.fillStyle = player.color;
    ctx.globalAlpha = 0.55;
    player.segments.forEach((seg) => {
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    });
    ctx.globalAlpha = 1;
  });

  ctx.fillStyle = myColor;
  mySnake.forEach((seg, index) => {
    ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    if (index === 0) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    }
  });

  gameOverOverlay.hidden = myAlive;
}

function updateLeaderboard() {
  const entries = [{ nickname, score: mySnake.length, alive: myAlive, mine: true }];
  remotePlayers.forEach((player) => {
    entries.push({ nickname: player.nickname, score: player.segments.length, alive: player.alive, mine: false });
  });

  entries.sort((a, b) => b.score - a.score);

  leaderboardList.innerHTML = entries
    .slice(0, 10)
    .map(
      (entry) => `
        <li class="${entry.mine ? "mine" : ""} ${entry.alive ? "" : "dead"}">
          <span>${entry.nickname}${entry.alive ? "" : " (탈락)"}</span>
          <strong>${entry.score}</strong>
        </li>
      `,
    )
    .join("");
}

function setupChannel() {
  channel = supabase.channel(CHANNEL_NAME, {
    config: {
      broadcast: { self: false },
      presence: { key: playerId },
    },
  });

  channel.on("broadcast", { event: "state" }, ({ payload }) => {
    remotePlayers.set(payload.id, payload);
  });

  channel.on("presence", { event: "leave" }, ({ key }) => {
    remotePlayers.delete(key);
  });

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      channel.track({ nickname, color: myColor });
    }
  });
}

function gameLoop() {
  stepMySnake();
  broadcastState();
  render();
  updateLeaderboard();
}

function startGame(name) {
  nickname = name;
  nicknameGate.hidden = true;
  arenaBody.hidden = false;
  myNicknameLabel.textContent = nickname;

  resetMySnake();

  if (supabase) setupChannel();

  document.addEventListener("keydown", handleKeydown);
  tickTimer = setInterval(gameLoop, TICK_MS);
}

nicknameSubmit.addEventListener("click", () => {
  const value = nicknameInput.value.trim();
  if (value) startGame(value);
});

nicknameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") nicknameSubmit.click();
});
