(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({ screenId: "SCR-03-04", title: "友達編集", showUser: true });

  const form = document.getElementById("friend-edit-form");
  const errorEl = document.getElementById("friend-edit-error");
  const rows = c.getFriends();
  const selectedId = c.getSelectedFriendId();
  const found = c.findFriendById(rows, selectedId);

  // 生年月日入力時に年齢差を非活性にする
  const ageDiffInput = document.getElementById("input-age-diff");
  const birthDateInput = document.getElementById("input-birthdate");
  function syncAgeDiffState() {
    ageDiffInput.disabled = !!birthDateInput.value;
    if (birthDateInput.value) ageDiffInput.value = "";
  }
  birthDateInput.addEventListener("input", syncAgeDiffState);

  // InstagramアカウントURLはアカウント名が空の場合は非表示
  const instagramNameInput = document.getElementById("input-instagram-name");
  const instagramUrlLabel = document.getElementById("label-instagram-url");
  function syncInstagramUrlState() {
    instagramUrlLabel.hidden = !instagramNameInput.value.trim();
    if (!instagramNameInput.value.trim()) {
      instagramUrlLabel.querySelector("input").value = "";
    }
  }
  instagramNameInput.addEventListener("input", syncInstagramUrlState);

  // 居住形態が一人暮らし以外の場合は更新月を非表示にする
  const residenceTypeSelect = document.getElementById("input-residence-type");
  const renewalMonthInput = document.getElementById("input-renewal-month");
  const renewalMonthLabel = renewalMonthInput.closest("label");
  function syncRenewalMonthState() {
    const isAlone = residenceTypeSelect.value === "一人暮らし";
    renewalMonthLabel.hidden = !isAlone;
    if (!isAlone) renewalMonthInput.value = "";
  }
  residenceTypeSelect.addEventListener("change", syncRenewalMonthState);

  // 今後の予定: ラジオボタンによりテキストエリアの活性/非活性を切り替える
  const futurePlanText = document.getElementById("input-future-plan-text");
  function syncFuturePlanState() {
    const checked = form.querySelector('input[name="今後の予定フラグ"]:checked');
    const isAri = checked && checked.value === "あり";
    futurePlanText.disabled = !isAri;
    if (!isAri) futurePlanText.value = "";
  }
  form.querySelectorAll('input[name="今後の予定フラグ"]').forEach(function (r) {
    r.addEventListener("change", syncFuturePlanState);
  });

  const metPlaceTypeSelect = document.getElementById("input-met-place-type");
  const metPlaceTextInput = document.getElementById("input-met-place-text");

  // EnumシートからEnum名で選択肢を取得
  async function loadEnumOptions(enumName) {
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
    return options;
  }

  async function loadProposeTargetOptions() {
    return loadEnumOptions("提案対象");
  }

  // 出会った場所の保存値を解析してプルダウンとテキストに分解
  function parseMetPlaceValue(value, options) {
    if (!value) return { type: "", text: "" };
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      if (value === opt) return { type: opt, text: "" };
      if (value.startsWith(opt + "・")) return { type: opt, text: value.slice(opt.length + 1) };
    }
    return { type: "", text: value };
  }

  function renderProposeTargetCheckboxes(options, selectedValues) {
    const container = document.getElementById("propose-target-checkboxes");
    container.innerHTML = "";
    if (!options.length) {
      container.innerHTML = "<span>選択肢がありません</span>";
      return;
    }
    options.forEach(function (opt) {
      const label = document.createElement("label");
      label.className = "checkbox-label";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "提案対象";
      input.value = opt;
      if (selectedValues && selectedValues.indexOf(opt) >= 0) input.checked = true;
      label.appendChild(input);
      label.appendChild(document.createTextNode(opt));
      container.appendChild(label);
    });
  }

  if (!found) {
    errorEl.textContent = "編集対象データがありません。";
    form.querySelectorAll("input, textarea, select, button").forEach(function (el) {
      if (el.id !== "btn-edit-cancel") el.disabled = true;
    });
    loadProposeTargetOptions().then(function (options) {
      renderProposeTargetCheckboxes(options, []);
    });
  } else {
    const friend = c.decryptFriendRecord(found.row);

    // 基本フィールド初期値
    form.elements["名前"].value = friend["名前"] || "";
    form.elements["LINE名"].value = friend["LINE名"] || "";
    instagramNameInput.value = friend["Instagramアカウント名"] || "";
    form.elements["Instagram URL"].value = friend["Instagram URL"] || "";
    syncInstagramUrlState();
    form.elements["生年月日"].value = friend["生年月日"] || "";
    form.elements["年齢差"].value = friend["年齢差"] || "";
    syncAgeDiffState();
    const genderValue = friend["性別"] || "";
    form.querySelectorAll('input[name="性別"]').forEach(function (r) {
      r.checked = (r.value === genderValue);
    });
    form.elements["職業"].value = friend["職業"] || "";
    form.elements["出会った日"].value = friend["出会った日"] || "";
    loadEnumOptions("出会った場所").then(function (options) {
      options.forEach(function (opt) {
        const el = document.createElement("option");
        el.value = opt;
        el.textContent = opt;
        metPlaceTypeSelect.appendChild(el);
      });
      const parsed = parseMetPlaceValue(friend["出会った場所"] || "", options);
      metPlaceTypeSelect.value = parsed.type;
      metPlaceTextInput.value = parsed.text;
    });
    form.elements["出身"].value = friend["出身"] || "";
    form.elements["居住地"].value = friend["居住地"] || "";
    residenceTypeSelect.value = friend["居住形態"] || "";
    syncRenewalMonthState();
    if (friend["居住形態"] === "一人暮らし") {
      renewalMonthInput.value = friend["更新月"] || "";
    }
    form.elements["職場"].value = friend["職場"] || "";
    form.elements["趣味"].value = friend["趣味"] || "";
    form.elements["家族構成"].value = friend["家族構成"] || "";
    form.elements["話したこと"].value = friend["話したこと"] || "";
    form.elements["その他"].value = friend["その他"] || "";

    // 今後の予定: "あり:content" または "なし:" 形式を解析
    const futurePlanRaw = friend["今後の予定"] || "";
    const futurePlanMatch = /^(あり|なし):(.*)$/s.exec(futurePlanRaw);
    if (futurePlanMatch) {
      const flag = futurePlanMatch[1];
      const text = futurePlanMatch[2];
      const radioEl = form.querySelector('input[name="今後の予定フラグ"][value="' + flag + '"]');
      if (radioEl) radioEl.checked = true;
      if (flag === "あり") {
        futurePlanText.disabled = false;
        futurePlanText.value = text;
      }
    }

    // 提案対象チェックボックス: Enum読込後に初期チェック状態を設定
    const selectedPropose = friend["提案対象"]
      ? friend["提案対象"].split(",").map(function (s) { return s.trim(); })
      : [];
    loadProposeTargetOptions().then(function (options) {
      renderProposeTargetCheckboxes(options, selectedPropose);
    });

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
      const currentUser = c.getCurrentUser();

      // 提案対象: チェック済みの値をカンマ結合
      const checkedPropose = Array.from(form.querySelectorAll('input[name="提案対象"]:checked'))
        .map(function (cb) { return cb.value; });

      // 今後の予定: ラジオ値 + テキスト
      const futureFlagEl = form.querySelector('input[name="今後の予定フラグ"]:checked');
      const futureFlag = futureFlagEl ? futureFlagEl.value : "なし";
      const futurePlanValue = futureFlag + ":" + (futureFlag === "あり" ? futurePlanText.value.trim() : "");

      const updated = {
        id: c.getFriendId(friend, found.index),
        "名前": String(fd.get("名前") || "").trim(),
        "LINE名": String(fd.get("LINE名") || "").trim(),
        "Instagramアカウント名": String(fd.get("Instagramアカウント名") || "").trim(),
        "Instagram URL": String(fd.get("Instagram URL") || "").trim(),
        "年齢差": ageDiffInput.disabled ? "" : String(fd.get("年齢差") || "").trim(),
        "生年月日": String(fd.get("生年月日") || "").trim(),
        "性別": String(fd.get("性別") || "").trim(),
        "職業": String(fd.get("職業") || "").trim(),
        "出会った日": String(fd.get("出会った日") || "").trim(),
        "出会った場所": (function () {
          const type = metPlaceTypeSelect.value.trim();
          const text = metPlaceTextInput.value.trim();
          return type ? (text ? type + "・" + text : type) : text;
        })(),
        "出身": String(fd.get("出身") || "").trim(),
        "居住地": String(fd.get("居住地") || "").trim(),
        "居住形態": String(fd.get("居住形態") || "").trim(),
        "更新月": renewalMonthLabel.hidden ? "" : String(fd.get("更新月") || "").trim(),
        "職場": String(fd.get("職場") || "").trim(),
        "趣味": String(fd.get("趣味") || "").trim(),
        "家族構成": String(fd.get("家族構成") || "").trim(),
        "話したこと": String(fd.get("話したこと") || "").trim(),
        "提案対象": checkedPropose.join(","),
        "その他": String(fd.get("その他") || "").trim(),
        "今後の予定": futurePlanValue,
        "ユーザーID": currentUser ? String(currentUser.id || "") : "",
        "最終更新日時": new Date().toISOString().slice(0, 19).replace("T", " ")
      };

      if (!updated["名前"]) {
        errorEl.textContent = "名前は必須です。";
        return;
      }

      // 確認ダイアログを表示
      confirmDialog.removeAttribute("hidden");
      btnConfirmOk.onclick = async function () {
        confirmDialog.setAttribute("hidden", "");
        try {
          await c.updateFriend(c.encryptFriendRecord(updated));
          rows[found.index] = updated;
          c.setFriends(rows);
          c.setSelectedFriendId(updated.id);
          c.setCompletionInfo({
            title: "友達編集完了",
            message: "友達情報が更新されました。",
            buttonLabel: "詳細に戻る",
            backScreen: "friendDetail"
          });
          c.navigate("completion");
        } catch (err) {
          errorEl.textContent = err && err.message ? err.message : "更新に失敗しました。";
        }
      };
    });
  }

  document.getElementById("btn-edit-cancel").addEventListener("click", function () {
    c.navigate("friendDetail");
  });
})();
