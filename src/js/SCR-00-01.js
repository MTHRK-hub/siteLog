(function () {
  /**
   * 共通ヘッダ (SCR-00-01) - ヘッダフレーム専用
   *
   * SCR-00-00.html の ① ヘッダ領域 iframe 内で動作する。
   * file:// プロトコルではフレーム間の直接 JS アクセスがブロックされるため、
   * postMessage 経由で SCR-00-00.html (親) からメッセージを受け取る。
   *
   * 受信メッセージ:
   *   { type: "updateHeader", config: { ... } }
   *
   * 送信メッセージ (→ 親 SCR-00-00 へ):
   *   { type: "navigate", screen: "screenKey" }
   *   { type: "logout" }
   *
   * config 仕様:
   *   screenId    : string  - 画面ID (例: "SCR-01-01")
   *   title       : string  - 画面名
   *   back        : string  - "menu" | "friend-list" | "site-list" | "" (空=非表示)
   *   showUser    : boolean - ユーザー名・ログアウトボタンを表示するか
   *   userName    : string  - 表示するユーザー名
   *   extraId     : string  - 右下ボタンの id 属性
   *   extraLabel  : string  - 右下ボタンのラベル
   *   extraScreen : string  - 右下ボタン押下時の遷移先画面キー
   *   extraEnabled: boolean - 右下ボタンの有効/無効 (省略時 true)
   *
   * レイアウト (sample/ヘッダイメージ.png に準拠):
   *   ┌──────────────┬─────────────────┬──────────────┐
   *   │ ① ユーザー名 │  ③ 画面ID (小)  │ ⑤ ログアウト │
   *   │              │  ④ 画面名 (大)  │              │
   *   │ ② 戻るボタン │                 │ ⑥ 追加ボタン │
   *   └──────────────┴─────────────────┴──────────────┘
   */

  var root = document.getElementById("header-root");
  var currentConfig = {};

  // ===========================
  // postMessage 受信
  // ===========================
  window.addEventListener("message", function (event) {
    var data = event.data;
    if (data && data.type === "updateHeader") {
      currentConfig = data.config || {};
      render();
    }
  });

  // ===========================
  // 親フレームへ遷移依頼
  // ===========================
  function navigateMain(screen) {
    window.parent.postMessage({ type: "navigate", screen: screen }, "*");
  }

  function escHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ===========================
  // レンダリング
  // ===========================
  function render() {
    var cfg = currentConfig;
    var screenId     = cfg.screenId     || "";
    var title        = cfg.title        || "";
    var back         = cfg.back         || "";
    var showUser     = !!cfg.showUser;
    var userName     = cfg.userName     || "";
    var extraId      = cfg.extraId      || "";
    var extraLabel   = cfg.extraLabel   || "";
    var extraScreen  = cfg.extraScreen  || "";
    var extraEnabled = cfg.extraEnabled !== false;

    // 上段左: ユーザー名
    var userHtml = showUser
      ? '<span class="user-name js-user-name">' + escHtml(userName) + "</span>"
      : "";

    // 上段右: ログアウトボタン
    var logoutHtml = showUser
      ? '<button type="button" class="btn btn-ghost" id="hdr-btn-logout">ログアウト</button>'
      : "";

    // 中央: 画面ID (上) + 画面名 (下)
    var centerHtml =
      (screenId
        ? '<span class="header-screen-id">' + escHtml(screenId) + "</span>"
        : "") +
      escHtml(title);

    // 下段左: 戻るボタン
    var navHtml = "";
    if (back === "menu") {
      navHtml = '<button type="button" class="btn btn-secondary" id="hdr-btn-nav">メニューに戻る</button>';
    } else if (back === "friend-list") {
      navHtml = '<button type="button" class="btn btn-secondary" id="hdr-btn-nav">一覧に戻る</button>';
    } else if (back === "site-list") {
      navHtml = '<button type="button" class="btn btn-secondary" id="hdr-btn-nav">一覧に戻る</button>';
    }

    // 下段右: ページ固有ボタン (新規登録・編集など)
    var extraHtml = "";
    if (extraId && extraLabel) {
      extraHtml =
        '<button type="button" class="btn btn-secondary" id="' + escHtml(extraId) + '"' +
        (extraEnabled ? "" : " disabled") + ">" +
        escHtml(extraLabel) + "</button>";
    }

    /*
     * ヘッダイメージ.png に準拠したテーブル構成
     *
     *   ┌──────────────┬─────────────────┬──────────────┐
     *   │ ① ユーザー名 │  ③ 画面ID (小)  │ ② ログアウト │
     *   │              │  ④ 画面名 (大)  │              │
     *   │ ⑤ 戻るボタン │                 │ ⑥ 追加ボタン │
     *   └──────────────┴─────────────────┴──────────────┘
     *
     * colgroup で列幅を明示し、hdr-center が rowspan="2" で両行を占有する。
     */
    var header = document.createElement("header");
    header.className = "hdr-wrap";
    header.innerHTML =
      '<table class="header-table">' +
        '<colgroup>' +
          '<col class="col-side">' +
          '<col class="col-center">' +
          '<col class="col-side">' +
        '</colgroup>' +
        '<tbody>' +
          '<tr class="hdr-row">' +
            '<td class="hdr-left hdr-top">'    + userHtml   + "</td>" +
            '<td class="hdr-center" rowspan="2">' +
              '<div class="hdr-center-inner">' +
                (screenId ? '<span class="header-screen-id">' + escHtml(screenId) + "</span>" : "") +
                '<span class="header-title">' + escHtml(title) + "</span>" +
              "</div>" +
            "</td>" +
            '<td class="hdr-right hdr-top">'   + logoutHtml + "</td>" +
          "</tr>" +
          '<tr class="hdr-row">' +
            '<td class="hdr-left hdr-bottom">'  + navHtml   + "</td>" +
            '<td class="hdr-right hdr-bottom">' + extraHtml + "</td>" +
          "</tr>" +
        "</tbody></table>";

    root.innerHTML = "";
    root.appendChild(header);

    bindButtons(back, extraId, extraScreen);
  }

  // ===========================
  // ボタンイベント設定
  // ===========================
  function bindButtons(back, extraId, extraScreen) {
    // ログアウト
    var logoutBtn = document.getElementById("hdr-btn-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        if (window.confirm("ログアウトしますか？")) {
          window.parent.postMessage({ type: "logout" }, "*");
        }
      });
    }

    // 戻るボタン
    var navBtn = document.getElementById("hdr-btn-nav");
    if (navBtn) {
      var backScreen =
        back === "menu"        ? "menu"       :
        back === "friend-list" ? "friendList" :
        back === "site-list"   ? "siteList"   : "";
      if (backScreen) {
        navBtn.addEventListener("click", function () {
          navigateMain(backScreen);
        });
      }
    }

    // 右下ページ固有ボタン
    if (extraId && extraScreen) {
      var extraBtn = document.getElementById(extraId);
      if (extraBtn) {
        extraBtn.addEventListener("click", function () {
          navigateMain(extraScreen);
        });
      }
    }
  }

  // 初期表示 (空ヘッダ)
  render();
})();
