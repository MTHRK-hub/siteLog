(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  const ym = c.getSelectedCashflowYm();

  function ymToLabel(s) {
    const m = /^(\d{4})-(\d{2})$/.exec(s);
    if (!m) return s;
    return m[1] + "年" + String(parseInt(m[2], 10)) + "月";
  }

  c.updateParentHeader({
    screenId: "SCR-07-04",
    title: "支出実績一覧",
    back: "cashflow-plan",
    showUser: true
  });

  const loginUser = c.getCurrentUser();
  const loginUserId = loginUser ? String(loginUser.id || "").trim() : "";

  const titleEl = document.getElementById("exp-list-title");
  const tbody = document.getElementById("exp-list-body");
  const statusEl = document.getElementById("exp-list-status");
  const deleteDialog = document.getElementById("delete-dialog");
  const deleteDialogMsg = document.getElementById("delete-dialog-msg");
  const btnDeleteOk = document.getElementById("btn-delete-ok");
  const btnDeleteCancel = document.getElementById("btn-delete-cancel");

  let expenditures = [];
  let pendingDeleteId = null;

  function formatAmount(val) {
    const n = parseInt(String(val || "").replace(/[^0-9\-]/g, ""), 10);
    if (Number.isNaN(n)) return "";
    return "¥" + Math.abs(n).toLocaleString("ja-JP");
  }

  function calcTotal(rows) {
    return rows.reduce(function (acc, r) {
      const n = parseInt(String(r["金額"] || "").replace(/[^0-9\-]/g, ""), 10);
      return acc + (Number.isNaN(n) ? 0 : Math.abs(n));
    }, 0);
  }

  function render() {
    const total = calcTotal(expenditures);
    titleEl.textContent = ymToLabel(ym) + " 合計支出 ¥" + total.toLocaleString("ja-JP");

    if (!expenditures.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">データがありません</td></tr>';
      return;
    }

    tbody.innerHTML = expenditures.map(function (r, idx) {
      return "<tr>" +
        "<td>" + c.escapeHtml(r["日付"] || "") + "</td>" +
        "<td>" + c.escapeHtml(r["カテゴリ"] || "") + "</td>" +
        "<td>" + c.escapeHtml(r["種別"] || "") + "</td>" +
        "<td>" + c.escapeHtml(r["内容"] || "") + "</td>" +
        "<td class='amount-cell'>" + c.escapeHtml(formatAmount(r["金額"])) + "</td>" +
        "<td>" + c.escapeHtml(r["備考"] || "") + "</td>" +
        "<td><button class='btn btn-detail btn-edit-exp' data-idx='" + idx + "'>編集</button></td>" +
        "<td><button class='btn btn-danger btn-delete-exp' data-id='" + c.escapeHtml(String(r["id"] || "")) + "'>削除</button></td>" +
        "</tr>";
    }).join("");

    tbody.querySelectorAll(".btn-edit-exp").forEach(function (btn) {
      btn.addEventListener("click", function () {
        alert("支出編集画面は後日実装予定です。");
      });
    });

    tbody.querySelectorAll(".btn-delete-exp").forEach(function (btn) {
      btn.addEventListener("click", function () {
        pendingDeleteId = btn.dataset.id;
        deleteDialogMsg.textContent = "支出データを削除しますか？";
        deleteDialog.removeAttribute("hidden");
      });
    });
  }

  btnDeleteCancel.addEventListener("click", function () {
    deleteDialog.setAttribute("hidden", "");
    pendingDeleteId = null;
  });

  btnDeleteOk.addEventListener("click", async function () {
    deleteDialog.setAttribute("hidden", "");
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    pendingDeleteId = null;
    statusEl.textContent = "削除中...";
    try {
      await c.deleteExpenditure(id);
      expenditures = expenditures.filter(function (r) {
        return String(r["id"] || "") !== String(id);
      });
      render();
      statusEl.textContent = "";
    } catch (err) {
      statusEl.textContent = err && err.message ? err.message : "削除に失敗しました。";
    }
  });

  async function loadExpenditures() {
    if (!ym) {
      statusEl.textContent = "対象年月が選択されていません。";
      return;
    }
    statusEl.textContent = "読み込み中...";
    const result = await c.safeLoadSheetRows("expenditures");
    if (!result.ok) {
      statusEl.textContent = result.message || "支出情報を取得できませんでした。";
      return;
    }

    expenditures = result.rows
      .filter(function (r) {
        return !loginUserId || String(r["ユーザーID"] || "").trim() === loginUserId;
      })
      .map(function (r) { return c.decryptExpenditureRecord(r); })
      .filter(function (r) {
        return String(r["日付"] || "").slice(0, 7) === ym;
      });

    statusEl.textContent = "";
    render();
  }

  loadExpenditures();
})();
