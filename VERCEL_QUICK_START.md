# 🚀 Deploy a Vercel en 3 minutos

## ✅ Ya hecho en tu proyecto:
- ✓ Código compilable (Next.js 16.2.6)
- ✓ `package.json` con scripts
- ✓ Commits en Git
- ✓ `vercel.json` configurado
- ✓ `.gitignore` correcto

## 🔗 Pasos para Vercel:

### **Paso 1: Crear repositorio en GitHub** (si no existe)
1. Ve a https://github.com/new
2. Crea repo con nombre "App-Vercel"
3. **NO** inicialices con README/gitignore
4. Copia la URL: `https://github.com/TU_USUARIO/App-Vercel.git`

### **Paso 2: Push tu código a GitHub**
```bash
# En terminal, en tu proyecto:
git remote add origin https://github.com/TU_USUARIO/App-Vercel.git
git branch -M main
git push -u origin main
```

**Verifica**: Ve a tu repo en GitHub y confirma que ves los archivos

### **Paso 3: Conectar a Vercel**
1. Ve a https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Busca "App-Vercel" en el dropdown
5. Click el repo para importarlo

### **Paso 4: Configurar en Vercel**
La mayoría de settings están OK por default:
- **Framework Preset**: Next.js ✓
- **Build Command**: `npm run build` ✓
- **Output Directory**: `.next` ✓
- **Install Command**: `npm install` ✓

**Opcional**: En "Environment Variables" no necesitas nada (in-memory storage)

### **Paso 5: Hacer deploy**
Click **"Deploy"** → Espera ~2-3 min

¡Listo! 🎉 Tu URL será: `https://app-vercel-XXXXXX.vercel.app`

---

## 📱 Acceder a la app:

**Admin Panel** (crear rondas):
```
https://app-vercel-XXXXXX.vercel.app/admin
```

**Estudiantes** (responder preguntas):
```
https://app-vercel-XXXXXX.vercel.app/play
```

---

## 🔄 Futuros cambios:

Simplemente haz:
```bash
git add .
git commit -m "descripción del cambio"
git push origin main
```

**Vercel detectará automáticamente el push y hará deploy** sin hacer nada más ✓

---

## ⚠️ Importante:

**Data en-memory** = se pierde cada reinicio del servidor (~15 min)
- ✓ Perfecto para demos/tareas
- ✓ Cada vez que reinicias, datos se borran
- ✓ Para persistencia: necesitarías migrar a DB (fuera de este scope)

---

## ❓ Troubleshooting:

### Build falla en Vercel
1. En Vercel Dashboard: Click proyecto → "Deployments" → última
2. Revisa la pestaña "Logs" para ver errores
3. Compara con `npm run build` local

### App lenta
- Vercel cold starts (~1s) es normal
- In-memory es rápido, no debería ser bottleneck

### ¿Necesito variable de ambiente?
NO - todo está hardcodeado/en-memory
