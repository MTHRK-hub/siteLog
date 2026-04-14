(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({
    screenId: "SCR-05-01",
    title: "メモ一覧",
    back: "menu",
    showUser: true,
    extraId: "btn-manuscript-create",
    extraLabel: "新規作成",
    extraScreen: "manuscriptCreate"
  });

  const status = document.getElementById("manuscript-load-status");
  const body = document.getElementById("manuscript-list-body");

  function render(rows) {
    body.innerHTML = "";
    rows.forEach(function (manuscript, index) {
      const tr = document.createElement("tr");
      const titleBtn = document.createElement("button");
      titleBtn.type = "button";
      titleBtn.className = "name-link";
      titleBtn.textContent = manuscript["タイトル"] || "";
      titleBtn.addEventListener("click", function () {
        c.setSelectedManuscriptId(c.getManuscriptId(manuscript, index));
        c.navigate("manuscriptDetail");
      });
      const tdTitle = document.createElement("td");
      tdTitle.appendChild(titleBtn);
      const tdUpdated = document.createElement("td");
      tdUpdated.textContent = manuscript["最終更新日時"] || "";
      tr.appendChild(tdTitle);
      tr.appendChild(tdUpdated);
      body.appendChild(tr);
    });
  }

  (async function init() {
    status.textContent = "メモデータを読み込み中...";
    const result = await c.safeLoadSheetRows("manuscripts");
    if (!result.ok) {
      status.textContent = result.message;
      render([]);
      return;
    }
    c.setManuscripts(result.rows);
    status.textContent = "メモデータ " + result.rows.length + "件を表示中";
    render(result.rows);
  })();
})();
