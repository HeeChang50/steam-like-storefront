# 중심잡기 챌린지

방향키(← →)로 흔들리는 공을 가운데에 맞춰 최대한 오래 버티는 미니 게임. 게임이 끝나면 직접 "랭킹에 등록" 버튼을 눌러 점수를 제출하고, "새로고침" 버튼으로 다른 사람 기록도 확인할 수 있습니다.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Environment variables

`.env` 파일에 아래 값을 넣어야 실시간 순위표가 동작합니다.

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Deploy with Bolt

Import this GitHub repository into Bolt, run `npm install`, set the two environment variables above, then deploy the Vite app.
