/* =========================================================
 *  像素素材：依主視覺重現的 E、閃電、電量條、訊號波、海浪、海廢
 *  同一份點陣資料可以輸出成 SVG（網頁裝飾）或畫在 canvas（濾鏡）
 * ========================================================= */
(function () {
  'use strict';

  var PAL = {
    R: '#D7191F', // 紅
    D: '#8B1E19', // 深紅
    W: '#FFFFFF', // 白
    C: '#C8BFB0', // 香檳
    S: '#DDD5C8', // 淺香檳（沙粒）
    G: '#64EA00', // 螢光綠
    K: '#1C1C1C', // 黑
    L: '#E3E3E3', // 淺灰
    M: '#BDBDBD', // 中灰
    Y: '#F2C200'  // 黃
  };

  /* ---------- 點陣圖（每個字元一格，「.」為透明） ---------- */
  var BM = {
    E: [
      'DRDRRDRRDR',
      'RWRDRRWRRD',
      'DRRW......',
      'RDRR......',
      'WRDR......',
      'RRDRRWDRR.',
      'DRRWRRRDR.',
      'RRDR......',
      'DWRR......',
      'RRDR......',
      'DRRDRWRDRR',
      'RDRRDRRRDW'
    ],
    // E 右側散開的像素碎塊
    E_CHIPS: [
      '..R.......',
      '......W...',
      '.R.....D..',
      '..........',
      '....R.....',
      '..........',
      '.D....R...',
      '..........',
      '..R.......',
      '.....R....',
      '..........',
      '...R....R.'
    ],
    BOLT: [
      '....GGGG',
      '...GGGG.',
      '..GGGG..',
      '.GGGG...',
      'GGGGGGGG',
      '.GGGGGG.',
      '...GGG..',
      '..GGG...',
      '..GG....',
      '.GG.....',
      '.G......',
      'G.......'
    ],
    SIGNAL: [
      'GGGG......',
      '....GG....',
      '......G...',
      'GGG....G..',
      '...GG...G.',
      '.....G..G.',
      'GG....G..G',
      '..G...G..G',
      '...G..G..G',
      'G..G..G..G'
    ],
    BOTTLE: [
      '..KK..',
      '.KGGK.',
      '..KK..',
      '.KWWK.',
      'KWWWLK',
      'KWWWLK',
      'KGGGGK',
      'KGGGGK',
      'KWWWLK',
      'KWWWLK',
      'KWWWLK',
      '.KKKK.'
    ],
    CAP: [
      '.KKK.',
      'KRRRK',
      'KDDDK',
      '.KKK.'
    ],
    BAG: [
      '...K...K...',
      '....K.K....',
      '....KGK....',
      '...KKKKK...',
      '..KWWWWWK..',
      '.KWWGGGWWK.',
      'KWWGWWWGWWK',
      'KWWWWWWGWWK',
      'KWWGWWWWWWK',
      'KWWWGGGWWWK',
      '.KWWWWWWWK.',
      '..KKKKKKK..'
    ],
    STAR: [
      '....K....',
      '....K....',
      '...KKK...',
      'KKKKKKKKK',
      '.KKKKKKK.',
      '..KKKKK..',
      '..KKKKK..',
      '.KKK.KKK.',
      '.KK...KK.',
      'K.......K'
    ],
    LEAF: [
      '.....KKKK',
      '...KKKKKK',
      '..KKKKK.K',
      '.KKKKK.KK',
      '.KKKK.KKK',
      '.KKK.KKKK',
      '.KK.KKKK.',
      '.K.KKKK..',
      'K.KKK....',
      'K........'
    ],
    PIN: [
      '..RRRR..',
      '.RRRRRR.',
      'RRRWWRRR',
      'RRWWWWRR',
      'RRRWWRRR',
      '.RRRRRR.',
      '..RRRR..',
      '...RR...',
      '...RR...'
    ],
    SUN: [
      '....Y....',
      '.Y..Y..Y.',
      '...YYY...',
      '..YYYYY..',
      'YYYYYYYYY',
      '..YYYYY..',
      '...YYY...',
      '.Y..Y..Y.',
      '....Y....'
    ],
    SPARK: [
      '..G..',
      '..G..',
      'GG.GG',
      '..G..',
      '..G..'
    ],
    // 海浪（可橫向重複）
    WAVE_TILE: [
      '..........LLLL......',
      '........LLMMMML.....',
      '.......LM.....ML....',
      '......LM...LL..L....',
      '.....LM...L..L......',
      'LLLLLM....LLL...LLLL',
      'MMMMMMLLLLLLLLLLMMMM'
    ]
  };

  function cellsFromBitmap(rows, ox, oy, colorOverride) {
    var out = [];
    for (var y = 0; y < rows.length; y++) {
      for (var x = 0; x < rows[y].length; x++) {
        var ch = rows[y][x];
        if (ch === '.' || ch === ' ') continue;
        out.push({ x: x + (ox || 0), y: y + (oy || 0), c: colorOverride || PAL[ch] || ch });
      }
    }
    return out;
  }

  // 海浪＋沙灘：cols 欄寬，回傳 cells 與高度
  function waveBand(cols, sandRows) {
    sandRows = sandRows || 3;
    var cells = [];
    var tile = BM.WAVE_TILE, tw = tile[0].length;
    for (var x = 0; x < cols; x++) {
      for (var y = 0; y < tile.length; y++) {
        var ch = tile[y][x % tw];
        if (ch !== '.') cells.push({ x: x, y: y, c: PAL[ch] });
      }
    }
    var top = tile.length;
    for (var sy = 0; sy < sandRows; sy++) {
      for (var sx = 0; sx < cols; sx++) {
        var speck = ((sx * 7 + sy * 13) % 11) === 0;
        cells.push({ x: sx, y: top + sy, c: speck ? PAL.S : PAL.C });
      }
    }
    return { cells: cells, w: cols, h: top + sandRows };
  }

  // 紅白棋盤格塊
  function checker(cols, rows, fade) {
    var out = [];
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      if ((x + y) % 2) continue;
      if (fade && ((x * 5 + y * 3) % 7) < (x / cols) * 6) continue; // 往右逐漸散開
      out.push({ x: x, y: y, c: (x + y) % 4 === 0 ? PAL.D : PAL.R });
    }
    return out;
  }

  function bounds(cells) {
    var w = 0, h = 0;
    cells.forEach(function (c) { if (c.x + 1 > w) w = c.x + 1; if (c.y + 1 > h) h = c.y + 1; });
    return { w: w, h: h };
  }

  /* ---------- 輸出 SVG 字串（同色相鄰格合併以減少元素） ---------- */
  function svg(cells, opts) {
    opts = opts || {};
    var b = bounds(cells);
    var w = opts.w || b.w, h = opts.h || b.h;
    var rows = {};
    cells.forEach(function (c) { (rows[c.y] = rows[c.y] || []).push(c); });
    var rects = [];
    Object.keys(rows).forEach(function (y) {
      var r = rows[y].sort(function (a, b) { return a.x - b.x; });
      for (var i = 0; i < r.length; i++) {
        var start = r[i], len = 1;
        while (i + 1 < r.length && r[i + 1].x === r[i].x + 1 && r[i + 1].c === start.c) { i++; len++; }
        rects.push('<rect x="' + start.x + '" y="' + y + '" width="' + len + '" height="1" fill="' + start.c + '"/>');
      }
    });
    var shadow = '';
    if (opts.shadow) {
      var dx = opts.shadow.dx || 0.6, dy = opts.shadow.dy || 0.6;
      shadow = '<g transform="translate(' + dx + ' ' + dy + ')" fill="' + (opts.shadow.color || PAL.C) + '">' +
        cells.map(function (c) { return '<rect x="' + c.x + '" y="' + c.y + '" width="1" height="1"/>'; }).join('') + '</g>';
      w += dx; h += dy;
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges"' +
      (opts.cls ? ' class="' + opts.cls + '"' : '') + ' aria-hidden="true">' + shadow + rects.join('') + '</svg>';
  }

  /* ---------- 畫到 canvas ---------- */
  function draw(ctx, cells, ox, oy, size, opts) {
    opts = opts || {};
    if (opts.shadow) {
      ctx.fillStyle = opts.shadow.color || PAL.C;
      cells.forEach(function (c) {
        ctx.fillRect(ox + (c.x + (opts.shadow.dx || 0.6)) * size, oy + (c.y + (opts.shadow.dy || 0.6)) * size, size + 0.5, size + 0.5);
      });
    }
    cells.forEach(function (c) {
      ctx.fillStyle = c.c;
      ctx.fillRect(ox + c.x * size, oy + c.y * size, size + 0.5, size + 0.5);
    });
  }

  // 像素電量條（canvas）
  function drawBattery(ctx, x, y, w, h, filled, total, color) {
    var b = Math.max(3, Math.round(h * 0.09));
    ctx.fillStyle = PAL.K;
    ctx.fillRect(x, y, w, h);
    ctx.fillRect(x + w, y + h * 0.3, b * 2, h * 0.4);
    ctx.fillStyle = PAL.W;
    ctx.fillRect(x + b, y + b, w - 2 * b, h - 2 * b);
    var pad = b * 1.6, gap = b * 1.2;
    var cw = (w - 2 * pad - gap * (total - 1)) / total;
    for (var i = 0; i < total; i++) {
      ctx.fillStyle = i < filled ? (color || PAL.G) : PAL.L;
      ctx.fillRect(x + pad + i * (cw + gap), y + pad, cw, h - 2 * pad);
    }
  }

  window.PX = {
    PAL: PAL,
    BM: BM,
    cells: function (name, ox, oy, color) { return cellsFromBitmap(BM[name], ox, oy, color); },
    fromRows: cellsFromBitmap,
    waveBand: waveBand,
    checker: checker,
    svg: svg,
    draw: draw,
    drawBattery: drawBattery
  };
})();
