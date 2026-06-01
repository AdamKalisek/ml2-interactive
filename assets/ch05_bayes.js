/* ===== §5 Naivní Bayes ===== */

/* Naivní Bayes — 2D rozhodování */
VIZ.add('bayes',{ id:'nb', title:'Naivní Bayesův klasifikátor', ref:'§5.1–5.3', hint:'Každá třída je popsaná pravděpodobnostmi příznaků. <b>Táhni černý testovací bod</b> — vpravo se počítá P(x|y)·P(y) pro obě třídy a vybere se větší (MAP). „Naivní“ = příznaky bereme nezávisle (osově orientované elipsy). Měň i apriorní pravděpodobnost.',
  build(host){
    const c=cardEl(host,'MAP rozhodnutí a vliv apriorní pravděpodobnosti');
    const row=controlsRow(c);
    const p=new Plot(c,{height:420}); p.world(-1,8,-1,8);
    const ro=readout(c);
    // two classes, each: mean + per-feature std (diagonal cov => naive)
    const cls=[{m:[2.2,2.4],s:[1.0,1.3],col:COL.c2,name:'A'},{m:[5.2,5.0],s:[1.4,0.9],col:COL.c1,name:'B'}];
    let priorB=0.5; let test={x:4,y:3.6}; let drag=false;
    function g1(x,m,s){return Math.exp(-0.5*((x-m)/s)**2)/(s*Math.sqrt(2*Math.PI));}
    function px_y(pt,k){return g1(pt[0],cls[k].m[0],cls[k].s[0])*g1(pt[1],cls[k].m[1],cls[k].s[1]);}
    function draw(){ p.clear();
      const prior=[1-priorB,priorB];
      const nx=70,ny=58,cw=p.plotW/nx,chh=p.plotH/ny;
      p.clip(()=>{ for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const wx=p.ix(p.padL+(i+.5)*cw),wy=p.iy(p.padT+(j+.5)*chh);
        const a=px_y([wx,wy],0)*prior[0], b=px_y([wx,wy],1)*prior[1]; const col=b>a?'251,146,60':'96,165,250'; const conf=Math.abs(b-a)/(a+b+1e-12);
        p.pxRect(p.padL+i*cw,p.padT+j*chh,cw+1,chh+1,{fill:`rgba(${col},${0.06+0.22*conf})`});}});
      p.axes({nx:9,ny:9,xlabel:'příznak X₁',ylabel:'X₂'});
      // contour-ish: draw class mean crosses
      cls.forEach(cl=>{p.dot(cl.m[0],cl.m[1],{r:5,fill:cl.col,stroke:'#fff',sw:1.5}); for(let kx=-2;kx<=2;kx++)for(let ky=-2;ky<=2;ky++){if((kx*kx+ky*ky)>4)continue;}});
      // ellipses (1 std)
      cls.forEach(cl=>{const e=[];for(let a=0;a<=64;a++){const th=a/64*6.283;e.push([cl.m[0]+cl.s[0]*Math.cos(th),cl.m[1]+cl.s[1]*Math.sin(th)]);}p.path(e,{stroke:cl.col,width:1.5,dash:[4,3]});});
      p.dot(test.x,test.y,{r:7,fill:'#111',stroke:'#fff',sw:2});
      const prr=[1-priorB,priorB]; const sA=px_y([test.x,test.y],0)*prr[0], sB=px_y([test.x,test.y],1)*prr[1];
      const win=sB>sA?'B':'A';
      ro.set(`P(x|A)·P(A)=<b style="color:${COL.c2}">${sA.toExponential(2)}</b> · P(x|B)·P(B)=<b style="color:${COL.c1}">${sB.toExponential(2)}</b> → MAP: <b class="tag" style="background:${win==='B'?COL.c1:COL.c2};color:#111">třída ${win}</b>`);
    }
    slider(row,{label:'apriorní P(B)',min:0.05,max:0.95,step:0.01,value:priorB,fmt:v=>v.toFixed(2),oninput:v=>{priorB=v;draw();}});
    p.redraw(draw);
    p.on('pointerdown',e=>{drag=true;test.x=clamp(e.x,-1,8);test.y=clamp(e.y,-1,8);draw();});
    p.on('pointermove',e=>{if(drag){test.x=clamp(e.x,-1,8);test.y=clamp(e.y,-1,8);draw();}});
    window.addEventListener('pointerup',()=>drag=false);
    note(c,'Elipsy jsou osově orientované — to je ten „naivní“ předpoklad nezávislosti příznaků. Zvýšením apriorní P(B) posuneš hranici ve prospěch oranžové třídy.');
  }
});

