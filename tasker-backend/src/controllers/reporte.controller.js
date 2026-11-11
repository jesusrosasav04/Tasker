const fs = require("fs");
const db = require("../config/db");
const { success, error } = require("../utils/response");
const { encrypt, decrypt } = require("../config/encryption");
const { rutaArchivo } = require("../middlewares/upload.middleware");
const { crearNotificacion } = require("./notificacion.controller");

const ESTADOS_DISPUTABLES = ["en_progreso", "completada"];

const notificarAdmins = async (mensaje) => {
  const [admins] = await db.query(
    `SELECT u.id FROM usuarios u JOIN roles r ON u.role_id = r.id WHERE r.nombre = 'admin' AND u.estado = 1`
  );
  for (const a of admins) crearNotificacion(a.id, mensaje);
};

// Tarea + sus dos participantes (cliente y trabajador aceptado; postulaciones.trabajador_id = usuarios.id)
const getTareaConParticipantes = async (conn, tarea_id, bloquear = false) => {
  const [rows] = await conn.query(
    `SELECT t.id, t.titulo, t.estado, t.cliente_id, p.trabajador_id
     FROM tareas t
     LEFT JOIN postulaciones p ON p.tarea_id = t.id AND p.estado = 'aceptada'
     WHERE t.id = ? ${bloquear ? "FOR UPDATE" : ""}`,
    [tarea_id]
  );
  return rows[0] || null;
};

// Carga un reporte si el usuario puede verlo (creador o admin)
const getReporteAccesible = async (id, user) => {
  const [rows] = await db.query(
    `SELECT r.id, r.tarea_id, r.tipo, r.creado_por, r.motivo, r.imagen, r.disputa,
            r.estado, r.resolucion, r.created_at, r.updated_at,
            u.nombre AS creador_nombre, u.email AS creador_email, ro.nombre AS creador_rol,
            t.titulo AS tarea_titulo, t.estado AS tarea_estado
     FROM reportes r
     JOIN usuarios u ON r.creado_por = u.id
     JOIN roles ro ON u.role_id = ro.id
     LEFT JOIN tareas t ON r.tarea_id = t.id
     WHERE r.id = ?`,
    [id]
  );
  const r = rows[0];
  if (!r || (user.role !== "admin" && r.creado_por !== user.id)) return null;
  return r;
};

