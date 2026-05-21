const pool = require("../../db");

module.exports = async function handler(req, res) {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const income = await pool.query(`
      SELECT category, SUM(amount) AS total
      FROM incomes
      WHERE EXTRACT(MONTH FROM date) = $1
      AND EXTRACT(YEAR FROM date) = $2
      GROUP BY category
    `, [month, year]);

    const expense = await pool.query(`
      SELECT category, SUM(amount) AS total
      FROM expenses
      WHERE EXTRACT(MONTH FROM date) = $1
      AND EXTRACT(YEAR FROM date) = $2
      GROUP BY category
    `, [month, year]);

    res.status(200).json({
      income: income.rows,
      expense: expense.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
  }
};