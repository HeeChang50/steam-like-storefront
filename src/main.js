import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Menu,
  Play,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  User,
  X,
  createIcons,
} from "lucide";
import "./styles.css";
import { supabase } from "./supabaseClient";

const games = [
  {
    slug: "neon-rush-2099",
    title: "Neon Rush 2099",
    genre: "레이싱",
    tag: "신규",
    price: "₩32,000",
    oldPrice: "₩48,000",
    discount: "-33%",
    score: 92,
    cover: "bg-0",
    accent: "pink",
  },
  {
    slug: "ashen-kingdom",
    title: "Ashen Kingdom",
    genre: "RPG",
    tag: "인기",
    price: "₩39,900",
    oldPrice: "₩66,000",
    discount: "-40%",
    score: 95,
    cover: "bg-1",
    accent: "amber",
  },
  {
    slug: "orbit-garden",
    title: "Orbit Garden",
    genre: "시뮬레이션",
    tag: "힐링",
    price: "₩19,500",
    oldPrice: "₩26,000",
    discount: "-25%",
    score: 88,
    cover: "bg-2",
    accent: "green",
  },
  {
    slug: "abyss-command",
    title: "Abyss Command",
    genre: "전략",
    tag: "추천",
    price: "₩28,800",
    oldPrice: "₩36,000",
    discount: "-20%",
    score: 90,
    cover: "bg-3",
    accent: "cyan",
  },
  {
    slug: "iron-sunset",
    title: "Iron Sunset",
    genre: "액션",
    tag: "특가",
    price: "₩44,000",
    oldPrice: "₩88,000",
    discount: "-50%",
    score: 93,
    cover: "bg-4",
    accent: "orange",
  },
  {
    slug: "violet-noir",
    title: "Violet Noir",
    genre: "어드벤처",
    tag: "스토리",
    price: "₩24,900",
    oldPrice: "₩41,500",
    discount: "-40%",
    score: 91,
    cover: "bg-5",
    accent: "violet",
  },
];

const likeCounts = new Map(games.map((game) => [game.slug, 0]));

const genres = ["전체", "액션", "RPG", "전략", "레이싱", "시뮬레이션", "어드벤처"];

const app = document.querySelector("#app");

