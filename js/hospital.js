/* Bệnh viện 2x2: cảnh 4 phòng riêng biệt cho mini game Ca trực.
 * Vẽ bằng canvas 2D ở tọa độ logic 400x300 (mỗi phòng 200x150), nhân với RES khi vẽ nên nét luôn sắc.
 * Dùng chung bộ vẽ người `drawPersonPixel` và `tickN` của clinic.html (gọi lúc chạy, không lúc nạp).
 * Màu ở đây là màu bức tranh của game, không phải màu giao diện.
 */
(function () {
  "use strict";
  let HW = 700, cols = 2;
  const HH = 300, RW = 200, RH = 150;
  const nRooms = () => cols * 2;
  const viewCols = () => cols < 4 ? cols + 1 : 4;
  const viewRooms = () => viewCols() * 2;

  /* ---------- bảng màu bức tranh ---------- */
  const C = {
    ink: "#2A2018", line: "rgba(50,36,20,.28)",
    wood1: "#D9A15C", wood2: "#B97B3C", wood3: "#8A5628", woodHi: "#EBC48C",
    steel: "#B8C2CC", steel2: "#8A97A5", steel3: "#5E6B79", white: "#FFFFFF", cream: "#FBF6EA",
    screenOff: "#223042", screenOn: "#7FD6E8", green: "#3BC48A", red: "#E5534B", amber: "#F5B72E", blue: "#3B82F6", teal: "#14B8A6", rose: "#F43F5E"
  };
  const THEME = [
    { name: "Tiếp đón", short: "1. Tiếp đón", wall: "#F4EFE4", wain: "#DCCFB4", rail: "#B9A98A", fA: "#F0E8D8", fB: "#E6DCC6", acc: "#F5B72E", staff: "Lê Tân Vân" },
    { name: "Khám và cấp cứu", short: "2. Khám và cấp cứu", wall: "#EEF3F6", wain: "#CFE0EA", rail: "#9DB8C8", fA: "#F3F6F8", fB: "#E6ECF0", acc: "#3B82F6", staff: "BS. Tuấn" },
    { name: "Xét nghiệm và dược", short: "3. Xét nghiệm và dược", wall: "#EDF4F1", wain: "#CFE3DA", rail: "#9CC0B0", fA: "#F1F6F3", fB: "#E3ECE7", acc: "#14B8A6", staff: "DS. Lan" },
    { name: "Điều dưỡng và hồi phục", short: "4. Điều dưỡng và hồi phục", wall: "#F4EEEE", wain: "#E3D3D3", rail: "#C9AFAF", fA: "#F5F1F1", fB: "#EAE3E3", acc: "#F43F5E", staff: "Y tá Mai" }
  ];
  THEME.push(
    { name: "Nhi và tiêm chủng", short: "5. Nhi và tiêm chủng", wall: "#F1EFF6", wain: "#D8D2E8", rail: "#B3A8D6", fA: "#F4F2F8", fB: "#E8E4F1", acc: "#8B5CF6", staff: "Y tá Hà" },
    { name: "Hồ sơ và giám định", short: "6. Hồ sơ và giám định", wall: "#F0EDE6", wain: "#D5CCB8", rail: "#B5A27A", fA: "#F3F0EA", fB: "#E7E2D6", acc: "#B58A2E", staff: "CV. Quân" },
    { name: "Dân số và sinh sản", short: "7. Dân số và sinh sản", wall: "#F7EFE8", wain: "#E6D0BE", rail: "#D2AE92", fA: "#F8F3EE", fB: "#EEE5DB", acc: "#F97316", staff: "BS. Hương" },
    { name: "Dự phòng và hiến ghép", short: "8. Dự phòng và hiến ghép", wall: "#ECF4F5", wain: "#C9DFE3", rail: "#8FBAC4", fA: "#F0F6F7", fB: "#E1ECEE", acc: "#0E7490", staff: "BS. Dũng" }
  );
  const ROOMS = THEME.map((t, i) => Object.assign({ i, x: (i < 4 ? i % 2 : 2 + ((i - 4) >> 1)) * RW, y: (i < 4 ? i >> 1 : (i - 4) % 2) * RH, w: RW }, t));
  /* phòng 3 mở rộng sang phải thêm 100px; hai phòng hàng dưới bên phải dịch theo để nhường chỗ */
  ROOMS[3].w = 300; ROOMS[5].x = 500; ROOMS[7].x = 700;
  const ROOM_OF = {
    "TIẾP ĐÓN": 0, "BHYT": 0, "TƯ VẤN SÀNG LỌC": 0,
    "KHÁM THAI": 1, "KHOA NHI": 1, "CẤP CỨU": 1, "TIÊM CHỦNG": 1,
    "DƯỢC": 2, "HỒ SƠ ĐIỆN TỬ": 2, "ATTP": 2,
    "NGƯỜI CAO TUỔI": 3, "PHÒNG BỆNH": 3, "DÂN SỐ": 1, "HIẾN GHÉP": 2
  };
  /* vị trí đứng (tọa độ cả cảnh) của nhân viên và 3 chỗ cho bệnh nhân trong mỗi phòng */
  const STAFF_AT = [[104, 82], [330, 108], [134, 242], [366, 252], [550, 100], [648, 242], [750, 100], [848, 242]];
  /* phụ tá xuất hiện khi nhân viên phòng đạt cấp 4 và cấp 7 */
  const ASSIST_AT = [[[72, 88], [136, 92]], [[292, 100], [356, 120]], [[104, 238], [168, 250]], [[336, 258], [384, 232]], [[508, 92], [584, 106]], [[686, 246], [684, 222]], [[708, 92], [784, 108]], [[812, 236], [884, 226]]];
  const PSCALE = 0.98;
  const SLOTS = [
    [[104, 112], [156, 126], [60, 128]],
    [[262, 120], [236, 134], [300, 134]],
    [[60, 240], [90, 270], [24, 284]],
    [[300, 236], [256, 252], [232, 224]],
    [[470, 112], [516, 128], [430, 130]],
    [[570, 236], [600, 266], [530, 256]],
    [[670, 112], [716, 128], [630, 130]],
    [[770, 236], [800, 268], [730, 256]]
  ];
  const STAFF_LOOK = [
    { skin: "#F1C9A5", hair: "#3B2A1E", shirt: "#2E6E8E", pants: "#3A4654", bun: true, female: true, steth: false, role: "staff" },
    { skin: "#D9A578", hair: "#1C232C", coat: true, steth: true, tie: true, pants: "#3A4654", female: false, role: "staff" },
    { skin: "#F1C9A5", hair: "#5F3A1E", coat: true, steth: true, glasses: true, pants: "#3A4654", female: true, longHair: true, role: "staff" },
    { skin: "#E7B98F", hair: "#2A1D16", shirt: "#E86C92", pants: "#E86C92", bun: true, female: true, hat: "#FFFFFF", role: "staff" },
    { skin: "#F1C9A5", hair: "#4A2E1C", shirt: "#8B5CF6", pants: "#4A3F6B", female: true, longHair: true, steth: true, role: "staff" },
    { skin: "#D9A578", hair: "#1C232C", shirt: "#8A6A48", pants: "#3A3226", glasses: true, tie: true, female: false, role: "staff" },
    { skin: "#F1C9A5", hair: "#2A1D16", coat: true, steth: true, pants: "#3A4654", female: true, longHair: true, role: "staff" },
    { skin: "#D9A578", hair: "#1C232C", coat: true, steth: true, pants: "#3A4654", female: false, glasses: true, role: "staff" }
  ];
  const ASSIST_LOOK = [
    { skin: "#F1C9A5", hair: "#2A1D16", shirt: "#4A8FB0", pants: "#3A4654", female: true, bun: true, role: "staff" },
    { skin: "#E7B98F", hair: "#3B2A1E", shirt: "#7FB6D6", pants: "#3A4654", female: false, role: "staff" },
    { skin: "#D9A578", hair: "#5F3A1E", shirt: "#E7A3B8", pants: "#E7A3B8", female: true, hat: "#FFFFFF", role: "staff" },
    { skin: "#F1C9A5", hair: "#1C232C", shirt: "#7A6BC4", pants: "#3A4654", female: false, glasses: true, role: "staff" }
  ];

  /* ---------- đồ thị đường đi ---------- */
  const NODES = {
    out: [-18, 112], e0: [10, 112], r0: [104, 112], h0: [152, 114], d01: [200, 112], h1: [240, 114], r1: [262, 120],
    h0b: [80, 120], d02: [80, 150], h2: [80, 190], r2: [172, 232],
    h1b: [320, 128], d13: [320, 150], h3: [320, 190], r3: [300, 236],
    h2b: [150, 262], d23: [200, 262], h3b: [250, 262],
    h3c: [352, 262], ex: [404, 262], exo: [418, 262],
    h1c: [372, 128], d14: [400, 112], h4: [430, 114], r4: [470, 112], s4: [430, 130], s4b: [516, 128], d45: [540, 150], h45: [540, 190],
    d35: [500, 262], h5: [532, 262], r5: [570, 236], s5: [530, 256], s5b: [600, 266], h5c: [660, 262],
    h4c: [560, 126], d46: [600, 112], h6: [632, 114], r6: [670, 112], s6: [630, 130], s6b: [716, 128], d67: [750, 150], h67: [750, 190],
    d57: [700, 262], h7: [732, 262], r7: [770, 236], s7: [730, 256], s7b: [800, 268], h7c: [860, 262],
    wc: [38, 114], s0: [60, 128], s0b: [156, 126], s1: [236, 134], s1b: [300, 134], s2: [256, 252], s3: [60, 240], s3b: [90, 270], s3c: [24, 284], s2b: [232, 224]
  };
  const EDGES = [
    ["out", "e0"], ["e0", "r0"], ["r0", "h0b"], ["h0b", "d02"], ["d02", "h2"], ["h2", "r2"], ["h2", "s3"], ["r0", "h0"], ["h0", "d01"], ["d01", "h1"], ["h1", "r1"],
    ["r1", "h1b"], ["h1b", "d13"], ["d13", "h3"], ["h3", "r3"], ["r2", "h2b"], ["h2b", "d23"], ["d23", "h3b"], ["h3b", "r3"], ["r3", "h3c"], ["h3c", "ex"], ["ex", "exo"],
    ["r0", "s0"], ["h0", "s0b"], ["h1", "s1"], ["r1", "s1b"], ["h3b", "s2"], ["r3", "s2b"], ["s3", "s3b"], ["s3b", "h2b"], ["s3", "s3c"], ["h2", "r2"]
  ];
  const EDGES3 = [
    ["h3c", "d35"], ["d35", "h5"], ["h5", "s5"], ["h5", "r5"], ["r5", "s5b"], ["h5", "h5c"],
    ["h1b", "h1c"], ["h1c", "d14"], ["d14", "h4"], ["h4", "r4"], ["h4", "s4"], ["r4", "s4b"], ["r4", "d45"], ["d45", "h45"], ["h45", "r5"]
  ];
  const EDGES4 = [
    ["r4", "h4c"], ["h4c", "d46"], ["d46", "h6"], ["h6", "r6"], ["h6", "s6"], ["r6", "s6b"], ["r6", "d67"], ["d67", "h67"], ["h67", "r7"],
    ["h5c", "d57"], ["d57", "h7"], ["h7", "s7"], ["h7", "r7"], ["r7", "s7b"], ["h7", "h7c"]
  ];
  let ADJ = {};
  function buildGraph() {
    ADJ = {};
    const noEx = e => !["ex", "exo"].includes(e[0]) && !["ex", "exo"].includes(e[1]);
    NODES.ex = [6, 262]; NODES.exo = [-18, 262];
    let list = EDGES.filter(noEx).concat([["ex", "exo"], ["ex", "s3"], ["ex", "s3c"], ["e0", "wc"], ["wc", "h0b"]]);
    if (cols >= 3) list = list.concat(EDGES3.filter(noEx));
    if (cols >= 4) list = list.concat(EDGES4.filter(noEx));
    for (const [a, b] of list) { (ADJ[a] = ADJ[a] || []).push(b); (ADJ[b] = ADJ[b] || []).push(a); }
  }
  buildGraph();
  const dist = (a, b) => Math.hypot(NODES[a][0] - NODES[b][0], NODES[a][1] - NODES[b][1]);
  function route(from, to) {
    const d = { [from]: 0 }, prev = {}, todo = new Set(Object.keys(NODES));
    while (todo.size) {
      let u = null;
      for (const n of todo) if (d[n] !== undefined && (u === null || d[n] < d[u])) u = n;
      if (u === null) break;
      todo.delete(u);
      if (u === to) break;
      for (const v of ADJ[u] || []) {
        const nd = d[u] + dist(u, v);
        if (d[v] === undefined || nd < d[v]) { d[v] = nd; prev[v] = u; }
      }
    }
    const out = []; let n = to;
    while (n) { out.unshift(n); n = prev[n]; if (n === from) { out.unshift(n); break; } }
    return out;
  }
  const spotNode = [["r0", "s0", "s0b"], ["r1", "s1", "s1b"], ["r2", "s2", "r2"], ["r3", "s3", "s3b"]];
  const SLOT_NODE = [["r0", "s0", "s0b"], ["r1", "s1", "s1b"], ["s3", "s3b", "s3c"], ["r3", "s2", "s2b"], ["r4", "s4b", "s4"], ["r5", "s5b", "s5"], ["r6", "s6b", "s6"], ["r7", "s7b", "s7"]];
  /* slot nằm trên giường: người thường nằm xuống (đầu trên gối), người ngồi xe lăn không dùng */
  const BED_SLOTS = { "3:2": { hx: 224, hy: 219 } };
  function isBedSlot(room, k) { return !!BED_SLOTS[room + ":" + k]; }
  function pickSlot(room, look) {
    for (let s = 1; s < 3; s++) {
      if (!slotFree(room, s)) continue;
      if (look && look.wheelchair && isBedSlot(room, s)) continue;
      return s;
    }
    return -1;
  }

  /* ---------- trạng thái ---------- */
  let g = null, RESV = 3;
  const S = {
    eq: [1, 1, 1, 1, 1, 1, 1, 1], st: [1, 1, 1, 1, 1, 1, 1, 1], active: -1,
    busy: false, reduced: false, cam: { x: 200, y: 150, z: 1 }, camT: { x: 200, y: 150, z: 1 }, flash: null, shk: 0,
    people: [], fx: [], nextId: 1, mounted: false, spawnT: 0, caseP: null, ambientTarget: 4
  };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pickOne = a => a[(Math.random() * a.length) | 0];
  const SKIN = ["#F1C9A5", "#D9A578", "#8D5524", "#F5D0B0"];
  /* bảng màu mở rộng để tạo nhân vật đa dạng */
  const SKIN_ALL = ["#F5D0B0", "#F1C9A5", "#E7B98F", "#D9A578", "#C68B59", "#8D5524", "#6B4226"];
  const HAIR_COLS = ["#241D14", "#3B2A1E", "#5F3A1E", "#8A5A2A", "#B8651E", "#7A4A1E", "#111827", "#4E4438", "#C9A66B", "#E0B872", "#2A1D16"];
  const GREY_COLS = ["#D6D3CB", "#B9B4AA", "#9A9A9A"];
  const SHIRT_COLS = ["#6FA8DC", "#9AB0CC", "#4E6E8E", "#D98BA5", "#E86C3A", "#6B8E7B", "#F2C14E", "#8B5CF6", "#C2527A", "#4E8A7E", "#A67C4A", "#E7D9B8", "#5B8DEF", "#9AA7B8", "#2E6E8E", "#81B29A"];
  const DRESS_COLS = ["#B3689B", "#F2A7C3", "#7B6FA8", "#5B8DEF", "#E07A5F", "#81B29A", "#F4A261", "#CDB4DB"];
  const PANT_COLS = ["#2C3540", "#3A4654", "#4E4438", "#2C3E50", "#4A7FA5", "#3A3226", "#4A3F6B", "#3A3A3A"];
  const SHOE_COLS = ["#241D14", "#3B2A1E", "#F5F5F5", "#5B4636"];
  const HAT_COLS = ["#F2C230", "#E86C3A", "#5B8DEF", "#FFFFFF", "#81B29A"];
  /* nhân vật ngẫu nhiên: người lớn, trẻ em, người già; nam hoặc nữ; có thể có kính, mũ, khẩu trang, râu, gậy */
  function randomLook() {
    const k = Math.random();
    const elder = k < 0.14, kid = !elder && k < 0.27;
    const female = Math.random() < 0.5;
    const look = { skin: pickOne(SKIN_ALL), hair: pickOne(HAIR_COLS), shoe: pickOne(SHOE_COLS) };
    if (female) {
      look.female = true; look.dress = pickOne(DRESS_COLS);
      if (Math.random() < 0.7) look.longHair = true; else look.bun = true;
      if (Math.random() < 0.3) look.glasses = true;
    } else {
      look.shirt = pickOne(SHIRT_COLS); look.pants = pickOne(PANT_COLS);
      if (Math.random() < 0.18) look.beard = true;
      else if (Math.random() < 0.15) look.bald = true;
      if (Math.random() < 0.2) look.tie = true;
    }
    if (kid) { look.kid = true; look.hair = pickOne(HAIR_COLS); }
    if (elder) { look.elder = true; look.hair = pickOne(GREY_COLS); look.glasses = Math.random() < 0.7; if (Math.random() < 0.6) look.cane = true; }
    if (!look.kid && !look.elder && Math.random() < 0.12) look.hat = pickOne(HAT_COLS);
    else if (Math.random() < 0.08) look.mask = true;
    return look;
  }
  const AMB = [
    { hair: "#241D14", shirt: "#6FA8DC", pants: "#2C3540" },
    { hair: "#5F3A1E", dress: "#B3689B", longHair: true, bun: true, female: true },
    { hair: "#D6D3CB", shirt: "#A67C4A", pants: "#4E4438", glasses: true, cane: true, elder: true },
    { hair: "#7A4A1E", shirt: "#F2C14E", pants: "#4A7FA5", kid: true },
    { hair: "#241D14", shirt: "#9AB0CC", pants: "#2C3E50", mask: true },
    { hair: "#111827", shirt: "#4E6E8E", pants: "#2C3540", tie: true },
    { hair: "#111827", shirt: "#D98BA5", pants: "#4E4438", longHair: true, female: true },
    { hair: "#241D14", dress: "#F2A7C3", longHair: true, kid: true, female: true },
    { hair: "#D6D3CB", dress: "#7B6FA8", longHair: true, bun: true, glasses: true, cane: true, elder: true, female: true },
    { hair: "#4E4438", shirt: "#6B8E7B", pants: "#3A4654", wheelchair: true, elder: true },
    { hair: "#2A1D16", shirt: "#E0A458", pants: "#3A4654", wheelchair: true },
    { hair: "#3B2A1E", shirt: "#4E8A7E", pants: "#2C3540", beard: true },
    { hair: "#8A5A2A", shirt: "#C2527A", pants: "#3A3226", longHair: true, female: true, glasses: true },
    { hair: "#111827", shirt: "#E7D9B8", pants: "#4A3F6B", bald: true, fat: true, glasses: true },
    { hair: "#B8651E", dress: "#5B8DEF", longHair: true, female: true },
    { hair: "#1C232C", shirt: "#E86C3A", pants: "#2C3E50", hat: "#F2C230" },
    { hair: "#4E4438", shirt: "#9AA7B8", pants: "#3A4654", elder: true, glasses: true, cane: true, bald: true }
  ];
  /* hệ số tốc độ: trẻ con, người già, xe lăn đi chậm hơn */
  function speedMul(look) { return look.wheelchair ? 0.5 : look.elder ? 0.38 : look.kid ? 0.72 : 1; }
  /* độ dài bước so với nhịp chân: người già bước ngắn hơn nhiều, trẻ em bước ngắn hơn một chút */
  function strideMul(look) { return look.wheelchair ? 1 : look.elder ? 0.6 : look.kid ? 0.85 : 1; }
  const ICON_OF_ROOM = ["clip", "cross", "pill", "heart", "cross", "clip", "heart", "pill"];

  /* ---------- hàm vẽ cơ bản ---------- */
  function rect(x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  function rrect(x, y, w, h, r, c) { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); }
  function srect(x, y, w, h, r, c, lw) { g.strokeStyle = c; g.lineWidth = lw || 1; g.beginPath(); g.roundRect(x, y, w, h, r); g.stroke(); }
  function circ(x, y, r, c) { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  function elp(x, y, rx, ry, c) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); }
  function line(x0, y0, x1, y1, c, lw) { g.strokeStyle = c; g.lineWidth = lw || 1; g.lineCap = "round"; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  function lg(x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
  function shade(x, y, rx, ry, a) { const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, "rgba(50,36,20," + (a || 0.22) + ")"); gr.addColorStop(1, "rgba(50,36,20,0)"); g.save(); g.translate(0, y); g.scale(1, ry / rx); g.translate(0, -y); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rx, 0, Math.PI * 2); g.fill(); g.restore(); }
  function tiles(x, y, w, h, s, a, b) { for (let j = 0; j * s < h; j++) for (let i = 0; i * s < w; i++) rect(x + i * s, y + j * s, Math.min(s, w - i * s), Math.min(s, h - j * s), (i + j) % 2 ? b : a); }
  function box3(x, y, w, h, d, top, front, side) { rect(x, y + d, w, h, front); rect(x, y, w, d, top); rect(x + w, y + d * 0.5, d * 0.6, h, side || front); }

  /* ---------- thành phần dùng lại ---------- */
  function wallAndFloor(th, eq, W) {
    const w = W || RW;
    rect(0, 0, w, 46, th.wall);
    g.fillStyle = lg(0, 0, 0, 46, [[0, "rgba(255,255,255,.35)"], [1, "rgba(0,0,0,.05)"]]); g.fillRect(0, 0, w, 46);
    rect(0, 32, w, 14, th.wain); rect(0, 31, w, 2, th.rail); rect(0, 44, w, 2, "rgba(0,0,0,.14)");
    rect(0, 0, w, 3, "rgba(255,255,255,.55)");
    tiles(0, 46, w, RH - 46, 12, th.fA, th.fB);
    g.fillStyle = lg(0, 46, 0, 62, [[0, "rgba(40,28,10,.20)"], [1, "rgba(40,28,10,0)"]]); g.fillRect(0, 46, w, 16);
    g.fillStyle = lg(0, RH - 22, 0, RH, [[0, "rgba(40,28,10,0)"], [1, "rgba(40,28,10,.10)"]]); g.fillRect(0, RH - 22, w, 22);
  }
  function windowFrame(x, y, w, h, view) {
    rrect(x - 2, y - 2, w + 4, h + 4, 3, "#F5F1E6"); srect(x - 2, y - 2, w + 4, h + 4, 3, "rgba(0,0,0,.25)", 1);
    g.fillStyle = lg(0, y, 0, y + h, view === "garden" ? [[0, "#BFE6F6"], [0.62, "#D9F1FA"], [0.62, "#8CCB7B"], [1, "#6DB563"]] : [[0, "#9FD4F0"], [1, "#DDF2FB"]]);
    g.fillRect(x, y, w, h);
    if (view !== "garden") { circ(x + w * 0.74, y + h * 0.3, 3.2, "rgba(255,255,255,.9)"); elp(x + w * 0.3, y + h * 0.42, 7, 2.6, "rgba(255,255,255,.85)"); }
    else { circ(x + w * 0.3, y + h * 0.78, 4, "#4FA356"); circ(x + w * 0.66, y + h * 0.74, 5, "#58B05F"); rect(x + w * 0.62, y + h * 0.78, 1.6, 6, "#7A5230"); }
    line(x + w / 2, y, x + w / 2, y + h, "#F5F1E6", 1.8); line(x, y + h / 2, x + w, y + h / 2, "#F5F1E6", 1.2);
    rect(x - 4, y + h + 2, w + 8, 2.4, "#E6DFCB");
    g.fillStyle = "rgba(255,255,255,.28)"; g.beginPath(); g.moveTo(x + 2, y + h); g.lineTo(x + w * 0.4, y); g.lineTo(x + w * 0.58, y); g.lineTo(x + 8 + w * 0.12, y + h); g.fill();
  }
  function clock(x, y, r, t) {
    circ(x, y, r + 1.6, "#6B5B48"); circ(x, y, r, "#FFFDF6");
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; line(x + Math.sin(a) * (r - 1.4), y - Math.cos(a) * (r - 1.4), x + Math.sin(a) * (r - 0.4), y - Math.cos(a) * (r - 0.4), "#6B5B48", 0.7); }
    const d = new Date(), m = d.getMinutes(), h = d.getHours() % 12 + m / 60;
    line(x, y, x + Math.sin(h * Math.PI / 6) * r * 0.5, y - Math.cos(h * Math.PI / 6) * r * 0.5, "#2A2018", 1.2);
    line(x, y, x + Math.sin(m * Math.PI / 30) * r * 0.78, y - Math.cos(m * Math.PI / 30) * r * 0.78, "#2A2018", 0.8);
    circ(x, y, 0.9, "#E5534B");
  }
  function plant(x, y, s) {
    s = s || 1;
    shade(x, y + 1, 9 * s, 3 * s, 0.25);
    g.fillStyle = lg(x - 5 * s, 0, x + 5 * s, 0, [[0, "#C9663A"], [1, "#A24A25"]]); g.beginPath(); g.moveTo(x - 5 * s, y - 9 * s); g.lineTo(x + 5 * s, y - 9 * s); g.lineTo(x + 3.6 * s, y); g.lineTo(x - 3.6 * s, y); g.fill();
    rect(x - 5.6 * s, y - 10.6 * s, 11.2 * s, 2.4 * s, "#D97A4A");
    const lv = [[-6, -19, "#3E9B52"], [6, -20, "#4DB063"], [0, -25, "#5CC274"], [-3, -15, "#46A85B"], [4, -14, "#3E9B52"]];
    for (const [dx, dy, c] of lv) { g.fillStyle = c; g.beginPath(); g.ellipse(x + dx * s, y + dy * s + 4 * s, 3.2 * s, 7 * s, dx * 0.07, 0, Math.PI * 2); g.fill(); }
  }
  function chair(x, y, c1, c2) {
    shade(x, y + 1, 9, 3, 0.2);
    rect(x - 7, y - 9, 14, 3, c2); rrect(x - 7, y - 20, 14, 12, 3, c1); g.fillStyle = "rgba(255,255,255,.28)"; g.fillRect(x - 5, y - 18, 10, 2);
    rrect(x - 8, y - 9, 16, 6, 2.4, c1); rect(x - 6, y - 3.6, 2, 4.4, C.steel3); rect(x + 4, y - 3.6, 2, 4.4, C.steel3);
  }
  function counter(x, y, w, hFront, top, face, trim) {
    shade(x + w / 2, y + hFront + 7, w * 0.55, 4, 0.22);
    rect(x - 2, y - 7, w + 4, 8, top); g.fillStyle = "rgba(255,255,255,.4)"; g.fillRect(x - 2, y - 7, w + 4, 2);
    rect(x - 2, y + 0.4, w + 4, 1.4, "rgba(0,0,0,.18)");
    g.fillStyle = lg(0, y + 1, 0, y + hFront, [[0, face], [1, trim]]); g.fillRect(x, y + 1.6, w, hFront);
    for (let i = x + 14; i < x + w - 6; i += 22) { srect(i, y + 6, 18, hFront - 9, 1.6, "rgba(0,0,0,.2)", 0.8); rect(i + 8, y + 4 + (hFront - 9) / 2, 2, 3, "rgba(255,230,180,.7)"); }
    rect(x, y + hFront, w, 3, "rgba(0,0,0,.22)");
  }
  function monitorPC(x, y, on, t) {
    rrect(x - 7, y - 11, 14, 9.6, 1.4, "#2B3440"); rrect(x - 6, y - 10, 12, 7.4, 1, on ? C.screenOn : C.screenOff);
    if (on) { for (let i = 0; i < 3; i++) rect(x - 5, y - 9 + i * 2.2, 5 + (i * 3 + ((t / 30) | 0)) % 4, 1, "rgba(255,255,255,.7)"); }
    rect(x - 1, y - 1.6, 2, 2.2, "#5A6572"); rrect(x - 4, y + 0.2, 8, 1.6, 0.8, "#4A5562");
    rrect(x - 7, y + 2, 14, 2.6, 1, "#E6EAEE"); for (let i = 0; i < 6; i++) rect(x - 6 + i * 2.1, y + 2.6, 1.3, 1.1, "#BAC3CC");
  }
  function led(x, y, w, h, txt, t) {
    rrect(x, y, w, h, 2, "#10161C"); srect(x, y, w, h, 2, "#6B7682", 1);
    g.font = "700 " + (h * 0.62) + "px ui-monospace, Consolas, monospace"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = (t / 25 | 0) % 2 ? "#FFB84D" : "#FFD27A"; g.fillText(txt, x + w / 2, y + h / 2 + 0.4); g.textBaseline = "alphabetic";
  }
  function bed(x, y, w, blanket, pillow, opts) {
    opts = opts || {};
    shade(x + w / 2, y + 22, w * 0.62, 5, 0.28);
    rect(x + 2, y + 15, 3, 9, C.steel3); rect(x + w - 5, y + 15, 3, 9, C.steel3);
    circ(x + 3.5, y + 24.4, 2, "#34404C"); circ(x + w - 3.5, y + 24.4, 2, "#34404C");
    rrect(x, y + 3, w, 14, 4, C.steel);
    g.fillStyle = lg(0, y, 0, y + 14, [[0, "#FFFFFF"], [1, "#E4EAF2"]]); g.beginPath(); g.roundRect(x + 2, y, w - 4, 12, 4); g.fill();
    rrect(x + 3, y + 1.4, 18, 8, 3.6, pillow || "#FFFFFF"); g.fillStyle = "rgba(0,0,0,.06)"; g.fillRect(x + 4, y + 7, 16, 1.8);
    g.fillStyle = lg(x + 22, 0, x + w, 0, [[0, blanket], [1, shade_c(blanket, -22)]]); g.beginPath(); g.roundRect(x + 22, y + 0.6, w - 26, 12.4, 3); g.fill();
    rect(x + 22, y + 5, w - 26, 1.4, "rgba(255,255,255,.35)");
    rect(x - 1, y - 6, 3.2, 14, C.steel2); rect(x + w - 2, y - 2, 3, 10, C.steel2);
    if (opts.rail) { line(x + 24, y - 3, x + w - 6, y - 3, C.steel3, 1); }
  }
  function shade_c(hex, d) { const n = parseInt(hex.slice(1), 16); const r = Math.max(0, Math.min(255, (n >> 16) + d)), gg = Math.max(0, Math.min(255, ((n >> 8) & 255) + d)), b = Math.max(0, Math.min(255, (n & 255) + d)); return "rgb(" + r + "," + gg + "," + b + ")"; }
  function iv(x, y, h) {
    shade(x, y + 1, 7, 2.4, 0.22);
    line(x, y, x, y - h, C.steel2, 1.4); line(x - 4, y, x + 4, y, C.steel3, 1.4); circ(x - 4, y + 0.8, 1, "#3A4450"); circ(x + 4, y + 0.8, 1, "#3A4450");
    line(x - 4, y - h, x + 4, y - h, C.steel2, 1.2);
    rrect(x + 1.2, y - h + 1, 5, 8, 1.6, "rgba(180,225,245,.85)"); rect(x + 1.8, y - h + 5, 3.8, 3.2, "rgba(80,170,210,.6)"); line(x + 3.6, y - h + 9, x + 3.6, y - h + 15, "rgba(120,170,200,.8)", 0.6);
  }
  function ecg(x, y, w, h, t, col) {
    rrect(x, y, w, h, 2, "#0E1620"); srect(x, y, w, h, 2, "#5E6B79", 1);
    g.strokeStyle = col || "#3BE0A0"; g.lineWidth = 1; g.beginPath();
    for (let i = 0; i <= w - 4; i += 1) {
      const p = ((i + t * 0.9) % 30) / 30; let v = 0;
      if (p > 0.1 && p < 0.16) v = -(p - 0.1) * 130; else if (p >= 0.16 && p < 0.2) v = (p - 0.16) * 260 - 7; else if (p >= 0.2 && p < 0.25) v = 3 - (p - 0.2) * 60;
      const px = x + 2 + i, py = y + h / 2 + v * (h / 22);
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.stroke();
    circ(x + w - 5, y + 4, 1.4, (t / 18 | 0) % 2 ? "#FF6B6B" : "#7A2B2B");
  }
  function cabinetWall(x, y, w, h, items) {
    rrect(x, y, w, h, 2, "#F6F4EE"); srect(x, y, w, h, 2, "rgba(0,0,0,.25)", 1);
    rect(x + w / 2 - 0.5, y + 1, 1, h - 2, "rgba(0,0,0,.18)");
    g.fillStyle = "rgba(180,225,245,.45)"; g.fillRect(x + 2, y + 2, w - 4, h - 4);
    const rows = Math.max(2, Math.floor(h / 12));
    for (let r = 0; r < rows; r++) { const yy = y + 4 + r * (h - 8) / rows; rect(x + 2, yy + (h - 8) / rows - 1.4, w - 4, 1.4, "rgba(0,0,0,.18)"); for (let i = 0; i < Math.floor((w - 6) / 6); i++) rect(x + 3 + i * 6, yy + 1, 4, (h - 8) / rows - 3, items[(r * 3 + i) % items.length]); }
  }
  function wheelchair(x, y) {
    shade(x, y + 1, 12, 3, 0.2);
    circ(x - 6, y - 7, 6, "#3A4450"); circ(x - 6, y - 7, 4.2, "#DCE3EA"); circ(x - 6, y - 7, 1.1, "#3A4450");
    circ(x + 8, y - 2, 2.4, "#3A4450");
    rrect(x - 8, y - 20, 4, 14, 1.6, "#5A6572"); rrect(x - 8, y - 13, 16, 4, 1.6, "#4C89D8"); rect(x - 7, y - 9, 14, 1.4, "#3A4450"); line(x + 6, y - 9, x + 8, y - 3, "#3A4450", 1.4);
  }
  function icon(kind, x, y, s) {
    s = s || 1;
    circ(x, y, 6.6 * s, "#FFFFFF"); g.strokeStyle = "rgba(40,30,20,.55)"; g.lineWidth = 1; g.beginPath(); g.arc(x, y, 6.6 * s, 0, Math.PI * 2); g.stroke();
    g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = "round"; g.lineJoin = "round";
    if (kind === "heart") { g.fillStyle = "#E5534B"; g.beginPath(); g.moveTo(0, 3.6); g.bezierCurveTo(-6, -1, -3.2, -5.4, 0, -2.2); g.bezierCurveTo(3.2, -5.4, 6, -1, 0, 3.6); g.fill(); }
    else if (kind === "pill") { g.rotate(-0.7); rrect(-4, -2, 4.2, 4, 2, "#E5534B"); rrect(0, -2, 4.2, 4, 2, "#F6F2EA"); g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 0.6; g.beginPath(); g.roundRect(-4, -2, 8.2, 4, 2); g.stroke(); }
    else if (kind === "cross") { rect(-1.3, -4, 2.6, 8, "#3B82F6"); rect(-4, -1.3, 8, 2.6, "#3B82F6"); }
    else if (kind === "clip") { rrect(-3.2, -4, 6.4, 8, 1, "#C9A065"); rect(-2.2, -3, 4.4, 6, "#FFFDF6"); line(-1.4, -1, 1.4, -1, "#8A97A5", 0.7); line(-1.4, 0.8, 1.4, 0.8, "#8A97A5", 0.7); rrect(-1.5, -4.6, 3, 1.8, 0.6, "#6B7682"); }
    else if (kind === "ok") { g.strokeStyle = "#2E9D57"; g.lineWidth = 1.8; g.beginPath(); g.moveTo(-3.4, 0.2); g.lineTo(-0.8, 2.8); g.lineTo(3.6, -2.6); g.stroke(); }
    else if (kind === "no") { g.fillStyle = "#E5534B"; g.font = "700 9px Epilogue, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("?", 0, 0.6); g.textBaseline = "alphabetic"; }
    g.restore();
  }

  function stool(x, y, c) { shade(x, y + 1, 8, 2.6, 0.22); rect(x - 1, y - 8, 2, 8, C.steel3); elp(x, y - 10, 7, 2.8, shade_c(c, -26)); rrect(x - 7, y - 13, 14, 4.6, 2.2, c); rect(x - 6, y - 12.2, 12, 1, "rgba(255,255,255,.4)"); line(x - 5, y - 0.4, x + 5, y - 0.4, C.steel3, 1.4); }
  function trolley(x, y, w) { w = w || 26; shade(x + w / 2, y + 3, w * 0.6, 3, 0.22); rrect(x, y - 17, w, 15, 2, "#F2F5F8"); srect(x, y - 17, w, 15, 2, "rgba(0,0,0,.22)", 1); rect(x, y - 11, w, 1, "rgba(0,0,0,.18)"); rect(x + w / 2 - 3, y - 15, 6, 1.4, C.steel2); rect(x + w / 2 - 3, y - 8, 6, 1.4, C.steel2); circ(x + 4, y - 0.4, 2, "#3A4450"); circ(x + w - 4, y - 0.4, 2, "#3A4450"); rect(x + 2, y - 20, w - 4, 3, "#DDE4EA"); rect(x + 5, y - 24, 4, 4, "#F28B82"); rect(x + 11, y - 23, 5, 3, "#81C995"); }
  function bin(x, y) { shade(x, y + 1, 6, 2, 0.2); g.fillStyle = "#6F8CA3"; g.beginPath(); g.moveTo(x - 5, y - 11); g.lineTo(x + 5, y - 11); g.lineTo(x + 4, y); g.lineTo(x - 4, y); g.fill(); rect(x - 6, y - 12.6, 12, 2.2, "#8CA9BF"); circ(x, y - 6, 1.6, "rgba(255,255,255,.7)"); }
  function toys(x, y) { rrect(x - 12, y - 8, 24, 8, 2, "#CFA66B"); rect(x - 10, y - 14, 5, 6, "#E5534B"); rect(x - 4, y - 12, 5, 4, "#3B82F6"); rect(x + 2, y - 15, 5, 7, "#F5B72E"); circ(x + 9, y - 12, 2.6, "#81C995"); }
  function bench(x, y, w, c) { shade(x + w / 2, y + 2, w * 0.6, 3, 0.22); rrect(x, y - 11, w, 6, 2.4, c); rrect(x, y - 19, w, 9, 3, shade_c(c, 14)); rect(x + 3, y - 5, 2, 6, C.steel3); rect(x + w - 5, y - 5, 2, 6, C.steel3); }

  /* ---------- 4 phòng: lớp sau, nhân viên, lớp trước ---------- */
  const BOXES = ["#F28B82", "#FDD663", "#81C995", "#8AB4F8", "#C58AF9", "#FCAD70", "#78D9EC", "#F6AEA9"];

  function room0(t, eq) {
    const th = THEME[0];
    wallAndFloor(th);
    windowFrame(14, 8, 44, 24);
    rect(14, 8, 7, 24, "rgba(245,183,46,.5)");
    led(76, 9, 46, 13, "A07", t);
    clock(139, 16, 7, t);
    rrect(158, 6, 30, 24, 2, "#FFFDF6"); srect(158, 6, 30, 24, 2, "rgba(0,0,0,.25)", 1);
    rect(171, 9, 4, 14, "#E5534B"); rect(166, 14, 14, 4, "#E5534B"); for (let i = 0; i < 3; i++) rect(162, 23 + i * 2.2 - 1.4, 22 - i * 4, 0.9, "#B9B3A3");
    /* kệ hồ sơ sau quầy */
    rect(88, 20, 40, 12, "#B7864C"); rect(88, 20, 40, 2, "#D6A867");
    for (let i = 0; i < 8; i++) rect(91 + i * 4.6, 23, 3.2, 9, BOXES[i % BOXES.length]);
    /* chậu cây, máy nước, thảm */
    plant(190, 96, 1.5);
    fancyRug(48, 112, 100, 22, "#2F6F8F", "#E8D9B0");
    /* máy nước uống bên trái */
    shade(24, 108, 10, 3, 0.22); rrect(17, 80, 14, 26, 2, "#F2F5F8"); rect(17, 80, 14, 3, "#DDE4EA"); rrect(19, 70, 10, 12, 4, "rgba(120,200,240,.7)"); circ(24, 88, 2, "#3B82F6"); rect(21, 96, 6, 2, "#94A3B2");
    /* vòi nước chảy khi có người đang rót nước */
    if (S.people.some(q => q.state === "drink" && q.wait > 90)) {
      const fl = 0.7 + 0.3 * Math.sin(t / 2.5);
      rect(23.4, 98, 1.2, 6 * fl, "rgba(120,200,240,.9)");
      circ(24, 104 + 2 * fl, 0.7, "rgba(255,255,255,.85)");
    }
    /* nhân viên đứng sau quầy */
    drawStaff(0, t);
    /* quầy tiếp đón */
    counter(44, 74, 120, 18, "#E3B070", "#B27A3E", "#8F5C2A");
    monitorPC(70, 68, true, t); rect(82, 66, 8, 2.4, "#FFFDF6"); circ(98, 66.6, 2.2, "#E5C14A"); rect(97.4, 63.6, 1.2, 2, "#B38B1E");
    rrect(108, 60, 7, 8, 1.4, "#E6F2F8"); rect(110, 58, 3, 2.4, "#3B82F6");
    rrect(124, 62, 12, 5.4, 1, "#FFFDF6"); rect(126, 63.4, 8, 0.8, "#B9B3A3"); rect(126, 65, 6, 0.8, "#B9B3A3");
    rrect(8, 118, 24, 14, 3, "#9C6B3E"); rect(11, 121, 18, 2, "rgba(255,255,255,.18)"); rect(11, 126, 18, 2, "rgba(255,255,255,.18)");
    toys(176, 138); bin(120, 140);
    if (eq >= 2) { monitorPC(146, 68, true, t + 40); }
    if (eq >= 3) { plant(158, 66, 0.7); }
    /* hàng ghế chờ */
    chair(150, 108, "#4C89D8", "#2F5FA8"); chair(168, 108, "#4C89D8", "#2F5FA8"); chair(186, 108, "#4C89D8", "#2F5FA8");
    rrect(158, 112, 24, 7, 2, "#CFA66B"); rect(163, 110, 14, 2, "#FFFDF6");
    if (eq >= 4) { rrect(120, 118, 26, 12, 4, "#6AA7D8"); rrect(120, 112, 26, 7, 4, "#8EC2EC"); }
    if (eq >= 5) { shade(22, 134, 12, 3, 0.25); rrect(14, 106, 18, 28, 2, "#E9EEF2"); srect(14, 106, 18, 28, 2, "rgba(0,0,0,.25)", 1); rect(16, 109, 14, 9, "#2B3440"); rect(18, 111, 10, 4, C.screenOn); rect(18, 122, 10, 2, "#8A97A5"); rect(19, 126, 8, 3, "#FFFDF6"); }
    if (eq >= 7) { rrect(164, 36, 26, 14, 2, "#10161C"); rect(166, 38, 22, 10, "#1B2A38"); g.font = "700 6px ui-monospace, Consolas, monospace"; g.textAlign = "center"; g.fillStyle = "#FFD27A"; g.fillText("QUẦY 1", 177, 45); }
  }
  function room1(t, eq) {
    const th = THEME[1];
    wallAndFloor(th);
    windowFrame(10, 8, 38, 22);
    for (let i = 0; i < 6; i++) rect(10, 10 + i * 3.6, 38, 1.4, "rgba(255,255,255,.6)");
    cabinetWall(56, 4, 30, 28, ["#F28B82", "#FDD663", "#81C995", "#8AB4F8", "#FFFDF6"]);
    ecg(96, 8, 34, 20, t);
    rrect(140, 6, 34, 24, 2, "#F8FBFF"); srect(140, 6, 34, 24, 2, "rgba(0,0,0,.35)", 1);
    g.strokeStyle = "rgba(120,140,160,.8)"; g.lineWidth = 1; g.beginPath(); g.arc(157, 18, 6, Math.PI, 0); g.stroke();
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(147 + i * 1.4, 14 + i * 2); g.lineTo(167 - i * 1.4, 14 + i * 2); g.stroke(); }
    line(157, 10, 157, 28, "rgba(120,140,160,.8)", 1);
    rect(0, 30, 6, 0, "#000");
    /* rèm ngăn */
    rect(0, 28, 70, 1.8, C.steel2);
    for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? "rgba(170,215,240,.8)" : "rgba(140,195,230,.8)"; g.fillRect(2 + i * 5, 30, 5, 36); }
    /* giường khám */
    bed(34, 76, 78, "#9CC3D6", "#FFFFFF", { rail: true });
    /* máy theo dõi cạnh giường */
    shade(124, 106, 8, 3, 0.2); rect(123, 78, 2, 26, C.steel2); rrect(116, 66, 18, 13, 2, "#2B3440"); rrect(117.4, 67.4, 15.2, 10.2, 1, "#0E1620");
    g.strokeStyle = "#3BE0A0"; g.lineWidth = 0.9; g.beginPath(); for (let i = 0; i < 14; i++) { const p = ((i * 2 + t * 0.8) % 16) / 16; const v = p > 0.4 && p < 0.5 ? -4 : p >= 0.5 && p < 0.58 ? 5 : 0; i ? g.lineTo(118 + i, 72.5 + v) : g.moveTo(118, 72.5 + v); } g.stroke();
    rect(119, 104, 12, 2, C.steel3);
    iv(30, 104, 30);
    trolley(52, 136, 28); bin(190, 140); stool(150, 130, "#6AA7D8");
    /* bàn bác sĩ */
    counter(132, 80, 60, 14, "#D9E2EC", "#9FB1C4", "#7C8FA5");
    monitorPC(150, 74, true, t); rrect(168, 70, 10, 7, 1, "#C9A065"); rect(170, 71.4, 6, 4, "#FFFDF6");
    g.strokeStyle = "#4C5967"; g.lineWidth = 1; g.beginPath(); g.arc(182, 73, 3.2, 0.2, Math.PI - 0.2); g.stroke(); circ(182, 77, 1.4, "#8A97A5");
    drawStaff(1, t);
    if (eq >= 2) { ecg(168, 38, 24, 14, t + 20, "#FF8A5B"); }
    if (eq >= 3) { cabinetWall(100, 36, 26, 24, ["#F28B82", "#FDD663", "#81C995", "#8AB4F8", "#FFFDF6"]); }
    if (eq >= 5) { shade(182, 138, 12, 3, 0.25); rrect(170, 104, 24, 18, 2, "#E5534B"); rect(170, 108, 24, 2, "#FFFFFF"); rect(176, 112, 12, 6, "#2B3440"); rect(178, 114, 8, 2, "#3BE0A0"); circ(174, 123, 2.4, "#34404C"); circ(190, 123, 2.4, "#34404C"); }
    if (eq >= 7) { shade(150, 128, 10, 3, 0.2); rect(148, 100, 4, 24, C.steel2); rrect(140, 88, 20, 14, 2, "#F2F5F8"); rect(142, 90, 16, 8, "#223042"); rect(144, 92, 8, 2, C.screenOn); circ(150, 124, 2.4, "#34404C"); }
  }
  function room2(t, eq) {
    const th = THEME[2];
    wallAndFloor(th);
    /* kệ thuốc dọc tường */
    rect(8, 28, 184, 3, "#C79A5E");
    rect(8, 14, 184, 3, "#C79A5E"); rect(8, 3, 184, 2, "#D6AE75");
    for (let r = 0; r < 2; r++) for (let i = 0; i < 34; i++) { const bx = 10 + i * 5.3; const h = 7 + ((i * 7 + r * 3) % 4); rect(bx, (r ? 28 : 14) - h, 4.2, h, BOXES[(i * 3 + r) % BOXES.length]); rect(bx, (r ? 28 : 14) - h, 4.2, 1.2, "rgba(255,255,255,.4)"); }
    for (let i = 0; i < 17; i++) { rrect(10 + i * 10.6, 6, 6, 8, 1.4, i % 2 ? "#9FD8EA" : "#F0C38C"); rect(11 + i * 10.6, 5, 4, 1.8, "#7A5A33"); }
    /* tủ lạnh vắc xin */
    shade(178, 73, 14, 3, 0.25); rrect(166, 22, 24, 50, 3, "#F4F7FA"); srect(166, 22, 24, 50, 3, "rgba(0,0,0,.22)", 1); rect(166, 42, 24, 1.4, "rgba(0,0,0,.2)"); rect(184, 30, 1.8, 10, C.steel2); rect(184, 48, 1.8, 14, C.steel2); rrect(169, 26, 10, 5, 1, "#10161C"); rect(170, 27.4, 7, 2, "#7FD6E8"); rect(168, 72, 3, 2, "#5E6B79"); rect(185, 72, 3, 2, "#5E6B79");
    /* băng xét nghiệm bên trái */
    counter(8, 82, 92, 16, "#EEF3F6", "#A9BCC8", "#8199A8");
    rrect(14, 70, 10, 11, 2, "#E6EDF2"); circ(19, 72, 4, "#C4D2DC"); rect(17.6, 66, 2.8, 5, "#8A97A5");
    for (let i = 0; i < 5; i++) { rect(48 + i * 3.4, 66, 2.4, 14, ["#F28B82", "#FDD663", "#81C995", "#8AB4F8", "#C58AF9"][i]); rect(48 + i * 3.4, 65, 2.4, 1.6, "#FFFDF6"); }
    rect(46, 78, 20, 2.4, "#8A97A5");
    const by = Math.sin(t / 14) * 1.2;
    g.fillStyle = "rgba(180,225,245,.7)"; g.beginPath(); g.moveTo(74, 66); g.lineTo(80, 66); g.lineTo(84, 80); g.lineTo(70, 80); g.fill(); rect(74, 70 + by, 6, 6, "rgba(90,200,150,.7)"); circ(77, 68 + by * 0.4, 0.9, "rgba(255,255,255,.8)");
    rrect(88, 64, 10, 16, 2, "#F2F5F8"); rect(90, 67, 6, 4, "#7FD6E8"); circ(93, 75, 1.4, "#E5534B");
    monitorPC(36, 76, true, t);
    drawStaff(2, t);
    fancyRug(40, 112, 60, 22, "#2E8F6B", "#EADFC0");
    stool(34, 118, "#5FBFA8"); trolley(140, 142, 30); bin(14, 140);
    /* quầy dược */
    counter(104, 86, 58, 14, "#F2E6CE", "#CBA66B", "#A07F45");
    rrect(112, 72, 13, 8, 1.4, "#FFFDF6"); rect(114, 74, 9, 1.2, "#B9B3A3"); rect(114, 76.6, 6, 1.2, "#B9B3A3");
    for (let i = 0; i < 2; i++) rrect(128 + i * 6, 74, 5, 6, 1.4, BOXES[i]);
    monitorPC(150, 80, true, t + 30);
    if (eq >= 2) { shade(34, 124, 14, 4, 0.25); rrect(18, 100, 28, 34, 2, "#EEF3F6"); srect(18, 100, 28, 34, 2, "rgba(0,0,0,.25)", 1); rect(21, 104, 22, 24, "#BFE3F2"); rect(32, 104, 1, 24, "rgba(255,255,255,.7)"); rect(24, 116, 16, 1, "rgba(0,0,0,.2)"); rect(44, 112, 1.6, 8, C.steel2); }
    if (eq >= 3) { shade(124, 130, 12, 3, 0.2); rrect(112, 112, 24, 16, 2, "#F2F5F8"); rect(115, 115, 18, 8, "#223042"); rect(117, 117, 10, 2, C.screenOn); rect(117, 120, 6, 1.4, "#FFB84D"); }
    if (eq >= 5) { shade(168, 138, 10, 3, 0.2); rect(165, 114, 14, 20, "#FFFDF6"); rect(165, 114, 14, 2, "#CBA66B"); rect(168, 120, 8, 1, "#B9B3A3"); rect(168, 124, 8, 1, "#B9B3A3"); for (let i = 0; i < 3; i++) rect(166 + i * 4.4, 108, 3.4, 6, BOXES[i + 2]); }
    if (eq >= 7) { rrect(70, 70, 14, 10, 2, "#C4D2DC"); circ(77, 75, 3, "#8A97A5"); rect(40, 70, 22, 3, "#E5534B"); }
  }
  function room3(t, eq) {
    const th = THEME[3];
    wallAndFloor(th, eq, 300);
    windowFrame(146, 8, 40, 22, "garden");
    clock(18, 16, 7, t);
    g.save(); g.translate(-70, 0);
    rrect(140, 8, 40, 22, 2, "#FFFDF6"); srect(140, 8, 40, 22, 2, "rgba(0,0,0,.25)", 1);
    g.fillStyle = "#F7C6D4"; g.beginPath(); g.moveTo(160, 24); g.bezierCurveTo(146, 15, 152, 10, 160, 15); g.bezierCurveTo(168, 10, 174, 15, 160, 24); g.fill();
    g.restore();
    ecg(40, 10, 28, 16, t + 7, "#FF6B8B");
    /* hai giường hồi phục */
    bed(14, 66, 74, "#9CC3D6", "#FFFFFF", { rail: true });
    bed(104, 66, 74, "#A9C9BE", "#FFFFFF", { rail: true });
    iv(94, 98, 32); iv(190, 92, 30);
    rrect(88, 84, 12, 13, 2, "#E2C197"); rect(88, 89, 12, 1.2, "rgba(0,0,0,.18)"); circ(94, 82, 2.6, "#F4B6C6"); rect(93.4, 78, 1.2, 4, "#4FA356");
    /* nhân viên + bàn điều dưỡng */
    drawStaff(3, t);
    counter(124, 112, 70, 14, "#F6E6D8", "#D4A98A", "#B3866A");
    monitorPC(146, 106, true, t + 20); rrect(166, 100, 10, 7, 1, "#C9A065"); rect(168, 101.4, 6, 4, "#FFFDF6"); circ(184, 104, 2.4, "#E5534B");
    fancyRug(20, 118, 56, 20, "#A9505C", "#F1E2D2");
    bench(96, 142, 50, "#C9A065"); plant(158, 140, 1); trolley(14, 148, 26);
    if (eq >= 2) { shade(150, 40, 0, 0, 0); rrect(130, 36, 24, 14, 2, "#10161C"); rect(132, 38, 20, 10, "#4B5A6A"); rect(136, 40, 8, 6, "#7FD6E8"); }
    if (eq >= 3) { shade(8, 136, 8, 3, 0.22); rrect(3, 100, 9, 34, 3, "#4C8FD8"); rect(5, 96, 5, 5, C.steel2); circ(7.5, 112, 2, "#FFFDF6"); }
    if (eq >= 5) { wheelchair(60, 136); plant(188, 84, 1); }
    if (eq >= 7) { cabinetWall(162, 40, 26, 22, ["#8FD0B0", "#FFFDF6", "#F7C6D4", "#8AB4F8"]); }
    if (eq >= 9) { rrect(60, 34, 14, 8, 2, "#BFE6C3"); circ(67, 36, 4, "#6DB563"); }
    /* phần mở rộng (x 200–300): khu nhiều giường, góc tiêm chủng, thiết bị, đồ chơi và trang trí */
    fancyRug(214, 116, 66, 16, "#7FB8C9", "#F1E2D2");
    bed(206, 66, 70, "#B6D7E8", "#FFFFFF", { rail: true });
    iv(282, 98, 30);
    rrect(272, 84, 12, 13, 2, "#E2C197"); rect(272, 89, 12, 1.2, "rgba(0,0,0,.18)"); circ(278, 82, 2.6, "#F4B6C6");
    rrect(232, 12, 24, 16, 1.5, "#FFF4D6"); srect(232, 12, 24, 16, 1.5, "rgba(0,0,0,.25)", 1);
    circ(244, 20, 3.2, "#F28B82"); circ(252, 22, 2.4, "#81C995");
    counter(214, 132, 50, 12, "#F6E6D8", "#D4A98A", "#B3866A");
    cabinetWall(270, 40, 22, 20, ["#8FD0B0", "#FFFDF6", "#F7C6D4"]);
    bin(224, 146);
    monitorPC(282, 128, true, t + 40);
    toys(288, 146);
  }
  function room4(t, eq) {
    const th = THEME[4];
    wallAndFloor(th);
    windowFrame(14, 8, 40, 22, "garden");
    rrect(70, 6, 18, 28, 2, "#FFFDF6"); srect(70, 6, 18, 28, 2, "rgba(0,0,0,.3)", 1);
    for (let i = 0; i < 6; i++) rect(72, 10 + i * 4, i % 2 ? 6 : 9, 1, "#8B5CF6");
    circ(82, 24, 4, "#C79A5E"); circ(79.4, 20.4, 1.6, "#C79A5E"); circ(84.6, 20.4, 1.6, "#C79A5E");
    rrect(98, 8, 36, 22, 2, "#FFFFFF"); srect(98, 8, 36, 22, 2, "rgba(0,0,0,.3)", 1);
    rect(104, 17, 22, 3, "#DDE6EE"); rect(100, 16, 4, 5, C.steel2); rect(126, 18, 8, 1, C.steel2); rect(110, 17.4, 9, 2.2, "#8B5CF6");
    clock(160, 16, 7, t);
    bed(10, 72, 56, "#C9C0E6", "#FFFFFF", { rail: true });
    fancyRug(16, 112, 64, 24, "#7C5CC4", "#F6EEC8"); toys(50, 134);
    counter(112, 72, 76, 14, "#F2ECFF", "#C8B8F0", "#A895E0");
    monitorPC(134, 66, true, t); rrect(160, 62, 10, 7, 1, "#C9A065"); rect(162, 63.4, 6, 4, "#FFFDF6");
    rect(172, 60, 3, 9, "#F6F2EA"); rect(171, 58, 5, 3, "#8B5CF6");
    drawStaff(4, t);
    bench(100, 144, 50, "#B9A6F0"); plant(188, 142, 1); trolley(160, 144, 28);
    if (eq >= 2) { rrect(112, 36, 24, 14, 2, "#10161C"); rect(114, 38, 20, 10, "#4B5A6A"); rect(118, 40, 8, 6, "#7FD6E8"); }
    if (eq >= 3) { cabinetWall(146, 36, 24, 24, ["#B9A6F0", "#FFFDF6", "#F3A6C0", "#8AB4F8"]); }
    if (eq >= 5) { shade(186, 112, 8, 3, 0.2); rrect(176, 40, 20, 30, 3, "#F4F7FA"); srect(176, 40, 20, 30, 3, "rgba(0,0,0,.22)", 1); rect(176, 54, 20, 1.2, "rgba(0,0,0,.2)"); rect(191, 46, 1.6, 6, C.steel2); }
    if (eq >= 7) { for (let i = 0; i < 5; i++) circ(100 + i * 16, 4 + (i % 2) * 5, 3, ["#F28B82", "#FDD663", "#81C995", "#8AB4F8", "#C4A8F5"][i]); }
    if (eq >= 9) { wheelchair(70, 144); }
  }
  function room5(t, eq) {
    const th = THEME[5];
    wallAndFloor(th);
    for (let i = 0; i < 2; i++) { rrect(14 + i * 26, 8, 20, 24, 2, "#FFFDF6"); srect(14 + i * 26, 8, 20, 24, 2, "rgba(0,0,0,.3)", 1); rect(18 + i * 26, 13, 12, 1.4, "#8A97A5"); rect(18 + i * 26, 17, 12, 1.4, "#8A97A5"); circ(24 + i * 26, 25, 3.2, "#C0392B"); }
    led(108, 8, 46, 18, "HS-025", t);
    clock(172, 16, 7, t);
    for (let i = 0; i < 2; i++) {
      const x = 8 + i * 22;
      rrect(x, 40, 18, 46, 2, "#B8C2CC"); srect(x, 40, 18, 46, 2, "rgba(0,0,0,.28)", 1);
      for (let k = 0; k < 3; k++) { rect(x + 2, 43 + k * 14, 14, 11, "#CBD3DB"); rect(x + 6, 47 + k * 14, 6, 1.6, C.steel3); }
    }
    shade(50, 90, 40, 3, 0.2);
    counter(112, 70, 76, 14, "#E8E0CC", "#BFAE86", "#9A8858");
    monitorPC(130, 64, true, t); monitorPC(152, 64, true, t + 30);
    rrect(168, 58, 16, 10, 2, "#E6EAEE"); rect(171, 54, 10, 5, "#FFFDF6"); rect(171, 62, 10, 1.2, "#8A97A5");
    drawStaff(5, t);
    fancyRug(16, 112, 64, 24, "#8A6A2E", "#EFE2BE");
    bench(96, 144, 50, "#C9A065"); plant(188, 142, 1); bin(10, 144);
    if (eq >= 2) { for (let i = 0; i < 2; i++) { const x = 100 + i * 22; rrect(x, 100, 18, 40, 2, "#B8C2CC"); srect(x, 100, 18, 40, 2, "rgba(0,0,0,.28)", 1); for (let k = 0; k < 3; k++) rect(x + 2, 103 + k * 12, 14, 9, "#CBD3DB"); } }
    if (eq >= 3) { rrect(10, 96, 28, 14, 2, "#8A6A48"); rect(12, 98, 24, 3, "#A67C4A"); rect(14, 104, 10, 4, "#F7ECD2"); }
    if (eq >= 5) { rrect(150, 100, 22, 22, 2, "#2B3440"); rect(152, 102, 18, 14, C.screenOn); rect(154, 105, 10, 1.2, "rgba(255,255,255,.7)"); rect(154, 108, 12, 1.2, "rgba(255,255,255,.7)"); }
    if (eq >= 7) { rrect(60, 100, 24, 14, 2, "#F2F5F8"); srect(60, 100, 24, 14, 2, "rgba(0,0,0,.28)", 1); line(64, 104, 80, 104, C.steel2, 1); line(64, 108, 78, 108, C.steel2, 1); }
  }
  function room6(t, eq) {
    const th = THEME[6];
    wallAndFloor(th);
    windowFrame(14, 8, 40, 22, "garden");
    rrect(66, 6, 36, 26, 2, "#FFFDF6"); srect(66, 6, 36, 26, 2, "rgba(0,0,0,.3)", 1);
    circ(76, 20, 4, "#F5C99B"); circ(84, 20, 4.6, "#E7A57A"); circ(92, 22, 3, "#F5C99B"); rect(72, 25, 24, 1.4, "#F97316");
    rrect(112, 8, 30, 22, 2, "#2B3440"); rect(114, 10, 26, 18, "#12202B"); g.strokeStyle = "#7FD6E8"; g.lineWidth = 1; g.beginPath(); g.arc(127, 22, 8, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); circ(127, 18, 2.6, "#CFEAF2");
    clock(162, 16, 7, t);
    bed(12, 72, 70, "#E8C3A8", "#FFFFFF", { rail: true });
    shade(98, 106, 10, 3, 0.2); rrect(88, 80, 22, 16, 2, "#F2F5F8"); rect(90, 82, 18, 8, "#223042"); rect(92, 84, 8, 2, C.screenOn); rect(98, 96, 3, 10, C.steel2); circ(94, 108, 2.2, "#34404C"); circ(106, 108, 2.2, "#34404C");
    fancyRug(18, 112, 64, 24, "#D9703A", "#FBEBD0"); toys(48, 134);
    counter(120, 76, 68, 14, "#FDF0E4", "#EBC3A2", "#CE9B77");
    monitorPC(140, 70, true, t); rrect(162, 66, 10, 7, 1, "#C9A065"); rect(164, 67.4, 6, 4, "#FFFDF6");
    drawStaff(6, t);
    bench(100, 144, 50, "#F0B38E"); plant(188, 142, 1); trolley(160, 144, 28);
    if (eq >= 2) { rrect(112, 38, 24, 12, 2, "#10161C"); rect(114, 40, 20, 8, "#4B5A6A"); rect(118, 42, 8, 4, "#7FD6E8"); }
    if (eq >= 3) { cabinetWall(142, 36, 22, 24, ["#F8B58A", "#FFFDF6", "#F5C99B", "#8AB4F8"]); }
    if (eq >= 5) { rrect(170, 40, 20, 26, 3, "#F4F7FA"); srect(170, 40, 20, 26, 3, "rgba(0,0,0,.22)", 1); rect(170, 52, 20, 1.2, "rgba(0,0,0,.2)"); }
    if (eq >= 7) { rrect(40, 8, 20, 22, 2, "#FFFDF6"); circ(50, 18, 5, "#F5C99B"); circ(50, 25, 3, "#E7A57A"); }
    if (eq >= 9) { wheelchair(70, 144); }
  }
  function room7(t, eq) {
    const th = THEME[7];
    wallAndFloor(th);
    windowFrame(4, 8, 32, 22, "garden");
    g.save(); g.translate(-22, 0);
    circ(70, 18, 11, "#FFFDF6"); circ(70, 18, 9, "#E5534B"); circ(70, 18, 6.4, "#FFFDF6"); line(64, 24, 76, 12, "#E5534B", 2); rect(60, 16, 6, 2, "#8A5A10"); rect(72, 17.4, 4, 2, "#4B5563");
    g.restore();
    g.save(); g.translate(24, 0);
    rrect(88, 6, 26, 26, 2, "#FFFDF6"); srect(88, 6, 26, 26, 2, "rgba(0,0,0,.3)", 1);
    g.fillStyle = "#E5534B"; g.beginPath(); g.moveTo(101, 12); g.bezierCurveTo(95, 14, 96, 20, 101, 22); g.bezierCurveTo(106, 20, 107, 14, 101, 12); g.fill(); line(101, 22, 96, 28, "#E5534B", 2); line(101, 22, 106, 28, "#E5534B", 2);
    g.restore();
    g.save(); g.translate(16, 0);
    rrect(124, 8, 34, 22, 2, "#FFFDF6"); srect(124, 8, 34, 22, 2, "rgba(0,0,0,.3)", 1);
    rect(128, 14, 26, 1.4, "#8A97A5"); rect(128, 19, 26, 1.4, "#8A97A5"); rect(128, 24, 16, 1.4, "#8A97A5");
    g.restore();
    clock(186, 16, 7, t);
    shade(44, 98, 20, 4, 0.22); rrect(14, 62, 56, 34, 3, "#F2F5F8"); srect(14, 62, 56, 34, 3, "rgba(0,0,0,.25)", 1);
    rrect(18, 66, 48, 18, 2, "#CFE9F1"); rect(18, 66, 48, 3, "#9FCBD9"); rect(18, 86, 48, 6, "#B8C2CC");
    circ(26, 76, 3, "#E5534B"); rect(34, 74, 20, 1.4, "rgba(0,0,0,.25)"); rect(34, 78, 14, 1.4, "rgba(0,0,0,.25)");
    shade(160, 104, 12, 3, 0.2); rrect(146, 78, 26, 22, 3, "#E5534B"); rect(146, 83, 26, 1.6, "#FFFFFF"); rect(157, 87, 4, 9, "#FFFFFF"); rect(154.5, 89.5, 9, 4, "#FFFFFF"); rrect(150, 74, 18, 5, 2, "#C0392B");
    counter(100, 106, 60, 14, "#EAF4F6", "#A9CBD6", "#7FA8B6");
    monitorPC(118, 100, true, t); rrect(138, 96, 10, 7, 1, "#C9A065"); rect(140, 97.4, 6, 4, "#FFFDF6");
    drawStaff(7, t);
    bench(10, 144, 56, "#7FB6C6"); plant(188, 142, 1); bin(176, 146);
    if (eq >= 2) { rrect(168, 56, 22, 26, 3, "#F4F7FA"); srect(168, 56, 22, 26, 3, "rgba(0,0,0,.22)", 1); rect(168, 66, 22, 1.2, "rgba(0,0,0,.2)"); }
    if (eq >= 3) { rrect(80, 118, 26, 8, 2, "#F6F2EA"); rect(84, 121, 18, 2, "#8A97A5"); }
    if (eq >= 5) { rrect(90, 36, 20, 12, 2, "#10161C"); rect(92, 38, 16, 8, "#4B5A6A"); rect(95, 40, 6, 4, "#7FD6E8"); }
    if (eq >= 7) { trolley(96, 148, 28); }
  }
  const ROOM_FN = [room0, room1, room2, room3, room4, room5, room6, room7];

  /* phụ tá: người thứ hai và thứ ba đứng làm việc trong phòng khi nhân viên lên cấp 4 và 7 */
  function drawAssistants(r, t) {
    const lv = S.st[r], n = lv >= 7 ? 2 : lv >= 4 ? 1 : 0;
    for (let k = 0; k < n; k++) {
      const [ax, ay] = ASSIST_AT[r][k], lx = ax - ROOMS[r].x, ly = ay - ROOMS[r].y;
      pPerson(lx, ly, ASSIST_LOOK[(r + k) % ASSIST_LOOK.length], { walk: -1, staff: true, work: k === 0, face: "n", blink: ((t + k * 40) % 170) < 5, talk: k === 1 && ((t / 30) | 0) % 4 === 0 }, PSCALE);
    }
  }

  /* ---------- phòng đang xây (chưa mở rộng) ---------- */
  function construction(i, t) {
    const th = THEME[i];
    rect(0, 0, RW, RH, "#D8D2C6");
    rect(0, 0, RW, 46, "#E7E2D8");
    for (let x = 0; x < RW; x += 20) rect(x, 0, 1, 46, "rgba(0,0,0,.10)");
    tiles(0, 46, RW, RH - 46, 24, "#CFC9BD", "#C6C0B3");
    g.fillStyle = lg(0, 46, 0, 62, [[0, "rgba(40,28,10,.22)"], [1, "rgba(40,28,10,0)"]]); g.fillRect(0, 46, RW, 16);
    /* giàn giáo */
    for (const x of [20, 70, 120, 170]) { rect(x, 14, 3, 118, "#E8B923"); rect(x, 14, 1, 118, "rgba(255,255,255,.4)"); }
    for (const y of [34, 70, 106]) { rect(20, y, 153, 3, "#C99A12"); rect(20, y + 3, 153, 1, "rgba(0,0,0,.2)"); }
    for (const [x, y] of [[26, 34], [76, 70], [126, 34], [96, 106]]) rect(x, y - 3, 34, 3, "#B98B55");
    /* xô sơn, nón, bao xi măng */
    rrect(150, 118, 14, 12, 2, "#E5534B"); rect(150, 121, 14, 2, "rgba(255,255,255,.5)");
    rrect(30, 124, 22, 12, 2, "#B9B2A4"); rect(30, 128, 22, 1.4, "rgba(0,0,0,.2)");
    g.fillStyle = "#F5841F"; g.beginPath(); g.moveTo(102, 136); g.lineTo(108, 118); g.lineTo(114, 136); g.closePath(); g.fill(); rect(104, 126, 8, 2, "#FFFFFF");
    /* bản vẽ */
    rrect(138, 52, 40, 28, 2, "#2F6F8F"); srect(138, 52, 40, 28, 2, "#EADFC0", 1);
    g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 0.8; g.strokeRect(144, 58, 14, 10); g.strokeRect(160, 58, 12, 16); g.beginPath(); g.moveTo(144, 74); g.lineTo(156, 74); g.stroke();
    /* băng cảnh báo chéo */
    g.save(); g.beginPath(); g.rect(0, 0, RW, RH); g.clip(); g.translate(RW / 2, RH / 2); g.rotate(-0.28);
    for (let x = -150; x < 150; x += 16) { rect(x, -7, 8, 14, "#F2C230"); rect(x + 8, -7, 8, 14, "#2A2018"); }
    g.restore();
    g.fillStyle = "rgba(30,22,14,.18)"; g.fillRect(0, 0, RW, RH);
  }

  /* ---------- nhân viên ---------- */
  function drawStaff(i, t) {
    const [sx, sy] = STAFF_AT[i];
    const lx = sx - ROOMS[i].x, ly = sy - ROOMS[i].y;
    const near = S.people.some(p => p.slot === 0 && p.room === i && p.state === "wait");
    const talk = near && ((t / 22) | 0) % 3 !== 2;
    pPerson(lx, ly, STAFF_LOOK[i], { walk: -1, staff: true, work: !near, face: near ? "s" : "n", blink: (t % 160) < 5, talk }, PSCALE);
  }
  /* người nằm trên giường: đầu trên gối, vai nhô khỏi chăn; (hx, hy) là tâm đầu */
  function lyingPatient(look, hx, hy) {
    const skin = look.skin || SKIN[0];
    rrect(hx + 4, hy - 1, 14, 9, 4, look.shirt || "#6B8E7B");
    circ(hx, hy, 6.2, skin);
    g.fillStyle = look.hair || "#2A1D16"; g.beginPath(); g.arc(hx, hy, 6.4, Math.PI, Math.PI * 2); g.fill();
    line(hx - 3.2, hy + 1.4, hx - 1.2, hy + 1.4, "#3B2A1E", 0.8);
    line(hx + 1.2, hy + 1.4, hx + 3.2, hy + 1.4, "#3B2A1E", 0.8);
  }
  /* cốc nước đầy theo tỷ lệ fill (0..1) */
  function drawCup(x, y, fill) {
    rrect(x - 2.6, y - 4, 5.2, 6, 1.2, "#F7FBFF");
    rrect(x - 2.2, y - 4 + (1 - fill) * 4.6, 4.4, Math.max(0.01, fill * 4.6), 0.8, "#5BB8E8");
    srect(x - 2.6, y - 4, 5.2, 6, 1.2, "rgba(0,0,0,.25)", 0.6);
  }
  /* người đang lấy nước: rót ở vòi (đếm 200→91), rồi đưa cốc lên miệng uống (90→0) */
  function drawDrinker(p) {
    const left = p.wait;
    if (left > 90) {
      drawCup(26, 108, Math.min(1, (200 - left) / 60));
    } else {
      const u = (90 - left) / 90;
      const k = Math.sin(u * Math.PI);
      drawCup(p.x + 3 + 2 * k, p.y - 18 - 6 * k, 1 - u * 0.8);
    }
  }
  function pPerson(x, y, look, pose, k) {
    g.save(); g.translate(x, y); g.scale(k, k); g.translate(-x, -y);
    const wc = !!look.wheelchair;
    if (wc) {
      const moving = pose.walk > 0, spin = moving ? x * 0.5 : 0;
      for (const sx of [-1, 1]) {
        elp(x + sx * 7.4, y - 7, 1.7, 7.2, "#2B3440"); elp(x + sx * 7.4, y - 7, 0.8, 5.4, "#8A97A5");
        g.strokeStyle = "rgba(220,230,240,.8)"; g.lineWidth = .5; g.beginPath(); g.moveTo(x + sx * 7.4, y - 7 + Math.sin(spin) * 5); g.lineTo(x + sx * 7.4, y - 7 - Math.sin(spin) * 5); g.stroke();
      }
      rect(x - 5.6, y - 12, 11.2, 1.6, "#4B5563"); rect(x - 5, y - 24, 1.4, 12, "#4B5563"); rect(x + 3.6, y - 24, 1.4, 12, "#4B5563");
      pose = Object.assign({}, pose, { sit: true, walk: -1, dir: 0 });
    }
    pose = Object.assign({}, pose, { gait: speedMul(look) });
    try { drawPersonPixel(x, y, look, pose); } catch (e) { /* bộ vẽ người chưa sẵn sàng */ }
    if (wc) { rect(x - 7.2, y - 19, 1.8, 6, "#4B5563"); rect(x + 5.4, y - 19, 1.8, 6, "#4B5563"); }
    g.restore();
  }

  /* ---------- vách ngăn và cửa ---------- */
  /* thảm trang trí: viền kép, hoa văn thoi, tua rua hai đầu, đổ bóng nhẹ */
  function fancyRug(x, y, w, h, base, trim) {
    rrect(x + 1, y + 2, w, h, 3, "rgba(60,40,20,.20)");
    rrect(x, y, w, h, 3, base);
    g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(x + 1, y + 1, w - 2, h * 0.4);
    srect(x + 2, y + 2, w - 4, h - 4, 2, trim, 1.2);
    if (w > 18 && h > 12) srect(x + 4.6, y + 4.6, w - 9.2, h - 9.2, 1.2, "rgba(255,255,255,.34)", 0.7);
    const n = Math.max(1, Math.floor((w - 12) / 15)), cy = y + h / 2, r = Math.min(h * 0.26, 6);
    if (w > 22 && h > 14) for (let i = 0; i < n; i++) {
      const cx = x + w * (i + 0.5) / n;
      g.fillStyle = trim; g.beginPath(); g.moveTo(cx, cy - r); g.lineTo(cx + r * 1.25, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r * 1.25, cy); g.closePath(); g.fill();
      g.fillStyle = base; g.beginPath(); g.moveTo(cx, cy - r * 0.45); g.lineTo(cx + r * 0.6, cy); g.lineTo(cx, cy + r * 0.45); g.lineTo(cx - r * 0.6, cy); g.closePath(); g.fill();
    }
    if (h > 10) for (let k = 0; k < Math.floor(h / 2.6); k++) { const yy = y + 1.4 + k * 2.6; rect(x - 1.6, yy, 1.6, 1, trim); rect(x + w, yy, 1.6, 1, trim); }
  }
  /* thảm trải lối đi qua tường (thay cho cửa) */
  function rugH(x0, w, top, bot, c1, c2) {
    /* sàn hành lang liền qua tường, hai đầu có thảm chùi chân */
    tiles(x0, top + 3, w, bot - top - 3, 8, "#EEE8DB", "#E2DACB");
    g.fillStyle = "rgba(60,40,20,.10)"; g.fillRect(x0, top + 3, 3, bot - top - 3); g.fillRect(x0 + w - 3, top + 3, 3, bot - top - 3);
    for (const y of [top - 13, bot - 13]) fancyRug(x0 + 1, y, w - 2, 12, c1, "#EADFC0");
  }
  function rugV(xv, a, b) {
    fancyRug(xv - 18, a + 4, 14, b - a - 8, "#2F6F8F", "#EADFC0");
    fancyRug(xv + 4, a + 4, 14, b - a - 8, "#2F6F8F", "#EADFC0");
  }
  function walls(t) {
    const WC = "#4A3A2C", WT = "#6B5640";
    const vc = viewCols();
    /* tường đứng: [x, y đầu, y cuối, các ô cửa, có hiện không] */
    const VW = [
      [200, 0, HH, [[96, 130], [246, 280]], true],
      [400, 0, 150, [[96, 130]], vc >= 3],
      [500, 150, HH, [[246, 280]], true],
      [600, 0, 150, [[96, 130]], vc >= 3],
      [700, 150, HH, [[246, 280]], vc >= 3],
      [800, 0, 150, [], vc >= 4],
      [900, 150, HH, [], vc >= 4]
    ];
    for (const [xv, y0s, y1s, gaps, show] of VW) {
      if (!show) continue;
      let y0 = y0s;
      for (const [a, b] of gaps.concat([[y1s, y1s]])) { if (a > y0) { rect(xv - 3, y0, 6, a - y0, WC); rect(xv - 3, y0, 2, a - y0, WT); } y0 = b; }
      for (const [a, b] of gaps) { rugV(xv, a, b); rect(xv - 6, a - 2, 12, 3, "#8A6A48"); rect(xv - 6, b - 1, 12, 3, "#8A6A48"); }
    }
    /* tường ngang y=150, có các ô cửa nối hai hàng phòng */
    const hgaps = [[60, 100], [300, 340], [520, 560], [730, 770]].filter(([a, b]) => b < HW);
    let x0 = 0;
    for (const [a, b] of hgaps.concat([[HW, HW]])) { if (a > x0) { rect(x0, 147, a - x0, 6, WC); rect(x0, 147, a - x0, 2, WT); } x0 = b; }
    for (const [a, b] of hgaps) rugH(a + 4, b - a - 8, 150, 196, "#2F6F8F", "#EADFC0");
    for (const [a, b] of hgaps) { rect(a - 2, 144, 3, 12, "#8A6A48"); rect(b - 1, 144, 3, 12, "#8A6A48"); }
    /* viền ngoài: lối vào ở trái trên, lối ra ở trái dưới */
    rect(0, 0, vc >= 4 ? 800 : 600, 2.4, WC); rect(0, HH - 3, HW, 3, WC);
    rect(0, 0, 3, 94, WC); rect(0, 130, 3, 116, WC); rect(0, 280, 3, HH - 280, WC);
    rect(0, 92, 6, 3, "#8A6A48"); rect(0, 128, 6, 3, "#8A6A48");
    rect(0, 244, 6, 3, "#8A6A48"); rect(0, 278, 6, 3, "#8A6A48");
    g.fillStyle = "rgba(255,240,200,.35)"; g.fillRect(3, 95, 6, 33); g.fillRect(3, 247, 6, 33);
  }

  /* ---------- người và đường đi ---------- */
  function slotFree(room, k) { return !S.people.some(p => p.room === room && p.slot === k && (p.state === "wait" || p.state === "walk" && p.destSlot === k)); }
  function makePerson(look, role) {
    return { id: S.nextId++, look, role, x: NODES.out[0], y: NODES.out[1], path: [], state: "idle", wait: 0, icon: null, room: -1, slot: -1, destSlot: -1, hop: 0, face: "n", seed: Math.random() * 100 };
  }
  function setPath(p, nodes) { p.path = nodes.map(n => ({ x: NODES[n][0], y: NODES[n][1] })); p.state = "walk"; }
  /* khoảng cách theo đường đi từ mọi nút tới một đích */
  function distancesTo(dest) {
    const d = { [dest]: 0 }, todo = new Set(Object.keys(NODES));
    while (todo.size) {
      let u = null;
      for (const n of todo) if (d[n] !== undefined && (u === null || d[n] < d[u])) u = n;
      if (u === null) break;
      todo.delete(u);
      for (const v of ADJ[u] || []) {
        const nd = d[u] + dist(u, v);
        if (d[v] === undefined || nd < d[v]) d[v] = nd;
      }
    }
    return d;
  }
  /* điểm bắt đầu: nút có tổng (đi bộ tới nút + đường đi tới đích) nhỏ nhất.
     Tránh chọn nút ở phía sau người đi, nên không phải quay lại. */
  function startNodeFor(p, dest) {
    const D = distancesTo(dest);
    let best = null, bc = Infinity;
    for (const k in NODES) {
      if (D[k] === undefined) continue;
      const c = Math.hypot(NODES[k][0] - p.x, NODES[k][1] - p.y) + D[k];
      if (c < bc) { bc = c; best = k; }
    }
    return best || nearestNode(p);
  }
  /* mỗi phòng chỉ nhận một bệnh nhân tại một thời điểm; người khác đứng đợi ở lối vào */
  const QUEUE_SPOTS = [[10, 96], [10, 138], [40, 138]];
  function roomBusy(r, self) {
    return S.people.some(q => q !== self && q.state !== "gone" && q.state !== "leave" &&
      ((q.room === r && (q.state === "wait" || q.state === "react")) || (q.state === "walk" && q.destRoom === r)));
  }
  function freeRooms(from) { const out = []; for (let r = 0; r < nRooms(); r++) if (r !== from && !roomBusy(r, null)) out.push(r); return out; }
  function freeQueueSpot() {
    for (const sp of QUEUE_SPOTS) if (!S.people.some(q => q.state !== "gone" && q.state !== "leave" && Math.hypot(q.x - sp[0], q.y - sp[1]) < 10)) return sp;
    return null;
  }
  /* đi lấy nước uống ở máy nước */
  function toDrink(p) {
    p.room = -1; p.slot = -1; p.destRoom = -2; p.destSlot = -1;
    setPath(p, route(startNodeFor(p, "wc"), "wc"));
  }
  function toQueue(p, sp) {
    p.destRoom = -1; p.destSlot = -1;
    setPath(p, route(startNodeFor(p, "e0"), "e0"));
    p.path.push({ x: sp[0], y: sp[1] });
  }
  function toRoom(p, room, slot) {
    const dest = SLOT_NODE[room][slot], from = startNodeFor(p, dest);
    const nodes = route(from, dest);
    p.destSlot = slot; p.destRoom = room;
    setPath(p, nodes);
    p.path.push({ x: SLOTS[room][slot][0], y: SLOTS[room][slot][1] });
  }
  function toExit(p) {
    const from = startNodeFor(p, "exo");
    const nodes = route(from, "exo");
    p.path = nodes.map(n => ({ x: NODES[n][0], y: NODES[n][1] })); p.state = "leave"; p.slot = -1; p.room = -1; p.icon = null; p.lie = false;
  }
  function nearestNode(p) {
    let best = "out", bd = 1e9;
    for (const k in NODES) { const d = Math.hypot(NODES[k][0] - p.x, NODES[k][1] - p.y); if (d < bd) { bd = d; best = k; } }
    return best;
  }
  /* tránh chồng lên nhau: đẩy nhẹ ra khỏi người khác, nhân viên và phụ tá đang đứng */
  function separate(p) {
    if (p.noSep > 0) { p.noSep--; return; }
    const end = p.path.length ? p.path[p.path.length - 1] : null;
    if (end && Math.hypot(end.x - p.x, end.y - p.y) < 14) return;   /* sắp tới chỗ thì không bị đẩy ra */
    const push = (ox, oy, rad) => {
      const dx = p.x - ox, dy = p.y - oy, d = Math.hypot(dx, dy);
      if (d < rad && d > 0.01) { const f = Math.min(0.45, (rad - d) * 0.2); p.x += dx / d * f; p.y += dy / d * f * 0.7; }
    };
    for (const q of S.people) {
      if (q === p || q.state === "gone") continue;
      if (p.isCase && !q.isCase) continue;                           /* bệnh nhân của ca có quyền đi trước */
      const stationary = q.state === "wait" || q.state === "react" || q.state === "drink";
      if (stationary || q.id < p.id || q.isCase) push(q.x, q.y, 11);  /* người đến sau nhường người đến trước */
    }
    const n = nRooms();
    for (let i = 0; i < n; i++) {
      push(STAFF_AT[i][0], STAFF_AT[i][1], 13);
      const as = S.st[i] >= 7 ? 2 : S.st[i] >= 4 ? 1 : 0;
      for (let k = 0; k < as; k++) push(ASSIST_AT[i][k][0], ASSIST_AT[i][k][1], 13);
    }
  }
  /* gỡ kẹt: đứng yên quá lâu khi còn đường đi thì nhảy tới điểm kế và bỏ qua tránh nhau một lúc */
  function unstick(p) {
    p.sx = p.sx === undefined ? p.x : p.sx; p.sy = p.sy === undefined ? p.y : p.sy; p.sk = (p.sk || 0) + 1;
    if (p.sk < 60) return;
    if (Math.hypot(p.x - p.sx, p.y - p.sy) < 2.5 && p.path.length) { const t = p.path.shift(); p.x = t.x; p.y = t.y; p.noSep = 150; }
    p.sx = p.x; p.sy = p.y; p.sk = 0;
  }
  function stepPerson(p) {
    if (p.state === "walk" || p.state === "leave") {
      let sp = (p.isCase ? 1.15 : 0.8) * speedMul(p.look) * strideMul(p.look);
      while (sp > 0 && p.path.length) {
        const tg = p.path[0], dx = tg.x - p.x, dy = tg.y - p.y, d = Math.hypot(dx, dy);
        if (Math.abs(dx) > Math.abs(dy) * 0.8) p.dir = dx > 0 ? 1 : -1; else p.dir = 0;
        if (d <= sp) { p.x = tg.x; p.y = tg.y; sp -= d; p.path.shift(); } else { p.x += dx / d * sp; p.y += dy / d * sp; sp = 0; }
      }
      separate(p); unstick(p);
      if (!p.path.length) {
        if (p.state === "leave") { p.state = "gone"; return; }
        if (p.destRoom === -2) { p.state = "drink"; p.wait = 200; p.room = -1; p.slot = -1; p.icon = null; return; }
        p.state = "wait"; p.slot = p.destSlot; p.room = p.destRoom; p.wait = p.isCase ? 1e9 : (p.room < 0 ? 20 : rnd(260, 620));
        p.lie = !p.isCase && isBedSlot(p.room, p.slot) && !(p.look && p.look.wheelchair);
        p.icon = p.isCase ? "clip" : (p.room >= 0 ? ICON_OF_ROOM[p.room] : null);
        if (p.isCase && typeof S.onArrive === "function") S.onArrive(p);
      }
    } else if (p.state === "wait") {
      if (!p.isCase && --p.wait <= 0) {
        if (p.room < 0) {                                  /* đang đứng đợi ở lối vào */
          const free = freeRooms(-1);
          const r = free.length ? free[(Math.random() * free.length) | 0] : -1;
          const k = r >= 0 ? pickSlot(r, p.look) : -1;
          if (k >= 0) { p.icon = null; toRoom(p, r, k); } else p.wait = 20;
        } else {
          if (Math.random() < 0.12) { toDrink(p); return; }   /* đôi khi ghé máy nước trước khi rời đi */
          const free = freeRooms(p.room);
          if (!free.length) p.wait = 40;                   /* các phòng khác đều có người: ở lại đợi thêm */
          else {
            const r = free[(Math.random() * free.length) | 0];
            const k = pickSlot(r, p.look);
            p.icon = null;
            if (Math.random() < 0.28 || k < 0) toExit(p);
            else { p.room = -1; p.slot = -1; toRoom(p, r, k); }
          }
        }
      }
    } else if (p.state === "drink") {
      if (--p.wait <= 0) toExit(p);
    } else if (p.state === "react") {
      if (--p.wait <= 0) toExit(p);
    }
    if (p.hop > 0) p.hop--;
  }
  function spawnAmbient() {
    const sig = l => [l.hair, l.shirt, l.dress, l.kid, l.elder, l.wheelchair].join("|");
    const used = new Set(S.people.filter(q => q.state !== "gone").map(q => sig(q.look)));
    let look = null;
    for (let a = 0; a < 8 && !look; a++) {
      const c = Math.random() < 0.6 ? randomLook() : Object.assign({ skin: pickOne(SKIN) }, pickOne(AMB));
      if (!used.has(sig(c))) look = c;
    }
    if (!look) return;
    const p = makePerson(look, "amb");
    p.x = NODES.out[0]; p.y = NODES.out[1];
    const free = freeRooms(-1);
    if (free.length) {
      const r = free[(Math.random() * free.length) | 0];
      const k = pickSlot(r, look);
      if (k < 0) return;
      toRoom(p, r, k);
    } else {
      const sp = freeQueueSpot();
      if (!sp) return;                                     /* hàng đợi đầy */
      toQueue(p, sp);
    }
    S.people.push(p);
  }

  /* ---------- hiệu ứng nổi ---------- */
  function fxText(x, y, text, col) { S.fx.push({ x, y, text, col: col || "#2E9D57", life: 70 }); }

  /* ---------- máy quay: zoom vào phòng đang có ca ---------- */
  function camTarget(room) {
    if (room < 0 || !ROOMS[room]) { S.camT = { x: HW / 2, y: HH / 2, z: 1 }; return; }
    const z = 2, r = ROOMS[room];
    const cx = Math.min(Math.max(r.x + (r.w || RW) / 2, HW / (2 * z)), HW - HW / (2 * z));
    const cy = Math.min(Math.max(r.y + RH / 2, HH / (2 * z)), HH - HH / (2 * z));
    S.camT = { x: cx, y: cy, z };
  }
  function stepCam() {
    const c = S.cam, T = S.camT, k = S.reduced ? 1 : 0.085;
    if (S.camT.z === 1) { T.x = HW / 2; T.y = HH / 2; }
    c.x += (T.x - c.x) * k; c.y += (T.y - c.y) * k; c.z += (T.z - c.z) * k;
    if (Math.abs(T.z - c.z) < 0.002) c.z = T.z;
    if (S.shk > 0) S.shk--;
    if (S.reduced) S.shk = 0;
  }
  function shakeOff() { return S.shk > 0 ? [(Math.random() - 0.5) * 3 * S.shk / 22, (Math.random() - 0.5) * 3 * S.shk / 22] : [0, 0]; }
  function applyCam() {
    const c = S.cam, [ox, oy] = shakeOff();
    g.translate(HW / 2, HH / 2); g.scale(c.z, c.z); g.translate(-c.x + ox, -c.y + oy);
  }

  /* ---------- vẽ cả cảnh ---------- */
  function draw(t) {
    if (!g) return;
    const amb = typeof ambientNow === "function" ? ambientNow() : null;
    /* cập nhật người */
    S.spawnT--;
    const ambCount = S.people.filter(p => p.role === "amb" && p.state !== "gone").length;
    if (S.spawnT <= 0 && ambCount < S.ambientTarget + (S.busy ? 4 : 0)) { spawnAmbient(); S.spawnT = 220 + Math.random() * 260; }
    for (const p of S.people) stepPerson(p);
    S.people = S.people.filter(p => p.state !== "gone");

    stepCam();
    g.setTransform(RESV, 0, 0, RESV, 0, 0); g.imageSmoothingEnabled = true;
    applyCam();
    rect(0, 0, HW, HH, "#3A2E22");
    for (let ci = nRooms(); ci < viewRooms(); ci++) {
      const r = ROOMS[ci]; g.save(); g.translate(r.x, r.y); g.beginPath(); g.rect(0, 0, r.w || RW, RH); g.clip(); construction(ci, t); g.restore();
    }
    for (const r of ROOMS.slice(0, nRooms())) {
      g.save(); g.translate(r.x, r.y); g.beginPath(); g.rect(0, 0, r.w || RW, RH); g.clip();
      ROOM_FN[r.i](t, S.eq[r.i]);
      drawAssistants(r.i, t);
      if (S.active >= 0 && S.active !== r.i) { g.fillStyle = "rgba(30,22,14,.10)"; g.fillRect(0, 0, r.w || RW, RH); }
      g.restore();
    }
    walls(t);
    /* người, sắp theo chiều sâu */
    const list = S.people.slice().sort((a, b) => a.y - b.y);
    for (const p of list) {
      const walkingNow = (p.state === "walk" || p.state === "leave");
      const pose = { dir: walkingNow ? (p.dir || 0) : 0, walk: walkingNow ? 1 : -1, face: p.face, blink: ((t + p.seed * 7) % 150) < 5, talk: p.state === "wait" && p.isCase && ((t / 24) | 0) % 3 === 0, sit: false };
      const hop = p.hop > 0 ? -Math.abs(Math.sin(p.hop * 0.45)) * 3 : 0;
      g.fillStyle = "rgba(50,36,20,.22)"; g.beginPath(); g.ellipse(p.x, p.y + 0.6, 7, 2.2, 0, 0, Math.PI * 2); g.fill();
      const shx = p.shake > 0 ? Math.sin(p.shake * 1.1) * 1.8 * Math.min(1, p.shake / 30) : 0; if (p.shake > 0) p.shake--;
      if (p.lie && p.state === "wait") { const bs = BED_SLOTS[p.room + ":" + p.slot]; if (bs) lyingPatient(p.look, bs.hx, bs.hy); }
      else pPerson(p.x + shx, p.y + hop, p.look, pose, PSCALE);
      if (p.state === "drink") drawDrinker(p);
      if (p.icon && (p.state === "wait" || p.state === "react")) icon(p.icon, p.x + 10, p.y - 40 + Math.sin((t + p.seed) / 18) * 1.2, 1.0);
      if (p.isCase && p.state === "wait") { g.strokeStyle = "rgba(255,200,60,.85)"; g.lineWidth = 1.2; g.beginPath(); g.ellipse(p.x, p.y + 0.6, 9, 3.2, 0, 0, Math.PI * 2); g.stroke(); }
    }
    /* ánh sáng ban đêm */
    if (amb && amb.dim) { g.fillStyle = amb.dim; g.fillRect(0, 0, HW, HH); }
    /* viền phòng đang hoạt động */
    if (S.active >= 0) { const r = ROOMS[S.active]; g.strokeStyle = "rgba(255,196,64,.95)"; g.lineWidth = 2.2; g.strokeRect(r.x + 3, r.y + 3, RW - 6, RH - 6); }
    /* chớp màu khi trả lời */
    if (S.flash) {
      const f = S.flash; f.life--;
      if (f.life <= 0) S.flash = null;
      else if (S.active >= 0) { const r = ROOMS[S.active]; g.globalAlpha = Math.min(0.34, f.life / f.max * 0.34); g.fillStyle = f.col; g.fillRect(r.x, r.y, r.w || RW, RH); g.globalAlpha = 1; }
    }
    /* chữ nổi */
    for (let i = S.fx.length - 1; i >= 0; i--) {
      const f = S.fx[i]; f.y -= 0.35; f.life--;
      if (f.life <= 0) { S.fx.splice(i, 1); continue; }
      g.globalAlpha = Math.min(1, f.life / 24); g.font = "700 12px Epilogue, system-ui, sans-serif"; g.textAlign = "center";
      g.lineWidth = 3; g.strokeStyle = "rgba(255,255,255,.95)"; g.strokeText(f.text, f.x, f.y); g.fillStyle = f.col; g.fillText(f.text, f.x, f.y); g.globalAlpha = 1;
    }
  }

  /* ---------- API ---------- */
  const H = {
    get W() { return HW; }, H: HH, RW, RH, ROOMS, ROOM_OF, STAFF_AT, SLOTS,
    get cols() { return cols; }, get nRooms() { return nRooms(); }, get viewRooms() { return viewRooms(); },
    setCols(n) { n = n >= 4 ? 4 : n === 3 ? 3 : 2; if (n === cols) return; cols = n; HW = viewCols() === 3 ? 700 : 900; buildGraph(); S.people = []; S.caseP = null; S.fx = []; S.cam = { x: HW / 2, y: HH / 2, z: 1 }; S.camT = { x: HW / 2, y: HH / 2, z: 1 }; if (typeof S.onResize === "function") S.onResize(); },
    focus(room) { camTarget(room); },
    cam() { return { x: S.cam.x, y: S.cam.y, z: S.cam.z, settled: Math.abs(S.cam.z - S.camT.z) < 0.02 && Math.abs(S.cam.x - S.camT.x) < 1 }; },
    toPct(x, y) { const c = S.cam; return { l: ((x - c.x) * c.z + HW / 2) / HW * 100, t: ((y - c.y) * c.z + HH / 2) / HH * 100 }; },
    debugPeople() { return S.people.map(q => ({ id: q.id, x: q.x, y: q.y, state: q.state, room: q.room })); },
    debug() { return { NODES, ADJ, SLOTS, STAFF_AT, ASSIST_AT, SLOT_NODE, ROOMS: ROOMS.map(r => ({ x: r.x, y: r.y })), RW, RH }; },
    setBusy(b) { S.busy = !!b; },
    setReduced(b) { S.reduced = !!b; },
    onResize(fn) { S.onResize = fn; },
    init(ctx, res) { g = ctx; RESV = res || 3; },
    setRes(r) { RESV = r; },
    setLevels(eq, st) { if (eq) S.eq = eq.slice(); if (st) S.st = st.slice(); },
    setActive(i) { S.active = i; if (i < 0) camTarget(-1); S.ambientTarget = i >= 0 ? 3 : 5; },
    draw,
    roomOfSign(sign) {
      if (cols >= 3) { if (sign === "KHOA NHI" || sign === "TIÊM CHỦNG") return 4; if (sign === "HỒ SƠ ĐIỆN TỬ" || sign === "ATTP") return 5; }
      if (cols >= 4) { if (sign === "KHÁM THAI" || sign === "DÂN SỐ") return 6; if (sign === "PHÒNG BỆNH" || sign === "TƯ VẤN SÀNG LỌC" || sign === "HIẾN GHÉP") return 7; }
      return ROOM_OF[sign] !== undefined ? ROOM_OF[sign] : 0;
    },
    beginCase(look, room, instant) {
      if (S.caseP && S.caseP.state !== "gone") { if (S.caseP.state === "wait" || S.caseP.state === "react") toExit(S.caseP); }
      const p = makePerson(look, "case"); p.isCase = true;
      /* khách có cùng dáng với bệnh nhân ca thì rời đi để không trùng nhân vật */
      const sg = l => [l.hair, l.shirt, l.dress, l.kid, l.elder, l.wheelchair].join("|");
      for (const q of S.people) if (q !== p && q.role === "amb" && q.state !== "gone" && q.state !== "leave" && sg(q.look) === sg(look)) toExit(q);
      /* nhường chỗ cho bệnh nhân giả nếu đang chiếm chỗ 0 */
      for (const q of S.people) if (q !== p && !q.isCase && q.state !== "gone" && q.state !== "leave" && ((q.room === room && (q.state === "wait" || q.state === "react")) || (q.state === "walk" && q.destRoom === room))) toExit(q);
      toRoom(p, room, 0);
      if (instant) { const sl = SLOTS[room][0]; p.x = sl[0]; p.y = sl[1]; p.path = []; }
      S.people.push(p); S.caseP = p;
      return p;
    },
    reactCase(ok) {
      const p = S.caseP; if (!p || p.state === "gone" || p.state === "leave") return;
      p.state = "react"; p.wait = 150; p.icon = ok ? "ok" : "no"; p.face = ok ? "s" : "f"; p.hop = ok ? 34 : 0;
      p.shake = ok ? 0 : 80;
      S.flash = { col: ok ? "#38B26B" : "#E5534B", life: ok ? 36 : 48, max: ok ? 36 : 48 };
      if (!ok) S.shk = 22;
    },
    fx(text, col, room) { const r = room >= 0 ? room : (S.active >= 0 ? S.active : 0); const sp = STAFF_AT[r]; fxText(sp[0], sp[1] - 38, text, col); },
    caseArrived(fn) { S.onArrive = fn; },
    casePos() { const p = S.caseP; return p ? { x: p.x, y: p.y, state: p.state } : null; },
    peopleCount() { return S.people.length; },
    reset() { S.people = []; S.caseP = null; S.fx = []; S.spawnT = 0; }
  };
  window.Hospital = H;
})();
