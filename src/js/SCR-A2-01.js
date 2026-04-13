(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  // 管理者のみアクセス可
  const currentUser = c.getCurrentUser();
  if (!currentUser || !currentUser.isAdmin) {
    c.navigate("menu");
    return;
  }

  c.updateParentHeader({
    screenId: "SCR-A2-01",
    title: "新規ユーザー一覧",
    back: "menu",
    showUser: true,
    extraId: "btn-user-register",
    extraLabel: "新規登録",
    extraScreen: "userRegister"
  });

  const status = document.getElementById("user-load-status");
  const body = document.getElementById("user-list-body");
  const deleteDialog = document.getElementById("delete-dialog");
  const deleteDialogMsg = document.getElementById("delete-dialog-msg");
  const btnDeleteOk = document.getElementById("btn-delete-ok");
  const btnDeleteCancel = document.getElementById("btn-delete-cancel");

  btnDeleteCancel.addEventListener("click", function () {
    deleteDialog.setAttribute("hidden", "");
  });

  let allRows = [];

  function render(rows) {
    body.innerHTML = "";
    rows.forEach(function (u) {
      const userId = c.escapeHtml(String(u["ユーザーID"] || "").trim());
      const userName = c.escapeHtml(String(u["ユーザー名"] || "").trim());
      const isAdmin = String(u["管理者フラグ"] || "").trim() === "1";
      const badgeHtml = isAdmin
        ? '<span class="badge-admin">あり</span>'
        : '<span class="badge-none">なし</span>';

      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + userId + "</td>" +
        "<td>" + userName + "</td>" +
        "<td>" + badgeHtml + "</td>" +
        "<td><button type='button' class='btn-delete-row' data-user-id='" + userId + "' data-user-name='" + userName + "'>削除</button></td>";
      body.appendChild(tr);
    });

    body.querySelectorAll(".btn-delete-row").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const uid = btn.getAttribute("data-user-id");
        const uname = btn.getAttribute("data-user-name");
        deleteDialogMsg.textContent = uid + "_" + uname + "さんを削除しますか？";
        deleteDialog.removeAttribute("hidden");

        btnDeleteOk.onclick = async function () {
          deleteDialog.setAttribute("hidden", "");
          status.textContent = "削除中...";
          try {
            await c.deleteUser(uid);
            status.textContent = "削除しました。再読み込み中...";
            await loadUsers();
          } catch (err) {
            status.textContent = err && err.message ? err.message : "削除に失敗しました。";
          }
        };
      });
    });
  }

  async function loadUsers() {
    status.textContent = "ユーザーデータを読み込み中...";
    const result = await c.safeLoadSheetRows("users");
    if (!result.ok) {
      status.textContent = result.message;
      render([]);
      return;
    }
    allRows = result.rows;
    status.textContent = "ユーザーデータ " + allRows.length + "件を表示中";
    render(allRows);
  }

  loadUsers();
})();
