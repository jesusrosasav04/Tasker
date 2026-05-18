# API TASKER

Base URL: http://localhost:3000/api

> Todas las rutas protegidas requieren header:
> `Authorization: Bearer <token>`

---

# AUTH

## Registro

POST /auth/register

Body:

```json
{
  "nombre": "string",
  "email": "string",
  "password": "string (min 6 caracteres)",
  "role": "cliente | trabajador",
  "telefono": "string (opcional)"
}
```

Response 201:

```json
{
  "ok": true,
  "data": {
    "token": "jwt",
    "usuario": {
      "id": 1,
      "nombre": "string",
      "email": "string",
      "role": "cliente"
    }
  },
  "message": "Usuario registrado exitosamente"
}
```

---

## Login

POST /auth/login

Body:

```json
{
  "email": "string",
  "password": "string"
}
```

Response 200:

```json
{
  "ok": true,
  "data": {
    "token": "jwt",
    "usuario": {
      "id": 1,
      "nombre": "string",
      "email": "string",
      "role": "cliente | trabajador | admin"
    }
  }
}
```

---

## Login con Google

GET /auth/google

> No requiere body ni token. Redirige al flujo de Google OAuth.

Flujo completo:

1. Frontend redirige al usuario a `GET /auth/google`
2. Google autentica al usuario
3. Backend genera JWT y redirige a:
   `http://localhost:5173/auth/google/success?token=xxx`
4. Frontend captura el token del URL y lo guarda en localStorage

---

## Mi perfil

GET /auth/me 🔒

Response 200:

```json
{
  "ok": true,
  "data": {
    "id": 1,
    "nombre": "string",
    "email": "string",
    "telefono": "string",
    "role": "cliente",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

---

# CATEGORÍAS

## Listar categorías

GET /categorias

Response 200:

```json
{
  "ok": true,
  "data": [
    { "id": 1, "nombre": "Plomería" },
    { "id": 2, "nombre": "Electricidad" }
  ]
}
```

---

# TRABAJADORES

## Listar trabajadores

GET /trabajadores

Query params opcionales:

- `categoria_id=1`
- `page=1`
- `limit=20`

Response 200:

```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "nombre": "string",
      "email": "string",
      "categoria": "Plomería",
      "calificacion_promedio": 4.5
    }
  ]
}
```

---

## Ver perfil de trabajador

GET /trabajadores/:id

Response 200:

```json
{
  "ok": true,
  "data": {
    "id": 1,
    "nombre": "string",
    "descripcion": "string",
    "categoria": "string",
    "calificacion_promedio": 4.5
  }
}
```

---

# TAREAS

## Crear tarea 🔒 (solo cliente)

POST /tareas

Body:

```json
{
  "titulo": "string (min 5, max 150)",
  "descripcion": "string (max 2000)",
  "categoria_id": 1,
  "presupuesto": 500.0,
  "ubicacion": "string (opcional)",
  "latitud": 19.4326077,
  "longitud": -99.1331785
}
```

Response 201:

```json
{
  "ok": true,
  "data": { "tarea_id": 1 },
  "message": "Tarea creada exitosamente"
}
```

---

## Mis tareas 🔒 (solo cliente)

GET /tareas/mis-tareas

Response 200:

```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "titulo": "string",
      "descripcion": "string",
      "presupuesto": 500.0,
      "ubicacion": "string",
      "latitud": 19.4326077,
      "longitud": -99.1331785,
      "estado": "pendiente",
      "categoria": "Plomería",
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## Tareas disponibles 🔒 (solo trabajador)

GET /tareas/disponibles

Query params opcionales:

- `page=1`
- `limit=20`

Response 200:

```json
{
  "ok": true,
  "data": {
    "tareas": [...],
    "page": 1,
    "limit": 20
  }
}
```

---

# POSTULACIONES

## Crear postulación 🔒 (solo trabajador)

POST /postulaciones

Body:

```json
{
  "tarea_id": 1,
  "precio_propuesto": 450.0,
  "mensaje": "string (opcional, max 1000 caracteres)"
}
```

Response 201:

```json
{
  "ok": true,
  "message": "Postulación enviada exitosamente"
}
```

---

## Mis postulaciones 🔒 (solo trabajador)

GET /postulaciones/mis-postulaciones

Response 200:

```json
{
  "ok": true,
  "data": [...]
}
```

---

## Postulaciones por tarea 🔒 (solo cliente)

GET /postulaciones/tarea/:id

Response 200:

```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "trabajador_nombre": "string",
      "precio_propuesto": 450.0,
      "mensaje": "string",
      "estado": "pendiente"
    }
  ]
}
```

---

## Aceptar postulación 🔒 (solo cliente)

PATCH /postulaciones/:id/aceptar

Response 200:

```json
{
  "ok": true,
  "message": "Postulación aceptada"
}
```

---

# GOOGLE MAPS

## Obtener API Key 🔒

GET /config/maps-key

> Requiere token JWT. Nunca pongas la API Key directamente en el frontend.

Response 200:

```json
{
  "ok": true,
  "data": { "apiKey": "AIza..." }
}
```

---

# CÓDIGOS DE ERROR

| Código | Significado                         |
| ------ | ----------------------------------- |
| 400    | Datos inválidos o faltantes         |
| 401    | Token requerido o expirado          |
| 403    | Sin permisos para esta acción       |
| 404    | Recurso no encontrado               |
| 409    | Conflicto (ej. email ya registrado) |
| 413    | Payload demasiado grande            |
| 429    | Demasiadas solicitudes (rate limit) |
| 500    | Error interno del servidor          |

---

# NOTAS IMPORTANTES

- 🔒 = ruta protegida, requiere `Authorization: Bearer <token>`
- El token JWT expira en **7 días**
- Rate limit: **10 intentos** en login/register por 15 minutos
- Rate limit general: **100 requests** por minuto
- Máximo payload: **10kb**
- Paginación disponible con `?page=1&limit=20` (máximo 50 por página)
