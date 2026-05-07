(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({
    screenId: "SCR-07-05",
    title: "支出編集",
    showUser: true
  });

  const form = document.getElementById("expenditure-edit-form");
  const errorEl = document.getElementById("exp-edit-error");
  const selectCategory = document.getElementById("exp-category");
  const selectType = document.getElementById("exp-type");
  const confirmDialog = document.getElementById("confirm-dialog");
  const btnConfirmOk = document.getElementById("btn-confirm-ok");
  const btnConfirmCancel = document.getElementById("btn-confirm-cancel");

  let enumRows = [];
  let targetRecord = null;
  const selectedId = c.getSelectedExpenditureId();

  function populateSelect(selectEl, enumName) {
    while (selectEl.options.length > 1) selectEl.remove(1);
    const row = enumRows.find(function (r) {
      return String(r["Enum名"] || "").trim() === enumName;
    });
    if (!row) return;
    for (let i = 1; i <= 15; i++) {
      const v = String(row["値" + i] || "").trim();
      if (!v) continue;
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      selectEl.appendChild(opt);
    }
  }

  selectCategory.addEventListener("change", function () {
    const cat = selectCategory.value.trim();
    while (selectType.options.length > 1) selectType.remove(1);
    selectType.value = "";
    if (!cat) {
      selectType.disabled = true;
      return;
    }
    selectType.disabled = false;
    populateSelect(selectType, "支出[" + cat + "]");
  });

  document.getElementById("btn-edit-cancel").addEventListener("click", function () {
    c.navigate("expenditureList");
  });

  btnConfirmCancel.addEventListener("click", function () {
    confirmDialog.hidden = true;
  });

  async function load() {
    if (!selectedId) {
      errorEl.textContent = "編集対象のデータがありません。";
      return;
    }

    errorEl.textContent = "読み込み中...";

    const [enumResult, expResult] = await Promise.all([
      c.safeLoadSheetRows("enums"),
      c.safeLoadSheetRows("expenditures")
    ]);

    if (!enumResult.ok) {
      errorEl.textContent = "Enum情報を取得できませんでした。";
      return;
    }
    enumRows = enumResult.rows;

    if (!expResult.ok) {
      errorEl.textContent = "支出情報を取得できませんでした。";
      return;
    }

    const raw = expResult.rows.find(function (r) {
      return String(r["id"] || "").trim() === String(selectedId).trim();
    });
    if (!raw) {
      errorEl.textContent = "対象データが見つかりませんでした。";
      return;
    }

    targetRecord = c.decryptExpenditureRecord(raw);

    populateSelect(selectCategory, "支出カテゴリ");

    const cat = String(targetRecord["カテゴリ"] || "").trim();
    const type = String(targetRecord["種別"] || "").trim();

    document.getElementById("exp-date").value = String(targetRecord["日付"] || "").trim();
    selectCategory.value = cat;

    if (cat) {
      selectType.disabled = false;
      populateSelect(selectType, "支出[" + cat + "]");
      selectType.value = type;
    }

    document.getElementById("exp-content").value = String(targetRecord["内容"] || "").trim();
    document.getElementById("exp-amount").value = String(targetRecord["金額"] || "").replace(/[^0-9]/g, "");
    document.getElementById("exp-note").value = String(targetRecord["備考"] || "").trim();

    errorEl.textContent = "";
  }

  load();

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!targetRecord) return;

    errorEl.textContent = "";
    confirmDialog.hidden = false;

    btnConfirmOk.onclick = async function () {
      confirmDialog.hidden = true;
      btnConfirmOk.onclick = null;

      const nowIso = new Date().toISOString().slice(0, 19).replace("T", " ");
      const record = Object.assign({}, targetRecord, {
        "日付": document.getElementById("exp-date").value.trim(),
        "カテゴリ": selectCategory.value.trim(),
        "種別": selectType.value.trim(),
        "内容": document.getElementById("exp-content").value.trim(),
        "金額": document.getElementById("exp-amount").value.trim(),
        "備考": document.getElementById("exp-note").value.trim(),
        "最終更新日時": nowIso
      });

      errorEl.textContent = "更新中...";
      try {
        await c.updateExpenditure(c.encryptExpenditureRecord(record));
        c.setCompletionInfo({
          title: "支出更新完了",
          message: "支出データが更新されました。",
          buttonLabel: "一覧に戻る",
          backScreen: "expenditureList"
        });
        c.navigate("completion");
      } catch (err) {
        errorEl.textContent = err && err.message ? err.message : "更新に失敗しました。";
      }
    };
  });
})();
