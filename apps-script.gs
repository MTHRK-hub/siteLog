/**
 * 現場記録簿: 書き込みAPI（Apps Script）
 *
 * 使い方:
 * 1) このファイルを Apps Script に貼り付け
 * 2) スクリプトプロパティに SPREADSHEET_ID を設定
 *    - 値: 1MmvDvR9hxb_bdda0Zsxr4ZKYeSjG80CQnLvOGPTABYE
 * 3) ウェブアプリとしてデプロイ（全員アクセス可）
 * 4) フロント側で window.SITELOG_WEBAPP_URL を設定
 */

// ============================
// ユーザー情報 設定
// ============================
const USER_SHEET_NAME = "ユーザー情報";
const USER_ID_COL = "ユーザーID";
const USER_PW_COL = "パスワード";
const USER_HEADERS = [
  "id",
  "ユーザーID",
  "パスワード",
  "ユーザー名",
  "生年月日",
  "管理者フラグ",
  "メッセージ",
  "最終更新日時"
];

// ============================
// 友達情報 設定
// ============================
const FRIEND_SHEET_NAME = "友達情報";
const FRIEND_HEADERS = [
  "id",
  "名前",
  "LINE名",
  "年齢差",
  "生年月日",
  "性別",
  "職業",
  "出会った日",
  "出会った場所",
  "出身",
  "居住地",
  "居住形態",
  "更新月",
  "趣味",
  "家族構成",
  "話したこと",
  "提案対象",
  "その他",
  "今後の予定",
  "ユーザーID",
  "最終更新日時"
];

// ============================
// 現場記録情報 設定
// ============================
const SITELOG_SHEET_NAME = "現場記録情報";
const SITELOG_HEADERS = [
  "id",
  "日付",
  "項目",
  "出会った相手",
  "メモ",
  "ToDo",
  "ユーザーID",
  "最終更新日時"
];

// ============================
// メモ情報 設定
// ============================
const MANUSCRIPT_SHEET_NAME = "メモ情報";
const MANUSCRIPT_HEADERS = [
  "id",
  "タイトル",
  "メモ",
  "ユーザーID",
  "最終更新日時"
];

// ============================
// 企画情報 設定
// ============================
const PROJECT_SHEET_NAME = "企画情報";
const PROJECT_HEADERS = [
  "id",
  "日付",
  "時間",
  "場所",
  "場所URL",
  "内容",
  "説明",
  "男性参加費",
  "女性参加費",
  "ユーザーID",
  "最終更新日時"
];

// ============================
// キャッシュフロー情報 設定
// ============================
const CASHFLOW_SHEET_NAME = "キャッシュフロー情報";
const CASHFLOW_HEADERS = [
  "id",
  "年月",
  "収支区分",
  "内訳",
  "金額",
  "備考",
  "ユーザーID",
  "最終更新日時"
];

// ============================
// イベント情報 設定
// ============================
const EVENT_SHEET_NAME = "イベント情報";
const EVENT_HEADERS = [
  "id",
  "日付",
  "時間",
  "項目",
  "場所",
  "イベント名",
  "参加費",
  "URL",
  "参加フラグ",
  "非表示フラグ",
  "ユーザーID",
  "最終更新日時"
];

