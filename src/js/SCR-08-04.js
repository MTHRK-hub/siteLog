(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({ screenId: "SCR-08-04", title: "イベント編集", showUser: true });

  const form = document.getElementById("event-edit-form");
  const errorEl = document.getElementById("event-edit-error");
  const selectItem = document.getElementById("select-item");
  const events = c.getEvents();
  const selectedId = c.getSelectedEventId();
  const found = c.findEventById(events, selectedId);
  const event = found ? found.row : null;

  async function loadItemOptions(selectedValue) {
    const result = await c.safeLoadSheetRows("enums");
    if (!result.ok) return;
    const row = result.rows.find(function (r) {
      return String(r["Enum名"] || "").trim() === "イベント項目";
    });
    if (!row) return;
    for (let i = 1; i <= 15; i++) {
      const v = String(row["値" + i] || "").trim();
      if (!v) continue;
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      if (v === selectedValue) opt.selected = true;
      selectItem.appendChild(opt);
    }
  }

  if (!event) {
    errorEl.textContent = "編集対象データがありません。";
    form.querySelectorAll("input, select, button").forEach(function (el) {
      if (el.id !== "btn-edit-cancel") el.disabled = true;
    });
    loadItemOptions("");
  } else {
    const timeParts = String(event["時間"] || "").split("～");
    form.elements["日付"].value = event["日付"] || "";
    form.elements["時間From"].value = timeParts[0] ? timeParts[0].trim() : "";
    form.elements["時間To"].value = timeParts[1] ? timeParts[1].trim() : "";
    form.elements["場所"].value = event["場所"] || "";
    form.elements["イベント名"].value = event["イベント名"] || "";
    form.elements["参加費"].value = event["参加費"] || "";
    form.elements["URL"].value = event["URL"] || "";
    const participationFlag = String(event["参加フラグ"] || "0").trim();
    const radios = form.querySelectorAll('input[name="参加フラグ"]');
    radios.forEach(function (r) { r.checked = r.value === participationFlag; });

    loadItemOptions(event["項目"] || "");

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
        id: c.getEventId(event, found.index),
        "日付": String(fd.get("日付") || "").trim(),
        "時間": time,
        "項目": String(fd.get("項目") || "").trim(),
        "場所": String(fd.get("場所") || "").trim(),
        "イベント名": String(fd.get("イベント名") || "").trim(),
        "参加費": String(fd.get("参加費") || "").trim(),
        "URL": String(fd.get("URL") || "").trim(),
        "参加フラグ": String(fd.get("参加フラグ") || "0"),
        "非表示フラグ": String(event["非表示フラグ"] || "0"),
        "ユーザーID": currentUser ? String(currentUser.id || "") : "",
        "最終更新日時": new Date().toISOString().slice(0, 19).replace("T", " ")
      };

      if (!updated["日付"]) {
        errorEl.textContent = "日付は必須です。";
        return;
      }
      if (!updated["イベント名"]) {
        errorEl.textContent = "イベント名は必須です。";
        return;
      }

      confirmDialog.removeAttribute("hidden");
      btnConfirmOk.onclick = async function () {
        confirmDialog.setAttribute("hidden", "");
        try {
          await c.updateEvent(c.encryptEventRecord(updated));
          events[found.index] = updated;
          c.setEvents(events);
          c.setSelectedEventId(updated.id);
          c.setCompletionInfo({
            title: "イベント編集完了",
            message: "イベントが更新されました。",
            buttonLabel: "詳細に戻る",
            backScreen: "eventDetail"
          });
          c.navigate("completion");
        } catch (err) {
          errorEl.textContent = err && err.message ? err.message : "更新に失敗しました。";
        }
      };
    });
  }

  document.getElementById("btn-edit-cancel").addEventListener("click", function () {
    c.navigate("eventDetail");
  });
})();
