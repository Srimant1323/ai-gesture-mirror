// ─── FIRE / SUPERHERO AURA ENGINE ────────────────────────────────────────────
(function(){
  const auraCanvas = document.getElementById('auraCanvas');
  const ac = auraCanvas.getContext('2d');

  function resize(){ auraCanvas.width=window.innerWidth; auraCanvas.height=window.innerHeight; }
  resize(); window.addEventListener('resize', resize);

  // ── Particle pool ──
  const MAX = 2000;
  const pool = [];

  const FINGERTIPS = [4,8,12,16,20];
  const KNUCKLES   = [3,7,11,15,19];
  const PALM_PTS   = [0,1,5,9,13,17];

  class P {
    constructor(){ this.alive=false; }
    spawn(x,y,hand){
      this.x=x+(Math.random()-.5)*12;
      this.y=y+(Math.random()-.5)*12;
      this.vx=(Math.random()-.5)*1.6;
      this.vy=-(Math.random()*4+1.8);
      this.life=0;
      this.max=Math.random()*30+20;
      this.r=Math.random()*11+4;
      this.hand=hand||'Right';
      this.tx=Math.random()*100;
      this.alive=true;
    }
    tick(){
      if(!this.alive)return;
      this.life++;
      this.tx+=0.07;
      this.vx+=Math.sin(this.tx)*0.25;
      this.vy-=0.045;
      this.x+=this.vx; this.y+=this.vy;
      this.r*=0.967;
      if(this.life>=this.max||this.r<0.5) this.alive=false;
    }
    draw(ctx){
      if(!this.alive)return;
      const theme = window._auraTheme||'fire';
      const pal   = (window.AURA_PALETTES||{})[theme];
      if(!pal) return;
      const colors= pal[this.hand]||pal['Right'];
      const t     = this.life/this.max;
      const ci    = Math.min(Math.floor(t*colors.length),colors.length-1);
      const c     = colors[ci];
      const alpha = (1-t)*(t<0.1?t*10:1);
      const g=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.r);
      g.addColorStop(0,  `rgba(${c.r},${c.g},${c.b},${(alpha*.95).toFixed(3)})`);
      g.addColorStop(0.45,`rgba(${c.r},${c.g},${c.b},${(alpha*.55).toFixed(3)})`);
      g.addColorStop(1,  `rgba(${c.r},${c.g},${c.b},0)`);
      ctx.beginPath();
      ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fillStyle=g;
      ctx.fill();
    }
  }

  for(let i=0;i<MAX;i++) pool.push(new P());
  function free(){ return pool.find(p=>!p.alive)||null; }

  // ── Current hands feed ──
  let _hands=[];
  window.setAuraHands=function(h){ _hands=h; };

  // ── Emit particles from landmarks ──
  function emit(){
    if(!window._auraOn) return;
    const vw=window.innerWidth, vh=window.innerHeight;
    _hands.forEach(h=>{
      const lm=h.landmarks, hand=h.hand;
      FINGERTIPS.forEach(i=>{
        const sx=(1-lm[i].x)*vw, sy=lm[i].y*vh;
        for(let k=0;k<6;k++){ const p=free(); if(p) p.spawn(sx,sy,hand); }
      });
      KNUCKLES.forEach(i=>{
        const sx=(1-lm[i].x)*vw, sy=lm[i].y*vh;
        for(let k=0;k<2;k++){ const p=free(); if(p) p.spawn(sx,sy,hand); }
      });
      PALM_PTS.forEach(i=>{
        const sx=(1-lm[i].x)*vw, sy=lm[i].y*vh;
        const p=free(); if(p) p.spawn(sx,sy,hand);
      });
    });
  }

  // ── Draw wrist pulse ring ──
  function drawPulse(now){
    if(!window._auraOn||!_hands.length) return;
    const vw=window.innerWidth, vh=window.innerHeight;
    const theme=window._auraTheme||'fire';
    const pal=(window.AURA_PALETTES||{})[theme];
    if(!pal) return;
    _hands.forEach(h=>{
      const lm=h.landmarks;
      const sx=(1-lm[0].x)*vw, sy=lm[0].y*vh;
      const c=pal[h.hand]||pal['Right'];
      const col=c[1];
      const pulse=0.6+0.4*Math.sin(now*0.005);
      const r=55*pulse;
      const g=ac.createRadialGradient(sx,sy,r*.2,sx,sy,r);
      g.addColorStop(0,`rgba(${col.r},${col.g},${col.b},0.22)`);
      g.addColorStop(0.6,`rgba(${col.r},${col.g},${col.b},0.09)`);
      g.addColorStop(1,`rgba(${col.r},${col.g},${col.b},0)`);
      ac.beginPath(); ac.arc(sx,sy,r,0,Math.PI*2);
      ac.fillStyle=g; ac.fill();
    });
  }

  // ── Main loop ──
  function loop(now){
    ac.clearRect(0,0,auraCanvas.width,auraCanvas.height);
    ac.globalCompositeOperation='lighter';
    emit();
    pool.forEach(p=>{ p.tick(); p.draw(ac); });
    drawPulse(now);
    ac.globalCompositeOperation='source-over';
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
