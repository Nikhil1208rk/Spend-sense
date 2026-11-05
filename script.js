
/* =====================================
   SPENDSENSE - EXPENSE TRACKER
   Currency: Indian Rupees (INR)
===================================== */

// 1. GET HTML ELEMENTS

const transactionForm = document.getElementById("transactionForm");
const budgetForm = document.getElementById("budgetForm");

const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const typeFilter = document.getElementById("typeFilter");
const monthFilter = document.getElementById("monthFilter");
const resetFilter = document.getElementById("resetFilter");

const transactionList = document.getElementById("transactionList");
const expenseChart = document.getElementById("expenseChart");

const STORAGE_KEY = "spendSenseTransactions";
const BUDGET_KEY = "spendSenseMonthlyBudget";


// 2. FORMAT AMOUNTS IN INDIAN RUPEES

function formatRupees(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}


// 3. GET TODAY'S DATE

function getToday() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

dateInput.value = getToday();


// 4. LOAD SAVED TRANSACTIONS

function loadTransactions() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        if (!Array.isArray(saved)) {
            return [];
        }

        return saved.filter((transaction) =>
            transaction &&
            typeof transaction.id === "string" &&
            typeof transaction.title === "string" &&
            Number.isFinite(transaction.amount) &&
            transaction.amount > 0 &&
            ["income", "expense"].includes(transaction.type) &&
            typeof transaction.category === "string" &&
            typeof transaction.date === "string"
        );

    } catch (error) {
        return [];
    }
}

let transactions = loadTransactions();


// 5. LOAD SAVED MONTHLY BUDGET

function loadBudget() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(BUDGET_KEY)
        );

        if (
            saved &&
            typeof saved.amount === "number" &&
            Number.isFinite(saved.amount) &&
            saved.amount > 0
        ) {
            return saved;
        }

    } catch (error) {
        // Use the default budget.
    }

    return { amount: 0 };
}

let budget = loadBudget();


// 6. SAVE TRANSACTIONS

function saveTransactions() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(transactions)
        );

        return true;

    } catch (error) {
        alert("Unable to save data. Check browser storage.");
        return false;
    }
}


// 7. SAVE BUDGET

function saveBudget() {
    try {
        localStorage.setItem(
            BUDGET_KEY,
            JSON.stringify(budget)
        );

        return true;

    } catch (error) {
        alert("Unable to save your budget.");
        return false;
    }
}


// 8. GET CURRENT MONTH

function getCurrentMonth() {
    return getToday().slice(0, 7);
}


// 9. UPDATE FINANCIAL DASHBOARD

function updateSummary() {
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach((transaction) => {

        if (transaction.type === "income") {
            totalIncome += transaction.amount;
        } else {
            totalExpenses += transaction.amount;
        }

    });

    const balance = totalIncome - totalExpenses;
    const savings = totalIncome - totalExpenses;

    document.getElementById("balance").textContent =
        formatRupees(balance);

    document.getElementById("income").textContent =
        formatRupees(totalIncome);

    document.getElementById("expenses").textContent =
        formatRupees(totalExpenses);

    document.getElementById("savings").textContent =
        formatRupees(savings);
}


// 10. CALCULATE CURRENT MONTH'S EXPENSES

function getMonthlyExpenses() {
    const currentMonth = getCurrentMonth();

    return transactions
        .filter((transaction) =>
            transaction.type === "expense" &&
            transaction.date.startsWith(currentMonth)
        )
        .reduce(
            (total, transaction) => total + transaction.amount,
            0
        );
}


// 11. UPDATE MONTHLY BUDGET

