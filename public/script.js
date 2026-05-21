const API = "/api";

const rupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR"
  }).format(number);
};

/* ================= DASHBOARD ================= */

async function loadDashboard() {
  const totalIncome = document.getElementById("totalIncome");
  if (!totalIncome) return;

  const summary = await fetch(`${API}/summary`).then(res => res.json());

  document.getElementById("totalIncome").innerText = rupiah(summary.totalIncome);
  document.getElementById("totalExpense").innerText = rupiah(summary.totalExpense);

  const status = document.getElementById("financeStatus");

  if (summary.percent >= 70) {
    status.innerText = "Boros";
    status.classList.add("status-boros");
    status.classList.remove("status-terkendali");
    document.getElementById("warningBox").classList.remove("hidden");
  } else {
    status.innerText = "Terkendali";
    status.classList.add("status-terkendali");
    status.classList.remove("status-boros");
    document.getElementById("warningBox").classList.add("hidden");
  }

  loadYearlyChart();
  loadMonthlyChart();
}

async function loadYearlyChart() {
  const data = await fetch(`${API}/chart/yearly`).then(res => res.json());

  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ];

  const incomeData = Array(12).fill(0);
  const expenseData = Array(12).fill(0);

  data.incomes.forEach(item => {
    incomeData[item.month - 1] = Number(item.total);
  });

  data.expenses.forEach(item => {
    expenseData[item.month - 1] = Number(item.total);
  });

  new Chart(document.getElementById("yearlyChart"), {
    type: "line",
    data: {
      labels: months,
      datasets: [
        {
          label: "Pendapatan",
          data: incomeData,
          borderColor: "#007f8f",
          tension: 0.4
        },
        {
          label: "Pengeluaran",
          data: expenseData,
          borderColor: "#d62828",
          tension: 0.4
        }
      ]
    }
  });
}

async function loadMonthlyChart() {
  const data = await fetch(`${API}/chart/monthly`).then(res => res.json());

  new Chart(document.getElementById("monthlyIncomeChart"), {
    type: "bar",
    data: {
      labels: data.income.map(item => item.category),
      datasets: [{
        label: "Pendapatan Bulan Ini",
        data: data.income.map(item => Number(item.total)),
        backgroundColor: "#00a8c6"
      }]
    }
  });

  new Chart(document.getElementById("monthlyExpenseChart"), {
    type: "bar",
    data: {
      labels: data.expense.map(item => item.category),
      datasets: [{
        label: "Pengeluaran Bulan Ini",
        data: data.expense.map(item => Number(item.total)),
        backgroundColor: "#d62828"
      }]
    }
  });
}

/* ================= INCOME ================= */
async function loadIncomes() {
  const table = document.getElementById("incomeTable");
  if (!table) return;

  try {
    const res = await fetch(`${API}/incomes`);
    const data = await res.json();

    if (!res.ok || !Array.isArray(data)) {
      console.error("ERROR API INCOMES:", data);

      table.innerHTML = `
        <tr>
          <td colspan="5" style="color:red;font-weight:700;">
            Gagal mengambil data pendapatan: ${data.error || data.message || "Database error"}
          </td>
        </tr>
      `;
      return;
    }

    table.innerHTML = data.map(item => `
      <tr>
        <td>${item.title}</td>
        <td>${item.category}</td>
        <td>${rupiah(item.amount)}</td>
        <td>${item.date.split("T")[0]}</td>
        <td>
          <button class="action-btn edit-btn" onclick='editIncome(${JSON.stringify(item)})'>Edit</button>
          <button class="action-btn delete-btn" onclick="deleteIncome(${item.id})">Hapus</button>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("FETCH INCOMES ERROR:", err);

    table.innerHTML = `
      <tr>
        <td colspan="5" style="color:red;font-weight:700;">
          Gagal konek ke API. Pastikan server jalan di localhost:3000.
        </td>
      </tr>
    `;
  }
}

function editIncome(item) {
  document.getElementById("incomeId").value = item.id;
  document.getElementById("incomeTitle").value = item.title;
  document.getElementById("incomeCategory").value = item.category;
  document.getElementById("incomeAmount").value = item.amount;
  document.getElementById("incomeDate").value = item.date.split("T")[0];
  document.getElementById("incomeNote").value = item.note || "";
}

async function deleteIncome(id) {
  await fetch(`${API}/incomes/${id}`, { method: "DELETE" });
  loadIncomes();
}

/* ================= EXPENSE ================= */

async function loadExpenses() {
  const table = document.getElementById("expenseTable");
  if (!table) return;

  const data = await fetch(`${API}/expenses`).then(res => res.json());

  table.innerHTML = data.map(item => `
    <tr>
      <td>${item.title}</td>
      <td>${item.category}</td>
      <td>${rupiah(item.amount)}</td>
      <td>${item.date.split("T")[0]}</td>
      <td>
        <button class="action-btn edit-btn" onclick='editExpense(${JSON.stringify(item)})'>Edit</button>
        <button class="action-btn delete-btn" onclick="deleteExpense(${item.id})">Hapus</button>
      </td>
    </tr>
  `).join("");
}

const expenseForm = document.getElementById("expenseForm");

if (expenseForm) {
  expenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("expenseId").value;

    const data = {
      title: document.getElementById("expenseTitle").value,
      category: document.getElementById("expenseCategory").value,
      amount: document.getElementById("expenseAmount").value,
      date: document.getElementById("expenseDate").value,
      note: document.getElementById("expenseNote").value
    };

    if (id) {
      await fetch(`${API}/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } else {
      await fetch(`${API}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    }

    expenseForm.reset();
    document.getElementById("expenseId").value = "";
    loadExpenses();
  });
}

function editExpense(item) {
  document.getElementById("expenseId").value = item.id;
  document.getElementById("expenseTitle").value = item.title;
  document.getElementById("expenseCategory").value = item.category;
  document.getElementById("expenseAmount").value = item.amount;
  document.getElementById("expenseDate").value = item.date.split("T")[0];
  document.getElementById("expenseNote").value = item.note || "";
}

async function deleteExpense(id) {
  await fetch(`${API}/expenses/${id}`, { method: "DELETE" });
  loadExpenses();
}

loadDashboard();
loadIncomes();
loadExpenses();