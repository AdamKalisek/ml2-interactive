/* ===== BI-ML2 interactive — core ===== */
'use strict';

/* ---------- registry ---------- */
const VIZ = {
  chapters: [],          // {key,label,title,items:[]}
  byKey: {},
  byId: {},
  chapter(key, label, title){ const c={key,label,title,items:[]}; this.chapters.push(c); this.byKey[key]=c; return c; },
  add(chKey, item){ const c=this.byKey[chKey]; if(!c){console.error('no chapter',chKey);return;} c.items.push(item); this.byId[item.id]=item; item._ch=c; },
};

/* predefined chapter order (mirrors skripta) */
VIZ.chapter('intro','Úvod','Jak používat tohoto průvodce');
VIZ.chapter('ml1','§1 · Základy z ML1','Co musíš umět z ML1');
VIZ.chapter('reg','§2 · Regrese & jádro','Regrese, bázové funkce a jádrový trik');
VIZ.chapter('svm','§3 · SVM','Metoda podpůrných vektorů');
VIZ.chapter('dim','§4 · Redukce dimenze','Redukce dimenzionality');
VIZ.chapter('bayes','§5 · Naivní Bayes','Klasifikace přes pravděpodobnost');
VIZ.chapter('lda','§6 · Generativní & LDA','Generativní vs. diskriminativní, LDA');
VIZ.chapter('perc','§7 · Perceptron','Perceptron');
VIZ.chapter('mlp','§8 · Sítě & backprop','Vícevrstvé sítě a zpětné šíření');
VIZ.chapter('train','§9 · Trénink & regularizace','Optimalizace a regularizace');
VIZ.chapter('cnn','§10 · CNN & RNN','Konvoluční a rekurentní sítě');
VIZ.chapter('nlp','§11 · NLP','Zpracování přirozeného jazyka');
VIZ.chapter('rl','§12 · Posilované učení','Reinforcement learning');

/* ---------- tiny DOM helper ---------- */
function el(tag, props, kids){
  const e=document.createElement(tag);
  if(props) for(const k in props){
    if(k==='class') e.className=props[k];
    else if(k==='html') e.innerHTML=props[k];
    else if(k==='text') e.textContent=props[k];
    else if(k.startsWith('on')&&typeof props[k]==='function') e.addEventListener(k.slice(2),props[k]);
    else if(k==='style'&&typeof props[k]==='object') Object.assign(e.style,props[k]);
    else e.setAttribute(k,props[k]);
  }
  if(kids){ (Array.isArray(kids)?kids:[kids]).forEach(c=>{ if(c==null)return; e.append(c.nodeType?c:document.createTextNode(c)); }); }
  return e;
}

/* ---------- colors ---------- */
const COL={accent:'#38bdf8',accent2:'#a78bfa',c1:'#fb923c',c2:'#60a5fa',c3:'#34d399',c4:'#f472b6',
  txt:'#dce3ea',muted:'#8b97a7',grid:'#1e2733',axis:'#3a4654',good:'#34d399',bad:'#f87171',warn:'#fbbf24',panel:'#0a0e13'};

/* ============================================================
   Plot — canvas with world coordinates + interaction
   ============================================================ */