function updateBudget() {
    const spent = getMonthlyExpenses();
    const totalBudget = budget.amount;

    document.getElementById("budgetSpent").textContent =
        formatRupees(spent);

    document.getElementById("budgetTotal").textContent =
        formatRupees(totalBudget);

    const progress = document.getElementById("budgetProgress");
    const message = document.getElementById("budgetMessage");

    if (totalBudget <= 0) {
        progress.style.width = "0%";
        progress.style.background = "#7857ff";

        message.textContent =
            "Set a monthly budget to get started.";

        document.getElementById("budgetAmount").value = "";

        return;
    }

    const percentage = (spent / totalBudget) * 100;

    progress.style.width =
        `${Math.min(percentage, 100)}%`;

    if (percentage >= 100) {

        progress.style.background = "#fb5575";

        message.textContent =
            `Budget exceeded by ${formatRupees(spent - totalBudget)}.`;

    } else if (percentage >= 80) {

        progress.style.background = "#ffad5c";

        message.textContent =
            `${percentage.toFixed(1)}% used. You are close to your budget limit!`;

    } else {

        progress.style.background = "#10b981";

        message.textContent =
            `${formatRupees(totalBudget - spent)} remaining this month.`;
    }

    document.getElementById("budgetAmount").value =
        totalBudget;
}


// 12. ADD A NEW TRANSACTION

transactionForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;

    if (
        !title ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !date ||
        date > getToday()
    ) {
        document.getElementById("formMessage").textContent =
            "Enter valid details and a date that is not in the future.";

        return;
    }

    const transaction = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        title: title,
        amount: amount,
        type: type,
        category: category,
        date: date
    };

    transactions.push(transaction);

    if (!saveTransactions()) {
        transactions.pop();
        return;
    }

    transactionForm.reset();

    dateInput.value = getToday();
    typeInput.value = "expense";

    document.getElementById("formMessage").textContent =
        "Transaction added successfully!";

    renderApp();
});


// 13. SET MONTHLY BUDGET

budgetForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const amount = Number(
        document.getElementById("budgetAmount").value
    );

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a budget greater than ₹0.");
        return;
    }

    const previousBudget = budget;

    budget = { amount: amount };

    if (!saveBudget()) {
        budget = previousBudget;
        return;
    }

    updateBudget();
});


// 14. DELETE A TRANSACTION

function deleteTransaction(id) {

    const shouldDelete = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!shouldDelete) {
        return;
    }

    const previousTransactions = transactions;

    transactions = transactions.filter(
        (transaction) => transaction.id !== id
    );

    if (!saveTransactions()) {
        transactions = previousTransactions;
        return;
    }

    renderApp();
}


// 15. FILTER TRANSACTIONS

function getFilteredTransactions() {

    const selectedType = typeFilter.value;
    const selectedMonth = monthFilter.value;

    return transactions
        .filter((transaction) => {

            const matchesType =
                selectedType === "all" ||
                transaction.type === selectedType;

            const matchesMonth =
                !selectedMonth ||
                transaction.date.startsWith(selectedMonth);

            return matchesType && matchesMonth;
        })
        .sort((a, b) => b.date.localeCompare(a.date));
}


// 16. DISPLAY TRANSACTIONS IN THE TABLE

function renderTransactions() {

    transactionList.replaceChildren();

    const filteredTransactions = getFilteredTransactions();

    if (filteredTransactions.length === 0) {

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 6;
        cell.className = "empty-state";
        cell.textContent = "No transactions found.";

        row.appendChild(cell);
        transactionList.appendChild(row);
    }

    filteredTransactions.forEach((transaction) => {

        const row = document.createElement("tr");

        function addCell(value) {
            const cell = document.createElement("td");

            cell.textContent = value;
            row.appendChild(cell);

            return cell;
        }

        addCell(transaction.title);
        addCell(transaction.category);
        addCell(transaction.date);

        // Income or expense badge.
        const typeCell = addCell("");
        const typeBadge = document.createElement("span");

        typeBadge.className =
            `type-badge ${
                transaction.type === "income"
                    ? "type-income"
                    : "type-expense"
            }`;

        typeBadge.textContent =
            transaction.type === "income" ? "Income" : "Expense";

        typeCell.appendChild(typeBadge);

        // Amount with rupee symbol.
        const amountCell = addCell(
            `${transaction.type === "income" ? "+" : "-"}${formatRupees(transaction.amount)}`
        );

        amountCell.className =
            transaction.type === "income"
                ? "amount-income"
                : "amount-expense";

        // Delete button.
        const actionCell = addCell("");
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";

        deleteButton.addEventListener("click", function () {
            deleteTransaction(transaction.id);
        });

        actionCell.appendChild(deleteButton);

        transactionList.appendChild(row);
    });

    document.getElementById("transactionCount").textContent =
        `${filteredTransactions.length} transaction(s)`;
}


