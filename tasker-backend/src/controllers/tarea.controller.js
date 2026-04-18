const db = require("../config/db");
const { success, error } = require("../utils/response");

const crear = async (req, res) => {
  const { Titulo, Descripcion, CategoriaID, direccion, MontoAcordado } =
    req.body;

  if (!Titulo || !Descripcion || !CategoriaID) {
    return error(res, "Titulo, Descripcion y CategoriaID son requeridos");
  }

  try {
    const [result] = await db.query(
      `
      INSERT INTO tareas (ClienteID, CategoriaID, Titulo, Descripcion, direccion, MontoAcordado, Estado)
      VALUES (?, ?, ?, ?, ?, ?, 'publicada')
    `,
      [
        req.user.id,
        CategoriaID,
        Titulo,
        Descripcion,
        direccion || null,
        MontoAcordado || null,
      ],
    );

    const [tarea] = await db.query("SELECT * FROM tareas WHERE TareaID = ?", [
      result.insertId,
    ]);

    return success(res, tarea[0], 201);
  } catch (err) {
    console.error(err);
    return error(res, "Error al crear tarea", 500);
  }
};

const misTareas = async (req, res) => {
  try {
    const [tareas] = await db.query(
      `
      SELECT t.*, c.nombre AS categoria_nombre
      FROM tareas t
      LEFT JOIN categorias c ON t.CategoriaID = c.CategoriaID
      WHERE t.ClienteID = ? AND t.activo = 1
      ORDER BY t.FechaCreacion DESC
    `,
      [req.user.id],
    );

    return success(res, tareas);
  } catch (err) {
    return error(res, "Error al obtener tareas", 500);
  }
};

const disponibles = async (req, res) => {
  try {
    const [tareas] = await db.query(`
      SELECT t.*, c.nombre AS categoria_nombre
      FROM tareas t
      LEFT JOIN categorias c ON t.CategoriaID = c.CategoriaID
      WHERE t.Estado = 'publicada' AND t.activo = 1
      ORDER BY t.FechaCreacion DESC
      LIMIT 20
    `);
    return success(res, tareas);
  } catch (err) {
    return error(res, "Error al obtener tareas", 500);
  }
};

module.exports = { crear, misTareas, disponibles };