// ============================
// エントリーポイント
// ============================
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      message: "siteLog api alive",
      endpoint: "doGet",
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    Logger.log("doPost start");
    Logger.log("raw body: " + (e && e.postData ? e.postData.contents : "no postData"));

    const body = parseBody_(e);
    const action = String(body.action || "");
    const payload = body.payload || {};
    Logger.log("action: " + action);

    // 友達情報操作
    if (action === "appendFriend") {
      appendFriend_(payload);
      return jsonOk_({ message: "appended" });
    }
    if (action === "updateFriend") {
      updateFriend_(payload);
      return jsonOk_({ message: "updated" });
    }
    if (action === "deleteFriend") {
      deleteFriend_(payload);
      return jsonOk_({ message: "deleted" });
    }

    // ユーザー情報操作
    if (action === "updatePassword") {
      updatePassword_(payload);
      return jsonOk_({ message: "updated" });
    }
    if (action === "appendUser") {
      appendUser_(payload);
      return jsonOk_({ message: "appended" });
    }
    if (action === "deleteUser") {
      deleteUser_(payload);
      return jsonOk_({ message: "deleted" });
    }

    // 現場記録情報操作
    if (action === "appendSiteLog") {
      appendSiteLog_(payload);
      return jsonOk_({ message: "appended" });
    }
    if (action === "updateSiteLog") {
      updateSiteLog_(payload);
      return jsonOk_({ message: "updated" });
    }
    if (action === "deleteSiteLog") {
      deleteSiteLog_(payload);
      return jsonOk_({ message: "deleted" });
    }

    // 企画情報操作
    if (action === "appendProject") {
      appendProject_(payload);
      return jsonOk_({ message: "appended" });
    }
    if (action === "updateProject") {
      updateProject_(payload);
      return jsonOk_({ message: "updated" });
    }
    if (action === "deleteProject") {
      deleteProject_(payload);
      return jsonOk_({ message: "deleted" });
    }

    // キャッシュフロー情報操作
    if (action === "appendCashflow") {
      appendCashflow_(payload);
      return jsonOk_({ message: "appended" });
    }
    if (action === "updateCashflow") {
      updateCashflow_(payload);
      return jsonOk_({ message: "updated" });
    }
    if (action === "deleteCashflow") {
      deleteCashflow_(payload);
      return jsonOk_({ message: "deleted" });
    }

    // ユーザー連鎖削除
    if (action === "deleteUserCascade") {
      deleteUserCascade_(payload);
      return jsonOk_({ message: "deleted" });
    }

    // イベント情報操作
    if (action === "appendEvent") {
      appendEvent_(payload);
      return jsonOk_({ message: "appended" });
    }
    if (action === "deleteEvent") {
      deleteEvent_(payload);
      return jsonOk_({ message: "deleted" });
    }
    if (action === "updateEventHideFlag") {
      updateEventHideFlag_(payload);
      return jsonOk_({ message: "updated" });
    }
    if (action === "updateEvent") {
      updateEvent_(payload);
      return jsonOk_({ message: "updated" });
    }

    // ユーザーメッセージ更新
    if (action === "updateUserMessage") {
      updateUserMessage_(payload);
      return jsonOk_({ message: "updated" });
    }

    // メモ情報操作
    if (action === "appendManuscript") {
      appendManuscript_(payload);
      return jsonOk_({ message: "appended" });
    }
    if (action === "updateManuscript") {
      updateManuscript_(payload);
      return jsonOk_({ message: "updated" });
    }
    if (action === "deleteManuscript") {
      deleteManuscript_(payload);
      return jsonOk_({ message: "deleted" });
    }

    Logger.log("unsupported action: " + action);
    return jsonErr_("unsupported action");
  } catch (err) {
    Logger.log("ERROR: " + (err && err.stack ? err.stack : err));
    return jsonErr_(err && err.message ? err.message : "unknown error");
  }
}

// ============================
// ユーザー情報 操作
// ============================
function updatePassword_(payload) {
  const ssId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!ssId) throw new Error("SPREADSHEET_ID is not set");
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName(USER_SHEET_NAME);
  if (!sheet) throw new Error("sheet not found: " + USER_SHEET_NAME);

  const userId = normalize_(payload.userId);
  const newPassword = normalize_(payload.newPassword);
  if (!userId) throw new Error("userId is required");
  if (!newPassword) throw new Error("newPassword is required");

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error("no user data found");

  // ヘッダ行からカラム位置を特定
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idColIdx = headers.findIndex(function (h) { return normalize_(h) === USER_ID_COL; });
  const pwColIdx = headers.findIndex(function (h) { return normalize_(h) === USER_PW_COL; });
  if (idColIdx < 0) throw new Error("column not found: " + USER_ID_COL);
  if (pwColIdx < 0) throw new Error("column not found: " + USER_PW_COL);

  const dataValues = sheet.getRange(2, idColIdx + 1, lastRow - 1, 1).getValues();
  let targetRow = -1;
  for (let i = 0; i < dataValues.length; i++) {
    if (normalize_(dataValues[i][0]) === userId) {
      targetRow = i + 2;
      break;
    }
  }
  if (targetRow < 0) throw new Error("user not found: " + userId);

  sheet.getRange(targetRow, pwColIdx + 1).setValue(newPassword);

  const tsColIdx = headers.findIndex(function (h) { return normalize_(h) === "最終更新日時"; });
  if (tsColIdx >= 0) {
    sheet.getRange(targetRow, tsColIdx + 1).setValue(currentTimestamp_());
  }
}

