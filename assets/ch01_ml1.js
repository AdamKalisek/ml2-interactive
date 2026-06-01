/* ===== §1 Základy z ML1 ===== */

/* Prokletí dimenzionality */
VIZ.add('ml1',{ id:'curse', title:'Prokletí dimenzionality', ref:'§1.4', hint:'Posuň <b>dimenzi d</b> a sleduj, jak rychle se skoro všechny body přesunou do tenké slupky u povrchu krychle — v mnoha rozměrech je „uvnitř“ prakticky prázdno. Proto data ve vysoké dimenzi řídnou.',
  build(host){
    const c=cardEl(host,'Kolik bodů zůstane „uvnitř“?');
    const row=controlsRow(c);
    const p=new Plot(c,{height:300}); p.world(0,1,0,1);
    const ro=readout(c);
    let d=2, eps=0.1;
    function draw(){ p.clear(); p.axes({nx:5,ny:5});
      const inner=Math.pow(1-eps,d); // fraction inside the (1-eps) subcube
      // visual: outer square + inner square (only meaningful as 2D cartoon)
      p.poly([[0,0],[1,0],[1,1],[0,1]],{fill:'rgba(56,189,248,.12)',stroke:COL.accent,width:2});
      const s=eps/2;
      p.poly([[s,s],[1-s,s],[1-s,1-s],[s,1-s]],{fill:'rgba(251,146,60,.18)',stroke:COL.c1,width:2});
      p.text(0.5,0.5,(inner*100).toFixed(1)+'% bodů',{align:'center',baseline:'middle',fill:COL.c1,font:'600 15px sans-serif'});
      p.text(0.5,0.97,'slupka tloušťky ε/2 (modrá) — sem padne zbytek',{align:'center',baseline:'top',fill:COL.muted,font:'11px sans-serif'});
      ro.set(`d = <b>${d}</b>, ε = <b>${eps.toFixed(2)}</b> → uvnitř podkrychle: <b>${(inner*100).toFixed(2)}%</b> · ve slupce: <b style="color:${COL.warn}">${((1-inner)*100).toFixed(2)}%</b>`);
    }
    slider(row,{label:'dimenze d',min:1,max:200,step:1,value:d,oninput:v=>{d=v;draw();}});
    slider(row,{label:'tloušťka ε',min:0.01,max:0.5,step:0.01,value:eps,fmt:v=>v.toFixed(2),oninput:v=>{eps=v;draw();}});
    p.redraw(draw);
    note(c,'Pro d=100 a ε=0,01 je ve slupce 86,7 % bodů. Čtverec je jen kreslená analogie — vzorec (1−ε)^d platí v každé dimenzi.');
  }
});

/* Overfitting */
VIZ.add('ml1',{ id:'overfit', title:'Přeučení (overfitting)', ref:'§1.2', hint:'Zvyš <b>stupeň polynomu</b> — model se začne kroutit přesně skrz body (malá trénovací chyba), ale na nových (testovacích) datech zhorší. <b>Regularizace λ</b> ho zase uklidní. Sleduj obě chyby.',
  build(host){
    const c=cardEl(host,'Trénovací vs. testovací chyba');
    const row=controlsRow(c);
    const p=new Plot(c,{height:340}); p.world(-0.2,1.2,-1.6,1.6);
    const ro=readout(c);
    const r=rng(7); const N=12;
    const f=x=>Math.sin(2*Math.PI*x);
    const train=[],test=[];
    for(let i=0;i<N;i++){const x=i/(N-1);train.push([x,f(x)+0.28*randnFrom(r)]);}
    for(let i=0;i<40;i++){const x=r();test.push([x,f(x)+0.28*randnFrom(r)]);}
    let deg=1, lam=0;
    function draw(){ p.clear(); p.axes({zero:true,xlabel:'x'});
      const coef=fitPolyRidge(train.map(d=>d[0]),train.map(d=>d[1]),deg,lam);
      p.fnCurve(x=>f(x),{stroke:'#475569',width:1.5,dash:[5,4]});
      p.fnCurve(x=>polyVal(coef,x),{stroke:COL.accent,width:2.6});
      train.forEach(d=>p.dot(d[0],d[1],{r:4.5,fill:COL.c1}));
      let etr=0; train.forEach(d=>etr+=(d[1]-polyVal(coef,d[0]))**2); etr/=train.length;
      let ete=0; test.forEach(d=>ete+=(d[1]-polyVal(coef,d[0]))**2); ete/=test.length;
      const warn=ete>0.18;
      ro.set(`stupeň <b>${deg}</b>, λ=<b>${lam.toFixed(3)}</b> · trén. chyba MSE: <b style="color:${COL.c1}">${etr.toFixed(3)}</b> · test. chyba: <b style="color:${warn?COL.bad:COL.good}">${ete.toFixed(3)}</b> ${warn?'⚠ přeučeno':''}`);
    }
    slider(row,{label:'stupeň polynomu',min:1,max:11,step:1,value:deg,oninput:v=>{deg=v;draw();}});
    slider(row,{label:'regularizace λ',min:0,max:1,step:0.005,value:lam,fmt:v=>v.toFixed(3),oninput:v=>{lam=v;draw();}});
    p.redraw(draw);
    legend(c,[{c:'#475569',t:'pravda sin(2πx)'},{c:COL.accent,t:'model'},{c:COL.c1,t:'trénovací body'}]);
    note(c,'Zkus stupeň 10 s λ=0 (divoké kroucení) a pak λ zvyš — křivka se zklidní zpět k pravdě.');
  }
});

