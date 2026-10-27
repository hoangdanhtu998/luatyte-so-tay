/* Nhân vật trợ lý: bác sĩ vẽ bằng SVG 2D. Không cần WebGL hay thư viện ngoài, chạy được khi ngoại tuyến.
   Trạng thái: idle, thinking, talking, wave, happy, shrug, cheer, sad. Trạng thái có thời lượng sẽ tự trở về idle. */

const STYLE = `
.dr-wrap{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center}
.dr-wrap svg{height:100%;width:auto;overflow:visible}
.dr-bob{animation:dr-bob 3.2s ease-in-out infinite;transform-origin:50% 100%}
@keyframes dr-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.dr-arm-r{transform-origin:72px 62px;transition:transform .35s ease}
.dr-arm-l{transform-origin:28px 62px;transition:transform .35s ease}
.dr-head{transform-origin:50px 40px;transition:transform .35s ease}
.dr-eye{transform-origin:center;transform-box:fill-box;animation:dr-blink 4s infinite}
@keyframes dr-blink{0%,94%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
.dr-mouth{transform-origin:50px 56px;transform-box:fill-box;transition:transform .12s}
.dr-mouth.open{transform:scaleY(2.2)}
.dr-wrap[data-s=wave] .dr-arm-r{transform:rotate(-150deg)}
.dr-wrap[data-s=wave] .dr-arm-r{animation:dr-wave .5s ease-in-out 4}
@keyframes dr-wave{0%,100%{transform:rotate(-150deg)}50%{transform:rotate(-125deg)}}
.dr-wrap[data-s=thinking] .dr-head{transform:rotate(-10deg)}
.dr-wrap[data-s=shrug] .dr-arm-l{transform:rotate(-30deg)}
.dr-wrap[data-s=shrug] .dr-arm-r{transform:rotate(30deg)}
.dr-wrap[data-s=happy] .dr-bob,.dr-wrap[data-s=cheer] .dr-bob{animation:dr-jump .5s ease-in-out 4}
@keyframes dr-jump{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.dr-wrap[data-s=cheer] .dr-arm-r,.dr-wrap[data-s=cheer] .dr-arm-l{transform:rotate(-160deg)}
.dr-wrap[data-s=cheer] .dr-arm-l{transform:rotate(160deg)}
.dr-wrap[data-s=sad] .dr-head{transform:rotate(8deg) translateY(2px)}
@media (prefers-reduced-motion: reduce){.dr-bob,.dr-eye,.dr-wrap[data-s] .dr-arm-r{animation:none!important}}
`;

