/**
 * NISSAN E級玩家｜任務照片上傳後端（Google Apps Script）
 *
 * 功能：收到手機傳來的照片 → 存到雲端硬碟（依隊伍分資料夾）→ 寫一列到試算表
 * 使用方式請看《部署與測試教學》第二部分。這個檔案原則上不需要修改。
 */

// 雲端硬碟上的主資料夾名稱（第一次執行會自動建立在「我的雲端硬碟」）
var ROOT_FOLDER_NAME = 'E級玩家淨灘_任務照片';

// 若想指定既有資料夾，把資料夾網址最後那串 ID 貼在這裡，例如 '1AbCdEf...'；留空則自動建立
var ROOT_FOLDER_ID = '';

var SHEET_NAME = '上傳紀錄';
var TIMEZONE = 'Asia/Taipei';

var TEAM_FOLDERS = {
  yellow: '黃隊_Electric閃電E隊',
  red:    '紅隊_Entertainment活力E隊',
  green:  '綠隊_Ecosystem生態E隊'
};

var HEADERS = ['上傳時間', '隊伍', '第幾張', '檔案連結', '是否人工放行', '手機代號', '拍攝時間', '紀錄編號'];

/** 部署前先手動執行一次：授權＋建立資料夾與表頭 */
function setup() {
  getSheet_();
  Object.keys(TEAM_FOLDERS).forEach(function (t) { getTeamFolder_(t); });
  Logger.log('設定完成！主資料夾：' + getRootFolder_().getUrl());
}

/** 用瀏覽器打開網址時會看到這個，用來確認部署成功 */
function doGet() {
  return json_({ ok: true, message: 'E級玩家上傳服務運作中' });
}

/** 手機上傳照片 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
    var d = JSON.parse(e.postData.contents);
    if (!TEAM_FOLDERS[d.team]) return json_({ ok: false, error: 'unknown team' });
    if (!d.image || String(d.image).indexOf('data:image/') !== 0) return json_({ ok: false, error: 'no image' });

    var sheet = getSheet_();

    // 防止重複：網路不穩時手機可能重傳同一張
    var dup = sheet.getRange('H:H').createTextFinder(String(d.id)).matchEntireCell(true).findNext();
    if (dup) return json_({ ok: true, duplicate: true });

    var shotTime = Utilities.formatDate(new Date(Number(d.ts) || Date.now()), TIMEZONE, 'yyyyMMdd_HHmmss');
    var name = d.team + '_第' + d.slot + '張_' + shotTime + '_' + d.device + (d.manual ? '_人工放行' : '') + '.jpg';
    var bytes = Utilities.base64Decode(String(d.image).split(',')[1]);
    var file = getTeamFolder_(d.team).createFile(Utilities.newBlob(bytes, 'image/jpeg', name));

    sheet.appendRow([
      Utilities.formatDate(new Date(), TIMEZONE, 'yyyy/MM/dd HH:mm:ss'),
      TEAM_FOLDERS[d.team],
      Number(d.slot),
      file.getUrl(),
      d.manual ? '是' : '否',
      d.device,
      Utilities.formatDate(new Date(Number(d.ts) || Date.now()), TIMEZONE, 'yyyy/MM/dd HH:mm:ss'),
      String(d.id)
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* ---------- 以下為輔助函式 ---------- */
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#D7191F').setFontColor('#FFFFFF');
  }
  return sh;
}

function getRootFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = ROOT_FOLDER_ID || props.getProperty('ROOT_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var it = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  var f = it.hasNext() ? it.next() : DriveApp.createFolder(ROOT_FOLDER_NAME);
  props.setProperty('ROOT_ID', f.getId());
  return f;
}

function getTeamFolder_(team) {
  var props = PropertiesService.getScriptProperties();
  var key = 'FOLDER_' + team;
  var id = props.getProperty(key);
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var root = getRootFolder_();
  var it = root.getFoldersByName(TEAM_FOLDERS[team]);
  var f = it.hasNext() ? it.next() : root.createFolder(TEAM_FOLDERS[team]);
  props.setProperty(key, f.getId());
  return f;
}
