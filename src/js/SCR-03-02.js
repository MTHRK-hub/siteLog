(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  const content = document.getElementById("friend-detail-content");
  const btnDelete = document.getElementById("btn-friend-delete");
  const dialog = document.getElementById("delete-dialog");
  const dialogMsg = document.getElementById("delete-dialog-msg");
  const deleteError = document.getElementById("delete-error");

  const friends = c.getFriends();
  const selectedId = c.getSelectedFriendId();
  const found = selectedId ? c.findFriendById(friends, selectedId) : null;
  const index = found ? found.index : c.getSelectedFriendIndex();
  const rawFriend = found ? found.row : friends[index];
  const friend = rawFriend ? c.decryptFriendRecord(rawFriend) : rawFriend;

  if (!friend) {
    c.updateParentHeader({
      screenId: "SCR-03-02",
      title: "友達詳細",
      back: "friend-list",
      showUser: true,
      extraId: "btn-friend-edit",
      extraLabel: "編集",
      extraScreen: "friendEdit",
      extraEnabled: false
    });
    content.innerHTML = "<div class='detail-row'><dt>情報</dt><dd>対象データがありません。一覧に戻ってください。</dd></div>";
    btnDelete.disabled = true;
    return;
  }

  c.updateParentHeader({
    screenId: "SCR-03-02",
    title: "友達詳細",
    back: "friend-list",
    showUser: true,
    extraId: "btn-friend-edit",
    extraLabel: "編集",
    extraScreen: "friendEdit"
  });

  let loginUser = c.getCurrentUser();

  async function refreshLoginUserIfNeeded() {
    if (loginUser.birthDate) return;
    const userResult = await c.safeLoadSheetRows("users");
    if (!userResult.ok) return;
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

  refreshLoginUserIfNeeded().then(function () {
    content.innerHTML =
      "<div class='detail-row'><dt>名前</dt><dd>" + c.escapeHtml(friend["名前"]) + "</dd></div>" +
      "<div class='detail-row'><dt>LINE名</dt><dd>" + c.escapeHtml(friend["LINE名"]) + "</dd></div>" +
      "<div class='detail-row'><dt>年齢</dt><dd>" + c.escapeHtml(c.calcAge(friend, loginUser)) + "</dd></div>" +
      (friend["生年月日"] ? "<div class='detail-row'><dt>生年月日</dt><dd>" + c.escapeHtml(friend["生年月日"]) + "</dd></div>" : "") +
      "<div class='detail-row'><dt>性別</dt><dd>" + c.escapeHtml(friend["性別"]) + "</dd></div>" +
      "<div class='detail-row'><dt>職業</dt><dd>" + c.escapeHtml(friend["職業"]) + "</dd></div>" +
      "<div class='detail-row'><dt>出会った日</dt><dd>" + c.escapeHtml(c.formatDate(friend["出会った日"])) + "</dd></div>" +
      "<div class='detail-row'><dt>出会った場所</dt><dd>" + c.escapeHtml(friend["出会った場所"]) + "</dd></div>" +
      "<div class='detail-row'><dt>相手の情報</dt><dd>" + c.escapeHtml(friend["相手の情報"]) + "</dd></div>" +
      "<div class='detail-row'><dt>今後の予定</dt><dd>" + c.escapeHtml(friend["今後の予定"]) + "</dd></div>";

    // 削除ボタン: 確認ダイアログを表示
    btnDelete.addEventListener("click", function () {
      dialogMsg.textContent = "「" + (friend["名前"] || "") + "」さんのデータを削除しますか？";
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
        const friendId = c.getFriendId(friend, index);
        await c.deleteFriend(friendId);

        // ローカルキャッシュから削除
        const updated = friends.filter(function (_, i) { return i !== index; });
        c.setFriends(updated);

        c.setCompletionInfo({
          title: "友達削除完了",
          message: "友達情報が削除されました。",
          buttonLabel: "一覧に戻る",
          backScreen: "friendList"
        });
        c.navigate("completion");
      } catch (err) {
        deleteError.textContent = err && err.message ? err.message : "削除に失敗しました。";
        btn.disabled = false;
      }
    });
  });
})();
