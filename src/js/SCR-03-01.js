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
  const filterSelect = document.getElementById("friend-filter");
  const filterSubRow = document.getElementById("filter-sub-row");
  const filterSubSelect = document.getElementById("friend-filter-sub");

  const loginUser = c.getCurrentUser();

  const enumCache = { "出会った場所": null, "提案対象": null };

  async function loadEnumOptions(enumName) {
    if (enumCache[enumName]) return enumCache[enumName];
    const result = await c.safeLoadSheetRows("enums");
    if (!result.ok) return [];
    const row = result.rows.find(function (r) {
      return String(r["Enum名"] || "").trim() === enumName;
    });
    if (!row) return [];
    const options = [];
    for (let i = 1; i <= 15; i++) {
      const v = String(row["値" + i] || "").trim();
      if (v) options.push(v);
    }
    enumCache[enumName] = options;
    return options;
  }

  function populateSubFilter(options) {
    filterSubSelect.innerHTML = '<option value=""></option>';
    options.forEach(function (opt) {
      const el = document.createElement("option");
      el.value = opt;
      el.textContent = opt;
      filterSubSelect.appendChild(el);
    });
  }

  function applyFilter(rows, filterValue) {
    if (!filterValue) return rows;
    if (filterValue === "20代") {
      return rows.filter(function (f) {
        const age = parseInt(c.calcAge(f, loginUser), 10);
        return !Number.isNaN(age) && age >= 20 && age <= 29;
      });
    }
    if (filterValue === "予定あり") {
      return rows.filter(function (f) {
        return String(f["今後の予定"] || "").startsWith("あり:");
      });
    }
    if (filterValue === "出会った場所") {
      const subValue = filterSubSelect.value;
      if (!subValue) return rows;
      return rows.filter(function (f) {
        const val = String(f["出会った場所"] || "");
        return val === subValue || val.startsWith(subValue + "・");
      });
    }
    if (filterValue === "提案対象") {
      const subValue = filterSubSelect.value;
      if (!subValue) return rows;
      return rows.filter(function (f) {
        return String(f["提案対象"] || "").split(",").map(function (s) { return s.trim(); }).indexOf(subValue) >= 0;
      });
    }
    return rows;
  }

  function render(rows) {
    body.innerHTML = "";
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="4" style="text-align:center">データがありません</td></tr>';
      return;
    }
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
    filtered.sort(function (a, b) {
      return String(a["名前"] || "").localeCompare(String(b["名前"] || ""), "ja");
    });

    function refreshView() {
      const applied = applyFilter(filtered, filterSelect.value);
      status.textContent = "友達データ " + applied.length + "件を表示中";
      render(applied);
    }

    filterSelect.addEventListener("change", async function () {
      const val = filterSelect.value;
      if (val === "出会った場所" || val === "提案対象") {
        const options = await loadEnumOptions(val);
        populateSubFilter(options);
        filterSubRow.removeAttribute("hidden");
      } else {
        filterSubRow.setAttribute("hidden", "");
        filterSubSelect.innerHTML = '<option value=""></option>';
      }
      refreshView();
    });
    filterSubSelect.addEventListener("change", refreshView);
    refreshView();
  })();
})();