const svg = `
<svg viewBox="0 0 100 130" aria-hidden="true">
  <g class="dr-bob">
    <!-- Áo blouse trắng -->
    <path d="M26 62 Q28 56 40 55 L60 55 Q72 56 74 62 L77 124 L23 124 Z" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" stroke-linejoin="round"/>
    <!-- Áo sơ mi bên trong và cổ áo -->
    <path d="M42 55 L50 72 L58 55 Z" fill="#CCFBF1"/>
    <path d="M42 55 L50 72 M58 55 L50 72" fill="none" stroke="#94A3B8" stroke-width="1"/>
    <!-- Túi áo và bút -->
    <rect x="58" y="80" width="11" height="10" rx="2" fill="none" stroke="#CBD5E1" stroke-width="1.2"/>
    <path d="M61 78 L61 74" stroke="#0F766E" stroke-width="1.6" stroke-linecap="round"/>
    <!-- Thẻ tên -->
    <rect x="30" y="74" width="13" height="8" rx="1.8" fill="#F0FDFA" stroke="#14B8A6" stroke-width="1"/>
    <rect x="32.5" y="77" width="8" height="1.4" rx="0.7" fill="#0F766E"/>
    <rect x="32.5" y="79.5" width="5" height="1.2" rx="0.6" fill="#94A3B8"/>
    <!-- Ống nghe -->
    <path d="M40 60 Q38 82 48 88 Q58 90 60 80" fill="none" stroke="#334155" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="40" cy="58" r="2.2" fill="#475569"/>
    <circle cx="60" cy="58" r="2.2" fill="#475569"/>
    <circle cx="61" cy="84" r="3.4" fill="#94A3B8" stroke="#475569" stroke-width="1"/>
    <!-- Tay trái -->
    <g class="dr-arm-l"><path d="M28 66 Q19 86 22 104" fill="none" stroke="#CBD5E1" stroke-width="13" stroke-linecap="round"/><path d="M28 66 Q19 86 22 104" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/><circle cx="22" cy="107" r="5.5" fill="#F3C79E"/></g>
    <!-- Tay phải -->
    <g class="dr-arm-r"><path d="M72 66 Q81 86 78 104" fill="none" stroke="#CBD5E1" stroke-width="13" stroke-linecap="round"/><path d="M72 66 Q81 86 78 104" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/><circle cx="78" cy="107" r="5.5" fill="#F3C79E"/></g>
    <!-- Đầu -->
    <g class="dr-head">
      <rect x="44" y="46" width="12" height="12" rx="4" fill="#F3C79E"/>
      <ellipse cx="31.5" cy="35" rx="3.8" ry="4.6" fill="#F3C79E"/>
      <ellipse cx="68.5" cy="35" rx="3.8" ry="4.6" fill="#F3C79E"/>
      <ellipse cx="50" cy="34" rx="18.5" ry="20.5" fill="#F9D9B8" stroke="#CBD5E1" stroke-width="1.2"/>
      <!-- Tóc gọn -->
      <path d="M31 33 Q28 12 50 11 Q72 12 69 33 Q68 22 60 20 Q52 24 42 20 Q33 23 31 33 Z" fill="#1E293B"/>
      <!-- Lông mày -->
      <path d="M38.5 27.5 Q43 25.2 46.5 27.2" fill="none" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M53.5 27.2 Q57 25.2 61.5 27.5" fill="none" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round"/>
      <!-- Mắt có điểm sáng -->
      <g class="dr-eye"><ellipse cx="43" cy="33.5" rx="2.3" ry="2.9" fill="#1E293B"/><circle cx="43.8" cy="32.5" r="0.8" fill="#FFFFFF"/></g>
      <g class="dr-eye"><ellipse cx="57" cy="33.5" rx="2.3" ry="2.9" fill="#1E293B"/><circle cx="57.8" cy="32.5" r="0.8" fill="#FFFFFF"/></g>
      <!-- Má hồng và mũi -->
      <ellipse cx="37.5" cy="40.5" rx="3.2" ry="2.2" fill="#F26B4F" opacity=".22"/>
      <ellipse cx="62.5" cy="40.5" rx="3.2" ry="2.2" fill="#F26B4F" opacity=".22"/>
      <path d="M50 36 Q48.6 40 50.6 40.6" fill="none" stroke="#C98B5E" stroke-width="1.1" stroke-linecap="round"/>
      <!-- Miệng: mở/đóng khi nói -->
      <ellipse class="dr-mouth" cx="50" cy="45" rx="4" ry="1.7" fill="#BE4B3A"/>
    </g>
  </g>
</svg>`;

export function mount(container){
  if (!container) return null;
  try {
    const style = document.createElement("style");
    style.textContent = STYLE;
    container.append(style);
    const wrap = document.createElement("div");
    wrap.className = "dr-wrap";
    wrap.dataset.s = "idle";
    wrap.innerHTML = svg;
    container.append(wrap);
    const mouth = wrap.querySelector(".dr-mouth");

    let timer = null, talkTimer = null, running = false;
    const clearTimers = () => { clearTimeout(timer); clearInterval(talkTimer); mouth.classList.remove("open"); };

    function play(state, sec){
      clearTimers();
      wrap.dataset.s = state;
      if (state === "talking"){
        talkTimer = setInterval(() => mouth.classList.toggle("open"), 180);
      } else if (state === "idle"){
        return;
      }
      if (sec) timer = setTimeout(() => play("idle"), sec * 1000);
      else if (state !== "talking") timer = setTimeout(() => play("idle"), 2500);
    }

    return {
      play,
      resume(){ running = true; },
      pause(){ running = false; clearTimers(); },
    };
  } catch {
    return null;
  }
}
