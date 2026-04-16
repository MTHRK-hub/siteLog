(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({ screenId: "SCR-05-03", title: "メモ登録", showUser: true });

  const form = document.getElementById("manuscript-create-form");
  const errorEl = document.getElementById("manuscript-create-error");

  function nextId(rows) {
    const maxId = rows.reduce(function (max, row, idx) {
      const id = Number(c.getManuscriptId(row, idx));
      return Number.isFinite(id) ? Math.max(max, id) : max;
    }, 0);
    return String(maxId + 1);
  }

  const confirmDialog = document.getElementById("confirm-dialog");
  const btnConfirmOk = document.getElementById("btn-confirm-ok");
  const btnConfirmCancel = document.getElementById("btn-confirm-cancel");

  btnConfirmCancel.addEventListener("click", function () {
    confirmDialog.setAttribute("hidden", "");
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorEl.textContent = "";

    const rows = c.getManuscripts();
    const fd = new FormData(form);
    const currentUser = c.getCurrentUser();
    const record = {
      id: nextId(rows),
      "タイトル": String(fd.get("タイトル") || "").trim(),
      "メモ": String(fd.get("メモ") || "").trim(),
      "ユーザーID": currentUser ? String(currentUser.id || "") : "",
      "最終更新日時": new Date().toISOString().slice(0, 19).replace("T", " ")
    };

    if (!record["タイトル"]) {
      errorEl.textContent = "タイトルは必須です。";
      return;
    }

    confirmDialog.removeAttribute("hidden");
    btnConfirmOk.onclick = async function () {
      confirmDialog.setAttribute("hidden", "");
      try {
        await c.appendManuscript(c.encryptManuscriptRecord(record));
        rows.push(record);
        c.setManuscripts(rows);
        c.setSelectedManuscriptId(record.id);
        c.setCompletionInfo({
          title: "メモ登録完了",
          message: "メモが登録されました。",
          buttonLabel: "一覧に戻る",
          backScreen: "manuscriptList"
        });
        c.navigate("completion");
      } catch (err) {
        errorEl.textContent = err && err.message ? err.message : "登録に失敗しました。";
      }
    };
  });

  document.getElementById("btn-create-cancel").addEventListener("click", function () {
    c.navigate("manuscriptList");
  });
})();