// ============================
// ユーザー管理
// ============================
function appendUser_(record) {
  const sheet = getSheet_(USER_SHEET_NAME);
  ensureHeader_(sheet, USER_HEADERS);

  const id = normalize_(record.id);
  if (!id) throw new Error("id is required");

  const userId = normalize_(record[USER_ID_COL]);
  if (!userId) throw new Error("ユーザーID is required");

  // id 重複チェック
  const existingIds = getExistingIds_(sheet);
  if (existingIds.has(id)) throw new Error("id already exists: " + id);

  // ユーザーID 重複チェック
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const userIdColIdx = USER_HEADERS.indexOf(USER_ID_COL);
    if (userIdColIdx >= 0) {
      const ids = sheet.getRange(2, userIdColIdx + 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (normalize_(ids[i][0]) === userId) {
          throw new Error("ユーザーID already exists: " + userId);
        }
      }
    }
  }

  record["最終更新日時"] = currentTimestamp_();
  sheet.appendRow(toRow_(record, USER_HEADERS));
}

function deleteUser_(payload) {
  const sheet = getSheet_(USER_SHEET_NAME);
  ensureHeader_(sheet, USER_HEADERS);

  const userId = normalize_(payload.id);
  if (!userId) throw new Error("id is required");

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error("no user data found");

  const userIdColIdx = USER_HEADERS.indexOf(USER_ID_COL);
  const ids = sheet.getRange(2, userIdColIdx + 1, lastRow - 1, 1).getValues();
  let targetRow = -1;
  for (let i = 0; i < ids.length; i++) {
    if (normalize_(ids[i][0]) === userId) {
      targetRow = i + 2;
      break;
    }
  }
  if (targetRow < 0) throw new Error("user not found: " + userId);

  sheet.deleteRow(targetRow);
}

// ============================
// ユーザー連鎖削除
// ============================
function deleteRowsByUserId_(sheet, userId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIdx = headers.findIndex(function (h) { return normalize_(h) === "ユーザーID"; });
  if (colIdx < 0) return;
  const values = sheet.getRange(2, colIdx + 1, lastRow - 1, 1).getValues();
  const rows = [];
  for (let i = 0; i < values.length; i++) {
    if (normalize_(values[i][0]) === userId) rows.push(i + 2);
  }
  for (let i = rows.length - 1; i >= 0; i--) {
    sheet.deleteRow(rows[i]);
  }
}

function deleteUserCascade_(payload) {
  deleteUser_(payload);
  const userId = normalize_(payload.id);
  const ssId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!ssId) return;
  const ss = SpreadsheetApp.openById(ssId);
  [FRIEND_SHEET_NAME, SITELOG_SHEET_NAME, MANUSCRIPT_SHEET_NAME,
   PROJECT_SHEET_NAME, CASHFLOW_SHEET_NAME, EVENT_SHEET_NAME].forEach(function (name) {
    const sheet = ss.getSheetByName(name);
    if (sheet) deleteRowsByUserId_(sheet, userId);
  });
}

// ============================
// 友達情報操作 操作
// ============================
function appendFriend_(record) {
  const sheet = getSheet_(FRIEND_SHEET_NAME);
  ensureHeader_(sheet, FRIEND_HEADERS);

  const id = normalize_(record.id);
  if (!id) throw new Error("id is required");
  if (!normalize_(record["名前"])) {
    throw new Error("名前 is required");
  }

  const ids = getExistingIds_(sheet);
  if (ids.has(id)) throw new Error("id already exists: " + id);

  record["最終更新日時"] = currentTimestamp_();
  sheet.appendRow(toRow_(record, FRIEND_HEADERS));
}

function updateFriend_(record) {
  const sheet = getSheet_(FRIEND_SHEET_NAME);
  ensureHeader_(sheet, FRIEND_HEADERS);

  const id = normalize_(record.id);
  if (!id) throw new Error("id is required");
  if (!normalize_(record["名前"])) {
    throw new Error("名前 is required");
  }

  const rowIndex = findRowById_(sheet, id);
  if (rowIndex < 0) throw new Error("target id not found: " + id);

  record["最終更新日時"] = currentTimestamp_();
  sheet.getRange(rowIndex, 1, 1, FRIEND_HEADERS.length).setValues([toRow_(record, FRIEND_HEADERS)]);
}

function deleteFriend_(payload) {
  const sheet = getSheet_(FRIEND_SHEET_NAME);
  ensureHeader_(sheet, FRIEND_HEADERS);

  const id = normalize_(payload.id);
  if (!id) throw new Error("id is required");

  const rowIndex = findRowById_(sheet, id);
  if (rowIndex < 0) throw new Error("target id not found: " + id);

  sheet.deleteRow(rowIndex);
}

