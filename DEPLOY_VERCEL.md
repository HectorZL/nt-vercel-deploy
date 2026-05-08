# Deploy a Vercel - Guía Paso a Paso

## Opción 1: Deploy desde GitHub (Recomendado)

### 1. Crear repositorio GitHub
```bash
# Si el repo no existe, crear uno en github.com
# Nombre: App-Vercel (o el que prefieras)
```

### 2. Agregar remote y push
```bash
# En la terminal, en el directorio del proyecto:
git remote add origin https://github.com/TU_USUARIO/App-Vercel.git
git branch -M main
git push -u origin main
```

### 3. Conectar en Vercel
1. Ir a https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Click "Import Git Repository"
4. Buscar y seleccionar "App-Vercel"
5. Click "Import"

### 4. Configuración en Vercel
- **Framework Preset**: Next.js (auto-detectado)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

Luego click "Deploy" → ¡Listo!

---

## Opción 2: Deploy desde CLI (Vercel CLI)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

Sigue los prompts:
- Vincula a tu GitHub repo
- Confirma proyecto
- Wait para que termine el build

---

## Opción 3: Deploy directo (sin Git)

```bash
# 1. Instalar CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

---

## Después del Deploy

✅ Tu app estará en: `https://app-vercel-XXXX.vercel.app`

Puedes acceder a:
- Admin: `https://app-vercel-XXXX.vercel.app/admin`
- Estudiantes: `https://app-vercel-XXXX.vercel.app/play`

---

## ¿Si quiero cambios futuros?

Simplemente haz:
```bash
git add .
git commit -m "tu mensaje"
git push origin main
```

Vercel detectará el push y hará auto-deploy automáticamente.

---

## Importante

**Data en-memory**: Vercel reinicia los serverless functions cada ~ 15 min
→ Los datos se pierden cada reinicio
→ **Perfecto para demo/tarea** ✓

Si necesitas persistencia, migra a Postgres (pero ese NO era tu requisito).

---

## Troubleshooting

### Build falla
- Revisa que `npm run build` funcione localmente
- Verifica variables de ambiente (si las hubiera)

### App lenta
- In-memory storage es rápido, no debería haber problema
- Vercel cold starts: primera request puede tardar ~1s

### Qué revisar en Vercel Dashboard
1. https://vercel.com/dashboard
2. Click tu proyecto
3. Tab "Deployments" → última deployment
4. Tab "Logs" → errores del build/runtime