/* Bayesovský odhad — Beta, add-one smoothing */
VIZ.add('bayes',{ id:'beta', title:'Bayesovský odhad a add-one smoothing', ref:'§5.4', hint:'Házíš mincí: <b>N₁</b> hlav, <b>N₀</b> orlů. Apriorní Beta(1,1) (rovnoměrné, „nic nevím“) se daty změní na aposteriorní. MLE odhad může <b>zkolabovat na 0/1</b>, Bayesův (střední hodnota aposteriorního) ne.',
  build(host){
    const c=cardEl(host,'Apriorní → aposteriorní rozdělení parametru p');
    const row=controlsRow(c);
    const p=new Plot(c,{height:360});
    const ro=readout(c);
    let N1=1,N0=4;
    function betaPdf(a,b){ // returns array of [p, density] normalized numerically
      const xs=[],raw=[]; let area=0; const M=200;
      for(let i=0;i<=M;i++){const x=i/M; const v=Math.pow(x,a-1)*Math.pow(1-x,b-1); raw.push(v);}
      for(let i=0;i<M;i++)area+=(raw[i]+raw[i+1])/2/M;
      for(let i=0;i<=M;i++)xs.push([i/M, raw[i]/(area||1)]);
      return xs; }
    function draw(){ const post=betaPdf(N1+1,N0+1); let ymax=Math.max(4,...post.map(d=>d[1]))*1.1;
      p.world(0,1,0,ymax); p.clear(); p.axes({nx:5,ny:5,xlabel:'p (pst. hlavy)'});
      p.path(betaPdf(1,1),{stroke:COL.muted,width:1.5,dash:[5,4]}); // prior
      p.clip(()=>p.path(post,{stroke:COL.accent,width:2.6}));
      const mle=N1/Math.max(1,(N0+N1)); const bayes=(N1+1)/(N0+N1+2);
      p.seg(mle,0,mle,ymax,{stroke:COL.bad,width:1.5,dash:[3,3]});
      p.seg(bayes,0,bayes,ymax,{stroke:COL.good,width:2});
      ro.set(`MLE p̂ = <b style="color:${COL.bad}">${mle.toFixed(3)}</b> ${(mle===0||mle===1)?'⚠ kolaps!':''} · Bayes (add-one) p̂ = <b style="color:${COL.good}">${bayes.toFixed(3)}</b> = (N₁+1)/(N₀+N₁+2)`);
    }
    slider(row,{label:'N₁ (hlavy)',min:0,max:30,step:1,value:N1,oninput:v=>{N1=v;draw();}});
    slider(row,{label:'N₀ (orly)',min:0,max:30,step:1,value:N0,oninput:v=>{N0=v;draw();}});
    p.redraw(draw);
    legend(c,[{c:COL.muted,t:'apriorní Beta(1,1)'},{c:COL.accent,t:'aposteriorní'},{c:COL.bad,t:'MLE'},{c:COL.good,t:'Bayes (add-one)'}]);
    note(c,'Nastav N₁=0 — MLE řekne p̂=0 (třída pak nikdy nevyhraje), zatímco Bayesův odhad zůstane rozumný (1/(N₀+2)). To je celé kouzlo add-one smoothingu.');
  }
});
