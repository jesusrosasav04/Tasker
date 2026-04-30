const router = require("express").Router();
const { getAll } = require("../controllers/categoria.controller");

// Ruta pública — solo activas
router.get("/", getAll);

module.exports = router;
