(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({ screenId: "SCR-04-03", title: "現場記録登録", showUser: true });

  const form = document.getElementById("site-create-form");
  const errorEl = document.getElementById("site-create-error");

  function nextId(rows) {
    const maxId = rows.reduce(function (max, row, idx) {
      const id = Number(c.getSiteLogId(row, idx));
      return Number.isFinite(id) ? Math.max(max, id) : max;
    }, 0);
    return String(maxId + 1);
  }

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

  const confirmDialog = document.getElementById("confirm-dialog");
  const btnConfirmOk = document.getElementById("btn-confirm-ok");
  const btnConfirmCancel = document.getElementById("btn-confirm-cancel");

  btnConfirmCancel.addEventListener("click", function () {
    confirmDialog.setAttribute("hidden", "");
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorEl.textContent = "";

    const rows = c.getSiteLogs();
    const fd = new FormData(form);
    const currentUser = c.getCurrentUser();
    const record = {
      id: nextId(rows),
      "日付": String(fd.get("日付") || "").trim(),
      "項目": String(fd.get("項目") || "").trim(),
      "出会った相手": String(fd.get("出会った相手") || "").trim(),
      "メモ": String(fd.get("メモ") || "").trim(),
      "ToDo": String(fd.get("ToDo") || "").trim(),
      "ユーザーID": currentUser ? String(currentUser.id || "") : "",
      "最終更新日時": new Date().toISOString().slice(0, 19).replace("T", " ")
    };

    if (!record["日付"]) {
      errorEl.textContent = "日付は必須です。";
      return;
    }

    // 確認ダイアログを表示
    confirmDialog.removeAttribute("hidden");
    btnConfirmOk.onclick = async function () {
      confirmDialog.setAttribute("hidden", "");
      try {
        await c.appendSiteLog(c.encryptSiteLogRecord(record));
        rows.push(record);
        c.setSiteLogs(rows);
        c.setCompletionInfo({
          title: "現場記録登録完了",
          message: "現場記録が登録されました。",
          buttonLabel: "一覧に戻る",
          backScreen: "siteList"
        });
        c.navigate("completion");
      } catch (err) {
        errorEl.textContent = err && err.message ? err.message : "登録に失敗しました。";
      }
    };
  });

  document.getElementById("btn-create-cancel").addEventListener("click", function () {
    c.navigate("siteList");
  });
})();