// POST /api/reportes — crear reporte (con o sin tarea, opcionalmente abre disputa)
const crearReporte = async (req, res) => {
  const usuario_id = req.user.id;
  const { tipo, motivo } = req.body;
  const tarea_id = req.body.tarea_id ? Number(req.body.tarea_id) : null;
  const disputa = req.body.disputa === "true" || req.body.disputa === "1";
  const imagen = req.file ? `reportes/${req.file.filename}` : null;

  if (disputa && !tarea_id) {
    return error(res, "Para abrir una disputa elige la tarea", 400);
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    let tarea = null;
    if (tarea_id) {
      tarea = await getTareaConParticipantes(conn, tarea_id, disputa);
      if (!tarea || (tarea.cliente_id !== usuario_id && tarea.trabajador_id !== usuario_id)) {
        await conn.rollback();
        return error(res, "Tarea no encontrada o no participas en ella", 404);
      }
    }

    if (disputa) {
      // La fila de la tarea está bloqueada (FOR UPDATE): dos disputas simultáneas no pueden pasar ambas
      if (tarea.estado === "disputa") {
        await conn.rollback();
        return error(res, "Esta tarea ya tiene una disputa abierta", 409);
      }
      if (!ESTADOS_DISPUTABLES.includes(tarea.estado)) {
        await conn.rollback();
        return error(res, "Solo puedes abrir una disputa en tareas en progreso o completadas", 400);
      }
      await conn.query("UPDATE tareas SET estado = 'disputa' WHERE id = ?", [tarea_id]);
    }

    const [result] = await conn.query(
      `INSERT INTO reportes (tarea_id, tipo, creado_por, motivo, imagen, disputa)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tarea_id, tipo, usuario_id, motivo.trim(), imagen, disputa ? 1 : 0]
    );
    await conn.commit();

    const id = result.insertId;
    notificarAdmins(disputa ? `Nueva disputa en la tarea #${tarea_id} (reporte #${id})` : `Nuevo reporte #${id}: ${tipo}`);
    if (disputa) {
      const otro = usuario_id === tarea.cliente_id ? tarea.trabajador_id : tarea.cliente_id;
      if (otro) crearNotificacion(otro, `Se abrió una disputa en la tarea "${tarea.titulo}". Soporte la revisará.`);
    }

    return success(res, { id }, disputa
      ? "Disputa abierta. Soporte revisará el caso y te escribirá por aquí."
      : "Reporte enviado. Soporte lo revisará pronto.", 201);
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error(err);
    return error(res, "Error al enviar el reporte", 500);
  } finally {
    conn.release();
  }
};

// GET /api/reportes/mis-reportes
const misReportes = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.tipo, r.motivo, r.estado, r.disputa, r.created_at, r.tarea_id,
              t.titulo AS tarea_titulo,
              (SELECT COUNT(*) FROM mensajes m
                WHERE m.reporte_id = r.id AND m.receptor_id = ? AND m.leido = 0) AS mensajes_nuevos
       FROM reportes r
       LEFT JOIN tareas t ON r.tarea_id = t.id
       WHERE r.creado_por = ?
       ORDER BY r.created_at DESC`,
      [req.user.id, req.user.id]
    );
    return success(res, rows);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener tus reportes", 500);
  }
};

// GET /api/reportes/:id — detalle + hilo de soporte (creador o admin)
const getReporte = async (req, res) => {
  try {
    const reporte = await getReporteAccesible(req.params.id, req.user);
    if (!reporte) return error(res, "Reporte no encontrado", 404);

    const [mensajes] = await db.query(
      `SELECT m.id, m.mensaje, m.remitente_id, m.created_at, u.nombre AS remitente_nombre,
              ro.nombre = 'admin' AS es_soporte
       FROM mensajes m
       JOIN usuarios u ON m.remitente_id = u.id
       JOIN roles ro ON u.role_id = ro.id
       WHERE m.reporte_id = ?
       ORDER BY m.created_at ASC, m.id ASC`,
      [reporte.id]
    );

    // Marcar leídos: el usuario lee lo que le escribió soporte; el admin, lo que llegó a soporte
    await db.query(
      req.user.role === "admin"
        ? "UPDATE mensajes SET leido = 1 WHERE reporte_id = ? AND receptor_id IS NULL AND leido = 0"
        : "UPDATE mensajes SET leido = 1 WHERE reporte_id = ? AND receptor_id = ? AND leido = 0",
      [reporte.id, req.user.id]
    );

    return success(res, {
      ...reporte,
      tiene_imagen: !!reporte.imagen,
      imagen: undefined,
      mensajes: mensajes.map((m) => ({ ...m, es_soporte: !!m.es_soporte, mensaje: decrypt(m.mensaje) })),
    });
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener el reporte", 500);
  }
};

// GET /api/reportes/:id/imagen
const getImagen = async (req, res) => {
  try {
    const reporte = await getReporteAccesible(req.params.id, req.user);
    const abs = reporte?.imagen && rutaArchivo(reporte.imagen);
    if (!abs || !fs.existsSync(abs)) return error(res, "Imagen no encontrada", 404);
    res.set("Cache-Control", "no-store");
    return res.sendFile(abs);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener la imagen", 500);
  }
};

// POST /api/reportes/:id/mensajes — escribir en el hilo de soporte
const enviarMensaje = async (req, res) => {
  const { mensaje } = req.body;
  const esAdmin = req.user.role === "admin";

  try {
    const reporte = await getReporteAccesible(req.params.id, req.user);
    if (!reporte) return error(res, "Reporte no encontrado", 404);
    if (reporte.estado === "resuelto")
      return error(res, "Este reporte ya está resuelto. Si el problema sigue, crea uno nuevo.", 400);

    const receptor_id = esAdmin ? reporte.creado_por : null; // null = bandeja de soporte
    const [result] = await db.query(
      `INSERT INTO mensajes (reporte_id, remitente_id, receptor_id, mensaje) VALUES (?, ?, ?, ?)`,
      [reporte.id, req.user.id, receptor_id, encrypt(mensaje.trim())]
    );

    if (esAdmin) {
      crearNotificacion(reporte.creado_por, `Soporte respondió tu reporte #${reporte.id}`);
      // Primera respuesta de soporte: el reporte pasa a "revisado"
      if (reporte.estado === "pendiente")
        await db.query("UPDATE reportes SET estado = 'revisado' WHERE id = ? AND estado = 'pendiente'", [reporte.id]);
    } else {
      notificarAdmins(`Nuevo mensaje en el reporte #${reporte.id}`);
    }

    return success(res, {
      id: result.insertId,
      mensaje: mensaje.trim(),
      remitente_id: req.user.id,
      es_soporte: esAdmin,
      created_at: new Date(),
    }, "Mensaje enviado", 201);
  } catch (err) {
    console.error(err);
    return error(res, "Error al enviar el mensaje", 500);
  }
};