// ============================
// 現場記録情報 操作
// ============================
function appendSiteLog_(record) {
  const sheet = getSheet_(SITELOG_SHEET_NAME);
  ensureHeader_(sheet, SITELOG_HEADERS);

  const id = normalize_(record.id);
  if (!id) throw new Error("id is required");
  if (!normalize_(record["日付"])) {
    throw new Error("日付 is required");
  }

  const ids = getExistingIds_(sheet);
  if (ids.has(id)) throw new Error("id already exists: " + id);

  record["最終更新日時"] = currentTimestamp_();
  sheet.appendRow(toRow_(record, SITELOG_HEADERS));
}

function updateSiteLog_(record) {
  const sheet = getSheet_(SITELOG_SHEET_NAME);
  ensureHeader_(sheet, SITELOG_HEADERS);

  const id = normalize_(record.id);
  if (!id) throw new Error("id is required");
  if (!normalize_(record["日付"])) {
    throw new Error("日付 is required");
  }

  const rowIndex = findRowById_(sheet, id);
  if (rowIndex < 0) throw new Error("target id not found: " + id);

  record["最終更新日時"] = currentTimestamp_();
  sheet.getRange(rowIndex, 1, 1, SITELOG_HEADERS.length).setValues([toRow_(record, SITELOG_HEADERS)]);
}

function deleteSiteLog_(payload) {
  const sheet = getSheet_(SITELOG_SHEET_NAME);
  ensureHeader_(sheet, SITELOG_HEADERS);

  const id = normalize_(payload.id);
  if (!id) throw new Error("id is required");

  const rowIndex = findRowById_(sheet, id);
  if (rowIndex < 0) throw new Error("target id not found: " + id);

  sheet.deleteRow(rowIndex);
}

// ============================
// メモ情報 操作
// ============================
function appendManuscript_(record) {
  const sheet = getSheet_(MANUSCRIPT_SHEET_NAME);
  ensureHeader_(sheet, MANUSCRIPT_HEADERS);

  const id = normalize_(record.id);
  if (!id) throw new Error("id is required");
  if (!normalize_(record["タイトル"])) {
    throw new Error("タイトル is required");
  }

  const ids = getExistingIds_(sheet);
  if (ids.has(id)) throw new Error("id already exists: " + id);

  record["最終更新日時"] = currentTimestamp_();
  sheet.appendRow(toRow_(record, MANUSCRIPT_HEADERS));
}

function updateManuscript_(record) {
  const sheet = getSheet_(MANUSCRIPT_SHEET_NAME);
  ensureHeader_(sheet, MANUSCRIPT_HEADERS);

  const id = normalize_(record.id);
  if (!id) throw new Error("id is required");
  if (!normalize_(record["タイトル"])) {
    throw new Error("タイトル is required");
  }

  const rowIndex = findRowById_(sheet, id);
  if (rowIndex < 0) throw new Error("target id not found: " + id);

  record["最終更新日時"] = currentTimestamp_();
  sheet.getRange(rowIndex, 1, 1, MANUSCRIPT_HEADERS.length).setValues([toRow_(record, MANUSCRIPT_HEADERS)]);
}

function deleteManuscript_(payload) {
  const sheet = getSheet_(MANUSCRIPT_SHEET_NAME);
  ensureHeader_(sheet, MANUSCRIPT_HEADERS);

  const id = normalize_(payload.id);
  if (!id) throw new Error("id is required");

  const rowIndex = findRowById_(sheet, id);
  if (rowIndex < 0) throw new Error("target id not found: " + id);

  sheet.deleteRow(rowIndex);
}

// ============================
// 企画情報 操作
// ============================
function appendProject_(record) {
  const sheet = getSheet_(PROJECT_SHEET_NAME);
  ensureHeader_(sheet, PROJECT_HEADERS);

  if (!normalize_(record["日付"])) {
    throw new Error("日付 is required");
  }

  // シート上の全 ID から最大値を取得して採番（クライアント送信の id は使わない）
  const existingIds = getExistingIds_(sheet);
  let maxId = 0;
  existingIds.forEach(function (idStr) {
    const n = Number(idStr);
    if (Number.isFinite(n) && n > maxId) maxId = n;
  });
  record.id = String(maxId + 1);

  record["最終更新日時"] = currentTimestamp_();
  sheet.appendRow(toRow_(record, PROJECT_HEADERS));
}

