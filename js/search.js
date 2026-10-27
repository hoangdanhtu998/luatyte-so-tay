/* Tìm kiếm cho Trợ lý: BM25 trên điểm luật, câu luyện và câu HIS.
   Chạy hoàn toàn trên trình duyệt, câu hỏi không được gửi đi đâu khi tra cứu. */
(function(){
  const K1 = 1.2, B = 0.75;
  // Dưới ngưỡng này coi như không có tài liệu khớp (đo trên bộ hiện có: câu ngoài phạm vi ≈ 2–6, câu khớp ≈ 20–50)
  const MIN_SCORE = 10;
  const STOP = new Set(("la cua va co khong duoc thi bi cho voi nhung cac mot nay do khi nao gi bao nhieu " +
    "the nhu hay ve tai tu den theo trong ngoai ra can phai nen ai sao vi neu hoac se da dang roi con bang " +
    "tren duoi sau truoc hon rat lam ma").split(" "));

  // Nhóm từ đồng nghĩa, viết không dấu, chữ thường. Khi một cụm trong nhóm xuất hiện, các cụm còn lại được thêm vào tìm kiếm.
  const SYN = [
    ["bhyt", "bao hiem y te"],
    ["trai tuyen", "khong dung tuyen", "chuyen tuyen", "khong dung noi dang ky"],
    ["bac si", "nguoi hanh nghe", "y si"],
    ["giay phep hanh nghe", "chung chi hanh nghe"],
    ["thuoc la", "tac hai thuoc la", "hut thuoc"],
    ["sinh con", "thai san", "mang thai", "khi sinh"],
    ["don thuoc", "ke don"],
    ["hiv", "aids"],
    ["ho so benh an", "benh an"],
    ["nha thuoc", "cua hang thuoc", "ban thuoc online"],
    ["tiem chung", "vac xin", "vaccine"],
    ["benh truyen nhiem", "dich benh", "truyen nhiem"],
    ["the bhyt", "the bao hiem"],
    ["khuyet tat", "nguoi khuyet tat"],
    ["thuc pham chuc nang", "tpcn"],
    ["dan so", "sinh con thu hai"],
    ["gioi tinh thai nhi", "chon gioi tinh"]
  ];

  const fold = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
  const words = s => fold(s).match(/[a-z0-9]+/g) || [];

  function terms(s){
    const f = words(s).filter(x => !STOP.has(x));
    const uni = f.filter(x => x.length > 1);
    const bi = [];
    for (let i = 0; i < f.length - 1; i++) bi.push(f[i] + "_" + f[i + 1]);
    return { uni, bi };
  }

  // Tài liệu về cách dùng ứng dụng. Cập nhật khi thêm tính năng.
  const APP = [
    ["Thư viện luật", "Liệt kê các luật. Bấm vào từng luật để đọc điểm chính, hướng dẫn và số hiệu. Nút Hỏi trợ lý về luật này mở trợ lý với câu hỏi tóm tắt sẵn."],
    ["Trắc nghiệm", "Mỗi lượt có 10 câu ngẫu nhiên. Chọn bộ Luật chung hoặc HIS, chọn chủ đề, rồi bấm Lượt mới. Câu đã đúng 5 lần liên tiếp xuất hiện ít hơn; câu hay sai xuất hiện nhiều hơn."],
    ["Thuộc luật", "Một luật được tính là đã thuộc khi đúng 5 lần liên tiếp mọi câu hỏi của luật đó. Tiến độ hiển thị ngay dưới từng luật."],
    ["Thử thách hôm nay", "5 câu mỗi ngày. Đạt từ 4/5 câu đúng để giữ chuỗi ngày liên tiếp. Làm lại trong cùng ngày chỉ để luyện, không tính vào chuỗi."],
    ["Huy hiệu", "Có các huy hiệu như Câu đúng đầu tiên, Năm câu liên tiếp, Thuộc một luật, Ba ngày liền, Ghép không lỗi. Xem danh sách ở đầu trang."],
    ["Đúng hay Sai", "Trả lời các nhận định Đúng/Sai trong 60 giây. Kỷ lục được lưu trên máy này."],
    ["Ghép cặp", "Ghép khái niệm với định nghĩa tương ứng. Ghép đủ 5 cặp không sai để nhận huy hiệu Ghép không lỗi."],
    ["Thẻ nhớ", "Lật thẻ để xem đáp án và đánh dấu đã nhớ."],
    ["Lưu dữ liệu", "Tiến độ, huy hiệu và kỷ lục được lưu trên trình duyệt của máy này. Đổi máy hoặc xóa dữ liệu trình duyệt thì tiến độ sẽ mất."],
    ["Trợ lý hỏi đáp", "Trả lời câu hỏi về luật và sức khỏe. Khi bật AI, trợ lý dựa trên tài liệu trong app và dẫn nguồn. Khi không có AI, trợ lý tra cứu trong sổ tay."]
  ];

  // Chào hỏi, cảm ơn: trả lời ngay, không cần tìm kiếm
  function intent(q){
    const n = fold(q).trim();
    if (/^(chao|xin chao|hello|hi|hey|alo)\b/.test(n) && n.split(/\s+/).length <= 4) return "greet";
    if (/\b(cam on|thanks|thank you|cảm ơn)\b/.test(n)) return "thanks";
    return null;
  }

  let index = [], df = new Map(), avgdl = 1;

  function build(LAWS, QUIZ, HIS){
    const docs = [];
    const lawName = id => { const l = LAWS.find(x => x.id === id); return l ? l.name : ""; };

    LAWS.forEach(l => {
      l.points.forEach(p => docs.push({
        kind: "law", lawId: l.id, title: l.name + " (" + l.so + ")", answer: p, note: "", law: "", src: "", verify: false,
        text: l.name + " " + l.so + " " + p + " " + p
      }));
      if (l.guide) docs.push({
        kind: "law", lawId: l.id, title: l.name + " (" + l.so + ")", answer: l.guide, note: "", law: "", src: "", verify: false,
        text: l.name + " " + l.so + " " + l.guide
      });
    });

    const quizDoc = (q, kind, law) => ({
      kind, title: q.q, answer: q.o[q.a], note: q.e || "", law, src: q.src || "", verify: !!q.verify,
      ref: q, set: kind === "his" ? "his" : "chung",
      text: q.q + " " + q.q + " " + q.o[q.a] + " " + (q.e || "") + " " + law
    });
    QUIZ.forEach(q => docs.push(quizDoc(q, "quiz", lawName(q.t))));
    HIS.forEach(q => docs.push(quizDoc(q, "his", q.law || "")));

    APP.forEach(([title, answer]) => docs.push({
      kind: "app", title: "Ứng dụng: " + title, answer, note: "", law: "", src: "", verify: false,
      text: title + " " + title + " " + answer
    }));

    index = docs.map(d => {
      const t = terms(d.text);
      const tf = new Map();
      t.uni.forEach(x => tf.set(x, (tf.get(x) || 0) + 1));
      t.bi.forEach(x => tf.set(x, (tf.get(x) || 0) + 1));
      return { d, tf, len: t.uni.length + t.bi.length };
    });

    df = new Map();
    index.forEach(e => e.tf.forEach((_, t) => df.set(t, (df.get(t) || 0) + 1)));
    avgdl = index.reduce((a, e) => a + e.len, 0) / Math.max(1, index.length);
  }

  function expand(q, weights){
    const qn = " " + fold(q) + " ";
    SYN.forEach(group => {
      if (!group.some(p => qn.includes(" " + p + " "))) return;
      group.forEach(p => {
        if (qn.includes(" " + p + " ")) return;
        terms(p).uni.forEach(t => weights.set(t, (weights.get(t) || 0) + 0.5));
      });
    });
  }

  // Trả về các tài liệu khớp nhất, kèm điểm. Chỉ giữ tài liệu có điểm gần bằng tài liệu đứng đầu.
  // loose: trả về cả tài liệu độ khớp thấp (đánh dấu weak) để AI có thể cân nhắc
  function search(q, k = 5, loose = false){
    const N = index.length;
    if (!N) return [];
    const qt = terms(q);
    const weights = new Map();
    qt.uni.forEach(t => weights.set(t, (weights.get(t) || 0) + 1));
    qt.bi.forEach(t => weights.set(t, (weights.get(t) || 0) + 1.5));
    expand(q, weights);
    if (!weights.size) return [];

    const scored = [];
    index.forEach(e => {
      let s = 0;
      weights.forEach((w, t) => {
        const f = e.tf.get(t);
        if (!f) return;
        const n = df.get(t) || 0;
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
        s += w * idf * f * (K1 + 1) / (f + K1 * (1 - B + B * e.len / avgdl));
      });
      if (s > 0) scored.push({ d: e.d, s });
    });
    scored.sort((a, b) => b.s - a.s);
    if (!scored.length) return [];
    const top = scored[0].s;
    if (top < MIN_SCORE && !loose) return [];
    const weak = top < MIN_SCORE;
    return scored.filter(x => x.s >= top * 0.35).slice(0, k).map(x => ({ ...x.d, score: x.s, weak }));
  }

  window.LYTSearch = { build, search, fold, intent };
})();
