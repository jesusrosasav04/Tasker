const router = require("express").Router();
const { getMisNotificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = require("../controllers/notificacion.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { param } = require("express-validator");
const validate = require("../middlewares/validate.middleware");

router.get("/",          verifyToken, getMisNotificaciones);
router.get("/no-leidas", verifyToken, noLeidas);
router.patch("/leer-todas", verifyToken, marcarTodasLeidas);
router.patch("/:id/leer",  verifyToken, param("id").isInt({ min: 1 }), validate, marcarLeida);

module.exports = router;
