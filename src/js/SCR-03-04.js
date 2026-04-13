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

  if (!found) {
    errorEl.textContent = "編集対象データがありません。";
    form.querySelectorAll("input, textarea, button").forEach(function (el) {
      if (el.id !== "btn-edit-cancel") el.disabled = true;
    });
  } else {
    const friend = c.decryptFriendRecord(found.row);
    form.elements["名前"].value = friend["名前"] || "";
    form.elements["LINE名"].value = friend["LINE名"] || "";
    form.elements["生年月日"].value = friend["生年月日"] || "";
    form.elements["年齢差"].value = friend["年齢差"] || "";
    syncAgeDiffState();
    const genderValue = friend["性別"] || "";
    form.querySelectorAll('input[name="性別"]').forEach(function (r) {
      r.checked = (r.value === genderValue);
    });
    form.elements["職業"].value = friend["職業"] || "";
    form.elements["出会った日"].value = friend["出会った日"] || "";
    form.elements["出会った場所"].value = friend["出会った場所"] || "";
    form.elements["相手の情報"].value = friend["相手の情報"] || "";
    form.elements["今後の予定"].value = friend["今後の予定"] || "";

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
      const updated = {
        id: c.getFriendId(friend, found.index),
        "名前": String(fd.get("名前") || "").trim(),
        "LINE名": String(fd.get("LINE名") || "").trim(),
        "年齢差": ageDiffInput.disabled ? "" : String(fd.get("年齢差") || "").trim(),
        "生年月日": String(fd.get("生年月日") || "").trim(),
        "性別": String(fd.get("性別") || "").trim(),
        "職業": String(fd.get("職業") || "").trim(),
        "出会った日": String(fd.get("出会った日") || "").trim(),
        "出会った場所": String(fd.get("出会った場所") || "").trim(),
        "相手の情報": String(fd.get("相手の情報") || "").trim(),
        "今後の予定": String(fd.get("今後の予定") || "").trim(),
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
