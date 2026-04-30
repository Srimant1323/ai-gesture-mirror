// ── MORSE CODE + BLIND ASSIST ENGINE (fixed) ─────────────────────────────────
(function(){

  // ── Morse Code Table ──────────────────────────────────────────────────────
  const MORSE_MAP = {
    '.-':'A','-...':'B','-.-.':'C','-.':'D','.':'E','..-.':'F',
    '--.':'G','....':'H','..':'I','.---':'J','-.-':'K','.-..':'L',
    '--':'M','-.':'N','---':'O','.--.':'P','--.-':'Q','.-.':'R',
    '...':'S','-':'T','..-':'U','...-':'V','.--':'W','-..-':'X',
    '-.--':'Y','--..':'Z','-----':'0','.----':'1','..---':'2',
    '...--':'3','....-':'4','.....':'5','-....':'6','--...':'7',
    '---..':'8','----.':'9'
  };

  // ── State ─────────────────────────────────────────────────────────────────
  let morseBuffer  = '';
  let messageText  = '';
  let morseActive  = false;
  let blindMode    = false;
  let lastMorseGesture = '';
  let morseDebounce    = 0;
  let letterTimer      = null;
  let lastNarration    = '';
  let narrateTimer     = 0;

  // ── TTS ───────────────────────────────────────────────────────────────────
  function speak(text, rate=1, pitch=1){
    if(!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate=rate; u.pitch=pitch; u.volume=1;
    window.speechSynthesis.speak(u);
  }

  // ── Morse helpers ─────────────────────────────────────────────────────────
  function decodeMorse(code){ return MORSE_MAP[code] || '?'; }

  function commitLetter(){
    if(!morseBuffer) return;
    const letter = decodeMorse(morseBuffer);
    messageText += letter;
    morseBuffer  = '';
    speak(letter, 1.1, 1.2);
    updateUI();
  }

  function commitWord(){
    if(morseBuffer) commitLetter();
    messageText += ' ';
    speak('space');
    updateUI();
  }

  function deleteLastSymbol(){
    if(morseBuffer.length){ morseBuffer=morseBuffer.slice(0,-1); speak('delete'); }
    else if(messageText.length){ messageText=messageText.slice(0,-1); speak('back'); }
    updateUI();
  }

  function speakMessage(){
    const txt = messageText.trim();
    if(!txt){ speak('Message is empty'); return; }
    speak(txt, 0.88);
    addBubble(txt);
    messageText=''; morseBuffer='';
    updateUI();
  }

  function clearMessage(){ messageText=''; morseBuffer=''; speak('Cleared'); updateUI(); }

  function copyMessage(){
    const txt = messageText.trim()||'';
    if(!txt){ speak('Nothing to copy'); return; }
    navigator.clipboard.writeText(txt)
      .then(()=>speak('Copied to clipboard'))
      .catch(()=>speak('Copy failed'));
  }

  // ── UI update ─────────────────────────────────────────────────────────────
  function updateUI(){
    const symEl  = document.getElementById('m-symbols');
    const letEl  = document.getElementById('m-letter');
    const msgEl  = document.getElementById('m-message');
    if(!symEl) return;
    symEl.textContent = morseBuffer
      ? morseBuffer.split('').map(c=>c==='.'?'•':'—').join(' ')
      : '—';
    letEl.textContent = morseBuffer ? decodeMorse(morseBuffer) : '';
    msgEl.textContent = messageText || 'Start gesturing…';
  }

  function addBubble(txt){
    const box = document.getElementById('m-bubbles');
    if(!box) return;
    const b = document.createElement('div');
    b.className='m-bubble';
    b.textContent=txt;
    box.appendChild(b);
    requestAnimationFrame(()=>b.classList.add('show'));
    box.scrollTop=box.scrollHeight;
  }

  // ── CSS ───────────────────────────────────────────────────────────────────
  const css = document.createElement('style');
  css.textContent=`
    /* ── Morse Panel ── */
    #morsePanel{
      position:fixed;bottom:90px;left:20px;width:260px;z-index:300;
      background:rgba(8,8,24,0.92);
      border:1px solid rgba(255,100,30,0.35);
      border-radius:18px;padding:16px 18px;
      backdrop-filter:blur(20px);
      font-family:'Inter',sans-serif;
      box-shadow:0 0 30px rgba(255,80,0,0.12);
      transition:border-color .3s;
    }
    #morsePanel.morse-on{border-color:rgba(255,120,30,0.7);box-shadow:0 0 30px rgba(255,80,0,.3)}

    #m-header{
      display:flex;justify-content:space-between;align-items:center;
      margin-bottom:12px;
    }
    #m-title{font-size:.88rem;font-weight:700;color:#fff;letter-spacing:.04em}

    /* big toggle */
    .sw{position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0}
    .sw input{opacity:0;width:0;height:0}
    .sw-track{position:absolute;inset:0;background:#333;border-radius:999px;
      cursor:pointer;transition:.3s;border:1px solid rgba(255,255,255,.1)}
    .sw-track:before{content:'';position:absolute;width:16px;height:16px;background:#aaa;
      border-radius:50%;bottom:3px;left:3px;transition:.3s}
    .sw input:checked + .sw-track{background:linear-gradient(135deg,#ff4500,#ff8800);border-color:#ff6600}
    .sw input:checked + .sw-track:before{transform:translateX(18px);background:#fff}

    #m-symbols{
      font-size:1.8rem;letter-spacing:.15em;min-height:2.2rem;
      color:#ff7030;text-shadow:0 0 14px #ff5500;font-weight:700;
      transition:all .2s;
    }
    #m-letter{
      font-size:4rem;font-weight:900;color:#fff;min-height:4.5rem;line-height:1;
      text-shadow:0 0 30px rgba(255,140,60,.7);
    }
    #m-message{
      font-size:.82rem;color:rgba(255,255,255,.65);
      min-height:2.5rem;word-break:break-all;line-height:1.5;
      border-top:1px solid rgba(255,255,255,.07);
      padding-top:8px;margin-top:4px;
    }
    #m-btns{display:flex;gap:6px;margin:10px 0 8px}
    .mb{
      flex:1;background:rgba(255,255,255,.07);
      border:1px solid rgba(255,255,255,.14);
      color:#fff;border-radius:10px;padding:7px 4px;
      font-size:.72rem;cursor:pointer;font-family:inherit;
      transition:background .2s,transform .1s;
    }
    .mb:hover{background:rgba(255,120,30,.25);border-color:#ff7030;transform:scale(1.04)}
    .mb:active{transform:scale(.97)}

    #m-guide{
      font-size:.62rem;color:rgba(255,255,255,.35);
      line-height:1.8;border-top:1px solid rgba(255,255,255,.07);
      padding-top:8px;
    }
    #m-guide span{color:rgba(255,160,80,.7);margin-right:4px}

    #m-bubbles{max-height:80px;overflow-y:auto;margin-top:8px;display:flex;flex-direction:column;gap:4px}
    .m-bubble{
      background:linear-gradient(135deg,#7c3aed,#ec4899);
      color:#fff;border-radius:12px 12px 2px 12px;
      padding:5px 12px;font-size:.76rem;
      opacity:0;transform:translateY(6px);transition:all .3s;
      align-self:flex-end;
    }
    .m-bubble.show{opacity:1;transform:translateY(0)}

    /* ── Disabled state overlay ── */
    #m-body{transition:opacity .3s}
    #morsePanel:not(.morse-on) #m-body{opacity:.38;pointer-events:none}

    /* ── Blind Assist button ── */
    #blindBtn{
      position:fixed;bottom:90px;right:20px;z-index:300;
      background:rgba(8,8,24,.92);
      border:1px solid rgba(255,255,255,.15);
      color:rgba(255,255,255,.7);border-radius:14px;
      padding:12px 20px;font-size:.8rem;cursor:pointer;
      font-family:inherit;backdrop-filter:blur(16px);
      transition:all .3s;line-height:1.4;text-align:center;
    }
    #blindBtn.on{
      background:linear-gradient(135deg,#065f46,#059669);
      color:#fff;border-color:#10b981;
      box-shadow:0 0 24px rgba(16,185,129,.35);
    }
    #blindLabel{
      position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
      font-size:1rem;color:rgba(255,255,255,.45);z-index:15;
      pointer-events:none;text-align:center;line-height:2;display:none;
    }
    body.blind-on #blindLabel{display:block}
  `;
  document.head.appendChild(css);

  // ── Build DOM ─────────────────────────────────────────────────────────────
  function buildUI(){
    // Morse panel
    const panel = document.createElement('div');
    panel.id='morsePanel';
    panel.innerHTML=`
      <div id="m-header">
        <div id="m-title">🔴 Morse Code</div>
        <label class="sw" title="Enable Morse mode">
          <input type="checkbox" id="morseToggle"/>
          <div class="sw-track"></div>
        </label>
      </div>
      <div id="m-body">
        <div id="m-symbols">—</div>
        <div id="m-letter"></div>
        <div id="m-message">Enable toggle to start…</div>
        <div id="m-btns">
          <button class="mb" id="m-speak">🔊 Speak</button>
          <button class="mb" id="m-clear">🗑 Clear</button>
          <button class="mb" id="m-copy">📋 Copy</button>
        </div>
        <div id="m-guide">
          <span>✊</span>Fist = dot (•)<br>
          <span>✋</span>Palm = dash (—)<br>
          <span>👍</span>Thumb Up = word space<br>
          <span>✌️</span>Peace = delete<br>
          <span>🤲</span>Both palms = speak
        </div>
        <div id="m-bubbles"></div>
      </div>
    `;
    document.body.appendChild(panel);

    // Wire toggle — panel itself always interactive
    document.getElementById('morseToggle').addEventListener('change', e=>{
      morseActive = e.target.checked;
      panel.classList.toggle('morse-on', morseActive);
      document.getElementById('m-message').textContent = morseActive
        ? 'Ready — make a fist for dot!' : 'Enable toggle to start…';
      speak(morseActive ? 'Morse code on' : 'Morse code off');
    });

    // Wire buttons with addEventListener (reliable)
    document.getElementById('m-speak').addEventListener('click', ()=>{ getAudioCtxUnlock(); speakMessage(); });
    document.getElementById('m-clear').addEventListener('click', ()=>clearMessage());
    document.getElementById('m-copy' ).addEventListener('click', ()=>copyMessage());

    // Blind assist button
    const blindBtn = document.createElement('button');
    blindBtn.id='blindBtn';
    blindBtn.innerHTML='👁️ Blind<br>Assist';
    blindBtn.addEventListener('click', ()=>{
      blindMode = !blindMode;
      blindBtn.classList.toggle('on', blindMode);
      blindBtn.innerHTML = blindMode ? '👁️ Audio<br>ON ✓' : '👁️ Blind<br>Assist';
      document.body.classList.toggle('blind-on', blindMode);
      getAudioCtxUnlock();
      speak(blindMode
        ? 'Blind assist on. I will describe your hands.'
        : 'Blind assist off.', 0.9);
    });
    document.body.appendChild(blindBtn);

    // Blind label overlay
    const lbl = document.createElement('div');
    lbl.id='blindLabel';
    lbl.innerHTML='🎙️ Audio Mode Active<br><small>All gestures narrated aloud</small>';
    document.body.appendChild(lbl);
  }

  // Unlock audio context on first user interaction
  function getAudioCtxUnlock(){
    if(window.speechSynthesis){
      // Warm up TTS with silent utterance
      const u = new SpeechSynthesisUtterance('');
      u.volume=0; window.speechSynthesis.speak(u);
    }
  }

  // ── Gesture → Morse (called from main loop each frame) ────────────────────
  window.processMorseGesture = function(gesture){
    if(!morseActive) return;
    const now = Date.now();
    // Ignore same gesture held, debounce rapid changes
    if(gesture === lastMorseGesture && gesture !== '') return;
    if(gesture === '') { lastMorseGesture=''; return; } // hand neutral
    if(now - morseDebounce < 550) return;
    morseDebounce = now;
    lastMorseGesture = gesture;

    clearTimeout(letterTimer);

    if(gesture==='fist'){
      morseBuffer+='.';
      updateUI();
      speak('dit',1.4,1.6);
      letterTimer=setTimeout(commitLetter,1800);

    } else if(gesture==='palm'){
      morseBuffer+='-';
      updateUI();
      speak('dah',1.1,0.85);
      letterTimer=setTimeout(commitLetter,1800);

    } else if(gesture==='thumbUp'){
      clearTimeout(letterTimer);
      commitWord();

    } else if(gesture==='peace'){
      clearTimeout(letterTimer);
      deleteLastSymbol();

    } else if(gesture==='bothPalms'){
      clearTimeout(letterTimer);
      speakMessage();
    }
  };

  // ── Blind narration (called from main loop) ───────────────────────────────
  window.narrateHands = function(handsArr){
    if(!blindMode) return;
    const now = Date.now();
    if(now - narrateTimer < 2800) return;
    narrateTimer = now;

    if(!handsArr.length){
      const msg='No hands in frame.';
      if(msg!==lastNarration){ speak(msg,0.9); lastNarration=msg; }
      return;
    }

    const parts = handsArr.map(h=>{
      const lm = h.landmarks;
      const ext = [8,12,16,20].filter(i=>lm[i].y<lm[i-2].y).length;
      const side = h.hand==='Right'?'Right':'Left';
      const pos  = lm[0].x<0.33?'left side':lm[0].x>0.66?'right side':'center';
      return `${side} hand at ${pos}, ${ext} finger${ext!==1?'s':''} up`;
    });
    const msg=parts.join('. ');
    if(msg!==lastNarration){ speak(msg,0.9); lastNarration=msg; }
  };

  // ── Wait for DOM then build ───────────────────────────────────────────────
  function tryInit(){
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded', buildUI);
    } else {
      buildUI();
    }
  }
  tryInit();

})();
