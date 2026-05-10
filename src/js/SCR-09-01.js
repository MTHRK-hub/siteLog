(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({
    screenId: "SCR-09-01",
    title: "お店一覧",
    back: "menu",
    showUser: true,
    extraId: "btn-shop-create",
    extraLabel: "新規作成",
    extraScreen: "shopCreate"
  });

  const status = document.getElementById("shop-load-status");
  const listBody = document.getElementById("shop-list-body");
  const locationFilter = document.getElementById("location-filter");
  const categoryFilterRow = document.getElementById("category-filter-row");
  const categoryFilter = document.getElementById("category-filter");

  let allShops = [];
  const loginUser = c.getCurrentUser();
  const loginUserId = loginUser ? String(loginUser.id || "").trim() : "";

  function buildLocationOptions() {
    const locSet = new Set();
    allShops.forEach(function (r) {
      const loc = String(r["場所"] || "").trim();
      if (loc) locSet.add(loc);
    });
    const sorted = Array.from(locSet).sort();
    locationFilter.innerHTML = "";
    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = "全件表示";
    locationFilter.appendChild(emptyOpt);
    sorted.forEach(function (loc) {
      const opt = document.createElement("option");
      opt.value = loc;
      opt.textContent = loc;
      locationFilter.appendChild(opt);
    });
  }

  async function buildCategoryOptions() {
    categoryFilter.innerHTML = "";
    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = "全件表示";
    categoryFilter.appendChild(emptyOpt);

    const result = await c.safeLoadSheetRows("enums");
    if (!result.ok) return;
    const row = result.rows.find(function (r) {
      return String(r["Enum名"] || "").trim() === "お店カテゴリ";
    });
    if (!row) return;
    for (let i = 1; i <= 15; i++) {
      const v = String(row["値" + i] || "").trim();
      if (!v) continue;
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      categoryFilter.appendChild(opt);
    }
  }

  function renderContent() {
    const filterLoc = locationFilter.value;
    const filterCat = categoryFilter.value;

    let displayRows = allShops;
    if (filterLoc) {
      displayRows = displayRows.filter(function (r) {
        return String(r["場所"] || "").trim() === filterLoc;
      });
    }
    if (filterLoc && filterCat) {
      displayRows = displayRows.filter(function (r) {
        return String(r["カテゴリ"] || "").trim() === filterCat;
      });
    }

    status.textContent = "お店データ " + displayRows.length + "件を表示中";

    if (!displayRows.length) {
      listBody.innerHTML = '<tr><td colspan="3" style="text-align:center">データがありません</td></tr>';
    } else {
      listBody.innerHTML = displayRows.map(function (r) {
        return "<tr>" +
          "<td><button type='button' class='name-link' data-sid='" + c.escapeHtml(String(r.id || "")) + "'>" + c.escapeHtml(r["店名"] || "") + "</button></td>" +
          "<td>" + c.escapeHtml(r["場所"] || "") + "</td>" +
          "<td>" + c.escapeHtml(r["カテゴリ"] || "") + "</td>" +
          "</tr>";
      }).join("");
      listBody.querySelectorAll("[data-sid]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          c.setSelectedShopId(btn.dataset.sid);
          c.navigate("shopDetail");
        });
      });
    }
  }

  locationFilter.addEventListener("change", function () {
    const hasLocation = !!locationFilter.value;
    categoryFilterRow.hidden = !hasLocation;
    categoryFilter.value = "";
    renderContent();
  });

  categoryFilter.addEventListener("change", function () {
    renderContent();
  });

  async function loadShops() {
    status.textContent = "読み込み中...";
    const result = await c.safeLoadSheetRows("shops", { allowEmpty: true });
    if (!result.ok) {
      status.textContent = result.message || "お店情報を取得できませんでした。";
      return;
    }
    const filtered = loginUserId
      ? result.rows.filter(function (r) {
          return String(r["ユーザーID"] || "").trim() === loginUserId;
        })
      : result.rows;
    allShops = filtered.map(function (r) {
      return c.decryptShopRecord(r);
    });
    c.setShops(allShops);
    buildLocationOptions();
    await buildCategoryOptions();
    renderContent();
  }

  loadShops();
})();