class Plot{
  constructor(host,opts={}){
    this.h = opts.height||360;
    this.padL=opts.padL!=null?opts.padL:40; this.padR=opts.padR!=null?opts.padR:14;
    this.padT=opts.padT!=null?opts.padT:14; this.padB=opts.padB!=null?opts.padB:32;
    this.wrap = el('div',{class:'canvas-wrap'});
    this.canvas = el('canvas');
    this.wrap.append(this.canvas);
    host.append(this.wrap);
    this.ctx=this.canvas.getContext('2d');
    this.bounds={x0:-1,x1:1,y0:-1,y1:1};
    this._draw=null;
    this.W=600;
    const ro=new ResizeObserver(()=>this.resize());
    ro.observe(this.wrap);
    requestAnimationFrame(()=>this.resize());
  }
  resize(){
    const dpr=window.devicePixelRatio||1;
    const w=this.wrap.clientWidth||600;
    this.W=w; this.H=this.h;
    this.canvas.style.height=this.h+'px';
    this.canvas.width=Math.round(w*dpr);
    this.canvas.height=Math.round(this.h*dpr);
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    if(this._draw) this._draw();
  }
  world(x0,x1,y0,y1){ this.bounds={x0,x1,y0,y1}; return this; }
  get plotW(){return this.W-this.padL-this.padR;}
  get plotH(){return this.H-this.padT-this.padB;}
  X(x){const b=this.bounds;return this.padL+(x-b.x0)/(b.x1-b.x0)*this.plotW;}
  Y(y){const b=this.bounds;return this.padT+(1-(y-b.y0)/(b.y1-b.y0))*this.plotH;}
  ix(px){const b=this.bounds;return b.x0+(px-this.padL)/this.plotW*(b.x1-b.x0);}
  iy(py){const b=this.bounds;return b.y0+(1-(py-this.padT)/this.plotH)*(b.y1-b.y0);}
  redraw(fn){ this._draw=fn; fn(); return this; }
  clear(){ this.ctx.clearRect(0,0,this.W,this.H); this.ctx.fillStyle=COL.panel; this.ctx.fillRect(0,0,this.W,this.H); }
  frame(){ const c=this.ctx; c.strokeStyle=COL.axis; c.lineWidth=1; c.strokeRect(this.padL+.5,this.padT+.5,this.plotW,this.plotH); }
  grid(nx=8,ny=6){ const c=this.ctx,b=this.bounds; c.strokeStyle=COL.grid; c.lineWidth=1; c.beginPath();
    for(let i=0;i<=nx;i++){const x=this.padL+i/nx*this.plotW; c.moveTo(x,this.padT);c.lineTo(x,this.padT+this.plotH);}
    for(let j=0;j<=ny;j++){const y=this.padT+j/ny*this.plotH; c.moveTo(this.padL,y);c.lineTo(this.padL+this.plotW,y);}
    c.stroke();
  }
  axes(opts={}){ const c=this.ctx,b=this.bounds;
    this.grid(opts.nx||8,opts.ny||6); this.frame();
    c.fillStyle=COL.muted; c.font='11px -apple-system,sans-serif';
    c.textAlign='center'; c.textBaseline='top';
    const nx=opts.nx||8; for(let i=0;i<=nx;i++){const xv=b.x0+i/nx*(b.x1-b.x0); c.fillText(fmtN(xv),this.padL+i/nx*this.plotW,this.padT+this.plotH+5);}
    c.textAlign='right'; c.textBaseline='middle';
    const ny=opts.ny||6; for(let j=0;j<=ny;j++){const yv=b.y1-j/ny*(b.y1-b.y0); c.fillText(fmtN(yv),this.padL-5,this.padT+j/ny*this.plotH);}
    if(opts.xlabel){c.fillStyle=COL.muted;c.textAlign='right';c.textBaseline='bottom';c.fillText(opts.xlabel,this.padL+this.plotW,this.padT+this.plotH-4);}
    if(opts.ylabel){c.save();c.translate(12,this.padT+6);c.fillStyle=COL.muted;c.textAlign='left';c.textBaseline='top';c.fillText(opts.ylabel,0,0);c.restore();}
    if(opts.zero){ // draw bold zero lines if in range
      const c2=this.ctx; c2.strokeStyle=COL.axis; c2.lineWidth=1.4;
      if(b.x0<0&&b.x1>0){c2.beginPath();c2.moveTo(this.X(0),this.padT);c2.lineTo(this.X(0),this.padT+this.plotH);c2.stroke();}
      if(b.y0<0&&b.y1>0){c2.beginPath();c2.moveTo(this.padL,this.Y(0));c2.lineTo(this.padL+this.plotW,this.Y(0));c2.stroke();}
    }
  }
  clip(fn){const c=this.ctx;c.save();c.beginPath();c.rect(this.padL,this.padT,this.plotW,this.plotH);c.clip();fn();c.restore();}
  path(pts,o={}){ const c=this.ctx; if(pts.length<2)return; c.strokeStyle=o.stroke||COL.accent; c.lineWidth=o.width||2;
    if(o.dash)c.setLineDash(o.dash); c.beginPath(); c.moveTo(this.X(pts[0][0]),this.Y(pts[0][1]));
    for(let i=1;i<pts.length;i++)c.lineTo(this.X(pts[i][0]),this.Y(pts[i][1])); c.stroke(); c.setLineDash([]); }
  fnCurve(f,o={}){ const pts=[],n=o.n||160,b=this.bounds; for(let i=0;i<=n;i++){const x=b.x0+i/n*(b.x1-b.x0);const y=f(x);if(isFinite(y))pts.push([x,y]);} this.clip(()=>this.path(pts,o)); }
  poly(pts,o={}){ const c=this.ctx; if(pts.length<2)return; c.beginPath(); c.moveTo(this.X(pts[0][0]),this.Y(pts[0][1]));
    for(let i=1;i<pts.length;i++)c.lineTo(this.X(pts[i][0]),this.Y(pts[i][1])); c.closePath();
    if(o.fill){c.fillStyle=o.fill;c.fill();} if(o.stroke){c.strokeStyle=o.stroke;c.lineWidth=o.width||1.5;c.stroke();} }
  dot(x,y,o={}){ const c=this.ctx; c.beginPath(); c.arc(this.X(x),this.Y(y),o.r||4,0,7); c.fillStyle=o.fill||COL.accent; c.fill();
    if(o.stroke){c.strokeStyle=o.stroke;c.lineWidth=o.sw||1.5;c.stroke();} }
  ring(x,y,o={}){ const c=this.ctx; c.beginPath(); c.arc(this.X(x),this.Y(y),o.r||7,0,7); c.strokeStyle=o.stroke||COL.txt; c.lineWidth=o.width||2; c.stroke(); }
  seg(x1,y1,x2,y2,o={}){ const c=this.ctx; c.strokeStyle=o.stroke||COL.axis; c.lineWidth=o.width||1.5; if(o.dash)c.setLineDash(o.dash); c.beginPath(); c.moveTo(this.X(x1),this.Y(y1)); c.lineTo(this.X(x2),this.Y(y2)); c.stroke(); c.setLineDash([]); }
  arrow(x1,y1,x2,y2,o={}){ const c=this.ctx; const X1=this.X(x1),Y1=this.Y(y1),X2=this.X(x2),Y2=this.Y(y2);
    c.strokeStyle=o.stroke||COL.txt; c.fillStyle=o.stroke||COL.txt; c.lineWidth=o.width||2;
    c.beginPath();c.moveTo(X1,Y1);c.lineTo(X2,Y2);c.stroke();
    const a=Math.atan2(Y2-Y1,X2-X1),s=o.head||8;
    c.beginPath();c.moveTo(X2,Y2);c.lineTo(X2-s*Math.cos(a-.4),Y2-s*Math.sin(a-.4));c.lineTo(X2-s*Math.cos(a+.4),Y2-s*Math.sin(a+.4));c.closePath();c.fill(); }
  text(x,y,str,o={}){ const c=this.ctx; c.fillStyle=o.fill||COL.txt; c.font=o.font||'12px -apple-system,sans-serif';
    c.textAlign=o.align||'left'; c.textBaseline=o.baseline||'alphabetic';
    const px=o.px? x:this.X(x), py=o.px? y:this.Y(y); c.fillText(str,px,py); }
  // screen-space rect (px)
  pxRect(x,y,w,h,o={}){const c=this.ctx;if(o.fill){c.fillStyle=o.fill;c.fillRect(x,y,w,h);}if(o.stroke){c.strokeStyle=o.stroke;c.lineWidth=o.width||1;c.strokeRect(x+.5,y+.5,w,h);}}
  on(ev,cb){ this.canvas.addEventListener(ev,e=>{ const r=this.canvas.getBoundingClientRect();
    const cx=(e.touches?e.touches[0].clientX:e.clientX)-r.left, cy=(e.touches?e.touches[0].clientY:e.clientY)-r.top;
    cb({px:cx,py:cy,x:this.ix(cx),y:this.iy(cy),orig:e}); }); }
}

