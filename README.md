# 🔧 Tasker

> Plataforma que conecta clientes con trabajadores para la contratación de servicios a domicilio.

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow?style=flat-square)
![Rama](https://img.shields.io/badge/rama-develop-blue?style=flat-square)
![Node](https://img.shields.io/badge/Node.js-Express%205-green?style=flat-square&logo=node.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![MySQL](https://img.shields.io/badge/Base%20de%20datos-MySQL-4479A1?style=flat-square&logo=mysql)

---

## ¿Qué es Tasker?

Tasker es una aplicación fullstack donde los **clientes** pueden publicar tareas que necesitan realizar (plomería, electricidad, limpieza, etc.) y los **trabajadores** pueden postularse para realizarlas. El cliente revisa las postulaciones y acepta al trabajador ideal.

---

## 🗂 Estructura del repositorio

```
Tasker/
├── tasker-backend/          # API REST - Node.js + Express + MySQL
└── Tasker-front/
    └── tasker-frontend/     # SPA - React 19 + Vite + TailwindCSS
```

---

## 🛠 Stack tecnológico

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | — | Runtime |
| Express | 5.x | Framework HTTP |
| MySQL2 | 3.x | Base de datos |
| JWT | 9.x | Autenticación |
| Passport + Google OAuth | 0.7 / 2.0 | Autenticación con Google |
| Helmet + CORS + HPP | — | Seguridad |
| express-rate-limit | 8.x | Rate limiting |
| express-validator | 7.x | Validaciones |
| Bcryptjs | 3.x | Hash de contraseñas |
| Multer | 2.x | Subida de archivos |

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | UI |
| Vite | 8.x | Bundler |
| React Router | 7.x | Navegación |
| TailwindCSS | 3.x | Estilos |
| Axios | 1.x | Peticiones HTTP |
| Lucide React | 1.x | Íconos |

---

## 🚀 Instalación y uso local

### Pre-requisitos
- Node.js 18+
- MySQL 8+
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/jesusrosasav04/Tasker.git
cd Tasker
git checkout develop
```

### 2. Configurar el Backend

```bash
cd tasker-backend
npm install
```

Crea un archivo `.env` en `tasker-backend/`:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=tasker
JWT_SECRET=tu_secreto_super_seguro
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
FRONTEND_URL=http://localhost:5173
```

Inicia el servidor:

```bash
npm run dev      # Desarrollo con nodemon
npm start        # Producción
```

El backend corre en `http://localhost:3000`

### 3. Configurar el Frontend

```bash
cd Tasker-front/tasker-frontend
npm install
```

Crea un archivo `.env` en `Tasker-front/tasker-frontend/`:

```env
VITE_API_URL=http://localhost:3000/api
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

El frontend corre en `http://localhost:5173`

---

## 🔑 Roles del sistema

| Rol | Acceso |
|---|---|
| `cliente` | Publica tareas, ve postulaciones, acepta trabajadores |
| `trabajador` | Explora tareas disponibles, se postula, gestiona su trabajo |
| `admin` | Gestiona usuarios, verifica trabajadores, supervisa tareas |

---

## 📡 API — Endpoints principales

### Autenticación
```
POST   /api/auth/register          Registro de usuario
POST   /api/auth/login             Inicio de sesión
GET    /api/auth/google            Login con Google
GET    /api/auth/google/callback   Callback OAuth Google
GET    /api/auth/me                Perfil del usuario autenticado
```

### Tareas
```
GET    /api/tareas/disponibles     Listar tareas disponibles (trabajador)
GET    /api/tareas/mis-tareas      Listar mis tareas (cliente)
POST   /api/tareas                 Crear tarea
```

### Postulaciones
```
POST   /api/postulaciones                        Postularse a una tarea
GET    /api/postulaciones/mis-postulaciones      Ver mis postulaciones
GET    /api/postulaciones/tarea/:id              Ver postulaciones de una tarea
PATCH  /api/postulaciones/:id/aceptar            Aceptar postulación
```

### Trabajadores
```
PUT    /api/trabajadores/perfil            Actualizar perfil
GET    /api/trabajadores/mis-tareas        Ver tareas asignadas
GET    /api/trabajadores/mis-calificaciones  Ver calificaciones
```

### Admin
```
GET    /api/admin/estadisticas                    Estadísticas generales
GET    /api/admin/usuarios                        Listar usuarios
PATCH  /api/admin/usuarios/:id/estado             Activar/desactivar usuario
GET    /api/admin/trabajadores/pendientes          Trabajadores por verificar
PATCH  /api/admin/trabajadores/:id/verificar      Aprobar o rechazar trabajador
GET    /api/admin/tareas                          Listar todas las tareas
```

---

## 🖥 Páginas del frontend

### Públicas
| Ruta | Descripción |
|---|---|
| `/` | Landing page |
| `/login` | Inicio de sesión (+ Google OAuth) |
| `/register` | Registro de nuevo usuario |
| `/auth/google/success` | Callback post-login con Google |
| `/proveedores` | Directorio de trabajadores |

### Cliente (protegidas)
| Ruta | Descripción |
|---|---|
| `/dashboard/cliente` | Panel principal con mis tareas |
| `/dashboard/cliente/tareas/nueva` | Formulario de nueva tarea |
| `/dashboard/cliente/tareas/:id` | Ver postulaciones de una tarea |

### Trabajador (protegidas)
| Ruta | Descripción |
|---|---|
| `/dashboard/trabajador` | Panel con 4 tabs: tareas disponibles, postulaciones, aceptadas, calificaciones |
| `/dashboard/trabajador/perfil` | Editar perfil profesional |

### Admin (protegidas)
| Ruta | Descripción |
|---|---|
| `/admin` | Estadísticas generales del sistema |
| `/admin/usuarios` | Gestión de usuarios (activar/desactivar) |
| `/admin/trabajadores` | Verificación de trabajadores |
| `/admin/tareas` | Supervisión de tareas con filtros |

---

## 🔐 Seguridad implementada

- **JWT** en cada request como `Authorization: Bearer <token>`
- **Helmet** — headers HTTP seguros
- **CORS** — solo permite el origen del frontend
- **HPP** — prevención de HTTP Parameter Pollution
- **express-rate-limit** — límite de peticiones por IP
- **express-mongo-sanitize** — sanitización de inputs
- **Bcryptjs** — hash de contraseñas
- **express-validator** — validación de datos de entrada
- Interceptor automático en frontend: en error `401` limpia el token y redirige a `/login`

---

## 🌿 Flujo de ramas

```
main          ← producción (estable)
  └── develop ← integración (rama activa)
        └── feature/nombre-feature ← desarrollo de features
```

Los Pull Requests siempre van de `feature/*` → `develop`. Nunca directamente a `main`.

---

## 👥 Equipo

| Rol | Área |
|---|---|
| Jesús Rosas | Backend |
| Pablo | Frontend |

---

<div align="center">
  <sub>Tasker © 2025 — Desarrollado con ❤️</sub>
</div>
