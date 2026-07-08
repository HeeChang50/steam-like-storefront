import "./styles.css";
import { supabase } from "./supabaseClient";

const BOUND = 100;
const FRICTION = 0.985;
const PUSH_ACCEL = 0.9;
const BASE_DISTURBANCE = 0.35;
const DISTURBANCE_GROWTH = 0.02;

const app = document.querySelector("#app");

app.innerHTML = `
  <div class="arena-page">
    <header class="arena-top">
      <h1>중심잡기 챌린지</h1>
      <p>방향키(← →)로 공을 가운데에 맞춰 최대한 오래 버티세요</p>
    </header>

    <div class="nickname-gate" id="nicknameGate">
      <input id="nicknameInput" type="text" maxlength="12" placeholder="닉네임 입력 (예: 균형왕)" />
      <button class="primary-button" type="button" id="nicknameSubmit">입장하기</button>
    </div>

    <div class="arena-body" id="arenaBody" hidden>
      <div class="gauge-panel">
        <div class="balance-track">
          <div class="balance-center-zone"></div>
          <div class="balance-ball" id="balanceBall"></div>
        </div>
        <p class="gauge-status" id="gaugeStatus">시작하기를 눌러주세요</p>
        <div class="balance-controls">
          <button class="primary-button" type="button" id="startButton">시작하기</button>
          <button class="secondary-button" type="button" id="registerButton" hidden>랭킹에 등록</button>
        </div>
        <div class="my-status">
          <span id="myNicknameLabel"></span>
          <span>내 최고 기록 <strong id="myBestScore">0.0</strong>초</span>
        </div>
      </div>
      <div class="arena-side">
        <div class="leaderboard">
          <div class="leaderboard-head">
            <h3>실시간 순위</h3>
            <button class="refresh-button" type="button" id="refreshButton" title="새로고침">↻ 새로고침</button>
          </div>
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
const balanceBall = document.querySelector("#balanceBall");
const gaugeStatus = document.querySelector("#gaugeStatus");
const startButton = document.querySelector("#startButton");
const registerButton = document.querySelector("#registerButton");
const myNicknameLabel = document.querySelector("#myNicknameLabel");
const myBestScoreEl = document.querySelector("#myBestScore");
const leaderboardList = document.querySelector("#leaderboardList");
const refreshButton = document.querySelector("#refreshButton");

let nickname = "";
let playing = false;
let position = 0;
let velocity = 0;
let startTime = 0;
let lastFrame = 0;
let finalScore = 0;
let myBestScore = 0;
const heldKeys = { left: false, right: false };

function resetBall() {
  position = 0;
  velocity = 0;
  balanceBall.style.left = "50%";
}

function startRun() {
  playing = true;
  resetBall();
  startTime = performance.now();
  lastFrame = startTime;
  startButton.hidden = true;
  registerButton.hidden = true;
  gaugeStatus.textContent = "버티는 중...";
}

function endRun() {
  playing = false;
  finalScore = Math.round(((performance.now() - startTime) / 1000) * 10) / 10;
  gaugeStatus.textContent = `${finalScore.toFixed(1)}초 생존! 등록하거나 다시 도전하세요`;
  startButton.hidden = false;
  startButton.textContent = "다시하기";
  registerButton.hidden = false;
  registerButton.disabled = false;
  registerButton.textContent = "랭킹에 등록";

  if (finalScore > myBestScore) {
    myBestScore = finalScore;
    myBestScoreEl.textContent = myBestScore.toFixed(1);
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  if (!playing) return;

  const dt = Math.min(now - lastFrame, 48) / 16.67;
  lastFrame = now;

  const elapsedSec = (now - startTime) / 1000;
  const disturbance = BASE_DISTURBANCE + elapsedSec * DISTURBANCE_GROWTH;

  velocity += (Math.random() - 0.5) * disturbance;
  if (heldKeys.left) velocity -= PUSH_ACCEL * dt * 0.1;
  if (heldKeys.right) velocity += PUSH_ACCEL * dt * 0.1;
  velocity *= FRICTION;
  position += velocity * dt;

  if (Math.abs(position) >= BOUND) {
    position = Math.sign(position) * BOUND;
    balanceBall.style.left = `${50 + (position / BOUND) * 48}%`;
    endRun();
    return;
  }

  balanceBall.style.left = `${50 + (position / BOUND) * 48}%`;
}

function handleKeydown(event) {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    heldKeys.left = true;
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    heldKeys.right = true;
  }
}

function handleKeyup(event) {
  if (event.key === "ArrowLeft") heldKeys.left = false;
  if (event.key === "ArrowRight") heldKeys.right = false;
}

startButton.addEventListener("click", startRun);

registerButton.addEventListener("click", async () => {
  registerButton.disabled = true;
  registerButton.textContent = "등록 중...";
  await submitScore(finalScore);
  registerButton.textContent = "등록 완료";
});

async function submitScore(score) {
  if (!supabase) return;
  const { error } = await supabase.rpc("submit_balance_score", {
    player_nickname: nickname,
    new_score: score,
  });
  if (error) console.error("점수 반영 실패:", error.message);
  else refreshLeaderboard();
}

async function refreshLeaderboard() {
  if (!supabase) return;
  const { data, error } = await supabase
    .from("balance_scores")
    .select("nickname, best_score")
    .order("best_score", { ascending: false })
    .limit(10);
  if (error) {
    console.error("리더보드 로드 실패:", error.message);
    return;
  }
  leaderboardList.innerHTML = data
    .map(
      (row) => `
        <li class="${row.nickname === nickname ? "mine" : ""}">
          <span>${row.nickname}</span>
          <strong>${Number(row.best_score).toFixed(1)}초</strong>
        </li>
      `,
    )
    .join("");
}

refreshButton.addEventListener("click", () => refreshLeaderboard());

function startGame(name) {
  nickname = name;
  nicknameGate.hidden = true;
  arenaBody.hidden = false;
  myNicknameLabel.textContent = nickname;

  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("keyup", handleKeyup);
  requestAnimationFrame(frame);

  if (supabase) refreshLeaderboard();
}

nicknameSubmit.addEventListener("click", () => {
  const value = nicknameInput.value.trim();
  if (value) startGame(value);
});

nicknameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") nicknameSubmit.click();
});