function updateProject_(record) {
  const sheet = getSheet_(PROJECT_SHEET_NAME);
  ensureHeader_(sheet, PROJECT_HEADERS);

  const id = normalize_(record.id);
  if (!id) throw new Error("id is required");
  if (!normalize_(record["日付"])) {
    throw new Error("日付 is required");
  }

  const rowIndex = findRowById_(sheet, id);
  if (rowIndex < 0) throw new Error("target id not found: " + id);

  record["最終更新日時"] = currentTimestamp_();
  sheet.getRange(rowIndex, 1, 1, PROJECT_HEADERS.length).setValues([toRow_(record, PROJECT_HEADERS)]);
}

function deleteProject_(payload) {
  const sheet = getSheet_(PROJECT_SHEET_NAME);
  ensureHeader_(sheet, PROJECT_HEADERS);

  const id = normalize_(payload.id);
  if (!id) throw new Error("id is required");

  const rowIndex = findRowById_(sheet, id);
  if (rowIndex < 0) throw new Error("target id not found: " + id);

  sheet.deleteRow(rowIndex);
}

function updateUserMessage_(payload) {
  const ssId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!ssId) throw new Error("SPREADSHEET_ID is not set");
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName(USER_SHEET_NAME);
  if (!sheet) throw new Error("sheet not found: " + USER_SHEET_NAME);

  const userId = normalize_(payload.userId);
  const message = payload.message != null ? String(payload.message) : "";
  if (!userId) throw new Error("userId is required");

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error("no user data found");

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idColIdx = headers.findIndex(function (h) { return normalize_(h) === USER_ID_COL; });
  const msgColIdx = headers.findIndex(function (h) { return normalize_(h) === "メッセージ"; });
  if (idColIdx < 0) throw new Error("column not found: " + USER_ID_COL);
  if (msgColIdx < 0) throw new Error("column not found: メッセージ");

  const dataValues = sheet.getRange(2, idColIdx + 1, lastRow - 1, 1).getValues();
  let targetRow = -1;
  for (let i = 0; i < dataValues.length; i++) {
    if (normalize_(dataValues[i][0]) === userId) {
      targetRow = i + 2;
      break;
    }
  }
  if (targetRow < 0) throw new Error("user not found: " + userId);

  sheet.getRange(targetRow, msgColIdx + 1).setValue(message);

  const tsColIdx = headers.findIndex(function (h) { return normalize_(h) === "最終更新日時"; });
  if (tsColIdx >= 0) {
    sheet.getRange(targetRow, tsColIdx + 1).setValue(currentTimestamp_());
  }
}

// ============================
// キャッシュフロー情報 操作
// ============================
function appendCashflow_(record) {
  const sheet = getSheet_(CASHFLOW_SHEET_NAME);
  ensureHeader_(sheet, CASHFLOW_HEADERS);

  if (!normalize_(record["年月"])) {
    throw new Error("年月 is required");
  }

  const existingIds = getExistingIds_(sheet);
  let maxId = 0;
  existingIds.forEach(function (idStr) {
    const n = Number(idStr);
    if (Number.isFinite(n) && n > maxId) maxId = n;
  });
  record.id = String(maxId + 1);

  record["最終更新日時"] = currentTimestamp_();
  sheet.appendRow(toRow_(record, CASHFLOW_HEADERS));
}

function updateCashflow_(record) {
  const sheet = getSheet_(CASHFLOW_SHEET_NAME);
  ensureHeader_(sheet, CASHFLOW_HEADERS);

  const id = normalize_(record.id);
  if (!id) throw new Error("id is required");
  if (!normalize_(record["年月"])) {
    throw new Error("年月 is required");
  }

  const rowIndex = findRowById_(sheet, id);
  if (rowIndex < 0) throw new Error("target id not found: " + id);

  record["最終更新日時"] = currentTimestamp_();
  sheet.getRange(rowIndex, 1, 1, CASHFLOW_HEADERS.length).setValues([toRow_(record, CASHFLOW_HEADERS)]);
}

function deleteCashflow_(payload) {
  const sheet = getSheet_(CASHFLOW_SHEET_NAME);
  ensureHeader_(sheet, CASHFLOW_HEADERS);

  const id = normalize_(payload.id);
  if (!id) throw new Error("id is required");

  const rowIndex = findRowById_(sheet, id);
  if (rowIndex < 0) throw new Error("target id not found: " + id);

  sheet.deleteRow(rowIndex);
}

