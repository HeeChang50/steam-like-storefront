# Snake Arena

여러 명이 동시에 접속해 방향키로 즐기는 실시간 멀티플레이어 뱀 게임. Supabase Realtime의 broadcast/presence로 모든 참가자의 뱀 위치를 동기화합니다.

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

`.env` 파일에 아래 값을 넣어야 실시간 동기화가 동작합니다.

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Deploy with Bolt

Import this GitHub repository into Bolt, run `npm install`, set the two environment variables above, then deploy the Vite app.
