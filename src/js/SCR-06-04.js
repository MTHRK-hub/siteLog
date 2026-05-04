(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({ screenId: "SCR-06-04", title: "企画編集", showUser: true });

  const form = document.getElementById("project-edit-form");
  const errorEl = document.getElementById("project-edit-error");
  const rows = c.getProjects();
  const selectedId = c.getSelectedProjectId();
  const found = c.findProjectById(rows, selectedId);

  // sessionStorage には復号済みデータが格納されているのでそのまま使用する
  const project = found ? found.row : null;

  if (!project) {
    errorEl.textContent = "編集対象データがありません。";
    form.querySelectorAll("input, textarea, button").forEach(function (el) {
      if (el.id !== "btn-edit-cancel") el.disabled = true;
    });
  } else {
    // 時間フィールドを「開始～終了」に分割して初期表示
    const timeParts = String(project["時間"] || "").split("～");
    form.elements["日付"].value = project["日付"] || "";
    form.elements["時間From"].value = timeParts[0] ? timeParts[0].trim() : "";
    form.elements["時間To"].value = timeParts[1] ? timeParts[1].trim() : "";
    form.elements["場所"].value = project["場所"] || "";
    form.elements["場所URL"].value = project["場所URL"] || "";

    // 前後の企画の時間を取得してmin/maxを設定
    const projectDate = project["日付"] || "";
    const prevProject = found.index > 0 ? rows[found.index - 1] : null;
    const nextProject = found.index < rows.length - 1 ? rows[found.index + 1] : null;
    function splitTime(timeStr) {
      const p = String(timeStr || "").split(/[~〜～]/);
      return { from: (p[0] || "").trim(), to: (p[1] || "").trim() };
    }
    const prevEndTime = prevProject && (prevProject["日付"] || "") === projectDate
      ? splitTime(prevProject["時間"]).to : "";
    const nextStartTime = nextProject && (nextProject["日付"] || "") === projectDate
      ? splitTime(nextProject["時間"]).from : "";
    if (prevEndTime) form.elements["時間From"].min = prevEndTime;
    if (nextStartTime) form.elements["時間To"].max = nextStartTime;
    form.elements["内容"].value = project["内容"] || "";
    form.elements["説明"].value = project["説明"] || "";
    form.elements["男性参加費"].value = project["男性参加費"] || "";
    form.elements["女性参加費"].value = project["女性参加費"] || "";

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
      const timeFrom = String(fd.get("時間From") || "").trim();
      const timeTo = String(fd.get("時間To") || "").trim();
      const time = timeFrom || timeTo ? timeFrom + "～" + timeTo : "";

      const updated = {
        id: c.getProjectId(project, found.index),
        "日付": String(fd.get("日付") || "").trim(),
        "時間": time,
        "場所": String(fd.get("場所") || "").trim(),
        "場所URL": String(fd.get("場所URL") || "").trim(),
        "内容": String(fd.get("内容") || "").trim(),
        "説明": String(fd.get("説明") || "").trim(),
        "男性参加費": String(fd.get("男性参加費") || "").trim(),
        "女性参加費": String(fd.get("女性参加費") || "").trim(),
        "ユーザーID": currentUser ? String(currentUser.id || "") : "",
        "最終更新日時": new Date().toISOString().slice(0, 19).replace("T", " ")
      };

      if (!updated["日付"]) {
        errorEl.textContent = "日付は必須です。";
        return;
      }

      confirmDialog.removeAttribute("hidden");
      btnConfirmOk.onclick = async function () {
        confirmDialog.setAttribute("hidden", "");
        try {
          await c.updateProject(c.encryptProjectRecord(updated));
          rows[found.index] = updated;
          c.setProjects(rows);
          c.setSelectedProjectId(updated.id);
          c.setCompletionInfo({
            title: "企画編集完了",
            message: "企画が更新されました。",
            buttonLabel: "詳細に戻る",
            backScreen: "projectDetail"
          });
          c.navigate("completion");
        } catch (err) {
          errorEl.textContent = err && err.message ? err.message : "更新に失敗しました。";
        }
      };
    });
  }

  document.getElementById("btn-edit-cancel").addEventListener("click", function () {
    c.navigate("projectDetail");
  });
})();
