const express = require("express");
const cors = require("cors");
const pool = require("../db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
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
});

app.get("/api/incomes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM incomes ORDER BY date DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
  }
});

app.post("/api/incomes", async (req, res) => {
  try {
    const { title, category, amount, date, note } = req.body;

    const result = await pool.query(
      "INSERT INTO incomes (title, category, amount, date, note) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [title, category, amount, date, note]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
  }
});

app.get("/api/expenses", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM expenses ORDER BY date DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
  }
});

app.post("/api/expenses", async (req, res) => {
  try {
    const { title, category, amount, date, note } = req.body;

    const result = await pool.query(
      "INSERT INTO expenses (title, category, amount, date, note) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [title, category, amount, date, note]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
  }
});

app.get("/api/summary", async (req, res) => {
  try {
    const income = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM incomes");
    const expense = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM expenses");

    const totalIncome = Number(income.rows[0].total);
    const totalExpense = Number(expense.rows[0].total);
    const percent = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      percent,
      warning: percent >= 70
    });
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
  }
});

app.get("/api/chart/yearly", async (req, res) => {
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

    res.json({
      incomes: incomes.rows,
      expenses: expenses.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
  }
});

app.get("/api/chart/monthly", async (req, res) => {
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

    res.json({
      income: income.rows,
      expense: expense.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code });
  }
});

module.exports = app;