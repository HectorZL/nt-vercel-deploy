# Desafio Relampago (Demo)

Mini quiz por rondas:

1. El profe crea una ronda (pregunta + 4 opciones + duracion).
2. Abre la ronda: el servidor fija `openedAt` y `closesAt`.
3. Estudiantes responden una vez.
4. Al cerrar (o expirar), se muestran estadisticas (% por opcion) y top.

## Stack

- Next.js (App Router)
- Prisma
- Postgres en Vercel (Vercel Postgres)

## Setup

1. Crea una base en Vercel: Storage -> Postgres.
2. Copia el connection string a `DATABASE_URL`.
3. Local: crea `.env.local` con:

```bash
DATABASE_URL="..."
```

4. Aplica el schema:

```bash
npm run db:push
```

5. Ejecuta:

```bash
npm run dev
```

## Rutas

- `/` home
- `/play` estudiante
- `/admin` panel (sin auth, demo)

## Endpoints

- `POST /api/demo/join` -> crea participante
- `GET /api/demo/round/current` -> ronda actual (open/closed)
- `POST /api/demo/round/answer` -> responder (1 vez)
- `GET /api/demo/round/results?roundId=...` -> stats + top

- `GET /api/admin/round/list`
- `POST /api/admin/round/create`
- `POST /api/admin/round/open`
- `POST /api/admin/round/close`
- `GET /api/admin/round/results?roundId=...`

## Nota sobre el cronometro server-side

No hay worker/cron en esta demo. La ronda se auto-cierra "on demand":

- cuando se consulta `current` / `results`
- o cuando llega una respuesta

Eso mantiene el timer autoritativo sin procesos en background.
# nt-vercel-deploy
