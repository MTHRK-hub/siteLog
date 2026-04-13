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
    screenId: "SCR-A2-02",
    title: "新規ユーザー登録",
    back: "user-list",
    showUser: true
  });

  const form = document.getElementById("user-register-form");
  const errorEl = document.getElementById("user-register-error");
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
    const userId = String(fd.get("ユーザーID") || "").trim();
    const password = String(fd.get("パスワード") || "").trim();
    const userName = String(fd.get("ユーザー名") || "").trim();
    const birthDate = String(fd.get("生年月日") || "").trim();
    const adminFlag = String(fd.get("管理者フラグ") || "0").trim();

    if (!userId) {
      errorEl.textContent = "ユーザーIDは必須です。";
      return;
    }
    if (!password) {
      errorEl.textContent = "パスワードは必須です。";
      return;
    }
    if (!userName) {
      errorEl.textContent = "ユーザー名は必須です。";
      return;
    }

    confirmDialog.removeAttribute("hidden");
    btnConfirmOk.onclick = async function () {
      confirmDialog.setAttribute("hidden", "");
      try {
        const record = {
          "ユーザーID": userId,
          "パスワード": password,
          "ユーザー名": userName,
          "生年月日": birthDate,
          "管理者フラグ": adminFlag,
          "最終更新日時": new Date().toISOString().slice(0, 19).replace("T", " ")
        };
        await c.appendUser(record);
        c.setCompletionInfo({
          title: "ユーザー登録完了",
          message: "ユーザーが登録されました。",
          buttonLabel: "一覧に戻る",
          backScreen: "userCreate"
        });
        c.navigate("completion");
      } catch (err) {
        errorEl.textContent = err && err.message ? err.message : "登録に失敗しました。";
      }
    };
  });

  document.getElementById("btn-register-cancel").addEventListener("click", function () {
    c.navigate("userCreate");
  });
})();
