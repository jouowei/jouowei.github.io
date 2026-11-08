/*
 * 文字整理：把辨識出來的一行行文字組成段落，並修正標點、空白與常見錯字。
 */
(function (root) {
  'use strict';

  var CJK = '\\u2e80-\\u9fff\\uf900-\\ufaff\\u3000-\\u303f\\uff00-\\uffef「」『』“”‘’…—';
  var C = '[' + CJK + ']';

  // 依每行右緣位置組段落：這一行沒寫到右邊界就是段落結尾
  // lines: [{ text, x0, x1, y0, y1 }]，y 為整張長圖上的座標
  function toParagraphs(lines, merge) {
    lines = lines.filter(function (l) { return l.text.trim(); });
    if (!merge) return lines.map(function (l) { return clean(l.text); }).join('\n');
    // 段落之間空一行，手機上比較好讀
    if (!lines.length) return '';
    var rights = lines.map(function (l) { return l.x1; }).sort(function (a, b) { return a - b; });
    var margin = rights[Math.floor(rights.length * 0.95)];
    var heights = lines.map(function (l) { return l.y1 - l.y0; }).sort(function (a, b) { return a - b; });
    var ch = heights[heights.length >> 1] || 20;   // 字高，約等於一個中文字寬
    var gaps = [];
    for (var i = 1; i < lines.length; i++) gaps.push(lines[i].y0 - lines[i - 1].y1);
    gaps.sort(function (a, b) { return a - b; });
    var gap = gaps.length ? Math.max(gaps[gaps.length >> 1], 1) : ch;
    var out = [], cur = '';
    lines.forEach(function (l, k) {
      var t = clean(l.text);
      cur = cur ? joinText(cur, t) : t;
      var next = lines[k + 1], short = margin - l.x1;
      // 中文排版常為了不讓標點落在行首而提早一兩個字換行，所以：
      // 差三個字以上才一定是段落結尾；只差一兩個字時，要以句號等結尾才算
      var ends = short > ch * 3.5 ||
        (short > ch * 0.6 && /[。！？!?」』…]$/.test(t)) ||
        !next ||
        next.y0 - l.y1 > gap * 1.8 + ch * 0.3 ||                      // 行距明顯變大
        /^\s*(\d+[.、．)]|[（(]?[一二三四五六七八九十]+[、)）]|[•●・▪■◆★→])/.test(next.text); // 下一行是條列
      if (ends) { out.push(cur); cur = ''; }
    });
    if (cur) out.push(cur);
    return out.join('\n\n');
  }

  // 接兩行：中文之間不加空白，英文單字之間補一個空白
  function joinText(a, b) {
    if (/[A-Za-z0-9,.;:!?]$/.test(a) && /^[A-Za-z0-9]/.test(b)) return a + ' ' + b;
    return a + b;
  }

  var HALF = { ',': '，', ':': '：', ';': '；', '?': '？', '!': '！', '(': '（', ')': '）' };

  // 中文字之間、中英之間多出來的空白
  function squeeze(t) {
    t = t.replace(new RegExp('(' + C + ') +(?=' + C + ')', 'g'), '$1');
    t = t.replace(new RegExp('(' + C + ') +(?=[A-Za-z0-9])', 'g'), '$1');
    return t.replace(new RegExp('([A-Za-z0-9]) +(?=' + C + ')', 'g'), '$1');
  }

  function clean(t) {
    t = squeeze(t.replace(/\s+/g, ' ').trim());
    // 中文旁邊的半形標點改全形
    t = t.replace(new RegExp('(' + C + ') ?([,:;?!()])|([,:;?!()]) ?(?=' + C + ')', 'g'), function (m, c1, p1, p2) {
      return c1 ? c1 + HALF[p1] : HALF[p2];
    });
    t = squeeze(t);
    t = t.replace(/，\s*。|。\s*，/g, '。').replace(/([，。：；？！])\1+/g, '$1');
    // 外國人名中間的點：埃隆.馬斯克、埃隆-馬斯克 → 埃隆·馬斯克
    t = t.replace(/([一-鿿])\s?[.\-'‧・•]\s?(?=[一-鿿])/g, '$1·');
    // 刪節號
    t = t.replace(/\.{3,}|…+|。{3,}/g, '……');
    return t;
  }

  // Tesseract 對簡轉繁文章裡的「爲」常認錯，依前後文補回（保守，只處理不會有歧義的詞）
  var MISREAD = '[鳥烏島劑廬]';
  var FIXES = [
    [new RegExp('([認因成作以稱行視化名分轉改更極較甚])' + MISREAD, 'g'), '$1爲'],
    [new RegExp(MISREAD + '(什麼|了|此|何|止)', 'g'), '爲$1'],
    [/認[誤詞委]/g, '認爲'], [/[誤詞委]什麼/g, '爲什麼'], [/因[息詞]/g, '因爲'],
    [/自以詞/g, '自以爲'], [/稱之詞/g, '稱之爲'],
    [/(?<![填作歌寫的唱])詞了/g, '爲了'],
    [/(?<![耽延錯失貽])誤了/g, '爲了'],
    [/因誤(?![會判解差點食操傷用信觸診導入植殺報讀])/g, '因爲'],
    [/成誤(?![會解差區判導])/g, '成爲'],
    // 「感」常被認成「威」
    [/威(?=到|受|覺|恩|謝|興趣|染|冒)/g, '感'],
    [/(緊迫|成就|幸福|安全|責任|使命|危機|方向|歸屬|榮譽|參與|挫敗|優越|存在|新鮮|距離)威/g, '$1感'],
    // 「裏」常被認成「裹」
    [/(這|那|哪|心|家|書|間|隊|目|司|子)裹(?![著着住挾腳足])/g, '$1裏'],
    // 破折號「——」常被認成「一一」（排除「一一對應」「一一列舉」等）
    [/一一(?![對列說介解道回核檢處點過記比確寫告落擊數細清指羅看試嘗答查審講分辨舉呈展])/g, '——'],
    [/(\d)\s?[一~〜]\s?(?=\d)/g, '$1～'],
    // 簡轉繁時「只」被誤轉成「隻」（前面是數量詞的「一隻」「兩隻」不動）
    [/(?<![一二兩三四五六七八九十百幾每這那半數])隻(要|有|是|能|會|好|不過|需|得|剩|想|顧|管|怕)/g, '只$1'],
    [/(不|最多|而|就|也|都|還|卻)隻(?![貓狗鳥雞鴨羊兔手腳眼腿])/g, '$1只'],
    [/綫/g, '線']
  ];
  function fixMisreads(t) {
    FIXES.forEach(function (f) { t = t.replace(f[0], f[1]); });
    return t;
  }

  // 引號改台灣慣用的「」，內層用『』
  function taiwanQuotes(t) {
    return t.split('\n').map(function (p) {
      var open = true;
      p = p.replace(/[“”„‟〝〞＂"]/g, function () { var q = open ? '「' : '」'; open = !open; return q; });
      var open2 = true;
      p = p.replace(new RegExp('[‘’](?=' + C + ')|(' + C + ')[‘’]', 'g'), function (m, c) {
        var q = open2 ? '『' : '』'; open2 = !open2;
        return c ? c + q : q;
      });
      return p;
    }).join('\n');
  }

  var api = { toParagraphs: toParagraphs, clean: clean, fixMisreads: fixMisreads, taiwanQuotes: taiwanQuotes };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TextProc = api;
})(this);
