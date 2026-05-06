(function () {
  const c = window.SiteLogCommon;

  const form = document.getElementById("expenditure-form");
  const msgEl = document.getElementById("exp-message");
  const selectCategory = document.getElementById("exp-category");
  const selectType = document.getElementById("exp-type");
  const confirmDialog = document.getElementById("confirm-dialog");
  const btnConfirmOk = document.getElementById("btn-confirm-ok");
  const btnConfirmCancel = document.getElementById("btn-confirm-cancel");

  let enumRows = [];

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

  async function loadEnums() {
    const result = await c.safeLoadSheetRows("enums");
    if (!result.ok) return;
    enumRows = result.rows;
    populateSelect(selectCategory, "支出カテゴリ");
  }

  loadEnums();

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

  function showError(text) {
    msgEl.className = "error-msg";
    msgEl.textContent = text;
  }

  function showSuccess(text) {
    msgEl.className = "error-msg exp-success";
    msgEl.textContent = text;
  }

  btnConfirmCancel.addEventListener("click", function () {
    confirmDialog.hidden = true;
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    msgEl.textContent = "";

    const userId = document.getElementById("exp-user-id").value.trim();
    const date = document.getElementById("exp-date").value.trim();
    const category = selectCategory.value.trim();
    const type = selectType.value.trim();
    const content = document.getElementById("exp-content").value.trim();
    const amount = document.getElementById("exp-amount").value.trim();
    const note = document.getElementById("exp-note").value.trim();

    if (!userId || !date) {
      showError("ユーザーIDと日付は必須です。");
      return;
    }

    confirmDialog.hidden = false;

    btnConfirmOk.onclick = async function () {
      confirmDialog.hidden = true;
      btnConfirmOk.onclick = null;

      const record = {
        "ユーザーID": userId,
        "日付": date,
        "カテゴリ": category,
        "種別": type,
        "内容": content,
        "金額": amount,
        "備考": note
      };

      try {
        await c.appendExpenditure(c.encryptExpenditureRecord(record));
        showSuccess("登録しました。");
        form.reset();
        while (selectType.options.length > 1) selectType.remove(1);
        selectType.disabled = true;
      } catch (err) {
        showError(err && err.message ? err.message : "登録に失敗しました。");
      }
    };
  });

  document.getElementById("btn-close").addEventListener("click", function () {
    window.close();
  });
})();
