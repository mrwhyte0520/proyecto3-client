# Gestor de Proyectos y Tareas — Cliente SPA (React)

Cliente web SPA construido con **React 19 + Vite** que consume la API REST del capstone
(*Gestor de Proyectos y Tareas*). Autenticación con JWT + refresh token, proyectos
colaborativos con roles, tablero Kanban, comentarios y adjuntos.

## URLs de producción

> Completa estas URLs cuando despliegues.

- **SPA (Vercel/Netlify):** `https://<tu-spa>.vercel.app`
- **API (Render):** `https://proyecto3-api.onrender.com/api/v1`
- **Swagger UI:** `https://proyecto3-api.onrender.com/swagger`

## Tecnologías

- React 19 con Hooks (`useState`, `useEffect`, `useContext`) y custom hook (`useFetch`).
- React Router v7 (rutas protegidas + página 404).
- Axios con interceptores: inyección del JWT y **renovación automática con refresh token**
  (single-flight), timeout de 20 s y mensajes de error legibles (ProblemDetails / RFC 7807).
- Context API para el estado de autenticación (`AuthContext`).
- Capa de servicios (`services/`) por recurso, separada de las páginas.
- CSS con variables (tema claro/oscuro automático), diseño responsivo.
- Variables de entorno por ambiente (`.env`, `.env.production`).

## Funcionalidades

- Registro e inicio de sesión con **JWT + refresh token** persistidos en `localStorage`.
  El access token se renueva solo cuando expira; el logout revoca el refresh token en el backend.
- Rutas protegidas: redirige a `/login` si no hay sesión.
- Dashboard con proyectos propios y compartidos (badge con el **rol**: Owner / Editor / Viewer).
- Tablero Kanban (Por hacer / En progreso / Hecho):
  - Crear tareas con prioridad.
  - Mover tareas entre columnas (actualización optimista).
  - **Filtros server-side** por prioridad y por asignado.
  - Modal de detalle: editar título, descripción, estado, prioridad, vencimiento y **asignado**;
    **comentarios** (agregar / eliminar los propios) y **adjuntos** (subir con validación de
    tipo/tamaño en cliente, descargar y eliminar).
- **Gestión de miembros**: invitar por email, cambiar rol y remover (solo Owner).
- La UI se adapta al rol: un Viewer ve todo en solo lectura.
- Página de perfil (`GET /auth/me`) y página 404.
- Indicadores de carga y manejo de errores en todas las llamadas.

## Estructura del proyecto

```
src/
├── api/          client.js        (Axios + interceptores + refresh + getErrorMessage)
├── components/   Navbar, ProtectedRoute, TaskModal
├── context/      AuthContext.jsx  (estado global de sesión)
├── hooks/        useFetch.js      (custom hook reutilizable)
├── services/     projects, tasks, members, comments, attachments
├── pages/        Login, Register, Projects, ProjectBoard, Members, Profile, NotFound
├── App.jsx       (rutas)
└── main.jsx      (bootstrap)
```

## Ejecutar localmente

Requisitos: **Node.js 20+** y la API corriendo (por defecto en `http://localhost:5149`).

```bash
npm install
npm run dev
```

La app queda en `http://localhost:5173`. La URL de la API se toma de `.env`:

```
VITE_API_URL=http://localhost:5149/api/v1
```

Para producción, `.env.production` define la URL pública de la API. Recuerda configurar
el CORS del backend para permitir el origen del SPA desplegado.

## Scripts

- `npm run dev` — servidor de desarrollo con HMR.
- `npm run build` — build de producción en `dist/`.
- `npm run preview` — sirve el build localmente.
- `npm run lint` — Oxlint.

## Credenciales de prueba (datos semilla del backend)

El backend crea automáticamente estos usuarios al iniciar con la base de datos vacía:

| Correo           | Contraseña    | Rol de ejemplo                          |
|------------------|---------------|-----------------------------------------|
| `ana@demo.com`   | `Password123` | Owner del proyecto "Rediseño del sitio" |
| `luis@demo.com`  | `Password123` | Editor invitado en ese proyecto         |

## Despliegue (Vercel)

1. Importa el repositorio en Vercel.
2. Framework preset: **Vite**. Build command: `npm run build`. Output: `dist`.
3. Variable de entorno: `VITE_API_URL = https://<tu-api>/api/v1`.
4. Redeploy. La app queda accesible por HTTPS.