function fmtN(v){ if(Math.abs(v)<1e-9)v=0; const a=Math.abs(v); if(a!==0&&(a<0.01||a>=1000))return v.toExponential(1); return (Math.round(v*100)/100).toString(); }

/* ---------- UI controls ---------- */
function cardEl(host,title){ const c=el('div',{class:'card'}); if(title)c.append(el('h3',{text:title})); host.append(c); return c; }
function controlsRow(parent){ const r=el('div',{class:'controls'}); parent.append(r); return r; }
function slider(parent,o){ const wrap=el('div',{class:'ctl'}); const lab=el('label'); const inp=el('input',{type:'range',min:o.min,max:o.max,step:o.step,value:o.value});
  const fmt=o.fmt||(v=>v); const render=()=>lab.innerHTML=`${o.label}: <b>${fmt(+inp.value)}</b>`; render();
  inp.addEventListener('input',()=>{render(); o.oninput&&o.oninput(+inp.value);}); wrap.append(lab,inp); parent.append(wrap);
  return {el:wrap,input:inp,get:()=>+inp.value,set:v=>{inp.value=v;render();}}; }
function selectC(parent,o){ const wrap=el('div',{class:'ctl'}); wrap.append(el('label',{text:o.label})); const sel=el('select');
  o.options.forEach(op=>{const v=typeof op==='string'?op:op.value,t=typeof op==='string'?op:op.label; sel.append(el('option',{value:v,text:t}));});
  sel.value=o.value!=null?o.value:(typeof o.options[0]==='string'?o.options[0]:o.options[0].value);
  sel.addEventListener('change',()=>o.oninput&&o.oninput(sel.value)); wrap.append(sel); parent.append(wrap);
  return {el:wrap,sel,get:()=>sel.value}; }
