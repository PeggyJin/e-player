/* =========================================================
 *  NISSAN E級玩家｜駕馭新動力，E起淨海趣！
 *  ★ 活動設定檔：要改的東西幾乎都在這裡 ★
 *  修改時只改「冒號右邊」的值，引號、逗號請保留。
 * ========================================================= */
window.EPLAYER_CONFIG = {

  /* ---------- 活動基本資料 ---------- */
  EVENT_TITLE: 'E級玩家',
  EVENT_SLOGAN: '駕馭新動力，E起淨海趣！',
  EVENT_DATE_TEXT: '2026.12.05',     // 濾鏡上顯示的日期
  EVENT_PLACE_TEXT: '台中大甲',        // 濾鏡上顯示的地點

  /* ---------- 工作人員通關碼（三隊共用） ----------
   * 用途：①拍照連續失敗 2 次時人工放行 ②重設手機進度
   * 建議 4～6 位數字。活動前請改掉預設值！ */
  STAFF_CODE: '1205',

  /* ---------- 雲端上傳（Google Apps Script 網址） ----------
   * 部署 Apps Script 後，把「網頁應用程式網址」（.../exec 結尾）貼在引號內。
   * 留空 '' 代表不上傳（測試用），遊戲仍可正常進行。 */
  UPLOAD_URL: 'https://script.google.com/macros/s/AKfycbyTwszm8ux4S7wCFQyUCKNJUXDuBKXHA3uvue2F13RoA2DVEHujjd5OSTDoI9pugdZ2/exec',

  /* ---------- 任務設定 ---------- */
  MISSION_COUNT: 3,          // 要找幾個（電量條格數）
  FAILS_BEFORE_STAFF: 2,     // 同一格連續失敗幾次後出現「請工作人員協助」
  UPLOAD_LONG_EDGE: 1280,    // 上傳照片長邊像素
  UPLOAD_JPEG_QUALITY: 0.82, // 上傳照片 JPEG 品質（0～1）

  /* ---------- 濾鏡相機 ---------- */
  VIDEO_MAX_SECONDS: 15,     // 錄影最長秒數
  VIDEO_WITH_AUDIO: true,    // 錄影是否收音（手機會多詢問一次麥克風權限）

  /* ---------- 音效 ---------- */
  SOUND: true,               // 成功／解鎖音效
  VIBRATE: true,             // 成功時震動（僅 Android 支援）

  /* ---------- 顏色辨識門檻 ----------
   * 原理：只分析畫面中央對準框內的範圍，逐點換算成 HSV（色相／飽和度／亮度）。
   *   hue  ：色相範圍（0～360 度），可以有多段
   *   sMin ：最低飽和度（0～1）。越高越嚴格；調低可容許褪色，但沙子、灰色更容易被誤判
   *   vMin ：最低亮度（0～1）。太暗的點不算
   *   vMax ：最高亮度（0～1）。反光過曝的點不算
   * 框內符合顏色的點 ≥ MIN_RATIO（比例）就算成功。
   * 現場太難過關 → 把 MIN_RATIO 調低（例如 0.08）；太容易過關 → 調高（例如 0.18）。 */
     COLOR_RULES: {
    MIN_RATIO: 0.12,
    yellow: { hue: [[38, 72]],             sMin: 0.36, vMin: 0.35, vMax: 1.0 },
    red:    { hue: [[0, 18], [332, 360]],  sMin: 0.32, vMin: 0.22, vMax: 1.0 },
    green:  { hue: [[72, 170]],            sMin: 0.22, vMin: 0.18, vMax: 1.0 }
  },

  /* ---------- 三隊設定 ----------
   * url：部署到 GitHub Pages 後的網址，給 qrcodes.html 產生 QR code 用。 */
  TEAMS: {
    yellow: {
      en: 'Electric',
      zh: '閃電E隊',
      icon: 'BOLT',     // 像素圖示：BOLT 閃電／STAR 星星／LEAF 葉子
      colorName: '黃色',
      color: '#F2C200',      // 隊伍代表色（任務格、按鈕）
      textOnColor: '#1C1C1C',// 隊色按鈕上的字色
      url: ''
    },
    red: {
      en: 'Entertainment',
      zh: '活力E隊',
      icon: 'STAR',
      colorName: '紅色',
      color: '#D7191F',
      textOnColor: '#FFFFFF',
      url: ''
    },
    green: {
      en: 'Ecosystem',
      zh: '生態E隊',
      icon: 'LEAF',
      colorName: '綠色',
      color: '#64EA00',
      textOnColor: '#1C1C1C',
      url: ''
    }
  },

  /* ---------- 頁面文字 ---------- */
  TEXT: {
    missionLine: '在淨灘區域找到 {n} 個 {color} 的海廢並拍下來',
    doneMessage: '用濾鏡拍照打卡，活動結束後到報到台兌換小禮物！'
  }
};