app.innerHTML = `
  <header class="topbar">
    <button class="icon-button mobile-menu" type="button" aria-label="메뉴 열기" title="메뉴">
      <i data-lucide="menu"></i>
    </button>
    <a class="brand" href="#" aria-label="Nebula Deck 홈">
      <span class="brand-mark"></span>
      <span>Nebula Deck</span>
    </a>
    <nav class="nav-links" aria-label="주요 메뉴">
      <a class="active" href="#store">상점</a>
      <a href="#deals">특가</a>
      <a href="#queue">추천 큐</a>
      <a href="#library">라이브러리</a>
      <a href="#click-battle">클릭배틀</a>
    </nav>
    <form class="search" role="search">
      <i data-lucide="search"></i>
      <input id="searchInput" type="search" placeholder="게임 검색" aria-label="게임 검색" />
    </form>
    <div class="header-actions">
      <button class="icon-button" type="button" aria-label="다운로드" title="다운로드">
        <i data-lucide="download"></i>
      </button>
      <button class="icon-button" type="button" aria-label="알림" title="알림">
        <i data-lucide="bell"></i>
      </button>
      <button class="icon-button" type="button" aria-label="장바구니" title="장바구니">
        <i data-lucide="shopping-cart"></i>
      </button>
      <button class="profile-button" type="button" aria-label="프로필" title="프로필">
        <i data-lucide="user"></i>
      </button>
    </div>
  </header>

  <div class="mobile-panel" aria-hidden="true">
    <button class="icon-button close-menu" type="button" aria-label="메뉴 닫기" title="닫기">
      <i data-lucide="x"></i>
    </button>
    <a href="#store">상점</a>
    <a href="#deals">특가</a>
    <a href="#queue">추천 큐</a>
    <a href="#library">라이브러리</a>
    <a href="#click-battle">클릭배틀</a>
  </div>

  <main>
    <section class="hero" id="store">
      <div class="hero-bg" aria-hidden="true"></div>
      <div class="hero-overlay" aria-hidden="true"></div>
      <div class="hero-content">
        <p class="eyebrow">오늘의 추천</p>
        <h1>Nexus Arc</h1>
        <p class="hero-copy">
          비 내리는 궤도 도시를 배경으로 펼쳐지는 싱글 플레이 액션 어드벤처.
          지금 위시리스트와 출시 특가가 열려 있습니다.
        </p>
        <div class="hero-meta" aria-label="추천 게임 정보">
          <span>압도적으로 긍정적</span>
          <span>SF 액션</span>
          <span>₩42,000</span>
        </div>
        <div class="hero-actions">
          <button class="primary-button" type="button">
            <i data-lucide="play"></i>
            지금 보기
          </button>
          <button class="secondary-button" type="button">
            <i data-lucide="heart"></i>
            위시리스트
          </button>
        </div>
      </div>
      <div class="hero-strip" aria-label="추천 하이라이트">
        ${games
          .slice(0, 4)
          .map(
            (game, index) => `
              <button class="strip-card ${index === 0 ? "selected" : ""}" type="button" data-hero="${index}">
                <span class="mini-cover ${game.cover}"></span>
                <span>
                  <strong>${game.title}</strong>
                  <small>${game.discount} ${game.genre}</small>
                </span>
              </button>
            `,
          )
          .join("")}
      </div>
    </section>

    <section class="toolbar-band" id="deals">
      <div class="section-head">
        <div>
          <p class="eyebrow">둘러보기</p>
          <h2>할인과 추천</h2>
        </div>
        <div class="carousel-actions" aria-label="카드 이동">
          <button class="icon-button" type="button" aria-label="이전" title="이전">
            <i data-lucide="chevron-left"></i>
          </button>
          <button class="icon-button" type="button" aria-label="다음" title="다음">
            <i data-lucide="chevron-right"></i>
          </button>
        </div>
      </div>
      <div class="filters" aria-label="장르 필터">
        <button class="filter-button utility" type="button" aria-label="필터 옵션" title="필터">
          <i data-lucide="sliders-horizontal"></i>
        </button>
        ${genres
          .map(
            (genre, index) =>
              `<button class="filter-button ${index === 0 ? "active" : ""}" type="button" data-genre="${genre}">${genre}</button>`,
          )
          .join("")}
      </div>
    </section>

    <section class="catalog-section">
      <div class="game-grid" id="gameGrid" aria-live="polite"></div>
    </section>

    <section class="queue-band" id="queue">
      <div class="queue-copy">
        <p class="eyebrow">개인화 큐</p>
        <h2>다음 플레이 후보</h2>
        <p>
          최근 본 장르와 할인율을 기준으로 빠르게 훑을 수 있게 정리했습니다.
        </p>
      </div>
      <div class="queue-list" id="library">
        ${games
          .slice(1, 5)
          .map(
            (game) => `
              <article class="queue-row">
                <span class="rank-cover ${game.cover}"></span>
                <div>
                  <strong>${game.title}</strong>
                  <span>${game.genre} · 평점 ${game.score}</span>
                </div>
                <b>${game.price}</b>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>

    <section class="click-battle" id="click-battle">
      <div class="section-head">
        <div>
          <p class="eyebrow">라이브 이벤트</p>
          <h2>클릭 배틀</h2>
        </div>
        <p class="click-battle-desc">두더지가 빛나는 순간에 클릭! 우리 반 실시간 랭킹에 도전하세요.</p>
      </div>
      <div class="click-battle-body">
        <div class="nickname-gate" id="nicknameGate">
          <input id="nicknameInput" type="text" maxlength="12" placeholder="닉네임 입력 (예: 두더지킬러)" />
          <button class="primary-button" type="button" id="nicknameSubmit">참가하기</button>
        </div>
        <div class="click-battle-play" id="clickBattlePlay" hidden>
          <div class="click-battle-score">
            <span id="playerNickname"></span>님의 점수 <strong id="myScore">0</strong>
          </div>
          <div class="mole-grid" id="moleGrid" aria-label="두더지 클릭판">
            ${Array.from({ length: 9 })
              .map((_, index) => `<button class="mole-hole" type="button" data-hole="${index}"></button>`)
              .join("")}
          </div>
        </div>
        <div class="leaderboard">
          <h3>실시간 TOP 10</h3>
          <ol id="leaderboardList" class="leaderboard-list"></ol>
        </div>
      </div>
    </section>
  </main>