/* Gradient descent 1D */
VIZ.add('ml1',{ id:'gd1d', title:'Gradientní sestup (intuice)', ref:'§1.3', hint:'Gradientní sestup hledá minimum tak, že jde „z kopce“ proti směru derivace. Měň <b>krok ε</b> a startovní bod (klikni do grafu). Malý krok = pomalu; velký krok = přeskakuje a může utéct.',
  build(host){
    const c=cardEl(host,'Kulička valící se do minima');
    const row=controlsRow(c);
    const p=new Plot(c,{height:340}); p.world(-3.2,3.2,-0.5,9);
    const J=x=>0.5*x*x + 1.6*Math.sin(2.2*x); const dJ=x=>x+1.6*2.2*Math.cos(2.2*x);
    let eps=0.15, x=2.6, path=[x], playing=false, timer=null;
    const ro=readout(c);
    function draw(){ p.clear(); p.axes({zero:true,xlabel:'parametr w',ylabel:'chyba J'});
      p.fnCurve(J,{stroke:'#64748b',width:2});
      // path
      for(let i=0;i<path.length;i++){const xi=path[i];p.dot(xi,J(xi),{r: i===path.length-1?7:3.5,fill:i===path.length-1?COL.c1:'rgba(251,146,60,.5)'});}
      const g=dJ(x);
      // tangent
      p.seg(x-0.6,J(x)-0.6*g,x+0.6,J(x)+0.6*g,{stroke:COL.accent,width:1.5,dash:[4,3]});
      ro.set(`w = <b>${x.toFixed(3)}</b> · J(w) = <b>${J(x).toFixed(3)}</b> · gradient = <b>${g.toFixed(3)}</b> · krok = ${(-eps*g).toFixed(3)}`);
    }
    function step(){ const g=dJ(x); x=clamp(x-eps*g,-3.2,3.2); path.push(x); if(path.length>200)path.shift(); draw(); }
    slider(row,{label:'krok ε (learning rate)',min:0.01,max:1.2,step:0.01,value:eps,fmt:v=>v.toFixed(2),oninput:v=>eps=v});
    button(row,{label:'1 krok',onclick:step});
    const pb=button(row,{label:'▶ spustit',primary:true,onclick:()=>{ playing=!playing; pb.textContent=playing?'⏸ pauza':'▶ spustit';
      if(playing){timer=setInterval(step,90);}else clearInterval(timer); }});
    button(row,{label:'reset',onclick:()=>{x=2.6;path=[x];draw();}});
    p.on('pointerdown',e=>{x=clamp(e.x,-3.2,3.2);path=[x];draw();});
    p.redraw(draw);
    note(c,'Funkce má víc lokálních minim — kam dojdeš, závisí na startu i na ε. Zkus ε=1 (přeskakuje) vs ε=0,03 (pomalu).');
  }
});
