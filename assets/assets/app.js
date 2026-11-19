/* =========================================================
 *  NISSAN E級玩家｜共用主程式（三隊共用）
 *  流程：首頁 → 任務相機 → 判定 → 充電完成動畫 → 濾鏡相機 → 預覽 → 完成頁
 * ========================================================= */
(function () {
  'use strict';

  var CFG = window.EPLAYER_CONFIG;
  var TEAM_ID = window.EPLAYER_TEAM;
  var TEAM = CFG.TEAMS[TEAM_ID];
  var N = CFG.MISSION_COUNT;
  var QS = new URLSearchParams(location.search);
  var TEST = QS.get('test') === '1';
  var UA = navigator.userAgent;
  var IS_IOS = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  /* ---------- LINE 內建瀏覽器：自動改用外部瀏覽器開啟 ---------- */
  if (/\bLine\//i.test(UA) && QS.get('openExternalBrowser') !== '1') {
    QS.set('openExternalBrowser', '1');
    location.replace(location.pathname + '?' + QS.toString());
    return;
  }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var app = document.getElementById('app');

  /* =========================================================
   *  進度（存在手機本機）
   * ========================================================= */
  var STORE_KEY = 'eplayer_v1_' + TEAM_ID;
  function freshState() {
    var s = { slots: [], fails: [], unlocked: false, uploaded: 0 };
    for (var i = 0; i < N; i++) { s.slots.push(null); s.fails.push(0); }
    return s;
  }
  function loadState() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && s.slots && s.slots.length === N) return s;
    } catch (e) {}
    return freshState();
  }
  var state = loadState();
  function saveState() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }
  function doneCount() { return state.slots.filter(Boolean).length; }
  function currentSlot() { for (var i = 0; i < N; i++) if (!state.slots[i]) return i; return -1; }

  var DEVICE_ID = (function () {
    var k = 'eplayer_device';
    var id = null;
    try { id = localStorage.getItem(k); } catch (e) {}
    if (!id) {
      id = Math.random().toString(36).slice(2, 8).toUpperCase();
      try { localStorage.setItem(k, id); } catch (e) {}
    }
    return id;
  })();

  /* =========================================================
   *  畫面
   * ========================================================= */
  var root = document.documentElement.style;
  root.setProperty('--team', TEAM.color);
  root.setProperty('--team-text', TEAM.textOnColor);

  var hlColor = '<span class="hl">' + TEAM.colorName + '</span>';
  var missionLine = CFG.TEXT.missionLine.replace('{n}', N).replace('{color}', hlColor);
  var waveSvg = PX.svg(PX.waveBand(60, 3).cells);
  var boltSvg = PX.svg(PX.cells('BOLT'));
  var eSvg = PX.svg(PX.cells('E'), { shadow: { dx: 0.7, dy: 0.7 } });
  var stripes = function (pos) { return '<div class="stripes stripes--' + pos + '"><i></i><i></i><i></i></div>'; };

  app.innerHTML =
    /* ---------- 首頁 ---------- */
    '<section id="s-home" class="screen"><div class="wrap">' +
      '<div class="kv-wrap"><img class="kv" src="assets/kv.webp" alt="NISSAN E級玩家｜' + CFG.EVENT_SLOGAN + '">' +
        '<div class="kv-logo" id="kv-logo" aria-hidden="true"></div></div>' +
      '<div class="home-body">' +
        '<div class="team-badge"><div class="team-badge__icon">' + PX.svg(PX.cells(TEAM.icon || 'BOLT', 0, 0, TEAM.textOnColor)) + '</div>' +
          '<div class="team-badge__text"><div class="team-badge__en">TEAM ' + TEAM.en.toUpperCase() + '</div>' +
          '<div class="team-badge__zh">' + TEAM.zh + '</div></div></div>' +
        '<div class="green-line"></div>' +
        '<div class="mission-card">' +
          '<div class="ribbon" id="home-ribbon"><small>MISSION</small>任務</div>' +
          '<p class="mission-text" id="home-mission">' + missionLine + '</p>' +
          '<div class="battery-box">' + batteryHTML('home-cells') +
            '<div class="battery-label" id="home-count"></div></div>' +
          '<p class="mission-tip" id="home-tip"></p>' +
        '</div>' +
        '<div class="home-cta"><button class="pbtn" id="btn-start"></button></div>' +
        '<div class="upload-chip" id="upload-chip"></div>' +
      '</div>' +
      '<div class="footer">' +
        '<div class="footer__logo" id="logo"><img src="assets/nissan-logo.png" alt="NISSAN"></div>' +
        '<div class="footer__wave">' + waveSvg +
          '<div class="footer__litter">' + PX.svg(PX.cells('BOTTLE')) + PX.svg(PX.cells('CAP')) + PX.svg(PX.cells('BAG')) + '</div>' +
        '</div><div class="footer__safe"></div>' +
      '</div>' +
    '</div></section>' +

    /* ---------- 任務相機 ---------- */
    '<section id="s-mission" class="screen"><div class="cam" id="mcam">' +
      '<video id="mvideo" playsinline muted autoplay></video>' +
      '<img class="freeze" id="mfreeze" alt="">' +
      '<div class="cam__top">' +
        '<button class="icon-btn" id="m-close" aria-label="返回">✕</button>' +
        '<span class="chip" id="m-slot"></span><span class="spacer"></span>' +
      '</div>' +
      '<div class="aim" id="aim"><i></i><i></i><i></i><i></i>' +
        '<div class="aim__label">把 <b>' + TEAM.colorName + '</b> 海廢放進框裡</div></div>' +
      '<div class="analyzing">分析顏色中<div class="dots"><span></span><span></span><span></span></div></div>' +
      '<div class="cam__bottom">' +
        '<button class="shutter" id="m-shutter" aria-label="拍照"></button>' +
        (TEST ? '<button class="test-link" id="m-pick">（測試）從相簿選圖</button>' : '') +
      '</div>' +
      '<div class="cam-error" id="m-error"><h3>相機打不開</h3><p id="m-error-msg"></p>' +
        '<div class="stack">' +
          '<button class="pbtn" id="m-fallback">📷 改用手機相機拍照</button>' +
          '<button class="pbtn pbtn--white" id="m-retry">再試一次</button>' +
          '<button class="pbtn pbtn--white pbtn--sm" id="m-err-home">回首頁</button>' +
        '</div></div>' +
      '<input type="file" accept="image/*" capture="environment" id="m-file" hidden>' +
      '<input type="file" accept="image/*" id="m-file-album" hidden>' +
    '</div></section>' +

    /* ---------- 充電完成解鎖 ---------- */
    '<section id="s-unlock" class="screen"><div class="wrap unlock" id="unlock">' +
      stripes('tr') + stripes('bl') +
      '<div class="unlock__bolt" id="u-bolt">' + boltSvg + '</div>' +
      '<div class="unlock__battery"><div class="battery__body" id="u-cells"></div><div class="battery__cap"></div></div>' +
      '<div class="unlock__pct" id="u-pct">0%</div>' +
      '<h2 class="unlock__title">充電完成！</h2>' +
      '<div class="unlock__sub">濾鏡解鎖！</div>' +
      '<div class="unlock__cta"><button class="pbtn pbtn--red" id="u-go">📸 開啟濾鏡相機</button></div>' +
      '<div class="burst" id="u-burst"></div>' +
    '</div></section>' +

    /* ---------- 濾鏡相機 ---------- */
    '<section id="s-filter" class="screen"><div class="cam fcam" id="fcam">' +
      '<video class="src-video" id="fvideo" playsinline muted autoplay></video>' +
      '<canvas class="live" id="fcanvas" width="720" height="1280"></canvas>' +
      '<div class="cam__top ftop"><span class="rec-time" id="rec-time"></span></div>' +
      '<div class="rec-bar" id="rec-bar"><span></span></div>' +
      '<div class="cam__bottom frow">' +
        '<button class="icon-btn fclose" id="f-close" aria-label="返回">✕</button>' +
        '<div class="mode-toggle" id="f-mode"><button data-mode="photo" class="on">拍照</button><button data-mode="video">錄影</button></div>' +
        '<button class="shutter fshutter" id="f-shutter" aria-label="拍攝"></button>' +
        '<button class="icon-btn flip" id="f-flip" aria-label="切換鏡頭"><span>⟲</span><small>翻轉</small></button>' +
      '</div>' +
      '<div class="cam-error" id="f-error"><h3>相機打不開</h3><p id="f-error-msg"></p>' +
        '<div class="stack"><button class="pbtn" id="f-retry">再試一次</button>' +
        '<button class="pbtn pbtn--white" id="f-err-home">回首頁</button></div></div>' +
    '</div></section>' +

    /* ---------- 預覽 ---------- */
    '<section id="s-preview" class="screen"><div class="preview">' +
      '<div class="preview__media" id="p-media"></div>' +
      '<div class="preview__bar"><p class="preview__tip" id="p-tip"></p>' +
        '<div class="btn-row"><button class="pbtn pbtn--white" id="p-retake">重拍</button>' +
        '<button class="pbtn pbtn--red" id="p-save">⬇ 下載</button></div></div>' +
    '</div></section>' +

    /* ---------- 完成頁 ---------- */
    '<section id="s-done" class="screen"><div class="wrap done">' +
      stripes('tr') +
      '<div class="done__e">' + eSvg + '</div>' +
      '<h2 class="done__title">任務完成！</h2>' +
      '<div class="done__card"><div class="ribbon"><small>NEXT</small>最後一步</div><br>' + CFG.TEXT.doneMessage + '</div>' +
      '<div class="stack"><button class="pbtn pbtn--red" id="d-again">📸 再拍一張</button>' +
        '<button class="pbtn pbtn--white" id="d-home">回首頁</button></div>' +
      '<div class="footer"><div class="footer__wave">' + waveSvg + '</div><div class="footer__safe"></div></div>' +
    '</div></section>' +

    /* ---------- 共用元件 ---------- */
    '<div class="sheet" id="sheet"></div>' +
    '<div class="modal-bg" id="modal-bg"><div class="modal" id="modal"></div></div>' +
    '<div class="toast" id="toast"></div>' +
    '<div class="inapp" id="inapp"><h2>請改用瀏覽器開啟</h2>' +
      '<p>你目前在 App 內建的瀏覽器裡，相機可能無法使用。</p>' +
      '<ol><li>點右上角「⋯」或分享按鈕</li><li>選「用瀏覽器開啟」／「在 Safari 開啟」／「在 Chrome 開啟」</li></ol>' +
      '<button class="pbtn pbtn--white" id="inapp-ok" style="margin-top:20px">我知道了，先繼續</button></div>' +
    (TEST ? '<div class="test-banner">TEST MODE</div>' : '');

  function batteryHTML(id) {
    return '<div class="battery"><div class="battery__body" id="' + id + '"></div><div class="battery__cap"></div></div>';
  }
  function fillCells(el, total, on, popIndex) {
    var h = '';
    for (var i = 0; i < total; i++) h += '<div class="cell' + (i < on ? ' on' : '') + (i === popIndex ? ' pop' : '') + '"></div>';
    el.innerHTML = h;
  }

  var current = null;
  function show(id) {
    if (current === 'mission' && id !== 'mission') stopMission();
    if (current === 'filter' && id !== 'filter') stopFilter();
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
    $('#s-' + id).classList.add('active');
    current = id;
    window.scrollTo(0, 0);
    hideSheet();
  }

  function toast(msg, ms) {
    var t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove('show'); }, ms || 2600);
  }

  /* =========================================================
   *  首頁
   * ========================================================= */
  function renderHome() {
    var n = doneCount();
    fillCells($('#home-cells'), N, n);
    $('#home-count').innerHTML = n + '/' + N + '<small>' + Math.round(n / N * 100) + '%</small>';
    var btn = $('#btn-start');
    if (state.unlocked) {
      $('#home-ribbon').innerHTML = '<small>CLEAR</small>任務完成';
      $('#home-tip').textContent = CFG.TEXT.doneMessage;
      btn.textContent = '📸 進入濾鏡相機';
    } else if (n >= N) {
      $('#home-tip').textContent = '電量已充滿！';
      btn.textContent = '⚡ 解鎖濾鏡';
    } else {
      $('#home-tip').textContent = '小提示：把海廢放在框的中央、拿近一點，避開逆光。';
      btn.textContent = n === 0 ? '開始任務 📷' : '繼續任務 📷';
    }
    updateChip();
  }

  $('#btn-start').addEventListener('click', function () {
    unlockAudio();
    if (state.unlocked) openFilter();
    else if (doneCount() >= N) openUnlock();
    else openMission();
  });

  /* 工作人員重設進度：長按 NISSAN logo 2 秒，或 3 秒內連點 5 下
   * 首頁最下方的 logo、主視覺右上角的 logo 都可以 */
  (function () {
    var timer = null, taps = [], busy = false;
    function fire() { if (busy) return; busy = true; clear(); openReset(); setTimeout(function () { busy = false; }, 800); }
    function clear() {
      clearTimeout(timer);
      document.querySelectorAll('.staff-hot').forEach(function (el) { el.classList.remove('holding'); });
    }
    function bind(el) {
      el.classList.add('staff-hot');
      function start(e) {
        if (e.cancelable) e.preventDefault();
        el.classList.add('holding');
        timer = setTimeout(fire, 2000);
        var now = Date.now();
        taps = taps.filter(function (t) { return now - t < 3000; }); taps.push(now);
        if (taps.length >= 5) { taps = []; fire(); }
      }
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('mousedown', start);
      ['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach(function (ev) { el.addEventListener(ev, clear); });
      el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }
    bind($('#logo'));
    bind($('#kv-logo'));
  })();

  function openReset() {
    if (navigator.vibrate) navigator.vibrate(60);
    codeModal('工作人員：重設進度', '輸入通關碼後，會清除這支手機在「' + TEAM.zh + '」的任務進度。').then(function (ok) {
      if (!ok) return;
      confirmModal('確定要重設嗎？', '任務格數、失敗次數、濾鏡解鎖都會歸零（已上傳的照片不受影響）。', '確定重設', '取消')
        .then(function (yes) {
          if (!yes) return;
          var uploaded = state.uploaded;
          state = freshState(); state.uploaded = uploaded; saveState();
          renderHome(); toast('已重設進度');
        });
    });
  }

  /* =========================================================
   *  對話框（通關碼／確認）
   * ========================================================= */
  function closeModal() { $('#modal-bg').classList.remove('show'); }
  function codeModal(title, msg) {
    return new Promise(function (resolve) {
      var m = $('#modal');
      m.innerHTML = '<h3>' + title + '</h3><p>' + msg + '</p>' +
        '<input class="code-input" id="code-in" type="tel" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="8">' +
        '<div class="btn-row"><button class="pbtn pbtn--white pbtn--sm" id="code-cancel">取消</button>' +
        '<button class="pbtn pbtn--red pbtn--sm" id="code-ok">確認</button></div>';
      $('#modal-bg').classList.add('show');
      var inp = $('#code-in');
      inp.focus(); // 需在點擊事件中同步呼叫，iPhone 才會跳出鍵盤
      function ok() {
        if (inp.value.trim() === String(CFG.STAFF_CODE)) { inp.blur(); closeModal(); resolve(true); }
        else {
          inp.value = ''; m.classList.remove('shake'); void m.offsetWidth; m.classList.add('shake');
          sfx('fail'); inp.focus();
        }
      }
      $('#code-ok').onclick = ok;
      inp.onkeydown = function (e) { if (e.key === 'Enter') ok(); };
      $('#code-cancel').onclick = function () { inp.blur(); closeModal(); resolve(false); };
    });
  }
  function confirmModal(title, msg, okText, cancelText) {
    return new Promise(function (resolve) {
      $('#modal').innerHTML = '<h3>' + title + '</h3><p>' + msg + '</p>' +
        '<div class="btn-row"><button class="pbtn pbtn--white pbtn--sm" id="cf-no">' + cancelText + '</button>' +
        '<button class="pbtn pbtn--red pbtn--sm" id="cf-yes">' + okText + '</button></div>';
      $('#modal-bg').classList.add('show');
      $('#cf-yes').onclick = function () { closeModal(); resolve(true); };
      $('#cf-no').onclick = function () { closeModal(); resolve(false); };
    });
  }

  /* =========================================================
   *  音效（8-bit）與震動
   * ========================================================= */
  var actx = null;
  function unlockAudio() {
    if (!CFG.SOUND) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
    } catch (e) { actx = null; }
  }
  var SFX = {
    click: [[1400, 0.03]],
    success: [[660, 0.08], [880, 0.08], [1320, 0.18]],
    fail: [[320, 0.12], [220, 0.2]],
    tick: [[520, 0.04]],
    unlock: [[523, 0.09], [659, 0.09], [784, 0.09], [1047, 0.12], [784, 0.07], [1047, 0.3]]
  };
  function sfx(name) {
    if (!CFG.SOUND || !actx) return;
    var t = actx.currentTime + 0.01;
    SFX[name].forEach(function (n) {
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = 'square'; o.frequency.value = n[0];
      g.gain.setValueAtTime(0.07, t); g.gain.setValueAtTime(0, t + n[1]);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + n[1] + 0.02);
      t += n[1];
    });
  }
  function buzz(p) { if (CFG.VIBRATE && navigator.vibrate) navigator.vibrate(p); }

  /* =========================================================
   *  相機共用
   * ========================================================= */
  function camErrorText(err) {
    var name = err && err.name;
    if (!window.isSecureContext) return '網頁必須用 https 開啟才能使用相機。';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
      return '這個瀏覽器不支援網頁相機。\n請改用 Safari（iPhone）或 Chrome（Android）開啟。';
    if (name === 'NotAllowedError' || name === 'SecurityError')
      return '沒有相機權限。\n\niPhone：點網址列左邊的「ᴀA」→ 網站設定 → 相機 → 允許，再按「再試一次」。\n\nAndroid：點網址列左邊的圖示 → 權限 → 相機 → 允許。';
    if (name === 'NotFoundError' || name === 'OverconstrainedError') return '找不到可用的相機。';
    if (name === 'NotReadableError') return '相機被其他 App 佔用中，請關掉其他使用相機的 App 再試一次。';
    return '無法啟動相機（' + (name || err) + '）。';
  }

  function getCamera(facing, hiRes) {
    var v = { facingMode: { ideal: facing } };
    if (hiRes) { v.width = { ideal: 1920 }; v.height = { ideal: 1080 }; }
    return navigator.mediaDevices.getUserMedia({ audio: false, video: v });
  }
  function stopStream(s) { if (s) s.getTracks().forEach(function (t) { t.stop(); }); }
  function attach(video, stream) {
    video.srcObject = stream;
    video.muted = true;
    video.setAttribute('playsinline', '');
    var p = video.play();
    return (p && p.catch) ? p.catch(function () {}) : Promise.resolve();
  }

  /* =========================================================
   *  任務相機
   * ========================================================= */
  var mStream = null;
  var mBusy = false;
  var lastCapture = null; // 最近一次拍到的畫面（canvas）
  var mvideo = $('#mvideo'), mcam = $('#mcam');

  function openMission() {
    show('mission');
    $('#m-slot').textContent = '第 ' + (currentSlot() + 1) + ' / ' + N + ' 個';
    mcam.classList.remove('is-frozen', 'is-analyzing');
    $('#m-error').classList.remove('show');
    mBusy = false;
    startMissionCam();
  }
  function startMissionCam() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.isSecureContext) {
      return showMissionError({ name: 'Unsupported' });
    }
    stopStream(mStream);
    getCamera('environment', true).then(function (s) {
      mStream = s;
      $('#m-error').classList.remove('show');
      return attach(mvideo, s);
    }).catch(showMissionError);
  }
  function showMissionError(err) {
    $('#m-error-msg').textContent = camErrorText(err) + '\n\n也可以按下方「改用手機相機拍照」，一樣能完成任務。';
    $('#m-error').classList.add('show');
  }
  function stopMission() { stopStream(mStream); mStream = null; mvideo.srcObject = null; }

  $('#m-close').onclick = function () { show('home'); renderHome(); };
  $('#m-err-home').onclick = function () { show('home'); renderHome(); };
  $('#m-retry').onclick = startMissionCam;
  $('#m-fallback').onclick = function () { unlockAudio(); $('#m-file').click(); };
  if (TEST) $('#m-pick').onclick = function () { unlockAudio(); $('#m-file-album').click(); };
  ['#m-file', '#m-file-album'].forEach(function (sel) {
    $(sel).addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!f) return;
      var img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas');
        var s = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
        c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        $('#m-error').classList.remove('show');
        handleCapture(c);
      };
      img.src = URL.createObjectURL(f);
    });
  });

  $('#m-shutter').onclick = function () {
    unlockAudio();
    if (mBusy || !mvideo.videoWidth) return;
    sfx('click');
    var c = document.createElement('canvas');
    c.width = mvideo.videoWidth; c.height = mvideo.videoHeight;
    c.getContext('2d').drawImage(mvideo, 0, 0);
    handleCapture(c);
  };

  // 把畫面上的對準框換算成照片上的範圍（畫面與照片都是 cover 填滿）
  function aimRectOn(srcW, srcH) {
    var box = mcam.getBoundingClientRect(), aim = $('#aim').getBoundingClientRect();
    var s = Math.max(box.width / srcW, box.height / srcH);
    var offX = box.left + (box.width - srcW * s) / 2, offY = box.top + (box.height - srcH * s) / 2;
    var r = { x: (aim.left - offX) / s, y: (aim.top - offY) / s, w: aim.width / s, h: aim.height / s };
    r.x = Math.max(0, r.x); r.y = Math.max(0, r.y);
    r.w = Math.min(srcW - r.x, r.w); r.h = Math.min(srcH - r.y, r.h);
    return r;
  }

  function handleCapture(canvas) {
    mBusy = true;
    lastCapture = canvas;
    $('#mfreeze').src = canvas.toDataURL('image/jpeg', 0.8);
    mcam.classList.add('is-frozen', 'is-analyzing');
    var result = analyzeColor(canvas, aimRectOn(canvas.width, canvas.height));
    setTimeout(function () {
      mcam.classList.remove('is-analyzing');
      if (result.ok) onSuccess(false, result);
      else onFail(result);
    }, 900);
  }

  /* ---------- 顏色辨識（HSV） ---------- */
  function analyzeColor(src, rect) {
    var rule = CFG.COLOR_RULES[TEAM_ID];
    // 每一段色相可以有自己的門檻（沒寫就用整體的 sMin／vMin／vMax）
    var ranges = rule.hue.map(function (h) {
      var o = h[2] || {};
      return {
        lo: h[0], hi: h[1],
        sMin: o.sMin !== undefined ? o.sMin : rule.sMin,
        vMin: o.vMin !== undefined ? o.vMin : rule.vMin,
        vMax: o.vMax !== undefined ? o.vMax : (rule.vMax !== undefined ? rule.vMax : 1)
      };
    });
    var S = 72;
    var t = document.createElement('canvas'); t.width = t.height = S;
    var x = t.getContext('2d', { willReadFrequently: true });
    x.drawImage(src, rect.x, rect.y, rect.w, rect.h, 0, 0, S, S);
    var d = x.getImageData(0, 0, S, S).data;
    var match = 0;
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
      var max = Math.max(r, g, b), min = Math.min(r, g, b), c = max - min;
      if (c === 0) continue;
      var v = max, s = c / max;
      var h;
      if (max === r) h = ((g - b) / c) % 6;
      else if (max === g) h = (b - r) / c + 2;
      else h = (r - g) / c + 4;
      h *= 60; if (h < 0) h += 360;
      for (var k = 0; k < ranges.length; k++) {
        var q = ranges[k];
        if (h >= q.lo && h <= q.hi && s >= q.sMin && v >= q.vMin && v <= q.vMax) { match++; break; }
      }
    }
    var ratio = match / (S * S);
    return { ok: ratio >= CFG.COLOR_RULES.MIN_RATIO, ratio: ratio };
  }
  window.EPLAYER_analyzeColor = analyzeColor; // 測試用

  /* ---------- 結果面板 ---------- */
  function showSheet(html) { var s = $('#sheet'); s.innerHTML = html; s.classList.add('show'); }
  function hideSheet() { $('#sheet').classList.remove('show'); }
  function debugLine(res) {
    return TEST && res ? '<p class="sheet__debug">符合比例 ' + (res.ratio * 100).toFixed(1) + '%（門檻 ' + (CFG.COLOR_RULES.MIN_RATIO * 100) + '%）</p>' : '';
  }

  function onSuccess(manual, res) {
    var slot = currentSlot();
    if (slot < 0) return;
    state.slots[slot] = { ts: Date.now(), manual: !!manual };
    state.fails[slot] = 0;
    saveState();
    enqueueUpload(lastCapture, slot + 1, manual);
    sfx('success'); buzz([60, 40, 120]);
    var n = doneCount();
    var last = n >= N;
    showSheet(
      '<h3 class="sheet__title">' + boltSvg + (manual ? '工作人員已放行！' : '充電 +1！') + '</h3>' +
      '<p class="sheet__msg">' + (last ? '3 個都找到了，電量充滿！' : '還差 ' + (N - n) + ' 個' + TEAM.colorName + '海廢，繼續加油！') + '</p>' +
      debugLine(res) +
      '<div class="battery-box">' + batteryHTML('sheet-cells') + '<div class="battery-label">' + n + '/' + N + '</div></div>' +
      '<button class="pbtn" id="sh-next">' + (last ? '⚡ 充電完成！' : '繼續找下一個 →') + '</button>'
    );
    fillCells($('#sheet-cells'), N, n, n - 1);
    $('#sh-next').onclick = function () {
      unlockAudio();
      if (last) openUnlock();
      else resumeMission();
    };
  }

  function onFail(res) {
    var slot = currentSlot();
    state.fails[slot] = (state.fails[slot] || 0) + 1;
    saveState();
    sfx('fail'); buzz(200);
    var needStaff = state.fails[slot] >= CFG.FAILS_BEFORE_STAFF;
    showSheet(
      '<h3 class="sheet__title">顏色不太對，再試一次！</h3>' +
      '<p class="sheet__msg">要找的是 <span class="hl">' + TEAM.colorName + '</span> 的海廢。試試看：拿近一點、讓它塞滿框、轉個角度避開反光或陰影。</p>' +
      debugLine(res) +
      '<div class="stack"><button class="pbtn" id="sh-retry">📷 再拍一次</button>' +
      (needStaff ? '<button class="pbtn pbtn--black" id="sh-staff">🙋 請工作人員協助</button>' : '') + '</div>'
    );
    $('#sh-retry').onclick = resumeMission;
    if (needStaff) $('#sh-staff').onclick = function () {
      codeModal('工作人員放行', '請工作人員確認海廢顏色後，輸入通關碼。').then(function (ok) {
        if (ok) onSuccess(true, null);
      });
    };
  }

  function resumeMission() {
    hideSheet();
    mcam.classList.remove('is-frozen');
    mBusy = false;
    $('#m-slot').textContent = '第 ' + (currentSlot() + 1) + ' / ' + N + ' 個';
    if (!mStream) startMissionCam();
  }

  /* =========================================================
   *  上傳佇列（IndexedDB；失敗會自動補傳）
   * ========================================================= */
  var Q = (function () {
    var mem = [], dbp = null;
    function db() {
      if (dbp) return dbp;
      dbp = new Promise(function (res, rej) {
        if (!window.indexedDB) return rej('no idb');
        var r = indexedDB.open('eplayer', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('queue', { keyPath: 'id' }); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { rej(r.error); };
      });
      return dbp;
    }
    function tx(mode, fn) {
      return db().then(function (d) {
        return new Promise(function (res, rej) {
          var t = d.transaction('queue', mode), st = t.objectStore('queue');
          var out = fn(st);
          t.oncomplete = function () { res(out && out.result !== undefined ? out.result : undefined); };
          t.onerror = function () { rej(t.error); };
        });
      });
    }
    return {
      add: function (it) { return tx('readwrite', function (s) { s.put(it); }).catch(function () { mem.push(it); }); },
      all: function () {
        return tx('readonly', function (s) { return s.getAll(); })
          .then(function (r) { return (r || []).concat(mem); })
          .catch(function () { return mem.slice(); });
      },
      del: function (id) {
        mem = mem.filter(function (m) { return m.id !== id; });
        return tx('readwrite', function (s) { s.delete(id); }).catch(function () {});
      }
    };
  })();

  function compress(src) {
    var L = CFG.UPLOAD_LONG_EDGE;
    var s = Math.min(1, L / Math.max(src.width, src.height));
    var c = document.createElement('canvas');
    c.width = Math.round(src.width * s); c.height = Math.round(src.height * s);
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', CFG.UPLOAD_JPEG_QUALITY);
  }

  function enqueueUpload(canvas, slotNo, manual) {
    if (!canvas) return;
    var ts = Date.now();
    var item = {
      id: DEVICE_ID + '-' + TEAM_ID + '-' + slotNo + '-' + ts,
      team: TEAM_ID,
      teamName: TEAM.en + ' ' + TEAM.zh,
      slot: slotNo,
      manual: !!manual,
      ts: ts,
      device: DEVICE_ID,
      image: compress(canvas)
    };
    Q.add(item).then(processQueue);
  }

  var uploading = false;
  function processQueue() {
    if (uploading) return;
    if (!CFG.UPLOAD_URL) { updateChip(); return; }
    uploading = true;
    Q.all().then(function (items) {
      var chain = Promise.resolve(true);
      items.forEach(function (it) {
        chain = chain.then(function (keepGoing) {
          if (!keepGoing) return false;
          return sendOne(it).then(function (ok) {
            if (!ok) return false;
            state.uploaded = (state.uploaded || 0) + 1; saveState();
            return Q.del(it.id).then(function () { return true; });
          });
        });
      });
      return chain;
    }).catch(function () {}).then(function () { uploading = false; updateChip(); });
  }
  function sendOne(it) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 60000);
    return fetch(CFG.UPLOAD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // 用 text/plain 避免跨網域預檢
      body: JSON.stringify(it),
      redirect: 'follow',
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { return r.json(); })
      .then(function (j) { return !!(j && j.ok); })
      .catch(function () { return false; })
      .then(function (ok) { clearTimeout(timer); return ok; });
  }
  function updateChip() {
    Q.all().then(function (items) {
      var chip = $('#upload-chip');
      if (!CFG.UPLOAD_URL) chip.textContent = TEST ? '⚠ 尚未設定上傳網址（照片不會上傳）' : '';
      else if (items.length) chip.textContent = '☁ ' + items.length + ' 張照片等待上傳（有網路時自動補傳）';
      else chip.textContent = state.uploaded ? '☁ 任務照片已上傳 ✓' : '';
    });
  }
  window.addEventListener('online', processQueue);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) processQueue(); });
  setInterval(processQueue, 20000);

  /* =========================================================
   *  充電完成解鎖動畫
   * ========================================================= */
  function openUnlock() {
    state.unlocked = true; saveState();
    show('unlock');
    var box = $('#unlock'), cells = $('#u-cells'), pct = $('#u-pct');
    box.classList.remove('done');
    $('#u-bolt').classList.remove('bounce');
    $('#u-burst').innerHTML = '';
    var total = 10, i = 0;
    fillCells(cells, total, 0);
    var timer = setInterval(function () {
      i++;
      fillCells(cells, total, i);
      pct.textContent = (i * 10) + '%';
      sfx('tick');
      if (i >= total) {
        clearInterval(timer);
        setTimeout(function () {
          box.classList.add('done');
          $('#u-bolt').classList.add('bounce');
          sfx('unlock'); buzz([80, 60, 80, 60, 200]);
          burst();
        }, 200);
      }
    }, 140);
  }
  function burst() {
    var colors = ['#D7191F', '#8B1E19', '#64EA00', '#C8BFB0', '#1C1C1C'];
    var b = $('#u-burst'), h = '';
    for (var k = 0; k < 36; k++) {
      var a = Math.random() * Math.PI * 2, dist = 120 + Math.random() * 180;
      var dx = Math.round(Math.cos(a) * dist / 8) * 8, dy = Math.round(Math.sin(a) * dist / 8) * 8;
      var sz = [8, 12, 16][k % 3];
      h += '<i style="--dx:' + dx + 'px;--dy:' + dy + 'px;width:' + sz + 'px;height:' + sz + 'px;background:' + colors[k % colors.length] + '"></i>';
    }
    b.innerHTML = h;
  }
  $('#u-go').onclick = function () { unlockAudio(); openFilter(); };

  /* =========================================================
   *  濾鏡（三隊共用同一款）
   * ========================================================= */
  var FONT_ZH = '"Noto Sans TC", "PingFang TC", "Heiti TC", "Microsoft JhengHei", "Noto Sans CJK TC", sans-serif';
  var logoImg = new Image();
  logoImg.src = 'assets/nissan-logo.png';
  var fontsReady = (function () {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var txt = CFG.FILTER_TITLE || '級玩家';
    return Promise.race([
      Promise.all([document.fonts.load('900 100px "Noto Sans TC"', txt), document.fonts.load('700 50px "Noto Sans TC"', txt)]),
      new Promise(function (r) { setTimeout(r, 3000); })
    ]).catch(function () {});
  })();

  function para(ctx, x, y, w, h, color, k) { // 斜向色塊（平行四邊形）
    k = k === undefined ? h * 0.84 : k;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + k, y); ctx.lineTo(x + w + k, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h);
    ctx.closePath(); ctx.fill();
  }

  function tinted(img, color, w, h) {
    var c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h);
    var x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, w, h); return c;
  }
  // 去背 logo；glow=true 時加白色外框，深色照片上也看得清楚
  function drawLogo(ctx, img, x, y, w, glow) {
    var h = w * img.naturalHeight / img.naturalWidth;
    if (glow) {
      var wl = tinted(img, '#fff', w, h);
      for (var a = 0; a < Math.PI * 2; a += Math.PI / 8) ctx.drawImage(wl, x + Math.cos(a) * 6, y + Math.sin(a) * 6, w, h);
    }
    ctx.drawImage(img, x, y, w, h);
  }

  /* 濾鏡版型（三隊共用）：以 1080×1920 為基準｜V2 遊戲 HUD
   * 上方：像素狀態列（閃電＋電量條＋訊號）、右上去背 NISSAN logo
   * 四角：紅色像素觀景框；點綴：綠色閃光、左下小像素 E
   * 底部：白底像素海浪＋沙灘＋海廢 */
  function outlined(ctx, cells, x, y, s, pad) { // 白邊包住像素圖，深色照片上也看得到
    ctx.fillStyle = '#fff';
    cells.forEach(function (c) { ctx.fillRect(x + c.x * s - pad, y + c.y * s - pad, s + pad * 2, s + pad * 2); });
    PX.draw(ctx, cells, x, y, s);
  }
  function drawOverlay(ctx, W, H) {
    var P = PX.PAL;
    ctx.save();
    ctx.scale(W / 1080, H / 1920);

    // 四角像素觀景框（黑外框＋紅色）
    function bracket(x, y, sx, sy) {
      var L = 150, T = 22;
      ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy);
      ctx.fillStyle = P.K; ctx.fillRect(-6, -6, L + 12, T + 12); ctx.fillRect(-6, -6, T + 12, L + 12);
      ctx.fillStyle = P.R; ctx.fillRect(0, 0, L, T); ctx.fillRect(0, 0, T, L);
      ctx.fillStyle = '#fff'; ctx.fillRect(T + 8, T + 8, 14, 14);
      ctx.restore();
    }
    bracket(46, 186, 1, 1); bracket(1034, 186, -1, 1); bracket(46, 1740, 1, -1); bracket(1034, 1740, -1, -1);

    // 上方狀態列：閃電＋電量條（充滿）＋訊號
    ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.fillRect(40, 44, 470, 104);
    ctx.strokeStyle = P.K; ctx.lineWidth = 6; ctx.strokeRect(40, 44, 470, 104);
    PX.draw(ctx, PX.cells('BOLT'), 66, 54, 7);
    PX.drawBattery(ctx, 140, 66, 220, 60, 5, 5, P.G);
    PX.draw(ctx, PX.cells('SIGNAL'), 400, 60, 7);
    PX.draw(ctx, PX.checker(6, 3, false), 540, 70, 12);

    // 右上 NISSAN logo（去背＋白色外框）
    if (logoImg.complete && logoImg.naturalWidth) drawLogo(ctx, logoImg, 916, 34, 124, true);

    // 綠色閃光＋左下小像素 E
    outlined(ctx, PX.cells('SPARK'), 980, 420, 8, 3);
    outlined(ctx, PX.cells('SPARK'), 70, 1300, 7, 3);
    outlined(ctx, PX.cells('SPARK'), 940, 1450, 5, 3);
    PX.draw(ctx, PX.cells('E'), 110, 1590, 8, { shadow: { dx: 0.6, dy: 0.6 } });

    // 底部：白底像素海浪＋沙灘＋海廢
    var wave = PX.waveBand(90, 3), wy = 1920 - wave.h * 12;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, wy + 12, 1080, wave.h * 12);
    for (var i = 0; i < 90; i++) if (i % 3 !== 1) ctx.fillRect(i * 12, wy, 12, 12);
    PX.draw(ctx, wave.cells, 0, wy, 12);
    PX.draw(ctx, PX.cells('BOTTLE'), 830, 1838, 6.5);
    PX.draw(ctx, PX.cells('CAP'), 882, 1886, 5.5);
    PX.draw(ctx, PX.cells('BAG'), 934, 1836, 7);

    ctx.restore();
  }

  var overlayCache = {};
  function overlay(W, H) {
    var k = W + 'x' + H;
    if (!overlayCache[k]) {
      var c = document.createElement('canvas'); c.width = W; c.height = H;
      drawOverlay(c.getContext('2d'), W, H);
      overlayCache[k] = c;
    }
    return overlayCache[k];
  }
  function resetOverlay() { overlayCache = {}; }
  fontsReady.then(resetOverlay);
  logoImg.onload = resetOverlay;

  function drawCover(ctx, video, W, H, mirror) {
    var vw = video.videoWidth, vh = video.videoHeight;
    ctx.fillStyle = '#1C1C1C'; ctx.fillRect(0, 0, W, H);
    if (!vw) return;
    var s = Math.max(W / vw, H / vh), dw = vw * s, dh = vh * s;
    ctx.save();
    if (mirror) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.restore();
  }

  /* ---------- 濾鏡相機 ---------- */
  var fStream = null, audioStream = null, facing = 'user', fMode = 'photo';
  var fvideo = $('#fvideo'), fcanvas = $('#fcanvas'), fctx = fcanvas.getContext('2d');
  var rafId = null, recorder = null, recChunks = [], recTimer = null, recStart = 0;
  var result = null; // { blob, type, kind }

  function openFilter() {
    show('filter');
    $('#f-error').classList.remove('show');
    startFilterCam();
    loop();
  }
  function startFilterCam() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.isSecureContext) {
      return filterError({ name: 'Unsupported' });
    }
    stopStream(fStream);
    getCamera(facing, true).then(function (s) {
      fStream = s; $('#f-error').classList.remove('show');
      return attach(fvideo, s);
    }).catch(filterError);
  }
  function filterError(err) { $('#f-error-msg').textContent = camErrorText(err); $('#f-error').classList.add('show'); }
  function loop() {
    cancelAnimationFrame(rafId);
    (function frame() {
      drawCover(fctx, fvideo, fcanvas.width, fcanvas.height, facing === 'user');
      fctx.drawImage(overlay(fcanvas.width, fcanvas.height), 0, 0);
      rafId = requestAnimationFrame(frame);
    })();
  }
  function stopFilter() {
    if (recorder && recorder.state === 'recording') { recorder.onstop = null; recorder.stop(); }
    endRecUI();
    cancelAnimationFrame(rafId);
    stopStream(fStream); fStream = null; fvideo.srcObject = null;
    stopStream(audioStream); audioStream = null;
  }

  $('#f-close').onclick = function () { show('home'); renderHome(); };
  $('#f-err-home').onclick = function () { show('home'); renderHome(); };
  $('#f-retry').onclick = startFilterCam;
  $('#f-flip').onclick = function () {
    if (recorder && recorder.state === 'recording') return;
    facing = facing === 'user' ? 'environment' : 'user';
    startFilterCam();
  };

  var REC_TYPES = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1', 'video/mp4',
    'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  function pickRecType() {
    if (!window.MediaRecorder || !fcanvas.captureStream) return null;
    for (var i = 0; i < REC_TYPES.length; i++) {
      try { if (MediaRecorder.isTypeSupported(REC_TYPES[i])) return REC_TYPES[i]; } catch (e) {}
    }
    return '';
  }

  $('#f-mode').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (recorder && recorder.state === 'recording') return;
    if (b.dataset.mode === 'video' && pickRecType() === null) { toast('這支手機的瀏覽器不支援錄影，請用拍照'); return; }
    fMode = b.dataset.mode;
    document.querySelectorAll('#f-mode button').forEach(function (x) { x.classList.toggle('on', x === b); });
    $('#f-shutter').classList.toggle('video', fMode === 'video');
    if (fMode === 'video' && CFG.VIDEO_WITH_AUDIO && !audioStream) {
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(function (s) { audioStream = s; })
        .catch(function () { toast('沒有麥克風權限，影片將沒有聲音'); });
    }
  });

  $('#f-shutter').onclick = function () {
    unlockAudio();
    if (!fvideo.videoWidth) return;
    if (fMode === 'photo') takePhoto();
    else if (recorder && recorder.state === 'recording') recorder.stop();
    else startRec();
  };

  function takePhoto() {
    sfx('click');
    var W = 1080, H = 1920;
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d');
    drawCover(x, fvideo, W, H, facing === 'user');
    x.drawImage(overlay(W, H), 0, 0);
    c.toBlob(function (blob) {
      result = { blob: blob, type: 'image/jpeg', kind: 'photo' };
      openPreview();
    }, 'image/jpeg', 0.92);
  }

  function startRec() {
    var type = pickRecType();
    var stream = fcanvas.captureStream(30);
    if (audioStream) audioStream.getAudioTracks().forEach(function (t) { stream.addTrack(t); });
    try {
      recorder = type ? new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 5000000 })
                      : new MediaRecorder(stream);
    } catch (e) { toast('無法開始錄影：' + e.name); return; }
    recChunks = [];
    recorder.ondataavailable = function (e) { if (e.data && e.data.size) recChunks.push(e.data); };
    recorder.onstop = function () {
      endRecUI();
      var t = (recorder.mimeType || type || 'video/webm').split(';')[0];
      result = { blob: new Blob(recChunks, { type: t }), type: t, kind: 'video' };
      openPreview();
    };
    recorder.start(250);
    sfx('click');
    recStart = Date.now();
    $('#f-shutter').classList.add('rec');
    $('#rec-bar').classList.add('show'); $('#rec-time').classList.add('show');
    var max = CFG.VIDEO_MAX_SECONDS * 1000;
    recTimer = setInterval(function () {
      var el = Date.now() - recStart;
      $('#rec-bar span').style.width = Math.min(100, el / max * 100) + '%';
      $('#rec-time').textContent = '● ' + Math.max(0, Math.ceil((max - el) / 1000)) + 's';
      if (el >= max && recorder.state === 'recording') recorder.stop();
    }, 100);
  }
  function endRecUI() {
    clearInterval(recTimer);
    $('#f-shutter').classList.remove('rec');
    $('#rec-bar').classList.remove('show'); $('#rec-time').classList.remove('show');
    $('#rec-bar span').style.width = '0';
  }

  /* ---------- 預覽與儲存 ---------- */
  var previewUrl = null;
  function openPreview() {
    show('preview');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(result.blob);
    var m = $('#p-media');
    m.innerHTML = result.kind === 'photo'
      ? '<img src="' + previewUrl + '" alt="濾鏡照片">'
      : '<video src="' + previewUrl + '" playsinline autoplay loop muted controls></video>';
    $('#p-tip').textContent = IS_IOS
      ? '按「下載」後，在選單中點「' + (result.kind === 'photo' ? '儲存影像' : '儲存影片') + '」就會存進照片 App'
      : '按「下載」就會存到手機';
  }
  $('#p-retake').onclick = function () { openFilter(); };
  $('#p-save').onclick = function () {
    if (!result) return;
    var ext = result.kind === 'photo' ? 'jpg' : (result.type.indexOf('mp4') > -1 ? 'mp4' : 'webm');
    var d = new Date(), pad = function (n) { return ('0' + n).slice(-2); };
    var name = 'EPlayer_' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '_' +
      pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '.' + ext;
    var file;
    try { file = new File([result.blob], name, { type: result.type }); } catch (e) { file = null; }

    var canShare = file && navigator.canShare && navigator.share && navigator.canShare({ files: [file] });
    if (IS_IOS && canShare) {
      navigator.share({ files: [file] }).then(backToFilter)
        .catch(function (e) { if (e && e.name !== 'AbortError') { download(name); backToFilter(); } });
    } else {
      download(name);
      setTimeout(backToFilter, 800);
    }
  };
  // 下載後直接回到濾鏡相機，可以繼續拍
  function backToFilter() {
    openFilter();
    toast('已儲存！' + CFG.TEXT.doneMessage, 4000);
  }
  function download(name) {
    var a = document.createElement('a');
    a.href = previewUrl; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }

  $('#d-again').onclick = function () { openFilter(); };
  $('#d-home').onclick = function () { show('home'); renderHome(); };

  /* =========================================================
   *  啟動
   * ========================================================= */
  if (/FBAN|FBAV|Instagram|MicroMessenger|; wv\)/i.test(UA)) $('#inapp').classList.add('show');
  $('#inapp-ok').onclick = function () { $('#inapp').classList.remove('show'); };

  show('home');
  renderHome();
  processQueue();
})();
