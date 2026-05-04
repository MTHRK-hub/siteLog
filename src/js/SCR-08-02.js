(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  const content = document.getElementById("event-detail-content");

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

  const events = c.getEvents();
  const selectedId = c.getSelectedEventId();
  const event = events.find(function (r) {
    return String(r.id || "") === String(selectedId || "");
  }) || null;

  if (!event) {
    content.innerHTML = "<div class='detail-row'><dt>情報</dt><dd>対象データがありません。一覧に戻ってください。</dd></div>";
    return;
  }

  function row(label, value) {
    return "<div class='detail-row'><dt>" + c.escapeHtml(label) +
      "</dt><dd>" + c.escapeHtml(value || "") + "</dd></div>";
  }

  function eventNameRow(name, url) {
    const u = String(url || "").trim();
    if (!u) return row("イベント名", name);
    return "<div class='detail-row'><dt>イベント名</dt><dd>" +
      '<a href="' + c.escapeHtml(u) + '" target="_blank" rel="noopener">' +
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
})();
