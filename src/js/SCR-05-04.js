(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({ screenId: "SCR-05-04", title: "メモ編集", showUser: true });

  const form = document.getElementById("manuscript-edit-form");
  const errorEl = document.getElementById("manuscript-edit-error");
  const manuscripts = c.getManuscripts();
  const selectedId = c.getSelectedManuscriptId();
  const found = c.findManuscriptById(manuscripts, selectedId);

  if (!found) {
    errorEl.textContent = "編集対象データがありません。";
    form.querySelectorAll("input, textarea, button").forEach(function (el) {
      if (el.id !== "btn-edit-cancel") el.disabled = true;
    });
  } else {
    const manuscript = found.row;
    form.elements["タイトル"].value = manuscript["タイトル"] || "";
    form.elements["メモ"].value = manuscript["メモ"] || "";

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
        id: c.getManuscriptId(manuscript, found.index),
        "タイトル": String(fd.get("タイトル") || "").trim(),
        "メモ": String(fd.get("メモ") || "").trim(),
        "ユーザーID": currentUser ? String(currentUser.id || "") : "",
        "最終更新日時": new Date().toISOString().slice(0, 19).replace("T", " ")
      };

      if (!updated["タイトル"]) {
        errorEl.textContent = "タイトルは必須です。";
        return;
      }

      confirmDialog.removeAttribute("hidden");
      btnConfirmOk.onclick = async function () {
        confirmDialog.setAttribute("hidden", "");
        try {
          await c.updateManuscript(c.encryptManuscriptRecord(updated));
          manuscripts[found.index] = updated;
          c.setManuscripts(manuscripts);
          c.setSelectedManuscriptId(updated.id);
          c.setCompletionInfo({
            title: "メモ編集完了",
            message: "メモが更新されました。",
            buttonLabel: "詳細に戻る",
            backScreen: "manuscriptDetail"
          });
          c.navigate("completion");
        } catch (err) {
          errorEl.textContent = err && err.message ? err.message : "更新に失敗しました。";
        }
      };
    });
  }

  document.getElementById("btn-edit-cancel").addEventListener("click", function () {
    c.navigate("manuscriptDetail");
  });
})();
