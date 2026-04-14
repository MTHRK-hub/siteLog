(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  const content = document.getElementById("manuscript-detail-content");

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
})();
