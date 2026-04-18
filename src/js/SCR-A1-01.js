(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({ screenId: "SCR-A1-01", title: "パスワード変更", back: "menu", showUser: true });

  const currentUser = c.getCurrentUser();

  const phaseVerify = document.getElementById("phase-verify");
  const phaseChange = document.getElementById("phase-change");
  const formVerify = document.getElementById("form-verify");
  const formChange = document.getElementById("form-change");
  const verifyError = document.getElementById("verify-error");
  const changeError = document.getElementById("change-error");
  const confirmDialog = document.getElementById("confirm-dialog");
  const btnConfirmOk = document.getElementById("btn-confirm-ok");
  const btnConfirmCancel = document.getElementById("btn-confirm-cancel");

  // フェーズ1: 現在のパスワード照合
  formVerify.addEventListener("submit", async function (e) {
    e.preventDefault();
    verifyError.textContent = "";

    const currentPw = c.normalizeAuthValue(document.getElementById("input-current-pw").value);
    if (!currentPw) {
      verifyError.textContent = "現在のパスワードを入力してください。";
      return;
    }

    const result = await c.safeLoadSheetRows("users");
    if (!result.ok) {
      verifyError.textContent = result.message;
      return;
    }

    const matched = result.rows.find(function (u) {
      const sheetId = c.normalizeAuthValue(u["ユーザーID"] || u["id"] || u["ID"] || "");
      const sheetPwRaw = c.normalizeAuthValue(u["パスワード"] || u["password"] || u["PW"] || "");
      const sheetPw = c.decrypt(sheetPwRaw);
      return sheetId === String(currentUser.id || "") && sheetPw === currentPw;
    });

    if (!matched) {
      verifyError.textContent = "現在のパスワードが正しくありません。";
      return;
    }

    // フェーズ2へ移行
    phaseVerify.setAttribute("hidden", "");
    phaseChange.removeAttribute("hidden");
  });

  // フェーズ2: 新しいパスワードで変更
  formChange.addEventListener("submit", async function (e) {
    e.preventDefault();
    changeError.textContent = "";

    const newPw = document.getElementById("input-new-pw").value;
    const newPwConfirm = document.getElementById("input-new-pw-confirm").value;

    if (!newPw) {
      changeError.textContent = "新しいパスワードを入力してください。";
      return;
    }
    if (newPw !== newPwConfirm) {
      changeError.textContent = "新しいパスワード（確認用）が一致しません。";
      return;
    }

    // 確認ダイアログを表示
    confirmDialog.removeAttribute("hidden");
    btnConfirmOk.onclick = async function () {
      confirmDialog.setAttribute("hidden", "");
      try {
        await c.updatePassword({
          userId: String(currentUser.id || ""),
          newPassword: c.encrypt(newPw)
        });
        c.setCompletionInfo({
          title: "パスワード変更完了",
          message: "パスワードが変更されました。",
          buttonLabel: "一覧に戻る",
          backScreen: "menu"
        });
        c.navigate("completion");
      } catch (err) {
        changeError.textContent = err && err.message ? err.message : "パスワードの変更に失敗しました。";
      }
    };
  });

  btnConfirmCancel.addEventListener("click", function () {
    confirmDialog.setAttribute("hidden", "");
  });
})();
