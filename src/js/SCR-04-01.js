(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  // 新規登録ボタンはヘッダ (SCR-00-01) に定義
  c.updateParentHeader({
    screenId: "SCR-04-01",
    title: "現場記録一覧",
    back: "menu",
    showUser: true,
    extraId: "btn-site-create",
    extraLabel: "新規登録",
    extraScreen: "siteCreate"
  });

  const status = document.getElementById("site-load-status");
  const body = document.getElementById("site-list-body");

  function render(rows) {
    body.innerHTML = "";
    rows.forEach(function (log, index) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + c.escapeHtml(c.formatDate(log["日付"])) + "</td>" +
        "<td>" + c.escapeHtml(log["項目"]) + "</td>" +
        "<td><button type='button' class='btn-detail' data-log-index='" + index + "'>詳細</button></td>";
      body.appendChild(tr);
    });
    body.querySelectorAll("[data-log-index]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const idx = Number(btn.getAttribute("data-log-index"));
        c.setSelectedSiteLogIndex(idx);
        c.setSelectedSiteLogId(c.getSiteLogId(rows[idx], idx));
        c.navigate("siteDetail");
      });
    });
  }

  (async function init() {
    status.textContent = "現場記録データを読み込み中...";
    const result = await c.safeLoadSheetRows("siteLogs");
    if (!result.ok) {
      status.textContent = result.message;
      render([]);
      return;
    }
    const decryptedRows = result.rows.map(function (r) { return c.decryptSiteLogRecord(r); });
    c.setSiteLogs(decryptedRows);
    const loginUser = c.getCurrentUser();
    const loginUserId = loginUser ? String(loginUser.id || "") : "";
    const filtered = decryptedRows.filter(function (r) {
      return String(r["ユーザーID"] || "").trim() === loginUserId;
    });
    status.textContent = "現場記録データ " + filtered.length + "件を表示中";
    render(filtered);
  })();
})();
