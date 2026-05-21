const pool = require("../../db");

module.exports = async function handler(req, res) {
  const { id } = req.query;

  try {
    if (req.method === "PUT") {
      const { title, category, amount, date, note } = req.body;

      const result = await pool.query(
        `UPDATE expenses
         SET title=$1, category=$2, amount=$3, date=$4, note=$5
         WHERE id=$6
         RETURNING *`,
        [title, category, amount, date, note, id]
      );

      return res.status(200).json(result.rows[0]);
    }

    if (req.method === "DELETE") {
      await pool.query("DELETE FROM expenses WHERE id=$1", [id]);
      return res.status(200).json({ message: "Pengeluaran berhasil dihapus" });
    }

    res.status(405).json({ message: "Method not allowed" });
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
  }
};