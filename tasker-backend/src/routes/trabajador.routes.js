const router = require("express").Router();
const { getAll, getById } = require("../controllers/trabajador.controller");

router.get("/", getAll);
router.get("/:id", getById);

module.exports = router;
