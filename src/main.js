import "./styles.css";
import { supabase } from "./supabaseClient";

const CYCLE_MS = 1400;
const TARGET_MIN = 44;
const TARGET_MAX = 56;

const app = document.querySelector("#app");

app.innerHTML = `
  <div class="arena-page">
    <header class="arena-top">
      <h1>타이밍 게이지 챌린지</h1>
      <p>스페이스바를 눌러 바늘을 가운데 초록 구간에 최대한 가깝게 멈추세요</p>
    </header>

    <div class="nickname-gate" id="nicknameGate">
      <input id="nicknameInput" type="text" maxlength="12" placeholder="닉네임 입력 (예: 정확왕)" />
      <button class="primary-button" type="button" id="nicknameSubmit">입장하기</button>
    </div>

    <div class="arena-body" id="arenaBody" hidden>
      <div class="gauge-panel">
        <div class="gauge-track">
          <div class="gauge-target"></div>
          <div class="gauge-needle" id="gaugeNeedle"></div>
        </div>
        <p class="gauge-status" id="gaugeStatus">스페이스바를 눌러 시작</p>
        <div class="my-status">
          <span id="myNicknameLabel"></span>
          <span>최고 점수 <strong id="myBestScore">0</strong></span>
        </div>
      </div>
      <div class="arena-side">
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
const gaugeNeedle = document.querySelector("#gaugeNeedle");
const gaugeStatus = document.querySelector("#gaugeStatus");
const myNicknameLabel = document.querySelector("#myNicknameLabel");
const myBestScoreEl = document.querySelector("#myBestScore");
const leaderboardList = document.querySelector("#leaderboardList");

let nickname = "";
let running = false;
let startTime = 0;
let lockedPosition = null;
let myBestScore = 0;
let rafId = null;

function needlePosition(elapsed) {
  const t = (elapsed % CYCLE_MS) / CYCLE_MS;
  const triangle = t < 0.5 ? t * 2 : 2 - t * 2;
  return triangle * 100;
}

function scoreFor(position) {
  const distance = Math.abs(50 - position);
  return Math.max(0, Math.round(100 - distance * 2.5));
}

function loop(now) {
  if (running) {
    const elapsed = now - startTime;
    const position = needlePosition(elapsed);
    gaugeNeedle.style.left = `${position}%`;
  }
  rafId = requestAnimationFrame(loop);
}

function startRound() {
  running = true;
  lockedPosition = null;
  startTime = performance.now();
  gaugeStatus.textContent = "스페이스바로 멈추세요!";
}

function lockRound() {
  const elapsed = performance.now() - startTime;
  const position = needlePosition(elapsed);
  running = false;
  lockedPosition = position;
  gaugeNeedle.style.left = `${position}%`;

  const score = scoreFor(position);
  const hit = position >= TARGET_MIN && position <= TARGET_MAX;
  gaugeStatus.textContent = `${score}점 ${hit ? "명중!" : ""} · 스페이스바로 재도전`;

  if (score > myBestScore) {
    myBestScore = score;
    myBestScoreEl.textContent = myBestScore;
    submitScore(score);
  }
}

async function submitScore(score) {
  if (!supabase) return;
  const { error } = await supabase.rpc("submit_timing_score", {
    player_nickname: nickname,
    new_score: score,
  });
  if (error) console.error("점수 반영 실패:", error.message);
}

function handleKeydown(event) {
  if (event.key !== " ") return;
  event.preventDefault();
  if (running) {
    lockRound();
  } else {
    startRound();
  }
}

async function refreshLeaderboard() {
  if (!supabase) return;
  const { data, error } = await supabase
    .from("timing_scores")
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
          <strong>${row.best_score}</strong>
        </li>
      `,
    )
    .join("");
}

function setupRealtime() {
  refreshLeaderboard();
  supabase
    .channel("timing_scores_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "timing_scores" },
      () => refreshLeaderboard(),
    )
    .subscribe();
}

function startGame(name) {
  nickname = name;
  nicknameGate.hidden = true;
  arenaBody.hidden = false;
  myNicknameLabel.textContent = nickname;

  document.addEventListener("keydown", handleKeydown);
  rafId = requestAnimationFrame(loop);

  if (supabase) setupRealtime();
}

nicknameSubmit.addEventListener("click", () => {
  const value = nicknameInput.value.trim();
  if (value) startGame(value);
});

nicknameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") nicknameSubmit.click();
});
