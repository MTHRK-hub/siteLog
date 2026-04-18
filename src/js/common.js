(function () {
  // ==========
  // 共通設定
  // ==========
  const SHEET_ID = "1MmvDvR9hxb_bdda0Zsxr4ZKYeSjG80CQnLvOGPTABYE";
  const SHEETS = {
    users: { gid: "0", name: "ユーザーデータ" },
    friends: { gid: "1058818904", name: "友達情報" },
    siteLogs: { gid: "241811860", name: "現場記録情報" },
    manuscripts: { gid: "784637613", name: "メモ情報" }
  };
  // 書き込みAPIのURL（window.SITELOG_WEBAPP_URL または window.SITELOG_FRIENDS_WEBAPP_URL を設定）
  const WRITE_API_URL = (window.SITELOG_WEBAPP_URL || window.SITELOG_FRIENDS_WEBAPP_URL || "");

  const STORAGE_KEYS = {
    loginUser: "siteLog-login-user",
    friends: "siteLog-friends-data",
    siteLogs: "siteLog-siteLogs-data",
    manuscripts: "siteLog-manuscripts-data",
    selectedFriend: "siteLog-selected-friend-index",
    selectedFriendId: "siteLog-selected-friend-id",
    selectedSiteLog: "siteLog-selected-siteLog-index",
    selectedSiteLogId: "siteLog-selected-siteLog-id",
    selectedManuscriptId: "siteLog-selected-manuscript-id",
    completionInfo: "siteLog-completion-info"
  };

  // =========================
  // Google Sheets 取得まわり
  // =========================
  function csvUrl(gid) {
    return "https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/export?format=csv&gid=" + gid;
  }

  function gvizUrl(gid, callbackName) {
    return "https://docs.google.com/spreadsheets/d/" + SHEET_ID +
      "/gviz/tq?gid=" + gid +
      "&tqx=out:json;responseHandler:" + encodeURIComponent(callbackName);
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];
      if (ch === '"') {
        if (inQuotes && next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (ch === "," && !inQuotes) {
        row.push(field);
        field = "";
        continue;
      }
      if ((ch === "\n" || ch === "\r") && !inQuotes) {
        if (ch === "\r" && next === "\n") i++;
        row.push(field);
        if (row.some(function (v) { return String(v).trim() !== ""; })) {
          rows.push(row);
        }
        row = [];
        field = "";
        continue;
      }
      field += ch;
    }
    row.push(field);
    if (row.some(function (v) { return String(v).trim() !== ""; })) rows.push(row);
    if (!rows.length) return [];

    const headers = rows[0].map(function (h) { return String(h).trim(); });
    const list = [];
    for (let i = 1; i < rows.length; i++) {
      const item = {};
      for (let j = 0; j < headers.length; j++) {
        item[headers[j]] = rows[i][j] == null ? "" : String(rows[i][j]).trim();
      }
      list.push(item);
    }
    return list;
  }

  function loadSheetRowsViaGviz(gid) {
    return new Promise(function (resolve, reject) {
      const callbackName = "__siteLogGvizCb_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
      let done = false;
      const script = document.createElement("script");
      const timer = setTimeout(function () {
        if (done) return;
        done = true;
        cleanup();
        reject(new Error("gviz timeout"));
      }, 10000);

      function cleanup() {
        clearTimeout(timer);
        try {
          delete window[callbackName];
        } catch (_) {
          window[callbackName] = undefined;
        }
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[callbackName] = function (data) {
        if (done) return;
        done = true;
        cleanup();
        try {
          const table = data && data.table;
          const cols = table && table.cols ? table.cols : [];
          const rows = table && table.rows ? table.rows : [];
          const headers = cols.map(function (c, idx) {
            const label = c && c.label ? String(c.label).trim() : "";
            return label || ("col_" + idx);
          });
          const list = rows.map(function (r) {
            const item = {};
            const cells = r && r.c ? r.c : [];
            headers.forEach(function (h, idx) {
              const cell = cells[idx];
              if (cell && cell.v != null) {
                item[h] = normalizeGvizValue_(cell.v);
              } else if (cell && cell.f != null) {
                // 日付型カラムに文字列（暗号化済みデータ等）が入った場合、
                // gviz が cell.v を null にすることがある。
                // cell.f（フォーマット済み文字列）で補完する。
                item[h] = String(cell.f).trim();
              } else {
                item[h] = "";
              }
            });
            return item;
          }).filter(function (item) {
            return Object.values(item).some(function (v) { return String(v).trim() !== ""; });
          });
          resolve(list);
        } catch (e) {
          reject(e);
        }
      };

      script.onerror = function () {
        if (done) return;
        done = true;
        cleanup();
        reject(new Error("gviz script load failed"));
      };
      script.src = gvizUrl(gid, callbackName);
      document.head.appendChild(script);
    });
  }

  async function loadSheetRows(key) {
    const spec = SHEETS[key];
    try {
      const res = await fetch(csvUrl(spec.gid), { cache: "no-store" });
      if (!res.ok) throw new Error(spec.name + " の取得に失敗しました");
      const rows = parseCsv(await res.text());
      if (!rows.length) throw new Error(spec.name + " に有効データがありません");
      return rows;
    } catch (_) {
      const rows = await loadSheetRowsViaGviz(spec.gid);
      if (!rows.length) throw new Error(spec.name + " に有効データがありません");
      return rows;
    }
  }

  function getSheetErrorMessage(key, rows) {
    if (rows && rows.length) {
      const first = rows[0];
      if (key === "users" && (!("ユーザーID" in first) || !("パスワード" in first))) {
        return "取得は成功しましたが、ユーザーデータのヘッダ名が一致しません。";
      }
      if (key === "friends" && !("名前" in first)) {
        return "取得は成功しましたが、友達情報のヘッダ名が一致しません。";
      }
      if (key === "siteLogs" && (!("日付" in first) || !("項目" in first))) {
        return "取得は成功しましたが、現場記録情報のヘッダ名が一致しません。";
      }
      if (key === "manuscripts" && !("タイトル" in first)) {
        return "取得は成功しましたが、メモ情報のヘッダ名が一致しません。";
      }
    }
    if (key === "users") {
      return "ユーザーデータを取得できません。シート共有設定を確認してください。";
    }
    if (key === "friends") {
      return "友達情報を取得できません。シート共有設定を確認してください。";
    }
    if (key === "manuscripts") {
      return "メモ情報を取得できません。シート共有設定を確認してください。";
    }
    return "現場記録情報を取得できません。シート共有設定を確認してください。";
  }

  async function safeLoadSheetRows(key) {
    try {
      const rows = await loadSheetRows(key);
      return { ok: true, rows: rows, message: "" };
    } catch (_) {
      return { ok: false, rows: [], message: getSheetErrorMessage(key, []) };
    }
  }

  // =========================
  // 書き込みAPI共通
  // =========================
  function ensureWriteApiConfigured() {
    if (!WRITE_API_URL) {
      throw new Error("書き込みAPIが未設定です。SITELOG_WEBAPP_URL を設定してください。");
    }
  }

  async function callWriteApi(action, payload) {
    ensureWriteApiConfigured();
    const body = JSON.stringify({ action: action, payload: payload });
    try {
      const res = await fetch(WRITE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body
      });
      if (!res.ok) {
        throw new Error("書き込みに失敗しました(" + res.status + ")");
      }
      const data = await res.json().catch(function () {
        return { ok: true };
      });
      if (data && data.ok === false) {
        throw new Error(data.message || "書き込みに失敗しました");
      }
      return { verified: true };
    } catch (err) {
      await postWriteViaForm(action, payload);
      return { verified: false };
    }
  }

  async function postWriteViaForm(action, payload) {
    return new Promise(function (resolve) {
      const frameName = "siteLogWriteFrame_" + Date.now();
      const iframe = document.createElement("iframe");
      iframe.name = frameName;
      iframe.style.display = "none";
      document.body.appendChild(iframe);

      const form = document.createElement("form");
      form.method = "POST";
      form.action = WRITE_API_URL;
      form.target = frameName;
      form.style.display = "none";

      const actionInput = document.createElement("input");
      actionInput.name = "action";
      actionInput.value = action;
      form.appendChild(actionInput);

      const payloadInput = document.createElement("input");
      payloadInput.name = "payload";
      payloadInput.value = JSON.stringify(payload || {});
      form.appendChild(payloadInput);

      document.body.appendChild(form);
      form.submit();

      setTimeout(function () {
        try {
          form.remove();
          iframe.remove();
        } catch (_) {}
        resolve();
      }, 1200);
    });
  }

  // =========================
  // 暗号化 / 復号化
  // =========================
  // XOR + 16進数文字列による可逆変換。
  // 暗号化済みデータには "ENC:" プレフィックスを付与する。
  // btoa/atob/escape/unescape を使用しないため、
  // 文字コード範囲・UTF-8妥当性に依存しない確実な実装。
  var _CIPHER_KEY = "SiteLogKey2024";
  var _ENC_PREFIX = "ENC:";

  function encrypt(text) {
    if (text == null || text === "") return text;
    var str = String(text);
    // 既に暗号化済みの場合はそのまま返す
    if (str.indexOf(_ENC_PREFIX) === 0) return str;
    var hex = "";
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i) ^ _CIPHER_KEY.charCodeAt(i % _CIPHER_KEY.length);
      hex += ("0000" + code.toString(16)).slice(-4);
    }
    return _ENC_PREFIX + hex;
  }

  function decrypt(encoded) {
    if (encoded == null || encoded === "") return encoded;
    var s = String(encoded);
    // "ENC:" プレフィックスがなければ未暗号化データとしてそのまま返す
    if (s.indexOf(_ENC_PREFIX) !== 0) return s;
    try {
      var hex = s.slice(_ENC_PREFIX.length);
      if (hex.length % 4 !== 0) return s; // 不正な長さ
      var str = "";
      for (var i = 0; i < hex.length; i += 4) {
        var code = parseInt(hex.slice(i, i + 4), 16) ^ _CIPHER_KEY.charCodeAt((i / 4) % _CIPHER_KEY.length);
        str += String.fromCharCode(code);
      }
      return str;
    } catch (_) {
      return s; // 復号化失敗時は元の値を返す
    }
  }

  var FRIEND_ENCRYPT_FIELDS = ["名前", "LINE名", "年齢差", "生年月日", "性別", "職業", "出会った日", "出会った場所", "相手の情報", "今後の予定"];
  var SITELOG_ENCRYPT_FIELDS = ["日付", "項目", "出会った相手", "メモ", "ToDo"];
  var MANUSCRIPT_ENCRYPT_FIELDS = ["タイトル", "メモ"];

  function encryptRecord(record, fields) {
    var out = {};
    Object.keys(record).forEach(function (k) {
      out[k] = fields.indexOf(k) >= 0 ? encrypt(record[k]) : record[k];
    });
    return out;
  }

  function decryptRecord(record, fields) {
    var out = {};
    Object.keys(record).forEach(function (k) {
      out[k] = fields.indexOf(k) >= 0 ? decrypt(record[k]) : record[k];
    });
    return out;
  }

  function encryptFriendRecord(record) {
    return encryptRecord(record, FRIEND_ENCRYPT_FIELDS);
  }

  function decryptFriendRecord(record) {
    return decryptRecord(record, FRIEND_ENCRYPT_FIELDS);
  }

  function encryptSiteLogRecord(record) {
    return encryptRecord(record, SITELOG_ENCRYPT_FIELDS);
  }

  function decryptSiteLogRecord(record) {
    return decryptRecord(record, SITELOG_ENCRYPT_FIELDS);
  }

  function encryptManuscriptRecord(record) {
    return encryptRecord(record, MANUSCRIPT_ENCRYPT_FIELDS);
  }

  function decryptManuscriptRecord(record) {
    return decryptRecord(record, MANUSCRIPT_ENCRYPT_FIELDS);
  }

  // =========================
  // パスワード変更
  // =========================
  async function updatePassword(payload) {
    await callWriteApi("updatePassword", payload);
  }

  async function resetUserPassword(userId) {
    await callWriteApi("updatePassword", {
      userId: String(userId || ""),
      newPassword: encrypt("resetPass")
    });
  }

  // =========================
  // ユーザー管理
  // =========================
  async function appendUser(record) {
    await callWriteApi("appendUser", record);
  }

  async function deleteUser(id) {
    await callWriteApi("deleteUser", { id: id });
  }

  // =========================
  // 友達 書き込み
  // =========================
  async function appendFriend(record) {
    await callWriteApi("appendFriend", record);
  }

  async function updateFriend(record) {
    await callWriteApi("updateFriend", record);
  }

  async function deleteFriend(id) {
    await callWriteApi("deleteFriend", { id: id });
  }

  // =========================
  // 現場記録 書き込み
  // =========================
  async function appendSiteLog(record) {
    await callWriteApi("appendSiteLog", record);
  }

  async function updateSiteLog(record) {
    await callWriteApi("updateSiteLog", record);
  }

  async function deleteSiteLog(id) {
    await callWriteApi("deleteSiteLog", { id: id });
  }

  // =========================
  // メモ 書き込み
  // =========================
  async function appendManuscript(record) {
    await callWriteApi("appendManuscript", record);
  }

  async function updateManuscript(record) {
    await callWriteApi("updateManuscript", record);
  }

  async function deleteManuscript(id) {
    await callWriteApi("deleteManuscript", { id: id });
  }

  // =========================
  // 日付ユーティリティ
  // =========================

  // gviz API は日付を "Date(year,month,day)" 形式（month は 0 始まり）で返す。
  // これを "YYYY-MM-DD" に正規化してから格納する。
  function normalizeGvizValue_(v) {
    const s = String(v);
    const m = /^Date\((\d+),(\d+),(\d+)\)$/.exec(s);
    if (m) {
      const y = m[1];
      const mo = String(parseInt(m[2], 10) + 1).padStart(2, "0");
      const d = String(parseInt(m[3], 10)).padStart(2, "0");
      return y + "-" + mo + "-" + d;
    }
    return s.trim();
  }

  // 日付文字列を Date オブジェクトに変換する。
  // 対応フォーマット: "YYYY-MM-DD", "YYYY/MM/DD", "Date(year,month,day)"
  function parseAnyDate_(dateStr) {
    if (!dateStr) return null;
    const s = String(dateStr).trim();
    // gviz形式（念のため未変換値が来た場合も吸収）
    const gviz = /^Date\((\d+),(\d+),(\d+)\)$/.exec(s);
    if (gviz) {
      const d = new Date(parseInt(gviz[1], 10), parseInt(gviz[2], 10), parseInt(gviz[3], 10), 12, 0, 0);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    // YYYY/MM/DD または YYYY-MM-DD
    const normalized = s.replace(/\//g, "-");
    const d = new Date(normalized.includes("T") ? normalized : normalized + "T12:00:00");
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // =========================
  // ユーティリティ
  // =========================
  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = parseAnyDate_(dateStr);
    if (!d) return dateStr;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "/" + m + "/" + day;
  }

  // 生年月日文字列から現在の年齢（整数）を返す。無効な場合は null
  function calcAgeFromBirthDate(dateStr) {
    const birth = parseAnyDate_(dateStr);
    if (!birth) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const dm = now.getMonth() - birth.getMonth();
    if (dm < 0 || (dm === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  }

  /**
   * 友達データの「年齢」を算出して文字列で返す。
   *  1. friend["生年月日"] が入力済み → そこから算出
   *  2. friend["年齢差"] が入力済み かつ loginUser.birthDate がある → ログインユーザーの年齢 ＋ 年齢差
   *  3. それ以外 → ""
   */
  function calcAge(friend, loginUser) {
    const birth = friend && friend["生年月日"] ? String(friend["生年月日"]).trim() : "";
    if (birth) {
      const age = calcAgeFromBirthDate(birth);
      return age !== null ? String(age) : "";
    }
    const diffRaw = friend && friend["年齢差"] != null ? String(friend["年齢差"]).trim() : "";
    if (diffRaw !== "" && loginUser && loginUser.birthDate) {
      const userAge = calcAgeFromBirthDate(loginUser.birthDate);
      const diff = parseInt(diffRaw, 10);
      if (userAge !== null && !Number.isNaN(diff)) {
        return String(userAge + diff);
      }
    }
    return "";
  }

  function normalizeAuthValue(value) {
    return String(value == null ? "" : value)
      .replace(/\u00a0/g, " ")
      .replace(/\u3000/g, " ")
      .trim();
  }

  // =========================
  // sessionStorage ユーティリティ
  // =========================
  function readJson(key, fallback) {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  function getCurrentUser() {
    return readJson(STORAGE_KEYS.loginUser, null);
  }

  function setCurrentUser(user) {
    if (!user) {
      sessionStorage.removeItem(STORAGE_KEYS.loginUser);
      return;
    }
    writeJson(STORAGE_KEYS.loginUser, user);
  }

  function requireLogin() {
    if (!getCurrentUser()) {
      navigate("login");
      return false;
    }
    return true;
  }

  function fillUserNames() {
    const user = getCurrentUser();
    const displayName = user && user.name ? user.name : "";
    const menuName = document.getElementById("menu-user-name");
    if (menuName) menuName.textContent = displayName;
    document.querySelectorAll(".js-user-name").forEach(function (el) {
      el.textContent = displayName;
    });
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEYS.loginUser);
    navigate("login");
  }

  function bindLogoutButtons() {
    document.querySelectorAll("[data-action='logout']").forEach(function (el) {
      el.addEventListener("click", function () {
        if (window.confirm("ログアウトしますか？")) {
          logout();
        }
      });
    });
  }

  function bindNavButton(selector, screen) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.addEventListener("click", function () {
      navigate(screen);
    });
  }

  const SCREEN_PATHS = {
    login: "SCR-01-01.html",
    menu: "SCR-02-01.html",
    friendList: "SCR-03-01.html",
    friendDetail: "SCR-03-02.html",
    friendCreate: "SCR-03-03.html",
    friendEdit: "SCR-03-04.html",
    siteList: "SCR-04-01.html",
    siteDetail: "SCR-04-02.html",
    siteCreate: "SCR-04-03.html",
    siteEdit: "SCR-04-04.html",
    manuscriptList: "SCR-05-01.html",
    manuscriptDetail: "SCR-05-02.html",
    manuscriptCreate: "SCR-05-03.html",
    manuscriptEdit: "SCR-05-04.html",
    completion: "SCR-99-01.html",
    passwordChange: "SCR-A1-01.html",
    userCreate: "SCR-A2-01.html",
    userRegister: "SCR-A2-02.html"
  };

  function navigate(screen) {
    const path = SCREEN_PATHS[screen] || "SCR-01-01.html";
    window.location.href = "./" + path;
  }

  // =========================
  // 友達データ ストレージ
  // =========================
  function setFriends(rows) {
    writeJson(STORAGE_KEYS.friends, rows || []);
  }

  function getFriends() {
    return readJson(STORAGE_KEYS.friends, []);
  }

  function setSelectedFriendIndex(index) {
    sessionStorage.setItem(STORAGE_KEYS.selectedFriend, String(index));
  }

  function getSelectedFriendIndex() {
    const raw = sessionStorage.getItem(STORAGE_KEYS.selectedFriend);
    return raw == null ? -1 : Number(raw);
  }

  function setSelectedFriendId(id) {
    sessionStorage.setItem(STORAGE_KEYS.selectedFriendId, String(id));
  }

  function getSelectedFriendId() {
    const raw = sessionStorage.getItem(STORAGE_KEYS.selectedFriendId);
    return raw == null ? "" : String(raw);
  }

  function getFriendId(friend, fallbackIndex) {
    if (!friend) return "";
    const raw = friend.id != null && String(friend.id).trim() !== "" ? friend.id : (fallbackIndex + 1);
    return normalizeAuthValue(raw);
  }

  function findFriendById(rows, id) {
    const normId = normalizeAuthValue(id);
    if (!normId) return null;
    const index = rows.findIndex(function (row, idx) {
      return getFriendId(row, idx) === normId;
    });
    if (index < 0) return null;
    return { index: index, row: rows[index] };
  }

  // =========================
  // 現場記録情報 ストレージ
  // =========================
  function setSiteLogs(rows) {
    writeJson(STORAGE_KEYS.siteLogs, rows || []);
  }

  function getSiteLogs() {
    return readJson(STORAGE_KEYS.siteLogs, []);
  }

  function setSelectedSiteLogIndex(index) {
    sessionStorage.setItem(STORAGE_KEYS.selectedSiteLog, String(index));
  }

  function getSelectedSiteLogIndex() {
    const raw = sessionStorage.getItem(STORAGE_KEYS.selectedSiteLog);
    return raw == null ? -1 : Number(raw);
  }

  function setSelectedSiteLogId(id) {
    sessionStorage.setItem(STORAGE_KEYS.selectedSiteLogId, String(id));
  }

  function getSelectedSiteLogId() {
    const raw = sessionStorage.getItem(STORAGE_KEYS.selectedSiteLogId);
    return raw == null ? "" : String(raw);
  }

  function getSiteLogId(log, fallbackIndex) {
    if (!log) return "";
    const raw = log.id != null && String(log.id).trim() !== "" ? log.id : (fallbackIndex + 1);
    return normalizeAuthValue(raw);
  }

  function findSiteLogById(rows, id) {
    const normId = normalizeAuthValue(id);
    if (!normId) return null;
    const index = rows.findIndex(function (row, idx) {
      return getSiteLogId(row, idx) === normId;
    });
    if (index < 0) return null;
    return { index: index, row: rows[index] };
  }

  // =========================
  // メモ情報 ストレージ
  // =========================
  function setManuscripts(rows) {
    writeJson(STORAGE_KEYS.manuscripts, rows || []);
  }

  function getManuscripts() {
    return readJson(STORAGE_KEYS.manuscripts, []);
  }

  function setSelectedManuscriptId(id) {
    sessionStorage.setItem(STORAGE_KEYS.selectedManuscriptId, String(id));
  }

  function getSelectedManuscriptId() {
    const raw = sessionStorage.getItem(STORAGE_KEYS.selectedManuscriptId);
    return raw == null ? "" : String(raw);
  }

  function getManuscriptId(manuscript, fallbackIndex) {
    if (!manuscript) return "";
    const raw = manuscript.id != null && String(manuscript.id).trim() !== "" ? manuscript.id : (fallbackIndex + 1);
    return normalizeAuthValue(raw);
  }

  function findManuscriptById(rows, id) {
    const normId = normalizeAuthValue(id);
    if (!normId) return null;
    const index = rows.findIndex(function (row, idx) {
      return getManuscriptId(row, idx) === normId;
    });
    if (index < 0) return null;
    return { index: index, row: rows[index] };
  }

  // =========================
  // 完了画面 情報
  // =========================
  function setCompletionInfo(info) {
    writeJson(STORAGE_KEYS.completionInfo, info || {});
  }

  function getCompletionInfo() {
    return readJson(STORAGE_KEYS.completionInfo, {});
  }

  // =========================
  // ヘッダフレーム更新
  // =========================
  /**
   * 親フレーム (SCR-00-00) の ① ヘッダフレームへヘッダ設定を送る。
   * ヘッダフレームが未ロードの場合は 100ms 後にリトライする。
   *
   * config 仕様は SCR-00-01.js の window.updateHeader 参照。
   * userName が未指定の場合は sessionStorage のログインユーザー名を自動補完する。
   */
  function updateParentHeader(config) {
    var cfg = config || {};
    if (!("userName" in cfg)) {
      var user = getCurrentUser();
      cfg.userName = user ? (user.name || "") : "";
    }
    var msg = { type: "updateHeader", config: cfg };
    // 親フレーム (SCR-00-00) へ送信 → 親がヘッダフレームへ中継する
    // file:// プロトコルでもpostMessageは動作する
    window.parent.postMessage(msg, "*");
    // ヘッダフレームがまだロード中の場合に備えて一度再送する
    setTimeout(function () {
      window.parent.postMessage(msg, "*");
    }, 300);
  }

  window.SiteLogCommon = {
    safeLoadSheetRows: safeLoadSheetRows,
    encrypt: encrypt,
    decrypt: decrypt,
    encryptFriendRecord: encryptFriendRecord,
    decryptFriendRecord: decryptFriendRecord,
    encryptSiteLogRecord: encryptSiteLogRecord,
    decryptSiteLogRecord: decryptSiteLogRecord,
    encryptManuscriptRecord: encryptManuscriptRecord,
    decryptManuscriptRecord: decryptManuscriptRecord,
    appendUser: appendUser,
    deleteUser: deleteUser,
    updatePassword: updatePassword,
    resetUserPassword: resetUserPassword,
    calcAge: calcAge,
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    normalizeAuthValue: normalizeAuthValue,
    appendFriend: appendFriend,
    updateFriend: updateFriend,
    deleteFriend: deleteFriend,
    appendSiteLog: appendSiteLog,
    updateSiteLog: updateSiteLog,
    deleteSiteLog: deleteSiteLog,
    appendManuscript: appendManuscript,
    updateManuscript: updateManuscript,
    deleteManuscript: deleteManuscript,
    getCurrentUser: getCurrentUser,
    setCurrentUser: setCurrentUser,
    requireLogin: requireLogin,
    fillUserNames: fillUserNames,
    bindLogoutButtons: bindLogoutButtons,
    bindNavButton: bindNavButton,
    navigate: navigate,
    setFriends: setFriends,
    getFriends: getFriends,
    setSiteLogs: setSiteLogs,
    getSiteLogs: getSiteLogs,
    setSelectedFriendIndex: setSelectedFriendIndex,
    getSelectedFriendIndex: getSelectedFriendIndex,
    setSelectedFriendId: setSelectedFriendId,
    getSelectedFriendId: getSelectedFriendId,
    getFriendId: getFriendId,
    findFriendById: findFriendById,
    setSelectedSiteLogIndex: setSelectedSiteLogIndex,
    getSelectedSiteLogIndex: getSelectedSiteLogIndex,
    setSelectedSiteLogId: setSelectedSiteLogId,
    getSelectedSiteLogId: getSelectedSiteLogId,
    getSiteLogId: getSiteLogId,
    findSiteLogById: findSiteLogById,
    setManuscripts: setManuscripts,
    getManuscripts: getManuscripts,
    setSelectedManuscriptId: setSelectedManuscriptId,
    getSelectedManuscriptId: getSelectedManuscriptId,
    getManuscriptId: getManuscriptId,
    findManuscriptById: findManuscriptById,
    setCompletionInfo: setCompletionInfo,
    getCompletionInfo: getCompletionInfo,
    updateParentHeader: updateParentHeader
  };
})();
