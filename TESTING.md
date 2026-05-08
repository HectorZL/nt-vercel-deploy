# Seeds y scripts de demostración para el quiz app

## Preparar ambiente local

1. Inicia Prisma Dev:
```bash
npx prisma dev --name demo
```

2. Copia la `DATABASE_URL` que se imprime y actualiza `.env.local`:
```bash
DATABASE_URL="postgres://..."
```

3. Aplicar schema a la BD:
```bash
npm run db:push
```

## Ejecutar la app

```bash
npm run dev
```

Luego:
- Estudiantes: http://localhost:3000/play
- Admin: http://localhost:3000/admin

## Pruebas

Unitarias:
```bash
npm test
```

Con coverage:
```bash
npm run test:ci
```

## Flujo manual para testear

1. **Admin**: `/admin`
   - Crea una ronda con pregunta + opciones + respuesta correcta
   - Abre la ronda → inicia el timer server-side

2. **Estudiantes**: `/play`
   - 3+ navegadores/tabs en incógnito, cada uno con nombre distinto
   - Esperan a que se abra la ronda
   - Responden (máx 1 respuesta por ronda)
   - Ven un countdown del timer

3. **Timer expira**: auto-cierra o admin cierra manualmente

4. **Resultados**: 
   - Estudiantes ven % por opción + top 10 más rápidos (si hay respuesta correcta)
   - Admin ve stats y puede exportar

## API endpoints (sin auth, demo)

```bash
# Alumno: Entrar
curl -X POST http://localhost:3000/api/demo/join \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan"}'

# Alumno: Ver ronda actual
curl http://localhost:3000/api/demo/round/current

# Alumno: Responder
curl -X POST http://localhost:3000/api/demo/round/answer \
  -H "Content-Type: application/json" \
  -d '{"participantId":"<id>","option":"A"}'

# Admin: Crear ronda
curl -X POST http://localhost:3000/api/admin/round/create \
  -H "Content-Type: application/json" \
  -d '{
    "question": "¿Capital de Ecuador?",
    "optionA": "Quito",
    "optionB": "Guayaquil",
    "optionC": "Cuenca",
    "optionD": "Loja",
    "correctOption": "A",
    "durationMs": 15000
  }'

# Admin: Abrir ronda
curl -X POST http://localhost:3000/api/admin/round/open \
  -H "Content-Type: application/json" \
  -d '{"roundId":"<roundId>"}'

# Admin: Cerrar ronda
curl -X POST http://localhost:3000/api/admin/round/close \
  -H "Content-Type: application/json" \
  -d '{"roundId":"<roundId>"}'

# Admin: Listar rondas
curl http://localhost:3000/api/admin/round/list

# Admin/Público: Ver resultados
curl "http://localhost:3000/api/demo/round/results?roundId=<roundId>"
```

## Deploy a Vercel

1. Crea una BD en Vercel: Storage → Create Database → Postgres
2. Copia la connection string a `DATABASE_URL` en env vars de Vercel
3. Deploy:
```bash
git push
```

Prisma ejecuta `npx prisma generate` automáticamente en `build` (si está en prebuild scripts).
