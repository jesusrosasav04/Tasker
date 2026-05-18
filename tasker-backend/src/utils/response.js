const success = (res, data, message = null, statusCode = 200) => {
  return res.status(statusCode).json({ ok: true, data, message });
};

const error = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ ok: false, error: message });
};

module.exports = { success, error };
