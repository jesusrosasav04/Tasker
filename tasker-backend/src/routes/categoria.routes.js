const router = require("express").Router();
const { getAll } = require("../controllers/categoria.controller");

router.get("/", getAll);

module.exports = router;