function segC(parent,o){ const wrap=el('div',{class:'ctl'}); if(o.label)wrap.append(el('label',{text:o.label})); const seg=el('div',{class:'seg'});
  let cur=o.value!=null?o.value:(typeof o.options[0]==='string'?o.options[0]:o.options[0].value); const btns={};
  o.options.forEach(op=>{const v=typeof op==='string'?op:op.value,t=typeof op==='string'?op:op.label; const b=el('button',{text:t,class:v===cur?'on':''});
    b.addEventListener('click',()=>{cur=v;Object.entries(btns).forEach(([k,bb])=>bb.classList.toggle('on',k===v));o.oninput&&o.oninput(v);}); btns[v]=b; seg.append(b);});
  wrap.append(seg); parent.append(wrap); return {el:wrap,get:()=>cur,set:v=>{cur=v;Object.entries(btns).forEach(([k,bb])=>bb.classList.toggle('on',k===v));}}; }
function checkC(parent,o){ const lab=el('label',{class:'chk'}); const inp=el('input',{type:'checkbox'}); if(o.value)inp.checked=true;
  inp.addEventListener('change',()=>o.oninput&&o.oninput(inp.checked)); lab.append(inp,o.label); parent.append(lab); return {el:lab,get:()=>inp.checked,set:v=>inp.checked=v}; }
