(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  const content = document.getElementById("event-detail-content");
  const btnDelete = document.getElementById("btn-event-delete");
  const dialog = document.getElementById("delete-dialog");
  const deleteError = document.getElementById("delete-error");

  const events = c.getEvents();
  const selectedId = c.getSelectedEventId();
  const found = selectedId ? c.findEventById(events, selectedId) : null;
  const event = found ? found.row : null;

  if (!event) {
    c.updateParentHeader({
      screenId: "SCR-08-02",
      title: "イベント詳細",
      back: "event-list",
      showUser: true,
      extraId: "btn-event-edit",
      extraLabel: "編集",
      extraEnabled: false
    });
    content.innerHTML = "<div class='detail-row'><dt>情報</dt><dd>対象データがありません。一覧に戻ってください。</dd></div>";
    btnDelete.disabled = true;
    return;
  }

  c.updateParentHeader({
    screenId: "SCR-08-02",
    title: "イベント詳細",
    back: "event-list",
    showUser: true,
    extraId: "btn-event-edit",
    extraLabel: "編集",
    extraScreen: "eventEdit",
    extraEnabled: true
  });

  function row(label, value) {
    return "<div class='detail-row'><dt>" + c.escapeHtml(label) +
      "</dt><dd>" + c.escapeHtml(value || "") + "</dd></div>";
  }

  function eventNameRow(name, url) {
    const u = String(url || "").trim();
    if (!u) return row("イベント名", name);
    return "<div class='detail-row'><dt>イベント名</dt><dd>" +
      '<a class="name-link" href="' + c.escapeHtml(u) + '" target="_blank" rel="noopener">' +
      c.escapeHtml(String(name || "")) + "</a></dd></div>";
  }

  const participation = String(event["参加フラグ"] || "").trim() === "1" ? "参加" : "不参加";

  content.innerHTML =
    row("日付", c.formatDate(event["日付"])) +
    row("時間", event["時間"]) +
    row("項目", event["項目"]) +
    row("場所", event["場所"]) +
    eventNameRow(event["イベント名"], event["URL"]) +
    row("参加費", event["参加費"]) +
    row("参加/不参加", participation);

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
      const eventId = c.getEventId(event, found.index);
      await c.deleteEvent(eventId);

      const updated = events.filter(function (_, i) { return i !== found.index; });
      c.setEvents(updated);

      c.setCompletionInfo({
        title: "イベント削除完了",
        message: "イベント情報が削除されました。",
        buttonLabel: "一覧に戻る",
        backScreen: "eventList"
      });
      c.navigate("completion");
    } catch (err) {
      deleteError.textContent = err && err.message ? err.message : "削除に失敗しました。";
      btn.disabled = false;
    }
  });
})();
