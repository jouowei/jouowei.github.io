/*
 * 截圖拼接
 * 做法：把每一列像素切成 BINS 段取灰階平均，當作這一列的「指紋」。
 * 在後一張截圖的上方取一段有文字的區塊，到前一張裡找出相同的位置，
 * 找到就從那裡接起來。結果用「片段清單」表示，不建立一張超大的畫布，
 * 避免超過手機瀏覽器的畫布尺寸上限。
 */
(function (root) {
  'use strict';

  var BINS = 48;
  var STRIP = 160;        // 比對用的區塊高度（像素）
  var MIN_L = 48;         // 重疊至少要有這麼多列
  var MIN_SCROLL = 12;    // 至少要捲動這麼多才算重疊（排除固定不動的標題列）
  var INK_ROW = 2;        // 一列的文字量超過此值才算「有文字的列」
  var MIN_TEXT_ROWS = 30; // 比對時至少要有這麼多列有文字
  var MATCH_T = 0.3;      // 正規化差異小於此值才算相同（0 = 完全一樣，約 0.5 以上 = 不同內容）
  var RATIO_T = 0.7;      // 最佳位置的差異要明顯小於次佳位置，避免重複內容造成誤判
  var FIXED_T = 6;        // 判斷固定標題列／底部列時，每格平均灰階差的上限
  var BLANK_RANGE = 28;   // 一列的明暗差小於此值視為空白列

  // 計算一張圖每一列的指紋（prof）、文字量（ink）、明暗差（range）與背景色（bg）
  function profile(imageData) {
    var w = imageData.width, h = imageData.height, d = imageData.data;
    var x0 = Math.floor(w * 0.02), x1 = Math.floor(w * 0.96); // 避開左右邊緣與捲軸
    var span = x1 - x0, b, y;
    var edges = new Int32Array(BINS + 1);
    for (b = 0; b <= BINS; b++) edges[b] = x0 + Math.round(span * b / BINS);
    var raw = new Float32Array(h * BINS);
    var ink = new Float32Array(h);
    var range = new Uint8Array(h);
    for (y = 0; y < h; y++) {
      var off = y * w * 4, sum = 0, sum2 = 0, lo = 255, hi = 0;
      for (b = 0; b < BINS; b++) {
        var acc = 0;
        for (var x = edges[b]; x < edges[b + 1]; x++) {
          var i = off + x * 4;
          var g = (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8;
          acc += g;
          if (g < lo) lo = g;
          if (g > hi) hi = g;
        }
        var v = acc / (edges[b + 1] - edges[b]);
        raw[y * BINS + b] = v;
        sum += v; sum2 += v * v;
      }
      var mean = sum / BINS;
      ink[y] = Math.sqrt(Math.max(0, sum2 / BINS - mean * mean));
      range[y] = hi - lo;
    }
    // 上下各一列做平均：圖片被縮放過時，同一行字可能差了不到一個像素
    var prof = new Float32Array(h * BINS);
    for (y = 0; y < h; y++) {
      var ya = y > 0 ? y - 1 : y, yb = y < h - 1 ? y + 1 : y;
      for (b = 0; b < BINS; b++) {
        prof[y * BINS + b] = (raw[ya * BINS + b] + 2 * raw[y * BINS + b] + raw[yb * BINS + b]) / 4;
      }
    }
    return { w: w, h: h, prof: prof, ink: ink, range: range, bg: background(prof) };
  }

  // 背景色：取樣後的中位數（畫面大多是背景）
  function background(prof) {
    var sample = [];
    for (var k = 0; k < prof.length; k += 13) sample.push(prof[k]);
    sample.sort(function (p, q) { return p - q; });
    return sample.length ? sample[sample.length >> 1] : 255;
  }

  // 超長截圖分段算指紋後再接起來（手機瀏覽器的畫布有尺寸上限）
  function merge(parts) {
    var h = 0, i = 0;
    parts.forEach(function (p) { h += p.h; });
    var prof = new Float32Array(h * BINS), ink = new Float32Array(h), range = new Uint8Array(h);
    parts.forEach(function (p) {
      prof.set(p.prof, i * BINS); ink.set(p.ink, i); range.set(p.range, i);
      i += p.h;
    });
    return { w: parts[0].w, h: h, prof: prof, ink: ink, range: range, bg: background(prof) };
  }

  function rowDiff(A, ya, B, yb) {
    var pa = A.prof, pb = B.prof, ia = ya * BINS, ib = yb * BINS, s = 0;
    for (var k = 0; k < BINS; k++) s += Math.abs(pa[ia + k] - pb[ib + k]);
    return s / BINS;
  }

  // 在 A 的 [pMin, aEnd) 範圍找出和 B[s, s+L) 最相同的位置。
  // 差異 ÷ 文字量 = 正規化差異；空白對空白不計，避免空白區被當成重疊。
  // 靠近 A 底部時只比對還放得下的列數（至少 MIN_L 列），重疊很短也找得到。
  function stripScore(A, B, s, Lp, p, rStep) {
    var pa = A.prof, pb = B.prof, inkA = A.ink, inkB = B.ink, bgA = A.bg, bgB = B.bg;
    var num = 0, den = 0, cnt = 0;
    for (var r = 0; r < Lp; r += rStep) {
      if (inkA[p + r] < INK_ROW && inkB[s + r] < INK_ROW) continue;
      var ia = (p + r) * BINS, ib = (s + r) * BINS;
      for (var k = 0; k < BINS; k++) {
        var a = pa[ia + k], c = pb[ib + k];
        num += Math.abs(a - c);
        var da = Math.abs(a - bgA), dc = Math.abs(c - bgB);
        den += da > dc ? da : dc;
      }
      cnt += rStep;
    }
    return (cnt < MIN_TEXT_ROWS || den <= 0) ? Infinity : num / den;
  }

  function searchStrip(A, B, s, L, pMin, aEnd) {
    var n = Math.max(0, aEnd - MIN_L - pMin + 1);
    var scores = new Float32Array(n).fill(Infinity);
    var best = -1, bestScore = Infinity, p, sc;
    // 先每隔 2 列粗找（指紋已做過直向平均，跳列影響不大），再在最佳位置附近逐列細找
    for (p = pMin; p + MIN_L <= aEnd; p += 2) {
      sc = stripScore(A, B, s, Math.min(L, aEnd - p), p, 2);
      scores[p - pMin] = sc;
      if (sc < bestScore) { bestScore = sc; best = p; }
    }
    if (best < 0 || bestScore >= MATCH_T * 1.5) return null;
    var coarse = best;
    bestScore = Infinity;
    for (p = Math.max(pMin, coarse - 3); p <= coarse + 3 && p + MIN_L <= aEnd; p++) {
      sc = stripScore(A, B, s, Math.min(L, aEnd - p), p, 1);
      if (sc < bestScore) { bestScore = sc; best = p; }
    }
    if (bestScore >= MATCH_T) return null;
    var second = Infinity; // 離最佳位置 30 列以外的次佳分數
    for (var q = 0; q < n; q++) {
      if (Math.abs(q + pMin - best) > 30 && scores[q] < second) second = scores[q];
    }
    if (second < Infinity && bestScore > second * RATIO_T) return null;
    return { p: best, score: bestScore };
  }

  // 兩張圖頂端（或底端）在同一位置、內容相同的列數：固定不動的標題列／底部列
  function fixedRows(A, B, fromBottom) {
    var max = Math.floor(Math.min(A.h, B.h) * 0.3), n = 0;
    while (n < max) {
      var ya = fromBottom ? A.h - 1 - n : n, yb = fromBottom ? B.h - 1 - n : n;
      if (rowDiff(A, ya, B, yb) >= FIXED_T) break;
      n++;
    }
    return n;
  }

  // 找 B 接在 A 後面的位置。回傳 { cutA, startB, score }：
  // 拼接結果 = A[0, cutA) + B[startB, B.h)。算過的組合會記住，排序和拼接共用。
  function findOverlap(A, B) {
    A._cache = A._cache || new Map();
    if (!A._cache.has(B)) A._cache.set(B, findOverlapRaw(A, B));
    return A._cache.get(B);
  }

  function findOverlapRaw(A, B) {
    if (Math.abs(A.w - B.w) > 1) return null;
    var L = Math.min(STRIP, Math.floor(B.h * 0.25));
    if (L < MIN_L) return null;
    var head = fixedRows(A, B, false);
    var aEnd = A.h - fixedRows(A, B, true); // 不和 A 的固定底部列比對
    var step = Math.floor(L / 2);
    // 從 B 的內容頂端開始試；標題列偵測失敗（例如狀態列時間不同）時再往下試幾次
    var sMax = Math.min(Math.floor(B.h * 0.7), head + step * 5);
    for (var s = head; s + L <= sMax + L && s + MIN_L <= B.h; s += step) {
      var m = searchStrip(A, B, s, Math.min(L, B.h - s), s + MIN_SCROLL, aEnd);
      if (!m) continue;
      var delta = m.p - s; // B 的第 r 列 = A 的第 r+delta 列
      // 往上延伸，找出 B 的內容從哪一列開始捲動（上面的是固定標題列）
      var r = s;
      while (r > 0 && rowDiff(A, r - 1 + delta, B, r - 1) < FIXED_T * 1.5) r--;
      return { cutA: r + delta, startB: r, score: m.score };
    }
    return null;
  }

  // 依重疊關係自動排序；排不出單一順序時回傳 null
  function autoOrder(P, onProgress) {
    var n = P.length, i, j, done = 0;
    if (n < 2) return n ? [0] : [];
    if (n > 15) return null;
    var cand = [];
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
      if (i === j) continue;
      var m = findOverlap(P[i], P[j]);
      if (m) cand.push({ a: i, b: j, score: m.score });
      if (onProgress) onProgress(++done / (n * (n - 1)));
    }
    cand.sort(function (x, y) { return x.score - y.score; });
    var next = [], prev = [];
    for (i = 0; i < n; i++) { next.push(-1); prev.push(-1); }
    function reaches(from, to) { // from 沿 next 走得到 to 嗎（避免成環）
      for (var k = from, c = 0; k !== -1 && c <= n; k = next[k], c++) if (k === to) return true;
      return false;
    }
    cand.forEach(function (c) {
      if (next[c.a] === -1 && prev[c.b] === -1 && !reaches(c.b, c.a)) {
        next[c.a] = c.b; prev[c.b] = c.a;
      }
    });
    var starts = [];
    for (i = 0; i < n; i++) if (prev[i] === -1) starts.push(i);
    if (starts.length !== 1) return null;
    var order = [];
    for (i = starts[0]; i !== -1; i = next[i]) order.push(i);
    return order.length === n ? order : null;
  }

  // 依指定順序拼接，回傳片段清單與每個接縫的結果
  function plan(P, order) {
    var segs = [], seams = [], start = 0, header = Infinity;
    for (var k = 0; k < order.length; k++) {
      var a = order[k], end = P[a].h, startNext = 0;
      if (k + 1 < order.length) {
        var m = findOverlap(P[a], P[order[k + 1]]);
        seams.push({ a: a, b: order[k + 1], found: !!m, score: m ? m.score : null });
        if (m) { end = m.cutA; startNext = m.startB; header = Math.min(header, m.startB); }
      }
      if (end > start) segs.push({ img: a, y0: start, y1: end });
      start = startNext;
    }
    var height = 0;
    segs.forEach(function (s) { height += s.y1 - s.y0; });
    // header：每張都有、固定不動的頂端（狀態列、App 標題列）高度，轉文字時可略過
    return { segs: segs, seams: seams, height: height, width: P[order[0]].w,
             header: header === Infinity ? 0 : header };
  }

  // 把拼接結果切成適合辨識或分享的小段，盡量切在兩行文字之間的空白
  function slices(P, layout, target, start) {
    target = target || 1400;
    var minH = Math.floor(target * 0.6);
    var H = layout.height, range = new Uint8Array(H), y = 0;
    layout.segs.forEach(function (s) {
      range.set(P[s.img].range.subarray(s.y0, s.y1), y);
      y += s.y1 - s.y0;
    });
    function blank(r) { return r <= 0 || r >= H || range[r] < BLANK_RANGE; }
    var out = [], pos = Math.min(start || 0, H - 1);
    while (H - pos > target) {
      var cut = -1;
      for (var c = pos + target; c >= pos + minH; c--) {
        if (blank(c - 1) && blank(c) && blank(c + 1)) { cut = c; break; }
      }
      if (cut < 0) cut = pos + target;
      out.push([pos, cut]);
      pos = cut;
    }
    out.push([pos, H]);
    return out;
  }

  // 把虛擬長圖的 [Y0, Y1) 畫到畫布上；sources[i] 是可 drawImage 的圖，scale 用於縮圖預覽
  function render(sources, layout, Y0, Y1, scale) {
    scale = scale || 1;
    var canvas = document.createElement('canvas');
    canvas.width = Math.round(layout.width * scale);
    canvas.height = Math.round((Y1 - Y0) * scale);
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    var y = 0;
    layout.segs.forEach(function (s) {
      var h = s.y1 - s.y0, a = Math.max(Y0, y), b = Math.min(Y1, y + h);
      if (b > a) {
        var sy = s.y0 + (a - y);
        ctx.drawImage(sources[s.img], 0, sy, layout.width, b - a,
                      0, (a - Y0) * scale, layout.width * scale, (b - a) * scale);
      }
      y += h;
    });
    return canvas;
  }

  // 每個接縫在長圖上的位置
  function seamPositions(layout) {
    var out = [], y = 0;
    layout.segs.forEach(function (s, k) {
      y += s.y1 - s.y0;
      if (k < layout.segs.length - 1) out.push(y);
    });
    return out;
  }

  var api = { profile: profile, merge: merge, findOverlap: findOverlap, autoOrder: autoOrder,
              plan: plan, slices: slices, render: render, seamPositions: seamPositions };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Stitch = api;
})(this);