function button(parent,o){ const b=el('button',{class:'btn'+(o.primary?' primary':''),text:o.label}); b.addEventListener('click',o.onclick); parent.append(b); return b; }
function readout(parent){ const r=el('div',{class:'readout'}); parent.append(r); return {el:r,set:h=>r.innerHTML=h}; }
function legend(parent,items){ const l=el('div',{class:'legend'}); items.forEach(it=>l.append(el('span',{html:`<i style="background:${it.c}"></i>${it.t}`}))); parent.append(l); return l; }
function note(parent,html){ const n=el('div',{class:'note',html}); parent.append(n); return n; }

/* ============================================================
   linear algebra & stats helpers
   ============================================================ */
function solveLin(A,b){ // Gaussian elimination, A:n×n (array of rows), b:n
  const n=b.length, M=A.map((r,i)=>r.concat(b[i]));
  for(let col=0;col<n;col++){ let piv=col; for(let r=col+1;r<n;r++) if(Math.abs(M[r][col])>Math.abs(M[piv][col]))piv=r;
    [M[col],M[piv]]=[M[piv],M[col]]; const d=M[col][col]; if(Math.abs(d)<1e-12){continue;}
    for(let r=0;r<n;r++){ if(r===col)continue; const f=M[r][col]/d; for(let k=col;k<=n;k++)M[r][k]-=f*M[col][k]; } }
  return M.map((r,i)=>r[n]/(M[i][i]||1e-12)); }

function eigSym2(a,b,c,d){ // symmetric [[a,b],[b? ...]] uses a,b,c,d with b==c expected; sorted desc
  const bb=(b+c)/2; const tr=a+d, det=a*d-bb*bb; const disc=Math.sqrt(Math.max(0,tr*tr/4-det));
  let l1=tr/2+disc, l2=tr/2-disc; // l1>=l2
  function vec(l){ // (A-lI)v=0
    let vx,vy; if(Math.abs(bb)>1e-9){vx=l-d; vy=bb;} else {if(a>=d){vx=1;vy=0;}else{vx=0;vy=1;}}
    const n=Math.hypot(vx,vy)||1; return [vx/n,vy/n]; }
  return {l1,l2,v1:vec(l1),v2:vec(l2)}; }

function fitPolyRidge(xs,ys,deg,lambda){ // returns coeffs c0..c_deg for sum c_k x^k, ridge on k>=1
  const m=deg+1, n=xs.length; const XtX=Array.from({length:m},()=>new Array(m).fill(0)); const Xty=new Array(m).fill(0);
  for(let i=0;i<n;i++){ const pw=[]; let p=1; for(let k=0;k<m;k++){pw.push(p);p*=xs[i];}
    for(let a=0;a<m;a++){ for(let b=0;b<m;b++) XtX[a][b]+=pw[a]*pw[b]; Xty[a]+=pw[a]*ys[i]; } }
  for(let k=1;k<m;k++)XtX[k][k]+=lambda;
  return solveLin(XtX,Xty); }
function polyVal(c,x){ let p=1,s=0; for(let k=0;k<c.length;k++){s+=c[k]*p;p*=x;} return s; }

function gauss2(mean,cov){ // returns pdf(x,y)
  const [a,b,c,d]=[cov[0][0],cov[0][1],cov[1][0],cov[1][1]]; const det=a*d-b*c; const inv=[[d/det,-b/det],[-c/det,a/det]];
  const norm=1/(2*Math.PI*Math.sqrt(Math.max(det,1e-9)));
  return (x,y)=>{const dx=x-mean[0],dy=y-mean[1]; const q=dx*(inv[0][0]*dx+inv[0][1]*dy)+dy*(inv[1][0]*dx+inv[1][1]*dy); return norm*Math.exp(-0.5*q);}; }

