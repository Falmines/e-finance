const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      time: result.rows[0]
    });
  } catch (err) {
    console.error("DB TEST ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/income.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "income.html"));
});

app.get("/expense.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "expense.html"));
});

/* ================= INCOME CRUD ================= */

app.get("/api/incomes", async (req, res) => {
  const result = await pool.query("SELECT * FROM incomes ORDER BY date DESC");
  res.json(result.rows);
});

app.post("/api/incomes", async (req, res) => {
  const { title, category, amount, date, note } = req.body;

  const result = await pool.query(
    "INSERT INTO incomes (title, category, amount, date, note) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [title, category, amount, date, note]
  );

  res.json(result.rows[0]);
});

app.put("/api/incomes/:id", async (req, res) => {
  const { id } = req.params;
  const { title, category, amount, date, note } = req.body;

  const result = await pool.query(
    "UPDATE incomes SET title=$1, category=$2, amount=$3, date=$4, note=$5 WHERE id=$6 RETURNING *",
    [title, category, amount, date, note, id]
  );

  res.json(result.rows[0]);
});

app.delete("/api/incomes/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM incomes WHERE id=$1", [id]);
  res.json({ message: "Pendapatan berhasil dihapus" });
});

/* ================= EXPENSE CRUD ================= */

app.get("/api/expenses", async (req, res) => {
  const result = await pool.query("SELECT * FROM expenses ORDER BY date DESC");
  res.json(result.rows);
});

app.post("/api/expenses", async (req, res) => {
  const { title, category, amount, date, note } = req.body;

  const result = await pool.query(
    "INSERT INTO expenses (title, category, amount, date, note) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [title, category, amount, date, note]
  );

  res.json(result.rows[0]);
});

app.put("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;
  const { title, category, amount, date, note } = req.body;

  const result = await pool.query(
    "UPDATE expenses SET title=$1, category=$2, amount=$3, date=$4, note=$5 WHERE id=$6 RETURNING *",
    [title, category, amount, date, note, id]
  );

  res.json(result.rows[0]);
});

app.delete("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM expenses WHERE id=$1", [id]);
  res.json({ message: "Pengeluaran berhasil dihapus" });
});

/* ================= DASHBOARD SUMMARY ================= */

app.get("/api/summary", async (req, res) => {
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
});

/* ================= YEARLY CHART ================= */

app.get("/api/chart/yearly", async (req, res) => {
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
});

/* ================= MONTHLY CHART ================= */

app.get("/api/chart/monthly", async (req, res) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const income = await pool.query(`
    SELECT category, SUM(amount) AS total
    FROM incomes
    WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
    GROUP BY category
  `, [month, year]);

  const expense = await pool.query(`
    SELECT category, SUM(amount) AS total
    FROM expenses
    WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
    GROUP BY category
  `, [month, year]);

  res.json({
    income: income.rows,
    expense: expense.rows
  });
});

module.exports = app;


