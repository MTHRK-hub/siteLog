(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({ screenId: "SCR-04-04", title: "現場記録編集", showUser: true });

  const form = document.getElementById("site-edit-form");
  const errorEl = document.getElementById("site-edit-error");
  const rows = c.getSiteLogs();
  const selectedId = c.getSelectedSiteLogId();
  const found = c.findSiteLogById(rows, selectedId);

  const log = found ? c.decryptSiteLogRecord(found.row) : null;

  if (!log) {
    errorEl.textContent = "編集対象データがありません。";
    form.querySelectorAll("input, select, textarea, button").forEach(function (el) {
      if (el.id !== "btn-edit-cancel") el.disabled = true;
    });
  } else {
    // 項目が MTG/その他 の場合は「出会った相手」を非活性にする
    const selectItem = document.getElementById("select-item");
    const inputPartner = document.getElementById("input-partner");
    function syncPartnerState() {
      const v = selectItem.value;
      const disable = (v === "MTG" || v === "その他");
      inputPartner.disabled = disable;
      if (disable) inputPartner.value = "";
    }
    selectItem.addEventListener("change", syncPartnerState);

    form.elements["日付"].value = log["日付"] || "";
    form.elements["項目"].value = log["項目"] || "";
    syncPartnerState();
    if (!inputPartner.disabled) {
      inputPartner.value = log["出会った相手"] || "";
    }
    form.elements["メモ"].value = log["メモ"] || "";
    form.elements["ToDo"].value = log["ToDo"] || "";

    const confirmDialog = document.getElementById("confirm-dialog");
    const btnConfirmOk = document.getElementById("btn-confirm-ok");
    const btnConfirmCancel = document.getElementById("btn-confirm-cancel");

    btnConfirmCancel.addEventListener("click", function () {
      confirmDialog.setAttribute("hidden", "");
    });

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      errorEl.textContent = "";

      const fd = new FormData(form);
      const currentUser = c.getCurrentUser();
      const updated = {
        id: c.getSiteLogId(log, found.index),
        "日付": String(fd.get("日付") || "").trim(),
        "項目": String(fd.get("項目") || "").trim(),
        "出会った相手": String(fd.get("出会った相手") || "").trim(),
        "メモ": String(fd.get("メモ") || "").trim(),
        "ToDo": String(fd.get("ToDo") || "").trim(),
        "ユーザーID": currentUser ? String(currentUser.id || "") : "",
        "最終更新日時": new Date().toISOString().slice(0, 19).replace("T", " ")
      };

      if (!updated["日付"]) {
        errorEl.textContent = "日付は必須です。";
        return;
      }

      // 確認ダイアログを表示
      confirmDialog.removeAttribute("hidden");
      btnConfirmOk.onclick = async function () {
        confirmDialog.setAttribute("hidden", "");
        try {
          await c.updateSiteLog(c.encryptSiteLogRecord(updated));
          rows[found.index] = updated;
          c.setSiteLogs(rows);
          c.setSelectedSiteLogId(updated.id);
          c.setCompletionInfo({
            title: "現場記録編集完了",
            message: "現場記録が更新されました。",
            buttonLabel: "詳細に戻る",
            backScreen: "siteDetail"
          });
          c.navigate("completion");
        } catch (err) {
          errorEl.textContent = err && err.message ? err.message : "更新に失敗しました。";
        }
      };
    });
  }

  document.getElementById("btn-edit-cancel").addEventListener("click", function () {
    c.navigate("siteDetail");
  });
})();
