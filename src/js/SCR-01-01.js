(function () {
  const c = window.SiteLogCommon;

  // ヘッダのログアウトボタン経由で遷移した場合はセッションをクリアする
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("logout") === "1") {
    c.setCurrentUser(null);
  }

  // ヘッダ更新: ログイン画面はユーザー名・ログアウト非表示
  c.updateParentHeader({ screenId: "SCR-01-01", title: "現場記録簿", showUser: false });

  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const idInput = document.getElementById("login-id");
  const passwordInput = document.getElementById("login-password");

  // 既にログイン済みならメニューへ（戻る操作などのUX向上）
  if (c.getCurrentUser()) {
    c.navigate("menu");
    return;
  }

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    loginError.textContent = "";
    const id = c.normalizeAuthValue(idInput.value);
    const password = c.normalizeAuthValue(passwordInput.value);

    if (!id || !password) {
      loginError.textContent = "IDとパスワードを入力してください";
      return;
    }

    // ユーザーデータは毎回取得せず、ログイン時だけ取得して照合
    const result = await c.safeLoadSheetRows("users");
    if (!result.ok) {
      loginError.textContent = result.message;
      return;
    }

    function getFirstNonEmpty(obj, keys) {
      for (let i = 0; i < keys.length; i++) {
        const v = obj ? obj[keys[i]] : "";
        if (v != null && String(v).trim() !== "") return v;
      }
      return "";
    }

    const matched = result.rows.find(function (u) {
      // 列名ゆれ（ユーザーID/id 等）を吸収して照合する
      const sheetId = c.normalizeAuthValue(getFirstNonEmpty(u, ["ユーザーID", "id", "ID"]));
      const sheetPw = c.normalizeAuthValue(getFirstNonEmpty(u, ["パスワード", "password", "PW"]));
      return sheetId === id && sheetPw === password;
    });
    if (!matched) {
      loginError.textContent = "IDまたはパスワードが正しくありません";
      return;
    }

    c.setCurrentUser({
      id: matched["ユーザーID"],
      name: matched["ユーザー名"] || matched["ユーザーID"],
      birthDate: matched["生年月日"] || "",
      isAdmin: matched["管理者フラグ"] === "1"
    });
    c.navigate("menu");
  });

  document.getElementById("btn-close-login").addEventListener("click", function () {
    loginError.textContent = "";
    idInput.value = "";
    passwordInput.value = "";
    // フレームページ（SCR-00-00）ごとウィンドウを閉じる
    // コンテンツフレーム内から window.top.close() を呼ぶと
    // ページ遷移後にブラウザがブロックするケースがあるため、
    // 親フレーム（SCR-00-00）へメッセージを送りトップウィンドウ側で close() を実行する
    window.parent.postMessage({ type: "closeApp" }, "*");
  });
})();
