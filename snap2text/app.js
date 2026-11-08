/* 截圖轉文字：介面與流程 */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var CDN = {
    tesseract: 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js',
    opencc: 'https://cdn.jsdelivr.net/npm/opencc-js@1.4.2/dist/umd/cn2t.js'
  };
  var BAND = 2048;                 // 算指紋時每次處理的高度（避開手機畫布上限）
  var MAX_CANVAS_AREA = 16000000;  // 下載長圖時單張畫布的面積上限
  var MAX_SHARE_IMAGES = 20;       // Claude 一則訊息可附的圖片數
  var PREFS_KEY = 'snap2text:prefs', LAST_KEY = 'snap2text:last';

  var state = { items: [], order: [], layout: null, lines: null, busy: false };
  // items[i] = { name, modified, src, w, h, prof, thumb }

  /* ---------- 小工具 ---------- */
  function setStatus(el, msg, kind) {
    el = $(el);
    el.textContent = msg || '';
    el.className = 'status' + (kind ? ' ' + kind : '');
  }
  function tick() { return new Promise(function (r) { setTimeout(r, 30); }); }
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) return resolve();
      var s = document.createElement('script');
      s.src = src; s.onload = resolve;
      s.onerror = function () { s.remove(); reject(new Error('無法載入 ' + src)); };
      document.head.appendChild(s);
    });
  }
  function toBlob(canvas, type, q) {
    return new Promise(function (r) { canvas.toBlob(r, type || 'image/png', q); });
  }
  function download(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 10000);
  }
  // 檔名只用英數字：部分瀏覽器會把中文檔名換成「download」
  function baseName() {
    var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
    return 'snap2text_' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes());
  }

  /* ---------- 偏好設定 ---------- */
  var PREF_IDS = ['opt-lang', 'opt-psm', 'opt-tw', 'opt-quote', 'opt-para', 'opt-fix', 'prompt'];
  function loadPrefs() {
    var p = {};
    try { p = JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch (e) {}
    if (p.prompt === undefined) p.prompt = '請幫我整理這份內容的重點。';
    PREF_IDS.forEach(function (id) {
      if (p[id.replace('opt-', '')] === undefined && id !== 'prompt') return;
      var el = $(id), v = id === 'prompt' ? p.prompt : p[id.replace('opt-', '')];
      if (el.type === 'checkbox') el.checked = !!v; else el.value = v;
    });
  }
  function savePrefs() {
    var p = {};
    PREF_IDS.forEach(function (id) {
      var el = $(id);
      p[id === 'prompt' ? 'prompt' : id.replace('opt-', '')] = el.type === 'checkbox' ? el.checked : el.value;
    });
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch (e) {}
  }

  /* ---------- 讀圖 ---------- */
  function decode(file) {
    if (window.createImageBitmap) return createImageBitmap(file);
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // 寬度和第一張不同時縮放成同寬，才能比對
  function normalizeWidth(src, w, h, targetW) {
    if (!targetW || w === targetW) return { src: src, w: w, h: h };
    var nh = Math.round(h * targetW / w);
    var c = document.createElement('canvas');
    c.width = targetW; c.height = nh;
    c.getContext('2d').drawImage(src, 0, 0, targetW, nh);
    return { src: c, w: targetW, h: nh };
  }

  function computeProfile(src, w, h) {
    var c = document.createElement('canvas'), parts = [];
    c.width = w;
    for (var y = 0; y < h; y += BAND) {
      var bh = Math.min(BAND, h - y);
      c.height = bh;
      var ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(src, 0, y, w, bh, 0, 0, w, bh);
      parts.push(Stitch.profile(ctx.getImageData(0, 0, w, bh)));
    }
    return Stitch.merge(parts);
  }

  async function addFiles(files) {
    files = Array.prototype.filter.call(files, function (f) { return /^image\//.test(f.type) || /\.(png|jpe?g|webp|gif|bmp|heic)$/i.test(f.name); });
    if (!files.length) return;
    // 先依檔案時間、檔名排，之後再依內容自動排序
    files.sort(function (a, b) { return (a.lastModified - b.lastModified) || a.name.localeCompare(b.name); });
    setStatus('stitch-status', '讀取圖片中…');
    await tick();
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      try {
        var bmp = await decode(f);
        var w = bmp.width, h = bmp.height;
        var targetW = state.items.length ? state.items[0].w : 0;
        var n = normalizeWidth(bmp, w, h, targetW);
        state.items.push({ name: f.name, modified: f.lastModified, src: n.src, w: n.w, h: n.h,
                           prof: computeProfile(n.src, n.w, n.h), thumb: URL.createObjectURL(f) });
        state.order.push(state.items.length - 1);
      } catch (e) {
        setStatus('stitch-status', '有一張圖讀不出來：' + f.name, 'err');
      }
      setStatus('stitch-status', '讀取圖片中…（' + (i + 1) + '/' + files.length + '）');
      await tick();
    }
    await autoSort(true);
  }

  /* ---------- 排序與拼接 ---------- */
  async function autoSort(silentIfSame) {
    var n = state.order.length;
    if (n >= 2) {
      setStatus('stitch-status', '比對 ' + n + ' 張圖的重疊位置…');
      await tick();
      var P = state.order.map(function (i) { return state.items[i].prof; });
      var o = Stitch.autoOrder(P);
      if (o) {
        var changed = o.some(function (v, k) { return v !== k; });
        state.order = o.map(function (k) { return state.order[k]; });
        restitch(changed ? '已依內容自動排好順序。' : (silentIfSame ? '' : '順序本來就正確。'));
        return;
      }
      restitch('無法只靠內容判斷順序，先依截圖時間排列；不對的話請用 ▲▼ 調整。');
      return;
    }
    restitch('');
  }

  function restitch(note) {
    state.lines = null;
    var items = state.items, order = state.order;
    $('order-tools').hidden = order.length < 2;
    renderThumbs();
    if (!order.length) {
      state.layout = null;
      ['step-preview', 'step-ocr'].forEach(function (id) { $(id).hidden = true; });
      setStatus('stitch-status', '');
      return;
    }
    var P = items.map(function (it) { return it.prof; });
    state.layout = Stitch.plan(P, order);
    var msg = [], kind = 'ok';
    if (note) msg.push(note);
    if (order.length > 1) {
      var bad = state.layout.seams.filter(function (s) { return !s.found; });
      if (!bad.length) msg.push('✓ ' + state.layout.seams.length + ' 個接縫都找到重疊，已自動去掉重複的部分。');
      else {
        kind = 'warn';
        bad.forEach(function (s) {
          msg.push('⚠ 第 ' + (order.indexOf(s.a) + 1) + '、' + (order.indexOf(s.b) + 1) +
                   ' 張之間找不到重疊：可能中間漏截，或順序不對。目前直接接在一起。');
        });
      }
    }
    msg.push('長圖大小：' + state.layout.width + ' × ' + state.layout.height + ' 像素');
    setStatus('stitch-status', msg.join('\n'), kind);
    renderPreview();
    $('step-preview').hidden = false;
    $('step-ocr').hidden = false;
  }

  function renderThumbs() {
    var box = $('thumbs');
    box.innerHTML = '';
    state.order.forEach(function (idx, k) {
      var it = state.items[idx];
      var d = document.createElement('div');
      d.className = 'thumb';
      d.innerHTML = '<span class="no">' + (k + 1) + '</span><img alt=""><div class="h"></div>' +
        '<div class="tools"><button data-a="up" aria-label="往前">▲</button>' +
        '<button data-a="down" aria-label="往後">▼</button><button data-a="del" aria-label="移除">✕</button></div>';
      d.querySelector('img').src = it.thumb;
      d.querySelector('.h').textContent = it.w + '×' + it.h;
      d.querySelector('[data-a=up]').disabled = k === 0;
      d.querySelector('[data-a=down]').disabled = k === state.order.length - 1;
      d.addEventListener('click', function (e) {
        var a = e.target.getAttribute('data-a');
        if (!a) return;
        var o = state.order;
        if (a === 'up' && k > 0) { o.splice(k - 1, 0, o.splice(k, 1)[0]); }
        else if (a === 'down' && k < o.length - 1) { o.splice(k + 1, 0, o.splice(k, 1)[0]); }
        else if (a === 'del') { o.splice(k, 1); }
        restitch('');
      });
      box.appendChild(d);
    });
  }

  var previewToken = 0;
  async function renderPreview() {
    var token = ++previewToken, L = state.layout, box = $('preview');
    box.innerHTML = '';
    var srcs = state.items.map(function (it) { return it.src; });
    var scale = Math.min(1, 720 / L.width);
    var seams = Stitch.seamPositions(L);
    for (var y = 0; y < L.height; y += 2000) {
      if (token !== previewToken) return;
      var y1 = Math.min(L.height, y + 2000);
      var c = Stitch.render(srcs, L, y, y1, scale);
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#dc2626';
      seams.forEach(function (sy) {
        if (sy >= y && sy < y1) {
          var py = (sy - y) * scale;
          ctx.fillRect(0, py - 2, 26, 4);
          ctx.beginPath(); ctx.moveTo(26, py - 8); ctx.lineTo(38, py); ctx.lineTo(26, py + 8); ctx.fill();
        }
      });
      box.appendChild(c);
      await tick();
    }
  }

  // 切成幾段：給辨識用、給 Claude 看圖用（每段長邊不超過約 1.4 倍寬，Claude 不會再縮小）
  // 轉文字時略過第一張頂端的狀態列與 App 標題列（多張截圖時才偵測得到）
  function cutSlices(skipHeader) {
    var P = state.items.map(function (it) { return it.prof; });
    var target = Math.max(800, Math.min(1800, Math.round(state.layout.width * 1.4)));
    return Stitch.slices(P, state.layout, target, skipHeader ? state.layout.header : 0);
  }

  async function downloadLongImage() {
    var L = state.layout, srcs = state.items.map(function (it) { return it.src; });
    var maxH = Math.floor(MAX_CANVAS_AREA / L.width);
    var parts = Math.ceil(L.height / maxH), name = baseName();
    for (var k = 0; k < parts; k++) {
      var y0 = k * maxH, y1 = Math.min(L.height, y0 + maxH);
      var blob = await toBlob(Stitch.render(srcs, L, y0, y1));
      download(blob, name + (parts > 1 ? '_' + (k + 1) : '') + '.png');
      await new Promise(function (r) { setTimeout(r, 400); });
    }
    if (parts > 1) setStatus('stitch-status', '長圖太長，已分成 ' + parts + ' 張下載。', 'ok');
  }

  /* ---------- 文字辨識 ---------- */
  async function runOCR() {
    if (state.busy || !state.layout) return;
    state.busy = true;
    $('btn-ocr').disabled = true;
    var prog = $('ocr-progress');
    prog.hidden = false; prog.value = 0;
    var scheduler = null;
    try {
      setStatus('ocr-status', '載入辨識程式…');
      await loadScript(CDN.tesseract);
      var langs = $('opt-lang').value.split('+'), psm = $('opt-psm').value;
      var slices = cutSlices(true), srcs = state.items.map(function (it) { return it.src; });
      var nWorkers = Math.min(slices.length, (navigator.hardwareConcurrency || 2) >= 4 ? 2 : 1);
      var current = {};
      scheduler = Tesseract.createScheduler();
      setStatus('ocr-status', '下載辨識模型…（只有第一次需要）');
      for (var w = 0; w < nWorkers; w++) {
        var worker = await Tesseract.createWorker(langs, 1, {
          logger: function (m) {
            if (m.status === 'recognizing text' && m.jobId) { current[m.jobId] = m.progress; showProgress(); }
          }
        });
        await worker.setParameters({ tessedit_pageseg_mode: psm, preserve_interword_spaces: '1' });
        scheduler.addWorker(worker);
      }
      var done = 0, results = new Array(slices.length), next = 0;
      function showProgress() {
        var partial = 0;
        Object.keys(current).forEach(function (k) { partial += current[k] < 1 ? current[k] : 0; });
        prog.value = Math.min(1, (done + partial) / slices.length);
        setStatus('ocr-status', '辨識中…（' + done + '/' + slices.length + ' 段）');
      }
      showProgress();
      // 一次只畫需要的幾段，避免同時佔用太多記憶體
      async function runner() {
        while (next < slices.length) {
          var i = next++, y0 = slices[i][0], y1 = slices[i][1];
          var canvas = Stitch.render(srcs, state.layout, y0, y1);
          var res = await scheduler.addJob('recognize', canvas, {}, { blocks: true, text: true });
          results[i] = linesOf(res.data, y0);
          canvas.width = canvas.height = 0;
          done++; showProgress();
        }
      }
      var runners = [];
      for (w = 0; w < nWorkers; w++) runners.push(runner());
      await Promise.all(runners);
      state.lines = [].concat.apply([], results);
      await refreshText();
      setStatus('ocr-status', '完成！共 ' + slices.length + ' 段。可以直接在下面修改文字。', 'ok');
      $('step-out').hidden = false;
      $('step-out').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      console.error(e);
      setStatus('ocr-status', '辨識失敗：' + (e && e.message ? e.message : e) + '\n請確認網路連線後再試一次。', 'err');
    } finally {
      if (scheduler) scheduler.terminate();
      state.busy = false;
      $('btn-ocr').disabled = false;
      prog.hidden = true;
    }
  }

  function linesOf(data, y0) {
    var out = [];
    (data.blocks || []).forEach(function (b) {
      (b.paragraphs || []).forEach(function (p) {
        (p.lines || []).forEach(function (l) {
          out.push({ text: l.text, x0: l.bbox.x0, x1: l.bbox.x1, y0: l.bbox.y0 + y0, y1: l.bbox.y1 + y0 });
        });
      });
    });
    return out;
  }

  var converters = {};
  async function refreshText() {
    if (!state.lines) return;
    var lang = $('opt-lang').value, zh = /^chi/.test(lang), tra = /^chi_tra/.test(lang);
    var t = TextProc.toParagraphs(state.lines, $('opt-para').checked);
    if (tra && $('opt-fix').checked) t = TextProc.fixMisreads(t);
    if (zh && $('opt-tw').checked) {
      try {
        await loadScript(CDN.opencc);
        var from = tra ? 't' : 'cn';
        converters[from] = converters[from] || OpenCC.Converter({ from: from, to: 'tw' });
        t = converters[from](t);
      } catch (e) {
        setStatus('ocr-status', '台灣用字轉換程式載入失敗，先顯示原始文字。', 'warn');
      }
    }
    if (zh && $('opt-quote').checked) t = TextProc.taiwanQuotes(t);
    $('out').value = t;
    updateCount();
    try { localStorage.setItem(LAST_KEY, t); } catch (e) {}
  }

  function updateCount() {
    var t = $('out').value;
    $('out-count').textContent = '共 ' + t.replace(/\s/g, '').length + ' 字、' + (t.trim() ? t.trim().split(/\n+/).length : 0) + ' 段';
  }

  /* ---------- 輸出與分享 ---------- */
  function textForClaude() {
    var p = $('prompt').value.trim(), t = $('out').value.trim();
    var head = '以下是手機截圖自動辨識出的文字（可能有少量辨識錯字，請依上下文判斷）：';
    return (p ? p + '\n\n' : '') + head + '\n\n' + t;
  }

  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; }
    catch (e) {
      var ta = document.createElement('textarea');
      ta.value = t; document.body.appendChild(ta); ta.select();
      var ok = document.execCommand('copy'); ta.remove(); return ok;
    }
  }

  async function fallbackCopy(t, why) {
    var ok = await copyText(t);
    setStatus('share-status', (why ? why + '\n' : '') + (ok ? '已複製全文，打開 Claude 貼上即可。' : '請長按文字框全選後複製。'), ok ? 'ok' : 'warn');
  }

  async function shareText() {
    var t = textForClaude();
    if (navigator.share) {
      try { await navigator.share({ text: t }); setStatus('share-status', ''); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    fallbackCopy(t, '這個瀏覽器不支援分享。');
  }

  async function shareFile() {
    var file = new File([$('out').value], baseName() + '.txt', { type: 'text/plain' });
    var p = $('prompt').value.trim();
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share(p ? { files: [file], text: p } : { files: [file] }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    download(file, file.name);
    setStatus('share-status', '這個瀏覽器不支援分享檔案，已改為下載。', 'warn');
  }

  async function shareImages() {
    var slices = cutSlices(), srcs = state.items.map(function (it) { return it.src; });
    var name = baseName(), files = [];
    setStatus('share-status', '準備圖片中…');
    for (var i = 0; i < slices.length; i++) {
      var blob = await toBlob(Stitch.render(srcs, state.layout, slices[i][0], slices[i][1]));
      files.push(new File([blob], name + '_' + String(i + 1).padStart(2, '0') + '.png', { type: 'image/png' }));
    }
    var note = '';
    if (files.length > MAX_SHARE_IMAGES) {
      note = '圖片共 ' + files.length + ' 張，Claude 一次最多收 ' + MAX_SHARE_IMAGES + ' 張，這次先傳前 ' + MAX_SHARE_IMAGES + ' 張。';
      files = files.slice(0, MAX_SHARE_IMAGES);
    }
    var p = $('prompt').value.trim();
    var text = '這是同一份長截圖依序切成的 ' + files.length + ' 張圖，請依序轉成完整的逐字稿（台灣繁體中文），不要遺漏或改寫。' + (p ? '\n' + p : '');
    if (navigator.canShare && navigator.canShare({ files: files })) {
      try { await navigator.share({ files: files, text: text }); setStatus('share-status', note, note ? 'warn' : ''); return; }
      catch (e) { if (e.name === 'AbortError') { setStatus('share-status', ''); return; } }
    }
    for (i = 0; i < files.length; i++) { download(files[i], files[i].name); await new Promise(function (r) { setTimeout(r, 300); }); }
    await copyText(text);
    setStatus('share-status', '這個瀏覽器不支援分享圖片，已改為下載，並複製了給 Claude 的說明文字。' + (note ? '\n' + note : ''), 'warn');
  }

  /* ---------- 從其他 App 分享進來的圖（Android 安裝後） ---------- */
  async function loadSharedFiles() {
    var params = new URLSearchParams(location.search);
    if (!params.has('shared') || !window.caches) return;
    history.replaceState(null, '', location.pathname);
    var cache = await caches.open('snap2text-shared');
    var keys = await cache.keys(), files = [];
    keys.sort(function (a, b) { return +a.url.split('/').pop() - +b.url.split('/').pop(); });
    for (var i = 0; i < keys.length; i++) {
      var res = await cache.match(keys[i]);
      var blob = await res.blob();
      files.push(new File([blob], decodeURIComponent(res.headers.get('x-name') || ('shared-' + i + '.png')),
        { type: blob.type, lastModified: +res.headers.get('x-modified') || Date.now() }));
      await cache.delete(keys[i]);
    }
    if (files.length) addFiles(files);
  }

  /* ---------- 綁定事件 ---------- */
  $('file').addEventListener('change', function (e) { addFiles(e.target.files); e.target.value = ''; });
  $('btn-auto').addEventListener('click', function () { autoSort(false); });
  $('btn-reverse').addEventListener('click', function () { state.order.reverse(); restitch('已反轉順序。'); });
  $('btn-clear').addEventListener('click', function () {
    state.items.forEach(function (it) { URL.revokeObjectURL(it.thumb); });
    state.items = []; state.order = []; restitch('');
    $('step-out').hidden = true;
  });
  $('btn-dl-img').addEventListener('click', downloadLongImage);
  $('btn-ocr').addEventListener('click', runOCR);
  ['opt-tw', 'opt-quote', 'opt-para', 'opt-fix'].forEach(function (id) {
    $(id).addEventListener('change', function () { savePrefs(); refreshText(); });
  });
  ['opt-lang', 'opt-psm', 'prompt'].forEach(function (id) { $(id).addEventListener('change', savePrefs); });
  $('out').addEventListener('input', function () {
    updateCount();
    try { localStorage.setItem(LAST_KEY, $('out').value); } catch (e) {}
  });
  $('btn-share-text').addEventListener('click', shareText);
  $('btn-share-file').addEventListener('click', shareFile);
  $('btn-share-img').addEventListener('click', shareImages);
  $('btn-copy').addEventListener('click', async function () {
    var ok = await copyText($('out').value);
    setStatus('share-status', ok ? '已複製。' : '複製失敗，請長按文字框全選後複製。', ok ? 'ok' : 'warn');
  });
  $('btn-dl-txt').addEventListener('click', function () {
    download(new Blob([$('out').value], { type: 'text/plain;charset=utf-8' }), baseName() + '.txt');
  });

  // 安裝到主畫面
  var installEvent = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); installEvent = e; $('btn-install').hidden = false;
  });
  $('btn-install').addEventListener('click', async function () {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    installEvent = null; $('btn-install').hidden = true;
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  loadPrefs();
  var last = null;
  try { last = localStorage.getItem(LAST_KEY); } catch (e) {}
  if (last) { $('out').value = last; updateCount(); $('step-out').hidden = false; }
  loadSharedFiles();

  // 給自動化測試用
  window.__snap2text = { state: state, addFiles: addFiles, runOCR: runOCR, cutSlices: cutSlices };
})();