// ============================
// イベント情報 操作
// ============================
function appendEvent_(record) {
  const sheet = getSheet_(EVENT_SHEET_NAME);
  ensureHeader_(sheet, EVENT_HEADERS);

  if (!normalize_(record["日付"])) throw new Error("日付 is required");

  const existingIds = getExistingIds_(sheet);
  let maxId = 0;
  existingIds.forEach(function (idStr) {
    const n = Number(idStr);
    if (Number.isFinite(n) && n > maxId) maxId = n;
  });
  record.id = String(maxId + 1);

  record["最終更新日時"] = currentTimestamp_();
  sheet.appendRow(toRow_(record, EVENT_HEADERS));
}

function deleteEvent_(payload) {
  const sheet = getSheet_(EVENT_SHEET_NAME);
  ensureHeader_(sheet, EVENT_HEADERS);

  const id = normalize_(payload.id);
  if (!id) throw new Error("id is required");

  const rowIndex = findRowById_(sheet, id);
  if (rowIndex < 0) throw new Error("target id not found: " + id);

  sheet.deleteRow(rowIndex);
}

function updateEventHideFlag_(payload) {
  const sheet = getSheet_(EVENT_SHEET_NAME);

  const id = normalize_(payload.id);
  if (!id) throw new Error("id is required");

  const rowIndex = findRowById_(sheet, id);
  if (rowIndex < 0) throw new Error("target id not found: " + id);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const flagColIdx = headers.findIndex(function (h) { return normalize_(h) === "非表示フラグ"; });
  if (flagColIdx < 0) throw new Error("column not found: 非表示フラグ");

  sheet.getRange(rowIndex, flagColIdx + 1).setValue("1");

  const tsColIdx = headers.findIndex(function (h) { return normalize_(h) === "最終更新日時"; });
  if (tsColIdx >= 0) {
    sheet.getRange(rowIndex, tsColIdx + 1).setValue(currentTimestamp_());
  }
}

function updateEvent_(record) {
  const sheet = getSheet_(EVENT_SHEET_NAME);
  ensureHeader_(sheet, EVENT_HEADERS);

  const id = normalize_(record.id);
  if (!id) throw new Error("id is required");
  if (!normalize_(record["日付"])) throw new Error("日付 is required");

  const rowIndex = findRowById_(sheet, id);
  if (rowIndex < 0) throw new Error("target id not found: " + id);

  record["最終更新日時"] = currentTimestamp_();
  sheet.getRange(rowIndex, 1, 1, EVENT_HEADERS.length).setValues([toRow_(record, EVENT_HEADERS)]);
}

// ============================
// 共通ユーティリティ
// ============================
function getSheet_(sheetName) {
  const ssId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!ssId) throw new Error("SPREADSHEET_ID is not set");
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("sheet not found: " + sheetName);
  return sheet;
}

function ensureHeader_(sheet, headers) {
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const ok = headers.every(function (h, i) {
    return normalize_(firstRow[i]) === normalize_(h);
  });
  if (!ok) {
    throw new Error("header mismatch in sheet: " + sheet.getName());
  }
}

function getExistingIds_(sheet) {
  const out = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return out;
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  values.forEach(function (r) {
    const id = normalize_(r[0]);
    if (id) out.add(id);
  });
  return out;
}

function findRowById_(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (normalize_(values[i][0]) === id) {
      return i + 2; // 1-indexed、1行目はヘッダ
    }
  }
  return -1;
}

function toRow_(record, headers) {
  return headers.map(function (h) {
    return normalize_(record[h]);
  });
}

function parseBody_(e) {
  if (!e) throw new Error("empty request");

  // 1) JSON body (fetch)
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (_) {
      // 続けて form-urlencoded として解釈
    }
  }

  // 2) form-urlencoded body (hidden form fallback)
  const action = e.parameter && e.parameter.action ? String(e.parameter.action) : "";
  const payloadRaw = e.parameter && e.parameter.payload ? String(e.parameter.payload) : "{}";
  if (action) {
    let payload = {};
    try {
      payload = JSON.parse(payloadRaw);
    } catch (_) {
      throw new Error("invalid payload json");
    }
    return { action: action, payload: payload };
  }

  throw new Error("empty body");
}

function currentTimestamp_() {
  const now = new Date();
  const pad = function (n) { return String(n).padStart(2, "0"); };
  return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate())
       + " " + pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
}

function normalize_(v) {
  return String(v == null ? "" : v).replace(/\u00a0/g, " ").replace(/\u3000/g, " ").trim();
}

function jsonOk_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(Object.assign({ ok: true }, obj || {})))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonErr_(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, message: String(message || "error") }))
    .setMimeType(ContentService.MimeType.JSON);
}
