const { validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      ok: false,
      error: errors.array()[0].msg, // devuelve solo el primer error
    });
  }
  next();
};

module.exports = validate;