// 17. COLOURFUL PIE CHART

function renderExpenseChart() {

    expenseChart.replaceChildren();

    // Add each expense category to the chart data.
    const categoryTotals = {};

    transactions.forEach((transaction) => {

        if (transaction.type === "expense") {

            categoryTotals[transaction.category] =
                (categoryTotals[transaction.category] || 0) +
                transaction.amount;
        }
    });

    // Sort categories from highest expense to lowest.
    const categories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    // Show a message when no expenses exist.
    if (categories.length === 0) {

        const emptyMessage = document.createElement("p");

        emptyMessage.className = "empty-state";
        emptyMessage.textContent =
            "Add expenses to see your colourful pie chart.";

        expenseChart.appendChild(emptyMessage);

        return;
    }

    // Calculate total expenses.
    const totalExpenses = categories.reduce(
        (sum, item) => sum + item[1],
        0
    );

    // Colours for different categories.
    const colors = [
        "#7857ff",
        "#f05bb5",
        "#38bdf8",
        "#10b981",
        "#ffad5c",
        "#fb5575",
        "#818cf8",
        "#14b8a6",
        "#c084fc"
    ];

    // Calculate each pie slice's angle.
    let currentAngle = 0;

    const slices = categories.map(([category, amount], index) => {

        const percentage =
            (amount / totalExpenses) * 100;

        const startAngle = currentAngle;

        currentAngle += (percentage / 100) * 360;

        return {
            category: category,
            amount: amount,
            percentage: percentage,
            startAngle: startAngle,
            endAngle: currentAngle,
            color: colors[index % colors.length]
        };
    });

    // Build the conic gradient for the pie chart.
    const gradient = slices.map((slice) => {

        return `${slice.color} ${slice.startAngle}deg ${slice.endAngle}deg`;

    }).join(", ");

    // Create the chart container.
    const chartWrap = document.createElement("div");

    chartWrap.className = "pie-chart-wrap";

    // Create the circular pie chart.
    const pie = document.createElement("div");

    pie.className = "pie-chart";
    pie.style.background = `conic-gradient(${gradient})`;

    pie.setAttribute("role", "img");

    pie.setAttribute(
        "aria-label",
        `Expense breakdown. Total expenses ${formatRupees(totalExpenses)}`
    );

    // Create the white centre of the pie chart.
    const center = document.createElement("div");

    center.className = "pie-center";

    const centerLabel = document.createElement("span");

    centerLabel.textContent = "Total Expenses";

    const centerAmount = document.createElement("strong");

    centerAmount.textContent = formatRupees(totalExpenses);

    center.append(centerLabel, centerAmount);

    pie.appendChild(center);

    chartWrap.appendChild(pie);

    expenseChart.appendChild(chartWrap);

    // Create the category legend.
    const legend = document.createElement("div");

    legend.className = "chart-legend";

    slices.forEach((slice) => {

        const item = document.createElement("div");

        item.className = "legend-item";

        // Colour indicator.
        const dot = document.createElement("span");

        dot.className = "legend-dot";
        dot.style.background = slice.color;

        // Category details.
        const details = document.createElement("div");

        details.className = "legend-text";

        const name = document.createElement("strong");

        name.textContent = slice.category;

        const amount = document.createElement("span");

        amount.textContent =
            `${formatRupees(slice.amount)} · ${slice.percentage.toFixed(1)}%`;

        details.append(name, amount);

        item.append(dot, details);

        legend.appendChild(item);
    });

    expenseChart.appendChild(legend);
}


// 18. FILTER EVENT LISTENERS

typeFilter.addEventListener("change", renderTransactions);

monthFilter.addEventListener("change", renderTransactions);

resetFilter.addEventListener("click", function () {

    typeFilter.value = "all";
    monthFilter.value = "";

    renderTransactions();
});


// 19. REFRESH THE COMPLETE DASHBOARD

function renderApp() {

    updateSummary();

    updateBudget();

    renderTransactions();

    renderExpenseChart();
}


// 20. INITIALISE THE WEBSITE

renderApp();
