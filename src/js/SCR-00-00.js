(function () {
  /**
   * 共通ヘッダビルダー (SCR-00-00)
   *
   * 各HTMLファイルに以下のプレースホルダを置き、このスクリプトが
   * 実行時にヘッダHTMLを組み立てて差し替える。
   *
   * <div id="site-header"
   *      data-title="画面タイトル"
   *      data-title-class="追加クラス名"
   *      data-back="menu|friend-list|site-list"
   *      data-show-user="true"
   *      data-extra-id="ボタンID"
   *      data-extra-label="ボタンラベル">
   * </div>
   *
   * data-back:
   *   "menu"        → 「メニューに戻る」ボタン → SCR-02-01
   *   "friend-list" → 「一覧に戻る」ボタン     → SCR-03-01
   *   "site-list"   → 「一覧に戻る」ボタン     → SCR-04-01
   *   (空 / 未設定)  → 左下エリアなし
   *
   * data-show-user: "true" のとき、ユーザー名とログアウトボタンを表示
   * data-title-class: <h1> に追加するクラス名（例: js-completion-title）
   * data-extra-id / data-extra-label: 右下に追加するページ固有ボタン
   *
   * レイアウト（ヘッダイメージ.png に準拠）:
   *   ┌──────────────┬──────────────┬──────────────┐
   *   │ ① ユーザー名 │              │ ④ ログアウト  │
   *   │              │  ③ 画面名    │              │
   *   │ ② 戻るボタン │              │ ⑤ 追加ボタン  │
   *   └──────────────┴──────────────┴──────────────┘
   */

  var placeholder = document.getElementById("site-header");
  if (!placeholder) return;

  var title      = placeholder.getAttribute("data-title")       || "";
  var titleClass = placeholder.getAttribute("data-title-class") || "";
  var back       = placeholder.getAttribute("data-back")        || "";
  var showUser   = placeholder.getAttribute("data-show-user") === "true";
  var extraId    = placeholder.getAttribute("data-extra-id")    || "";
  var extraLabel = placeholder.getAttribute("data-extra-label") || "";

  // 上段左: ユーザー名
  var userHtml = showUser
    ? '<span class="user-name js-user-name"></span>'
    : "";

  // 上段右: ログアウトボタン
  var logoutHtml = showUser
    ? '<button type="button" class="btn btn-ghost" data-action="logout">ログアウト</button>'
    : "";

  // 下段左: 戻るボタン
  var navHtml = "";
  if (back === "menu") {
    navHtml = '<button type="button" class="btn btn-secondary" data-action="menu">メニューに戻る</button>';
  } else if (back === "friend-list") {
    navHtml = '<button type="button" class="btn btn-secondary" data-action="friend-list">一覧に戻る</button>';
  } else if (back === "site-list") {
    navHtml = '<button type="button" class="btn btn-secondary" data-action="site-list">一覧に戻る</button>';
  }

  // 下段右: ページ固有ボタン（新規登録・編集など）
  var extraHtml = (extraId && extraLabel)
    ? '<button type="button" class="btn btn-secondary" id="' + extraId + '">' + extraLabel + '</button>'
    : "";

  // <h1> クラス
  var h1Class = "top-title" + (titleClass ? " " + titleClass : "");

  var header = document.createElement("header");
  header.className = "top-bar";
  header.innerHTML =
    '<div class="top-user">'   + userHtml   + '</div>' +
    '<h1 class="' + h1Class + '">' + title + '</h1>' +
    '<div class="top-logout">' + logoutHtml + '</div>' +
    '<div class="top-nav">'    + navHtml    + '</div>' +
    '<div class="top-extra">'  + extraHtml  + '</div>';

  placeholder.parentNode.replaceChild(header, placeholder);
})();
