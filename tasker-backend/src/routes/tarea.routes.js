const router = require("express").Router();
const {
  crear,
  misTareas,
  disponibles,
} = require("../controllers/tarea.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, crear);
router.get("/mis-tareas", verifyToken, misTareas);
router.get("/disponibles", verifyToken, disponibles);

module.exports = router;
