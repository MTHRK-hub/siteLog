(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  const content = document.getElementById("manuscript-detail-content");
  const btnDelete = document.getElementById("btn-manuscript-delete");
  const dialog = document.getElementById("delete-dialog");
  const deleteError = document.getElementById("delete-error");

  const manuscripts = c.getManuscripts();
  const selectedId = c.getSelectedManuscriptId();
  const found = selectedId ? c.findManuscriptById(manuscripts, selectedId) : null;
  const manuscript = found ? found.row : null;

  if (!manuscript) {
    c.updateParentHeader({
      screenId: "SCR-05-02",
      title: "メモ詳細",
      back: "manuscript-list",
      showUser: true,
      extraId: "btn-manuscript-edit",
      extraLabel: "編集",
      extraScreen: "manuscriptEdit",
      extraEnabled: false
    });
    content.innerHTML = "<div class='detail-row'><dt>情報</dt><dd>対象データがありません。一覧に戻ってください。</dd></div>";
    btnDelete.disabled = true;
    return;
  }

  c.updateParentHeader({
    screenId: "SCR-05-02",
    title: "メモ詳細",
    back: "manuscript-list",
    showUser: true,
    extraId: "btn-manuscript-edit",
    extraLabel: "編集",
    extraScreen: "manuscriptEdit"
  });

  content.innerHTML =
    "<div class='detail-row'><dt>タイトル</dt><dd>" + c.escapeHtml(manuscript["タイトル"]) + "</dd></div>" +
    "<div class='detail-row'><dt>メモ</dt><dd>" + c.escapeHtml(manuscript["メモ"]) + "</dd></div>";

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
      const manuscriptId = c.getManuscriptId(manuscript, found.index);
      await c.deleteManuscript(manuscriptId);

      const updated = manuscripts.filter(function (_, i) { return i !== found.index; });
      c.setManuscripts(updated);

      c.setCompletionInfo({
        title: "メモ削除完了",
        message: "メモが削除されました。",
        buttonLabel: "一覧に戻る",
        backScreen: "manuscriptList"
      });
      c.navigate("completion");
    } catch (err) {
      deleteError.textContent = err && err.message ? err.message : "削除に失敗しました。";
      btn.disabled = false;
    }
  });
})();