`;

const grid = document.querySelector("#gameGrid");
const filterButtons = document.querySelectorAll("[data-genre]");
const searchInput = document.querySelector("#searchInput");
const mobilePanel = document.querySelector(".mobile-panel");

function renderGames() {
  const activeGenre = document.querySelector("[data-genre].active")?.dataset.genre ?? "전체";
  const query = searchInput.value.trim().toLowerCase();
  const visible = games.filter((game) => {
    const matchesGenre = activeGenre === "전체" || game.genre === activeGenre;
    const matchesSearch = `${game.title} ${game.genre} ${game.tag}`.toLowerCase().includes(query);
    return matchesGenre && matchesSearch;
  });

  grid.innerHTML = visible
    .map(
      (game) => `
        <article class="game-card ${game.accent}">
          <div class="cover ${game.cover}" role="img" aria-label="${game.title} 커버 이미지">
            <span class="tag">${game.tag}</span>
            <span class="score"><i data-lucide="star"></i>${game.score}</span>
          </div>
          <div class="game-info">
            <div>
              <h3>${game.title}</h3>
              <p>${game.genre}</p>
            </div>
            <div class="price-box">
              <span>${game.discount}</span>
              <strong>${game.price}</strong>
              <del>${game.oldPrice}</del>
            </div>
          </div>
          <button class="like-button" type="button" data-like="${game.slug}" aria-label="${game.title} 좋아요">
            <i data-lucide="heart"></i>
            <span class="like-count">${likeCounts.get(game.slug)}</span>
          </button>
        </article>
      `,
    )
    .join("");

  if (!visible.length) {
    grid.innerHTML = `<p class="empty-state">검색 결과가 없습니다.</p>`;
  }
  createIcons({ icons: { Star, Heart } });

  grid.querySelectorAll("[data-like]").forEach((button) => {
    button.addEventListener("click", () => likeGame(button.dataset.like));
  });
}

async function likeGame(slug) {
  if (!supabase) {
    likeCounts.set(slug, likeCounts.get(slug) + 1);
    renderGames();
    return;
  }

  const { error } = await supabase.rpc("increment_game_like", { game_slug: slug });
  if (error) {
    console.error("좋아요 반영 실패:", error.message);
  }
}

function applyLikeRow(row) {
  likeCounts.set(row.slug, row.likes);
  renderGames();
}

async function initLikes() {
  if (!supabase) return;

  const { data, error } = await supabase.from("game_likes").select("slug, likes");
  if (error) {
    console.error("좋아요 초기 로드 실패:", error.message);
  } else {
    data.forEach(applyLikeRow);
  }

  supabase
    .channel("game_likes_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "game_likes" },
      (payload) => applyLikeRow(payload.new),
    )
    .subscribe();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderGames();
  });
});

searchInput.addEventListener("input", renderGames);

document.querySelector(".mobile-menu").addEventListener("click", () => {
  mobilePanel.classList.add("open");
  mobilePanel.setAttribute("aria-hidden", "false");
});

document.querySelector(".close-menu").addEventListener("click", () => {
  mobilePanel.classList.remove("open");
  mobilePanel.setAttribute("aria-hidden", "true");
});

document.querySelectorAll(".mobile-panel a").forEach((link) => {
  link.addEventListener("click", () => {
    mobilePanel.classList.remove("open");
    mobilePanel.setAttribute("aria-hidden", "true");
  });
});

createIcons({
  icons: {
    Bell,
    ChevronLeft,
    ChevronRight,
    Download,
    Heart,
    Menu,
    Play,
    Search,
    ShoppingCart,
    SlidersHorizontal,
    Star,
    User,
    X,
  },
});
renderGames();
initLikes();
initClickBattle();

const NICKNAME_KEY = "nebula_click_battle_nickname";

function initClickBattle() {
  const nicknameGate = document.querySelector("#nicknameGate");
  const nicknameInput = document.querySelector("#nicknameInput");
  const nicknameSubmit = document.querySelector("#nicknameSubmit");
  const play = document.querySelector("#clickBattlePlay");
  const playerNicknameEl = document.querySelector("#playerNickname");
  const myScoreEl = document.querySelector("#myScore");
  const moleGrid = document.querySelector("#moleGrid");
  const holes = moleGrid.querySelectorAll(".mole-hole");
  const leaderboardList = document.querySelector("#leaderboardList");

  let nickname = localStorage.getItem(NICKNAME_KEY);
  let myScore = 0;
  let activeHole = null;

  function startPlaying(name) {
    nickname = name;
    localStorage.setItem(NICKNAME_KEY, nickname);
    nicknameGate.hidden = true;
    play.hidden = false;
    playerNicknameEl.textContent = nickname;
    startMoleLoop();
    fetchMyScore();
  }

  nicknameSubmit.addEventListener("click", () => {
    const value = nicknameInput.value.trim();
    if (value) startPlaying(value);
  });
  nicknameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") nicknameSubmit.click();
  });

  function startMoleLoop() {
    setInterval(() => {
      holes.forEach((hole) => hole.classList.remove("active"));
      activeHole = holes[Math.floor(Math.random() * holes.length)];
      activeHole.classList.add("active");
    }, 650);
  }

  holes.forEach((hole) => {
    hole.addEventListener("click", () => {
      if (hole !== activeHole || !hole.classList.contains("active")) return;
      hole.classList.remove("active");
      activeHole = null;
      myScore += 1;
      myScoreEl.textContent = myScore;
      registerHit(nickname);
    });
  });

  async function registerHit(name) {
    if (!supabase) return;
    const { error } = await supabase.rpc("increment_click_score", { player_nickname: name });
    if (error) console.error("클릭 점수 반영 실패:", error.message);
  }

  async function fetchMyScore() {
    if (!supabase || !nickname) return;
    const { data, error } = await supabase
      .from("click_battle_scores")
      .select("score")
      .eq("nickname", nickname)
      .maybeSingle();
    if (!error && data) {
      myScore = data.score;
      myScoreEl.textContent = myScore;
    }
  }

  async function refreshLeaderboard() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("click_battle_scores")
      .select("nickname, score")
      .order("score", { ascending: false })
      .limit(10);
    if (error) {
      console.error("리더보드 로드 실패:", error.message);
      return;
    }
    leaderboardList.innerHTML = data
      .map((row) => `<li><span>${row.nickname}</span><strong>${row.score}</strong></li>`)
      .join("");
  }

  if (supabase) {
    refreshLeaderboard();
    supabase
      .channel("click_battle_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "click_battle_scores" },
        () => refreshLeaderboard(),
      )
      .subscribe();
  }

  if (nickname) startPlaying(nickname);
}