/* seeded RNG (mulberry32) */
function rng(seed){ let s=seed>>>0; return ()=>{ s|=0;s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return((t^t>>>14)>>>0)/4294967296; }; }
function randnFrom(r){ let u=0,v=0; while(u===0)u=r(); while(v===0)v=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

/* ============================================================
   router + sidebar + boot
   ============================================================ */
VIZ.boot=function(){
  this.renderNav();
  window.addEventListener('hashchange',()=>this.route());
  // mobile menu
  const sb=document.getElementById('sidebar'),scrim=document.getElementById('scrim');
  document.getElementById('menuBtn').addEventListener('click',()=>{sb.classList.toggle('open');scrim.classList.toggle('show');});
  scrim.addEventListener('click',()=>{sb.classList.remove('open');scrim.classList.remove('show');});
  // search
  document.getElementById('search').addEventListener('input',e=>this.filter(e.target.value.toLowerCase()));
  this.route();
};
VIZ.renderNav=function(){
  const nav=document.getElementById('nav'); nav.innerHTML='';
  this.chapters.forEach(ch=>{ if(!ch.items.length)return;
    nav.append(el('div',{class:'ch',text:ch.label}));
    ch.items.forEach(it=>{ const a=el('a',{class:'item',href:'#'+it.id});
      a.append(el('span',{text:it.title})); if(it.ref)a.append(el('span',{class:'rf',text:it.ref}));
      a.dataset.search=(it.title+' '+(it.ref||'')+' '+ch.title+' '+(it.hint||'')).toLowerCase();
      nav.append(a); }); });
};
VIZ.filter=function(q){ document.querySelectorAll('#nav .item').forEach(a=>{ a.classList.toggle('hide', q && !a.dataset.search.includes(q)); });
  document.querySelectorAll('#nav .ch').forEach(h=>{ let n=h.nextElementSibling,any=false; while(n&&n.classList.contains('item')){if(!n.classList.contains('hide'))any=true;n=n.nextElementSibling;} h.style.display=any?'':'none'; }); };
VIZ.route=function(){
  const id=location.hash.slice(1); const view=document.getElementById('view');
  document.querySelectorAll('#nav .item').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+id));
  document.getElementById('sidebar').classList.remove('open'); document.getElementById('scrim').classList.remove('show');
  document.getElementById('content').scrollTop=0; window.scrollTo(0,0);
  const it=this.byId[id];
  view.innerHTML='';
  if(!it){ this.renderWelcome(view); return; }
  const head=el('div',{class:'head'});
  head.append(el('h1',{text:it.title}));
  if(it.ref){ const r=el('a',{class:'ref',href:'ml2_skripta.pdf',target:'_blank'}); r.innerHTML='📖 teorie ve skriptech · '+it.ref; head.append(r); }
  if(it.hint) head.append(el('p',{class:'hint',html:it.hint}));
  view.append(head);
  const body=el('div'); view.append(body);
  try{ it.build(body); }catch(err){ body.append(el('div',{class:'note',text:'Chyba ve vizualizaci: '+err.message})); console.error(err); }
};
VIZ.renderWelcome=function(view){
  const w=el('div',{class:'welcome'});
  w.append(el('div',{class:'head',html:'<h1>Interaktivní průvodce BI-ML2</h1>'}));
  w.append(el('p',{class:'hint',html:'Ke každé kapitole a podkapitole skript je tu <b>interaktivní vizualizace</b> — hraj si s posuvníky, taháním a tlačítky, abys viděl(a), <b>co daný pojem reálně dělá</b>. Teorie tu schválně není — ta je ve <a href="ml2_skripta.pdf" target="_blank">skriptech (PDF)</a>, na která každá stránka odkazuje. Vyber téma vlevo, nebo začni klikem níže.'}));
  const grid=el('div',{class:'grid'});
  this.chapters.forEach(ch=>{ if(ch.key==='intro'||!ch.items.length)return;
    ch.items.forEach(it=>{ const t=el('a',{class:'tile',href:'#'+it.id});
      t.append(el('div',{class:'n',text:ch.label})); t.append(el('div',{class:'t',text:it.title}));
      if(it.hint)t.append(el('div',{class:'d',html:it.hint.replace(/<[^>]+>/g,'').slice(0,90)+'…'})); grid.append(t); }); });
  w.append(grid); view.append(w);
};
