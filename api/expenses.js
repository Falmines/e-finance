const pool = require("../db");

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const result = await pool.query("SELECT * FROM expenses ORDER BY date DESC");
      return res.status(200).json(result.rows);
    }

    if (req.method === "POST") {
      const { title, category, amount, date, note } = req.body;

      const result = await pool.query(
        `INSERT INTO expenses (title, category, amount, date, note)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING *`,
        [title, category, amount, date, note]
      );

      return res.status(200).json(result.rows[0]);
    }

    res.status(405).json({ message: "Method not allowed" });
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
  }
};