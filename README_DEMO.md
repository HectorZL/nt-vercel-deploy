# Desafío Relámpago - Demo

A lightweight, in-memory quiz application built with Next.js 16. Perfect for classroom demos or one-time tasks.

## Features

✅ **In-memory storage** - No database needed  
✅ **Server-side countdown** - Precise timing, auto-close on expiration  
✅ **Real-time polling** - Students see live updates (500ms intervals)  
✅ **Admin panel** - Create, open, close rounds & view results  
✅ **Leaderboard** - Top responses ranked by latency  
✅ **Response distribution** - Live charts showing vote percentages  

## Quick Start

### 1. Start the server
```bash
npm install
npm run dev
```

Server runs on `http://localhost:3000`

### 2. Open in browser

**Admin Panel** (create & manage rounds)
```
http://localhost:3000/admin
```

**Student View** (join & answer questions)
```
http://localhost:3000/play
```

### 3. Demo workflow

1. Open `/admin` in one tab
2. Click "Create Round" and fill in:
   - Question: "What is 2+2?"
   - Options: "3", "4", "5", "6"
   - Correct: "B" (4)
   - Duration: 10 seconds
3. Click "Open Round"
4. Open `/play` in 3+ new tabs (different browsers/private windows)
5. Each student enters their name and selects an answer
6. Watch the countdown timer
7. Auto-close or click "Close Round"
8. Click "View Results" to see stats

## API Endpoints

### Public (Student)

```
POST   /api/demo/join
       Body: { name: string }
       Returns: { participant: { id, createdAt, name } }

GET    /api/demo/round/current
       Returns: { round: Round | null }

POST   /api/demo/round/answer
       Body: { participantId: string, option: "A"|"B"|"C"|"D" }
       Returns: { ok: true, responseId: string }

GET    /api/demo/round/results?roundId=...
       Returns: { round: Round, results: Results }
```

### Admin

```
POST   /api/admin/round/create
       Body: { question, optionA, optionB, optionC, optionD, correctOption, durationMs }
       Returns: { round: Round }

POST   /api/admin/round/open
       Body: { roundId: string }
       Returns: { round: Round }

POST   /api/admin/round/close
       Body: { roundId: string }
       Returns: { round: Round }

GET    /api/admin/round/list
       Returns: { rounds: Round[] }

GET    /api/admin/round/results?roundId=...
       Returns: { round: Round, results: Results }
```

## Architecture

```
src/
├── server/
│   ├── storage.ts          # In-memory data store
│   ├── quiz-utils.ts       # Pure utility functions (no dependencies)
│   └── __tests__/
│       └── quiz.test.ts    # Unit tests
├── app/
│   ├── admin/              # Admin UI (create/manage rounds)
│   ├── play/               # Student UI (join & answer)
│   └── api/
│       ├── demo/           # Public endpoints (student)
│       └── admin/          # Admin endpoints
└── ...
```

### Storage Structure

All data is stored in-memory using JavaScript `Map` objects:
- `rounds`: Quiz round definitions + state
- `participants`: Student names
- `responses`: Individual answer submissions

**Data is cleared on server restart.**

## Key Design Decisions

1. **No Database** - Uses in-memory storage for simplicity
2. **Server-side Timer** - `openedAt` + `durationMs` = `closesAt`; no background workers
3. **Auto-close** - Rounds auto-close when expired (on query)
4. **Polling** - 500ms client-side polling (no WebSockets)
5. **Latency Tracking** - Server captures submission time relative to `openedAt`
6. **Single Active Round** - Only one "OPEN" round allowed (simplicity)

## Limitations

- Data lost on server restart
- Single server instance only (no multi-process support)
- No authentication (demo mode)
- Max ~1000 concurrent users per round (in-memory limits)

## Testing

```bash
# Unit tests
npm test

# Manual API testing (requires server running)
bash test-demo.sh
```

## Browser Compatibility

Works on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Mobile support: Yes (responsive design)

## Files Reference

| File | Purpose |
|------|---------|
| `src/server/storage.ts` | In-memory data store |
| `src/server/quiz-utils.ts` | Pure utilities (timer logic) |
| `src/app/admin/page.tsx` | Admin UI |
| `src/app/admin/results/page.tsx` | Admin results view |
| `src/app/play/page.tsx` | Student UI |
| `src/app/api/demo/*` | Public API (student) |
| `src/app/api/admin/*` | Admin API |
| `test-demo.sh` | API test script |

## Environment

- **Node.js**: 18+ (uses `nanoid` for ID generation)
- **Next.js**: 16.2.6
- **React**: 19+
- **Tailwind CSS**: 4+ (styling)

## Notes

- Countdown timer updates every 250ms for smooth UX
- Response distribution percentages rounded to 1 decimal place
- Leaderboard shows top 10 responses sorted by latency
- Correct answers highlighted in green on results page
- All timestamps are server-side (no client clock skew issues)
