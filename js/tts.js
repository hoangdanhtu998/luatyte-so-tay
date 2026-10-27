/**
 * TTS Component - Text-to-Speech cho tiếng Việt
 * Piper TTS local, không cần API keys
 */
class TTSAudioController {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      defaultVoice: 'vi_VN-vais1000-medium',
      defaultSpeed: 1.0,
      apiUrl: '/api/tts',
      ...options
    };
    this.currentAudio = null;
    this.isLoading = false;
    this.voices = [];
    this.init();
  }

  async init() {
    await this.loadVoices();
    this.render();
    this.bindEvents();
  }

  async loadVoices() {
    try {
      const res = await fetch(`${this.options.apiUrl}/voices`);
      this.voices = await res.json();
    } catch (err) {
      console.error('Failed to load voices:', err);
      this.voices = [{
        id: 'vi_VN-vais1000-medium',
        name: 'Tiếng Việt (Medium)',
        available: true
      }];
    }
  }

  render() {
    const voiceOptions = this.voices.map(v => 
      `<option value="${v.id}" ${v.id === this.options.defaultVoice ? 'selected' : ''}>${v.name} (${v.available ? '✓' : '✗'})</option>`
    ).join('');

    this.container.innerHTML = `
      <div class="tts-controller" style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
        <h3 style="margin-top: 0;">🔊 Chuyển văn bản thành giọng nói</h3>
        <textarea id="tts-text" placeholder="Nhập text tiếng Việt cần đọc..." rows="4" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;"></textarea>
        <div style="display: flex; gap: 10px; margin: 10px 0; align-items: center;">
          <select id="tts-voice" style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            ${voiceOptions}
          </select>
          <div style="display: flex; align-items: center; gap: 5px;">
            <label>Tốc độ:</label>
            <input type="range" id="tts-speed" min="0.5" max="1.5" step="0.1" value="${this.options.defaultSpeed}" style="width: 100px;">
            <span id="tts-speed-value">${this.options.defaultSpeed}</span>
          </div>
        </div>
        <button id="tts-play" disabled style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
          <span id="tts-play-icon">▶</span>
          <span id="tts-play-text">Phát âm thanh</span>
        </button>
        <div id="tts-status" style="margin-top: 10px; color: #666; font-size: 13px;"></div>
        <audio id="tts-audio" controls style="width: 100%; margin-top: 10px; display: none;"></audio>
      </div>
    `;
  }

  bindEvents() {
    const textInput = document.getElementById('tts-text');
    const playBtn = document.getElementById('tts-play');
    const speedInput = document.getElementById('tts-speed');
    const speedValue = document.getElementById('tts-speed-value');

    textInput.addEventListener('input', (e) => {
      this.updatePlayButton(e.target.value);
    });

    speedInput.addEventListener('input', (e) => {
      speedValue.textContent = e.target.value;
    });

    playBtn.addEventListener('click', () => {
      this.speak();
    });
  }

  updatePlayButton(text) {
    const btn = document.getElementById('tts-play');
    btn.disabled = !text.trim() || this.isLoading;
  }

  async speak() {
    const text = document.getElementById('tts-text').value.trim();
    const voice = document.getElementById('tts-voice').value;
    const speed = parseFloat(document.getElementById('tts-speed').value);

    if (!text) return;

    this.setLoading(true);
    this.setStatus('Đang xử lý...');

    try {
      const res = await fetch(`${this.options.apiUrl}/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, speed })
      });

      const data = await res.json();

      if (data.success) {
        const audio = document.getElementById('tts-audio');
        audio.src = `${this.options.apiUrl}${data.audioFile}`;
        audio.style.display = 'block';
        audio.play();
        this.setStatus('');
      } else {
        this.setStatus(`Lỗi: ${data.error}`);
      }
    } catch (err) {
      this.setStatus(`Lỗi kết nối: ${err.message}`);
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    const btn = document.getElementById('tts-play');
    const icon = document.getElementById('tts-play-icon');
    const text = document.getElementById('tts-play-text');
    
    btn.disabled = loading;
    icon.textContent = loading ? '⏳' : '▶';
    text.textContent = loading ? 'Đang xử lý...' : 'Phát âm thanh';
  }

  setStatus(msg) {
    document.getElementById('tts-status').textContent = msg;
  }
}

// Export cho Node.js (nếu cần)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TTSAudioController;
}
