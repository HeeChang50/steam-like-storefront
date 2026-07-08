# 타이밍 게이지 챌린지

스페이스바로 움직이는 바늘을 가운데 목표 구간에 멈추는 미니 게임. Supabase realtime으로 최고 점수를 공유해 여러 명이 실시간 순위표로 겨룹니다.

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
