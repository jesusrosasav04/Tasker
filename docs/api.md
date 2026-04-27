# API TASKER

Base URL:
http://localhost:3000/api/v1

---

# AUTH

## Login

POST /auth/login

Body:
{
"email": "string",
"password": "string"
}

Response:
{
"user": {
"id": 1,
"nombre": "string",
"rol": "cliente"
},
"token": "jwt"
}

---

## Registro

POST /auth/register

Body:
{
"nombre": "string",
"email": "string",
"password": "string",
"rol": "cliente | trabajador"
}

Response:
{
"message": "Usuario creado correctamente"
}

---

# USUARIOS

## Obtener usuarios

GET /usuarios

Response:
[
{
"id": 1,
"nombre": "string",
"email": "string",
"rol": "cliente"
}
]

---

# SOLICITUDES

## Crear solicitud

POST /solicitudes

Body:
{
"titulo": "string",
"descripcion": "string",
"ubicacion": "string",
"usuario_id": 1
}

---

## Obtener solicitudes

GET /solicitudes

Response:
[
{
"id": 1,
"titulo": "string",
"descripcion": "string",
"ubicacion": "string"
}
]

---

# NOTAS

- Todas las rutas empiezan con /api/v1
- El login devuelve un token JWT
- Ese token se usará después para proteger rutas
