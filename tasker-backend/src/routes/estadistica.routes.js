const router = require("express").Router();
const { misEstadisticas } = require("../controllers/estadistica.controller");
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");

router.get("/", verifyToken, verifyRole("cliente", "trabajador"), misEstadisticas);

module.exports = router;
