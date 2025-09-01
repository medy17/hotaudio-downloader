javascript:(function () {
    if (window.HOTAUDIO_GRABBER_LOADED) {
        alert('Grabber already loaded!');
        return;
    }
    window.HOTAUDIO_GRABBER_LOADED = true;
    window.DECRYPTED_AUDIO_CHUNKS = [];
    console.log('[GRABBER] Audio grabber activated!');
    const originalAppendBuffer = SourceBuffer.prototype.appendBuffer;
    SourceBuffer.prototype.appendBuffer = function (data) {
        window.DECRYPTED_AUDIO_CHUNKS.push(data);
        console.log(`[GRABBER] Chunk captured! Size: ${data.byteLength}. Total: ${window.DECRYPTED_AUDIO_CHUNKS.length}`);
        return originalAppendBuffer.apply(this, arguments);
    };
    let speedApplied = false;
    const speedInterval = setInterval(() => {
        try {
            if (window.as && window.as.el && !speedApplied) {
                window.as.el.playbackRate = 16;
                speedApplied = true;
                console.log('[GRABBER] Speed set to 16x');
                clearInterval(speedInterval);
                updateButton();
                return;
            }
            const audioElements = document.querySelectorAll('audio, video');
            audioElements.forEach(el => {
                if (el.playbackRate !== 16) {
                    el.playbackRate = 16;
                    speedApplied = true;
                    console.log('[GRABBER] Speed set to 16x on audio element');
                    clearInterval(speedInterval);
                    updateButton();
                }
            });
        } catch (e) {
            console.log('[GRABBER] Speed control attempt:', e);
        }
    }, 500);
    let downloadTriggered = false;
    const monitorInterval = setInterval(() => {
        if (downloadTriggered) return;
        const timeEl = document.querySelector('#player-progress-text');
        if (timeEl) {
            const timeText = timeEl.textContent || '';
            const match = timeText.match(/([0-9:]+)\s*\/\s*([0-9:]+)/);
            if (match) {
                const parseTime = t => {
                    const parts = t.split(':').map(Number);
                    return parts.length === 2 ? parts[0] * 60 + parts[1] : parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : 0;
                };
                const current = parseTime(match[1]);
                const total = parseTime(match[2]);
                if (total > 10 && (total - current) <= 5) {
                    downloadTriggered = true;
                    clearInterval(monitorInterval);
                    setTimeout(() => {
                        if (window.DECRYPTED_AUDIO_CHUNKS.length > 0) {
                            const blob = new Blob(window.DECRYPTED_AUDIO_CHUNKS, {type: 'audio/mp4'});
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            let filename = 'hotaudio-track';
                            const titleEl = document.querySelector('.player-track-title, .track-title, h1');
                            if (titleEl) filename = titleEl.textContent.trim().replace(/[\\/:*?"<>|]/g, '-');
                            a.download = filename + '.m4a';
                            a.href = url;
                            a.click();
                            URL.revokeObjectURL(url);
                            console.log('[GRABBER] Download complete!');
                        }
                    }, 3000);
                }
            }
        }
    }, 1000);
    const btn = document.createElement('div');
    btn.innerHTML = '🎵 GRABBER ACTIVE<br><small>Waiting for audio...</small>';
    btn.style.cssText = 'position:fixed;top:10px;right:10px;background:linear-gradient(45deg,#ff6b6b,#4ecdc4);color:white;padding:15px;border-radius:10px;font-family:Arial;font-size:14px;font-weight:bold;text-align:center;z-index:99999;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.2);animation:pulse 2s infinite;';

    function updateButton() {
        if (speedApplied) {
            btn.innerHTML = '🎵 GRABBER ACTIVE<br><small>16x Speed ✅</small>';
        }
    }

    btn.onclick = () => {
        if (window.DECRYPTED_AUDIO_CHUNKS.length > 0) {
            const blob = new Blob(window.DECRYPTED_AUDIO_CHUNKS, {type: 'audio/mp4'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.download = 'manual-download.m4a';
            a.href = url;
            a.click();
            URL.revokeObjectURL(url);
            btn.innerHTML = '✅ DOWNLOADED!';
            setTimeout(() => updateButton(), 3000);
        } else {
            alert('No audio captured yet. Play a track first!');
        }
    };
    document.body.appendChild(btn);
    const style = document.createElement('style');
    style.textContent = '@keyframes pulse{0%{transform:scale(1);}50%{transform:scale(1.05);}100%{transform:scale(1);}}';
    document.head.appendChild(style);
    window.forceSpeed = () => {
        try {
            if (window.as && window.as.el) {
                window.as.el.playbackRate = 16;
                console.log('[MANUAL] Speed forced to 16x via as.el');
            }
            document.querySelectorAll('audio, video').forEach(el => {
                el.playbackRate = 16;
                console.log('[MANUAL] Speed forced to 16x on element');
            });
            updateButton();
        } catch (e) {
            console.log('[MANUAL] Force speed error:', e);
        }
    };
    alert('🎵 Hotaudio Grabber Activated!\n\n✅ Audio capture ready\n⚡ Auto 16x speed (if not working, try: forceSpeed() in console)\n📥 Auto-download when track ends\n👆 Click floating button for manual download\n\nPlay a track to start!');
})();