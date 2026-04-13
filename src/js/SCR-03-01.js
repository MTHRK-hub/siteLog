(function () {
  const c = window.SiteLogCommon;
  // 画面HTML分割のため、一覧→詳細の受け渡しは sessionStorage に保存して遷移する
  if (!c.requireLogin()) return;

  c.updateParentHeader({
    screenId: "SCR-03-01",
    title: "友達一覧",
    back: "menu",
    showUser: true,
    extraId: "btn-friend-create",
    extraLabel: "新規登録",
    extraScreen: "friendCreate"
  });

  const status = document.getElementById("friend-load-status");
  const body = document.getElementById("friend-list-body");

  const loginUser = c.getCurrentUser();

  function render(rows) {
    body.innerHTML = "";
    rows.forEach(function (f, index) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td><button type='button' class='name-link' data-friend-index='" + index + "'>" + c.escapeHtml(f["名前"]) + "</button></td>" +
        "<td>" + c.escapeHtml(c.calcAge(f, loginUser)) + "</td>" +
        "<td>" + c.escapeHtml(f["性別"]) + "</td>" +
        "<td>" + c.escapeHtml(f["職業"]) + "</td>";
      body.appendChild(tr);
    });
    body.querySelectorAll("[data-friend-index]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        // 選択行インデックスを保存して詳細画面へ
        const index = Number(btn.getAttribute("data-friend-index"));
        c.setSelectedFriendIndex(index);
        c.setSelectedFriendId(c.getFriendId(rows[index], index));
        c.navigate("friendDetail");
      });
    });
  }

  (async function init() {
    // 表示のたびに最新を取りたいので、一覧画面遷移時に読み込む
    status.textContent = "友達データを読み込み中...";

    // birthDate未設定（ログイン後に列追加などでセッションが古い場合）はシートから再取得
    if (!loginUser.birthDate) {
      const userResult = await c.safeLoadSheetRows("users");
      if (userResult.ok) {
        const userId = loginUser.id ? String(loginUser.id) : "";
        const userRow = userResult.rows.find(function (r) {
          return String(r["ユーザーID"] || "").trim() === userId;
        });
        if (userRow && userRow["生年月日"]) {
          loginUser.birthDate = String(userRow["生年月日"]).trim();
          loginUser.isAdmin = String(userRow["管理者フラグ"] || "") === "1";
          c.setCurrentUser(loginUser);
        }
      }
    }

    const result = await c.safeLoadSheetRows("friends");
    if (!result.ok) {
      status.textContent = result.message;
      render([]);
      return;
    }
    const decryptedRows = result.rows.map(function (r) { return c.decryptFriendRecord(r); });
    c.setFriends(decryptedRows);
    const loginUserId = loginUser.id ? String(loginUser.id) : "";
    const filtered = decryptedRows.filter(function (r) {
      return String(r["ユーザーID"] || "").trim() === loginUserId;
    });
    status.textContent = "友達データ " + filtered.length + "件を表示中";
    render(filtered);
  })();
})();
