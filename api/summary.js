const pool = require("../db");

module.exports = async function handler(req, res) {
  try {
    const income = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM incomes");
    const expense = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM expenses");

    const totalIncome = Number(income.rows[0].total);
    const totalExpense = Number(expense.rows[0].total);
    const percent = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

    res.status(200).json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      percent,
      warning: percent >= 70
    });
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
  }
};