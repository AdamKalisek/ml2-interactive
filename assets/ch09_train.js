/* ===== §9 Trénink, optimalizace, regularizace ===== */

/* Optimizers race */
VIZ.add('train',{ id:'opt', title:'Optimalizační metody (závod)', ref:'§9.2–9.4', hint:'Tři optimalizátory startují ze stejného bodu na „údolí“ chyby. <b>SGD</b> osciluje napříč úzkým údolím, <b>momentum</b> má setrvačnost, <b>Adam</b> adaptuje krok pro každý směr. Měň learning rate, <b>klikni pro nový start</b> a spusť.',
  build(host){
    const c=cardEl(host,'SGD vs. momentum vs. Adam na úzkém údolí');
    const row=controlsRow(c);
    const p=new Plot(c,{height:420}); p.world(-5,5,-4,4);
    const ro=readout(c);
    // loss: narrow ravine
    const A=0.12,B=2.0; const f=(x,y)=>A*x*x+B*y*y; const gx=(x,y)=>2*A*x, gy=(x,y)=>2*B*y;
    let lr=0.12, start={x:-4.2,y:3.2}, opt={}, playing=false, timer=null;
    function reset(){ opt={ sgd:{x:start.x,y:start.y,path:[[start.x,start.y]]},
      mom:{x:start.x,y:start.y,vx:0,vy:0,path:[[start.x,start.y]]},
      adam:{x:start.x,y:start.y,sx:0,sy:0,rx:0,ry:0,t:0,path:[[start.x,start.y]]} }; }
    function step(){ const e=lr;
      // SGD
      {const o=opt.sgd;o.x-=e*gx(o.x,o.y);o.y-=e*gy(o.x,o.y);o.path.push([o.x,o.y]);}
      // momentum
      {const o=opt.mom,mu=0.85;o.vx=mu*o.vx-e*gx(o.x,o.y);o.vy=mu*o.vy-e*gy(o.x,o.y);o.x+=o.vx;o.y+=o.vy;o.path.push([o.x,o.y]);}
      // adam
      {const o=opt.adam,b1=0.9,b2=0.999,d=1e-8;o.t++;const Gx=gx(o.x,o.y),Gy=gy(o.x,o.y);
        o.sx=b1*o.sx+(1-b1)*Gx;o.sy=b1*o.sy+(1-b1)*Gy;o.rx=b2*o.rx+(1-b2)*Gx*Gx;o.ry=b2*o.ry+(1-b2)*Gy*Gy;
        const sxh=o.sx/(1-b1**o.t),syh=o.sy/(1-b1**o.t),rxh=o.rx/(1-b2**o.t),ryh=o.ry/(1-b2**o.t);
        o.x-=e*3*sxh/(Math.sqrt(rxh)+d);o.y-=e*3*syh/(Math.sqrt(ryh)+d);o.path.push([o.x,o.y]);}
      draw(); }
    function draw(){ p.clear();
      const nx=80,ny=64,cw=p.plotW/nx,chh=p.plotH/ny;
      p.clip(()=>{for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const wx=p.ix(p.padL+(i+.5)*cw),wy=p.iy(p.padT+(j+.5)*chh);const v=f(wx,wy);const t=Math.min(1,v/30);p.pxRect(p.padL+i*cw,p.padT+j*chh,cw+1,chh+1,{fill:`rgba(56,189,248,${0.04+0.30*t})`});}});
      p.axes({nx:10,ny:8,zero:true});
      p.dot(0,0,{r:5,fill:COL.good,stroke:'#fff',sw:1.5}); // minimum
      const cols={sgd:COL.bad,mom:COL.warn,adam:COL.c3};
      ['sgd','mom','adam'].forEach(k=>{const o=opt[k];p.path(o.path,{stroke:cols[k],width:2});p.dot(o.x,o.y,{r:5,fill:cols[k],stroke:'#0a0e13',sw:1});});
      ro.set(`vzdálenost k minimu — SGD: <b style="color:${COL.bad}">${Math.hypot(opt.sgd.x,opt.sgd.y).toFixed(2)}</b> · momentum: <b style="color:${COL.warn}">${Math.hypot(opt.mom.x,opt.mom.y).toFixed(2)}</b> · Adam: <b style="color:${COL.c3}">${Math.hypot(opt.adam.x,opt.adam.y).toFixed(2)}</b>`);
    }
    slider(row,{label:'learning rate',min:0.02,max:0.45,step:0.01,value:lr,fmt:v=>v.toFixed(2),oninput:v=>lr=v});
    button(row,{label:'1 krok',onclick:step});
    const pb=button(row,{label:'▶ závod',primary:true,onclick:()=>{playing=!playing;pb.textContent=playing?'⏸':'▶ závod';if(playing)timer=setInterval(step,90);else clearInterval(timer);}});
    button(row,{label:'reset',onclick:()=>{reset();draw();}});
    p.on('pointerdown',e=>{start={x:clamp(e.x,-5,5),y:clamp(e.y,-4,4)};reset();draw();});
    reset(); p.redraw(draw);
    legend(c,[{c:COL.bad,t:'SGD'},{c:COL.warn,t:'momentum'},{c:COL.c3,t:'Adam'},{c:COL.good,t:'minimum'}]);
    note(c,'Údolí je úzké ve svislém směru (velká křivost) a ploché vodorovně. SGD cik-cak osciluje, momentum to vyhladí, Adam si škáluje krok zvlášť pro každou osu.');
  }
});

