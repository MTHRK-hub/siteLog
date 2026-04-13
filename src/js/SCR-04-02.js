(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  const content = document.getElementById("site-detail-content");
  const btnDelete = document.getElementById("btn-site-delete");
  const dialog = document.getElementById("delete-dialog");
  const deleteError = document.getElementById("delete-error");

  const rows = c.getSiteLogs();
  const selectedId = c.getSelectedSiteLogId();
  const found = selectedId ? c.findSiteLogById(rows, selectedId) : null;
  const index = found ? found.index : c.getSelectedSiteLogIndex();
  const rawLog = found ? found.row : rows[index];
  const log = rawLog ? c.decryptSiteLogRecord(rawLog) : rawLog;

  if (!log) {
    c.updateParentHeader({
      screenId: "SCR-04-02",
      title: "現場記録詳細",
      back: "site-list",
      showUser: true,
      extraId: "btn-site-edit",
      extraLabel: "編集",
      extraScreen: "siteEdit",
      extraEnabled: false
    });
    content.innerHTML = "<div class='detail-row'><dt>情報</dt><dd>対象データがありません。一覧に戻ってください。</dd></div>";
    btnDelete.disabled = true;
    return;
  }

  c.updateParentHeader({
    screenId: "SCR-04-02",
    title: "現場記録詳細",
    back: "site-list",
    showUser: true,
    extraId: "btn-site-edit",
    extraLabel: "編集",
    extraScreen: "siteEdit"
  });

  const hidePartner = (log["項目"] === "MTG" || log["項目"] === "その他");
  content.innerHTML =
    "<div class='detail-row'><dt>日付</dt><dd>" + c.escapeHtml(c.formatDate(log["日付"])) + "</dd></div>" +
    "<div class='detail-row'><dt>項目</dt><dd>" + c.escapeHtml(log["項目"]) + "</dd></div>" +
    (hidePartner ? "" : "<div class='detail-row'><dt>出会った相手</dt><dd>" + c.escapeHtml(log["出会った相手"]) + "</dd></div>") +
    "<div class='detail-row'><dt>メモ</dt><dd>" + c.escapeHtml(log["メモ"]) + "</dd></div>" +
    "<div class='detail-row'><dt>ToDo</dt><dd>" + c.escapeHtml(log["ToDo"]) + "</dd></div>";

  // 削除ボタン: 確認ダイアログを表示
  btnDelete.addEventListener("click", function () {
    deleteError.textContent = "";
    dialog.hidden = false;
  });

  document.getElementById("btn-delete-cancel").addEventListener("click", function () {
    dialog.hidden = true;
  });

  document.getElementById("btn-delete-confirm").addEventListener("click", async function () {
    deleteError.textContent = "";
    const btn = document.getElementById("btn-delete-confirm");
    btn.disabled = true;

    try {
      const logId = c.getSiteLogId(log, index);
      await c.deleteSiteLog(logId);

      const updated = rows.filter(function (_, i) { return i !== index; });
      c.setSiteLogs(updated);

      c.setCompletionInfo({
        title: "現場記録削除完了",
        message: "現場記録が削除されました。",
        buttonLabel: "一覧に戻る",
        backScreen: "siteList"
      });
      c.navigate("completion");
    } catch (err) {
      deleteError.textContent = err && err.message ? err.message : "削除に失敗しました。";
      btn.disabled = false;
    }
  });
})();
