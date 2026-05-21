const pool = require("../../db");

module.exports = async function handler(req, res) {
  try {
    const year = new Date().getFullYear();

    const incomes = await pool.query(`
      SELECT EXTRACT(MONTH FROM date) AS month, SUM(amount) AS total
      FROM incomes
      WHERE EXTRACT(YEAR FROM date) = $1
      GROUP BY month
      ORDER BY month
    `, [year]);

    const expenses = await pool.query(`
      SELECT EXTRACT(MONTH FROM date) AS month, SUM(amount) AS total
      FROM expenses
      WHERE EXTRACT(YEAR FROM date) = $1
      GROUP BY month
      ORDER BY month
    `, [year]);

    res.status(200).json({
      incomes: incomes.rows,
      expenses: expenses.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
  }
};