/* Dropout */
VIZ.add('train',{ id:'dropout', title:'Regularizace: dropout', ref:'§9.5', hint:'Při trénování se <b>náhodně vynulují</b> některé neurony (pro každou dávku znovu). Síť se tak nesmí spoléhat na jeden neuron a informaci rozprostře. Měň pravděpodobnost p a generuj nové dávky.',
  build(host){
    const c=cardEl(host,'Náhodné vypínání neuronů');
    const row=controlsRow(c);
    const p=new Plot(c,{height:380}); p.world(0,10,0,10);
    let pdrop=0.5, seed=1;
    const layers=[3,6,6,2];
    function draw(){ p.clear();
      const r=rng(seed); const xs=layers.map((_,i)=>1.2+i*(7.6/(layers.length-1)));
      const drop=layers.map((n,li)=>Array.from({length:n},(_,k)=> (li>0&&li<layers.length-1)? r()<pdrop : false));
      const ys=layers.map(n=>Array.from({length:n},(_,k)=>1.5+k*(7/(Math.max(1,n-1)))));
      // edges
      for(let li=0;li<layers.length-1;li++)for(let a=0;a<layers[li];a++)for(let b=0;b<layers[li+1];b++){
        if(drop[li][a]||drop[li+1][b])continue; p.seg(xs[li],ys[li][a],xs[li+1],ys[li+1][b],{stroke:'rgba(120,140,160,.25)',width:1});}
      layers.forEach((n,li)=>{for(let k=0;k<n;k++){const d=drop[li][k];p.dot(xs[li],ys[li][k],{r:9,fill:d?'#2a3340':(li===0?COL.c2:li===layers.length-1?COL.c1:COL.accent),stroke:d?'#445':'#0a0e13',sw:d?1.5:1.5});if(d)p.text(xs[li],ys[li][k],'×',{align:'center',baseline:'middle',fill:'#889',font:'14px sans-serif'});}});
      p.text(xs[0],0.6,'vstup',{align:'center',fill:COL.muted,font:'11px sans-serif'});
      p.text(xs[layers.length-1],0.6,'výstup',{align:'center',fill:COL.muted,font:'11px sans-serif'});
    }
    slider(row,{label:'pst. vypnutí p',min:0,max:0.8,step:0.05,value:pdrop,fmt:v=>v.toFixed(2),oninput:v=>{pdrop=v;draw();}});
    button(row,{label:'🎲 nová dávka',primary:true,onclick:()=>{seed++;draw();}});
    p.redraw(draw);
    note(c,'Každá dávka trénuje jinou „podsíť“ (analogie k baggingu). Při predikci se nic nevypíná. Zvyšuje to schopnost generalizace. Typicky p≈0,5 pro skryté vrstvy, ≈0,2 pro vstupy.');
  }
});

/* Vanishing/exploding gradient */
VIZ.add('train',{ id:'vanish', title:'Hloubka: mizející a explodující gradient', ref:'§9.6', hint:'Triviální hluboká síť f = x·wˡ. Sleduj, jak <b>relativní změna výstupu</b> po jednom kroku gradientního sestupu závisí na váze w a hloubce l. Pro malé w mizí (gradient se „ztratí“), pro velké exploduje.',
  build(host){
    const c=cardEl(host,'Proč je hluboké učení těžké');
    const row=controlsRow(c);
    const p=new Plot(c,{height:360}); p.world(0.4,1.5,-6,2);
    const ro=readout(c);
    let l=10, eps=0.01, x=1;
    function relChange(w){ const f=x*Math.pow(w,l); const grad=x*l*Math.pow(w,l-1); const wn=w-eps*grad; const fn=x*Math.pow(wn,l); return Math.abs((f-fn)/(f||1e-9)); }
    function draw(){ p.clear(); p.axes({nx:11,ny:8,xlabel:'váha w',ylabel:'log₁₀ relativní změny'});
      p.fnCurve(w=>Math.log10(Math.max(1e-7,relChange(w))),{stroke:COL.accent,width:2.6,n:200});
      p.seg(0.4,0,1.5,0,{stroke:'#475569',width:1,dash:[4,3]});
      ro.set(`hloubka l=<b>${l}</b> · u w=0,8: rel. změna ≈ <b style="color:${COL.warn}">${(relChange(0.8)*100).toExponential(1)}%</b> · u w=1,2: ≈ <b style="color:${COL.bad}">${(relChange(1.2)*100).toExponential(1)}%</b>`);
    }
    slider(row,{label:'hloubka l',min:2,max:40,step:1,value:l,oninput:v=>{l=v;draw();}});
    p.redraw(draw);
    note(c,'Malé w → relativní změna mizivá (potřeba obří learning rate); velké w → exploduje (potřeba mrňavý). Těžko se volí jeden krok pro všechny. Řeší to dávková normalizace (batch norm).');
  }
});
