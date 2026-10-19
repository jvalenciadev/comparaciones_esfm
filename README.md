# Sistema Comparativo ESFM/UA — Bolivia (Next.js & Vercel)

Aplicación web moderna de alto rendimiento para auditoría, conciliación y control presupuestario de convocatorias docentes y administrativas de las Escuelas Superiores de Formación de Maestros (ESFM) y Unidades Académicas (UA).

---

## 🚀 Despliegue en Vercel y GitHub

### 1. Subir a GitHub
Ejecuta en la terminal del proyecto:
```bash
git init
git add .
git commit -m "feat: migración a Next.js para despliegue en Vercel"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

### 2. Desplegar en Vercel
1. Ingresa a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** -> **"Project"**.
3. Selecciona el repositorio que acabas de subir.
4. Vercel detectará automáticamente el framework **Next.js**.
5. Haz clic en **"Deploy"**. En menos de 1 minuto tendrás tu URL pública (ejemplo: `https://sistema-comparativo.vercel.app`).

---

## 💻 Ejecución Local
- **Opción Rápida:** Haz doble clic en el archivo `iniciar.bat`.
- **Línea de comandos:**
  ```bash
  npm run dev
  ```
  Abre tu navegador en [http://localhost:3000](http://localhost:3000).

---

## 📦 Arquitectura del Sistema
- **Framework:** Next.js (App Router) + React 19 + TypeScript.
- **Procesamiento de Datos:** SheetJS (`xlsx`) en el cliente, eliminando cuellos de botella y restricciones de tiempo de ejecución serverless.
- **Fuentes Soportadas:** Planilla SEP (`PLA0926_DGFM SEPTIEMBRE.xlsx`), DATOS SIFMWEB, GESTIÓN 2023 y OFICIAL PUBLICADO.
- **Exportación:** Generación en vivo de reportes `.xlsx` descargables.
