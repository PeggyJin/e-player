/* =========================================================
 *  NISSAN e級玩家｜駕馭新動力，e起淨海趣！
 *  ★ 活動設定檔：要改的東西幾乎都在這裡 ★
 *  修改時只改「冒號右邊」的值，引號、逗號請保留。
 * ========================================================= */
window.EPLAYER_CONFIG = {

  /* ---------- 活動基本資料 ---------- */
  EVENT_TITLE: 'e級玩家',
  EVENT_SLOGAN: '駕馭新動力，e起淨海趣！',

  /* ---------- 工作人員通關碼 ----------
   * 用途：拍照連續失敗 2 次時，由工作人員輸入後人工放行
   * 建議 4～6 位數字。活動前請改掉預設值！ */
  STAFF_CODE: '1205',

  /* ---------- 雲端上傳（Google Apps Script 網址） ----------
   * 部署 Apps Script 後，把「網頁應用程式網址」（.../exec 結尾）貼在引號內。
   * 留空 '' 代表不上傳（測試用），遊戲仍可正常進行。 */
  UPLOAD_URL: 'https://script.google.com/macros/s/AKfycbyTwszm8ux4S7wCFQyUCKNJUXDuBKXHA3uvue2F13RoA2DVEHujjd5OSTDoI9pugdZ2/exec',

  /* ---------- 任務設定 ---------- */
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
   *   hue  ：色相範圍（0～360 度），可以有多段。
   *          每段可寫成 [起, 迄] 或 [起, 迄, { sMin, vMin, vMax }]，第三項代表這一段另外的門檻
   *   sMin ：最低飽和度（0～1）。越高越嚴格；調低可容許褪色，但沙子、灰色更容易被誤判
   *   vMin ：最低亮度（0～1）。太暗的點不算
   *   vMax ：最高亮度（0～1）。反光過曝的點不算
   * 框內符合顏色的點 ≥ MIN_RATIO（比例）就算成功。
   * 現場太難過關 → 把 MIN_RATIO 調低（例如 0.08）；太容易過關 → 調高（例如 0.18）。
   * 色相參考：紅 0／橘 25／黃 50／黃綠 80／綠 120／藍綠 175／藍 220 */
  COLOR_RULES: {
    MIN_RATIO: 0.12,
    yellow: {
      hue: [
        [38, 72],                              // 黃色
        [18, 38, { sMin: 0.62, vMin: 0.6 }]    // 橘色：要夠鮮豔、夠亮，避免把漂流木的褐色算進去
      ],
      sMin: 0.36, vMin: 0.35, vMax: 1.0
    },
    red: {
      hue: [[0, 18], [332, 360]],              // 紅色（不含橘色）
      sMin: 0.32, vMin: 0.22, vMax: 1.0
    },
    green: {
      hue: [
        [72, 170],                             // 黃綠～綠
        [80, 165, { sMin: 0.12, vMin: 0.6 }],  // 淺綠、粉綠：顏色淡但要夠亮
        [170, 186, { sMin: 0.45 }]             // 藍綠：要夠鮮豔，避免把海水算進去
      ],
      sMin: 0.22, vMin: 0.18, vMax: 1.0
    }
  },

  /* ---------- 任務顏色與順序 ----------
   * MISSION_ORDER：參加者要依序找的顏色（目前：紅 → 黃 → 綠）
   * COLORS：每個顏色的名稱、代表色、按鈕字色、找不到時的小提示 */
  MISSION_ORDER: ['red', 'yellow', 'green'],
  COLORS: {
    red:    { name: '紅色', color: '#D7191F', textOnColor: '#FFFFFF', hint: '正紅、暗紅、褪色的粉紅都可以；橘色要留到黃色關卡喔！' },
    yellow: { name: '黃色', color: '#F2C200', textOnColor: '#1C1C1C', hint: '黃色或橘色都可以！' },
    green:  { name: '綠色', color: '#64EA00', textOnColor: '#1C1C1C', hint: '綠色、淺綠、藍綠都可以；海草和植物不算喔！' }
  },

  /* ---------- 濾鏡標語（參加者可在濾鏡相機按「換標語」切換） ----------
   * text：用 {大括號} 包起來的字會變成紅色
   * icon／tail：標語前後的像素圖示（PIN 定位、SUN 太陽、BOLT 閃電、BAG 回收袋、SPARK 閃光、DOTS 進度點） */
  FILTER_SLOGANS: [
    { icon: 'PIN',  text: '我在{大甲}天氣晴', tail: 'SUN' },
    { icon: 'BOLT', text: 'e級玩家{淨灘中}', tail: 'DOTS' },
    { icon: 'BAG',  text: 'e起把{海}撿乾淨', tail: 'SPARK' }
  ],

  /* ---------- 網址（給 qrcodes.html 產生 QR code 用；留空會自動抓目前網址） ---------- */
  SITE_URL: '',

  /* ---------- 頁面文字 ---------- */
  TEXT: {
    missionLine: '依序在淨灘區域找到<br>{colors}<br>三種顏色的海廢並拍下',
    doneMessage: '用濾鏡拍照打卡，活動結束後到報到台兌換小禮物！'
  }
};