// ── Admin ────────────────────────────────────────────

// GET /api/admin/reportes?estado=&tipo=
const getReportesAdmin = async (req, res) => {
  const { estado, tipo } = req.query;
  const filtros = [];
  const params = [];
  if (estado) { filtros.push("r.estado = ?"); params.push(estado); }
  if (tipo) { filtros.push("r.tipo = ?"); params.push(tipo); }

  try {
    const [rows] = await db.query(
      `SELECT r.id, r.tipo, r.motivo, r.estado, r.disputa, r.created_at, r.tarea_id,
              t.titulo AS tarea_titulo,
              u.nombre AS creador_nombre, ro.nombre AS creador_rol,
              (SELECT COUNT(*) FROM mensajes m
                WHERE m.reporte_id = r.id AND m.receptor_id IS NULL AND m.leido = 0) AS mensajes_nuevos
       FROM reportes r
       JOIN usuarios u ON r.creado_por = u.id
       JOIN roles ro ON u.role_id = ro.id
       LEFT JOIN tareas t ON r.tarea_id = t.id
       ${filtros.length ? "WHERE " + filtros.join(" AND ") : ""}
       ORDER BY (r.estado = 'resuelto'), r.disputa DESC, r.created_at DESC`,
      params
    );
    return success(res, rows);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener reportes", 500);
  }
};

// PATCH /api/admin/reportes/:id — cambiar estado; al resolver una disputa decide cómo queda la tarea
const actualizarReporte = async (req, res) => {
  const { id } = req.params;
  const { estado, resolucion, tarea_estado } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      "SELECT id, tarea_id, creado_por, disputa, estado FROM reportes WHERE id = ? FOR UPDATE",
      [id]
    );
    const reporte = rows[0];
    if (!reporte) {
      await conn.rollback();
      return error(res, "Reporte no encontrado", 404);
    }
    if (reporte.disputa && reporte.estado === "resuelto") {
      await conn.rollback();
      return error(res, "Esta disputa ya se resolvió y no se puede reabrir", 400);
    }

    const resuelveDisputa = reporte.disputa && estado === "resuelto";
    if (resuelveDisputa && !["completada", "cancelada"].includes(tarea_estado)) {
      await conn.rollback();
      return error(res, "Indica cómo queda la tarea: completada o cancelada", 400);
    }
    if (estado === "resuelto" && !resolucion?.trim()) {
      await conn.rollback();
      return error(res, "Escribe la resolución para el usuario", 400);
    }

    await conn.query(
      "UPDATE reportes SET estado = ?, resolucion = COALESCE(?, resolucion) WHERE id = ?",
      [estado, resolucion?.trim() || null, id]
    );

    let tarea = null;
    if (resuelveDisputa) {
      tarea = await getTareaConParticipantes(conn, reporte.tarea_id, true);
      await conn.query("UPDATE tareas SET estado = ? WHERE id = ? AND estado = 'disputa'", [tarea_estado, reporte.tarea_id]);
    }
    await conn.commit();

    if (estado === "resuelto") {
      crearNotificacion(reporte.creado_por, `Tu reporte #${id} fue resuelto: ${resolucion.trim()}`);
      if (tarea) {
        const otro = reporte.creado_por === tarea.cliente_id ? tarea.trabajador_id : tarea.cliente_id;
        if (otro) crearNotificacion(otro, `La disputa de la tarea "${tarea.titulo}" se resolvió: la tarea quedó ${tarea_estado}.`);
      }
    }

    return success(res, null, "Reporte actualizado correctamente");
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error(err);
    return error(res, "Error al actualizar reporte", 500);
  } finally {
    conn.release();
  }
};

module.exports = { crearReporte, misReportes, getReporte, getImagen, enviarMensaje, getReportesAdmin, actualizarReporte };
