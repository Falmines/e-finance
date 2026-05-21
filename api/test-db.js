const pool = require("../db");

module.exports = async function handler(req, res) {
  try {
    const result = await pool.query("SELECT NOW()");
    res.status(200).json({
      success: true,
      message: "Database berhasil konek",
      time: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      code: err.code
    });
  }
};