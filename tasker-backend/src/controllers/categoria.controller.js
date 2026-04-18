const db = require("../config/db");
const { success, error } = require("../utils/response");

const getAll = async (req, res) => {
  try {
    const [categorias] = await db.query(
      "SELECT * FROM categorias WHERE activo = 1 ORDER BY nombre",
    );
    return success(res, categorias);
  } catch (err) {
    return error(res, "Error al obtener categorías", 500);
  }
};

module.exports = { getAll };
