(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({ screenId: "SCR-08-03", title: "イベント登録", showUser: true });

  const form = document.getElementById("event-create-form");
  const errorEl = document.getElementById("event-create-error");
  const selectItem = document.getElementById("select-item");

  function nextId(rows) {
    const maxId = rows.reduce(function (max, row, idx) {
      const id = Number(c.getEventId(row, idx));
      return Number.isFinite(id) ? Math.max(max, id) : max;
    }, 0);
    return String(maxId + 1);
  }

  async function loadItemOptions() {
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
      selectItem.appendChild(opt);
    }
  }

  loadItemOptions();

  const confirmDialog = document.getElementById("confirm-dialog");
  const btnConfirmOk = document.getElementById("btn-confirm-ok");
  const btnConfirmCancel = document.getElementById("btn-confirm-cancel");

  btnConfirmCancel.addEventListener("click", function () {
    confirmDialog.setAttribute("hidden", "");
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorEl.textContent = "";

    const rows = c.getEvents();
    const fd = new FormData(form);
    const currentUser = c.getCurrentUser();
    const timeFrom = String(fd.get("時間From") || "").trim();
    const timeTo = String(fd.get("時間To") || "").trim();
    const time = timeFrom || timeTo ? timeFrom + "～" + timeTo : "";

    const record = {
      id: nextId(rows),
      "日付": String(fd.get("日付") || "").trim(),
      "時間": time,
      "項目": String(fd.get("項目") || "").trim(),
      "場所": String(fd.get("場所") || "").trim(),
      "イベント名": String(fd.get("イベント名") || "").trim(),
      "参加費": String(fd.get("参加費") || "").trim(),
      "URL": String(fd.get("URL") || "").trim(),
      "参加フラグ": String(fd.get("参加フラグ") || "0"),
      "非表示フラグ": "0",
      "ユーザーID": currentUser ? String(currentUser.id || "") : "",
      "最終更新日時": new Date().toISOString().slice(0, 19).replace("T", " ")
    };

    if (!record["日付"]) {
      errorEl.textContent = "日付は必須です。";
      return;
    }
    if (!record["イベント名"]) {
      errorEl.textContent = "イベント名は必須です。";
      return;
    }

    confirmDialog.removeAttribute("hidden");
    btnConfirmOk.onclick = async function () {
      confirmDialog.setAttribute("hidden", "");
      try {
        await c.appendEvent(c.encryptEventRecord(record));
        rows.push(record);
        c.setEvents(rows);
        c.setCompletionInfo({
          title: "イベント登録完了",
          message: "イベントが登録されました。",
          buttonLabel: "一覧に戻る",
          backScreen: "eventList"
        });
        c.navigate("completion");
      } catch (err) {
        errorEl.textContent = err && err.message ? err.message : "登録に失敗しました。";
      }
    };
  });

  document.getElementById("btn-create-cancel").addEventListener("click", function () {
    c.navigate("eventList");
  });
})();
