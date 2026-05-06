(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({
    screenId: "SCR-07-01",
    title: "キャッシュフロー計画",
    back: "menu",
    showUser: true,
    extraId: "btn-cashflow-create",
    extraLabel: "新規作成",
    extraScreen: "cashflowCreate",
    extraEnabled: true
  });

  const status = document.getElementById("cashflow-load-status");
  const content = document.getElementById("cashflow-content");
  const cashflowTitle = document.getElementById("cashflow-title");
  const summaryIncome = document.getElementById("summary-income");
  const summaryExpense = document.getElementById("summary-expense");
  const summaryCashflow = document.getElementById("summary-cashflow");
  const incomeBody = document.getElementById("income-list-body");
  const expenseBody = document.getElementById("expense-list-body");
  const monthFilter = document.getElementById("month-filter");

  let allCashflows = [];
  const loginUser = c.getCurrentUser();
  const loginUserId = loginUser ? String(loginUser.id || "").trim() : "";

  function formatAmount(val) {
    const n = parseInt(String(val || "").replace(/[^0-9\-]/g, ""), 10);
    if (Number.isNaN(n)) return "";
    return "¥" + Math.abs(n).toLocaleString("ja-JP");
  }

  function extractYm(ymStr) {
    const s = String(ymStr || "").trim();
    const m1 = /^(\d{4})[-\/](\d{1,2})/.exec(s);
    if (m1) return m1[1] + "-" + String(parseInt(m1[2], 10)).padStart(2, "0");
    const m2 = /^(\d{4})年(\d{1,2})月/.exec(s);
    if (m2) return m2[1] + "-" + String(parseInt(m2[2], 10)).padStart(2, "0");
    return s;
  }

  function ymToLabel(ym) {
    const m = /^(\d{4})-(\d{2})$/.exec(ym);
    if (!m) return ym;
    return m[1] + "年" + String(parseInt(m[2], 10)) + "月";
  }

  function buildMonthOptions(rows) {
    const ymSet = new Set();
    rows.forEach(function (r) {
      const ym = extractYm(r["年月"] || "");
      if (ym) ymSet.add(ym);
    });
    const sorted = Array.from(ymSet).sort(function (a, b) {
      return b.localeCompare(a);
    });

    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = "年月を選択してください。";
    monthFilter.appendChild(emptyOpt);

    sorted.forEach(function (ym) {
      const opt = document.createElement("option");
      opt.value = ym;
      opt.textContent = ymToLabel(ym);
      monthFilter.appendChild(opt);
    });
  }

  const btnEdit = document.getElementById("btn-edit");

  function renderContent(filterYm) {
    if (!filterYm) {
      content.hidden = true;
      btnEdit.disabled = true;
      return;
    }
    btnEdit.disabled = false;

    const rows = allCashflows.filter(function (r) {
      return extractYm(r["年月"] || "") === filterYm;
    });

    cashflowTitle.textContent = ymToLabel(filterYm) + " キャッシュフロー";

    const incomeRows = rows.filter(function (r) { return String(r["収支区分"] || "").trim() === "0"; });
    const expenseRows = rows.filter(function (r) { return String(r["収支区分"] || "").trim() === "1"; });

    function sumAmount(list) {
      return list.reduce(function (acc, r) {
        const n = parseInt(String(r["金額"] || "").replace(/[^0-9\-]/g, ""), 10);
        return acc + (Number.isNaN(n) ? 0 : Math.abs(n));
      }, 0);
    }

    const totalIncome = sumAmount(incomeRows);
    const totalExpense = sumAmount(expenseRows);
    const cashflowVal = totalIncome - totalExpense;

    summaryIncome.textContent = "¥" + totalIncome.toLocaleString("ja-JP");
    summaryExpense.textContent = "¥" + totalExpense.toLocaleString("ja-JP");
    summaryCashflow.textContent = (cashflowVal >= 0 ? "¥" : "-¥") + Math.abs(cashflowVal).toLocaleString("ja-JP");
    summaryCashflow.parentElement.classList.toggle("negative", cashflowVal < 0);

    function sortByBiko(list) {
      return list.slice().sort(function (a, b) {
        return String(a["備考"] || "").localeCompare(String(b["備考"] || ""), "ja");
      });
    }

    function buildRows(list) {
      if (!list.length) {
        return '<tr><td colspan="3" style="text-align:center">データがありません</td></tr>';
      }
      return list.map(function (r) {
        return "<tr>" +
          "<td>" + c.escapeHtml(r["内訳"] || "") + "</td>" +
          "<td class='amount-cell'>" + c.escapeHtml(formatAmount(r["金額"])) + "</td>" +
          "<td>" + c.escapeHtml(r["備考"] || "") + "</td>" +
          "</tr>";
      }).join("");
    }

    incomeBody.innerHTML = buildRows(sortByBiko(incomeRows));
    expenseBody.innerHTML = buildRows(sortByBiko(expenseRows));
    content.hidden = false;
  }

  monthFilter.addEventListener("change", function () {
    renderContent(monthFilter.value);
    document.getElementById("cashflow-delete-row").hidden = !monthFilter.value;
  });

  btnEdit.addEventListener("click", function () {
    const ym = monthFilter.value;
    if (!ym) return;
    c.setSelectedCashflowYm(ym);
    c.navigate("cashflowEdit");
  });

  document.getElementById("btn-expenditure").addEventListener("click", function () {
    const ym = monthFilter.value;
    if (!ym) return;
    c.setSelectedCashflowYm(ym);
    c.navigate("expenditureList");
  });

  const deleteDialog = document.getElementById("delete-dialog");
  const deleteDialogMsg = document.getElementById("delete-dialog-msg");
  const btnDeleteOk = document.getElementById("btn-delete-ok");
  const btnDeleteCancel = document.getElementById("btn-delete-cancel");
  const statusEl = document.getElementById("cashflow-load-status");

  btnDeleteCancel.addEventListener("click", function () {
    deleteDialog.hidden = true;
  });

  document.getElementById("btn-delete").addEventListener("click", function () {
    const ym = monthFilter.value;
    if (!ym) return;
    deleteDialogMsg.textContent = ymToLabel(ym) + "のデータを削除しますか？";
    deleteDialog.hidden = false;
  });

  btnDeleteOk.addEventListener("click", async function () {
    deleteDialog.hidden = true;
    const ym = monthFilter.value;
    if (!ym) return;
    const targets = allCashflows.filter(function (r) {
      return extractYm(r["年月"] || "") === ym;
    });
    statusEl.textContent = "削除中...";
    try {
      for (var i = 0; i < targets.length; i++) {
        await c.deleteCashflow(targets[i].id);
      }
      c.setCompletionInfo({
        title: "キャッシュフロー削除完了",
        message: "キャッシュフローデータが削除されました。",
        buttonLabel: "計画画面に戻る",
        backScreen: "cashflowPlan"
      });
      c.navigate("completion");
    } catch (err) {
      statusEl.textContent = err && err.message ? err.message : "削除に失敗しました。";
    }
  });

  async function loadCashflows() {
    status.textContent = "読み込み中...";
    const result = await c.safeLoadSheetRows("cashflows");
    if (!result.ok) {
      status.textContent = result.message || "キャッシュフロー情報を取得できませんでした。";
      return;
    }
    const filtered = loginUserId
      ? result.rows.filter(function (r) {
          return String(r["ユーザーID"] || "").trim() === loginUserId;
        })
      : result.rows;
    allCashflows = filtered.map(function (r) {
      return c.decryptCashflowRecord(r);
    });
    c.setCashflows(allCashflows);
    status.textContent = "";
    buildMonthOptions(allCashflows);
    renderContent(monthFilter.value);
  }

  loadCashflows();
})();
