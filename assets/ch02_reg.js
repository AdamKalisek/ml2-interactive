/* ===== §2 Regrese, bázové funkce, jádrový trik ===== */

/* Bázové funkce: jak se z RBF skládá křivka */
VIZ.add('reg',{ id:'basis', title:'Lineární model bázových funkcí', ref:'§2.3', hint:'Model je <b>vážený součet bázových funkcí</b> (tady RBF „hrbolky“). Slabě jsou vidět jednotlivé báze, tučně jejich součet, který se učí proložit body. Měň počet bází a jejich šířku.',
  build(host){
    const c=cardEl(host,'Součet bázových funkcí = výsledná křivka');
    const row=controlsRow(c);
    const p=new Plot(c,{height:360}); p.world(0,1,-1.6,1.6);
    const r=rng(3); const f=x=>Math.sin(2*Math.PI*x);
    const data=[]; for(let i=0;i<11;i++){const x=i/10;data.push([x,f(x)+0.18*randnFrom(r)]);}
    let K=6, gamma=40, showBasis=true, lam=0.001;
    function centers(){const a=[];for(let j=0;j<K;j++)a.push(j/(K-1));return a;}
    function fit(){ const ctr=centers(); const Phi=data.map(d=>ctr.map(mu=>Math.exp(-gamma*(d[0]-mu)**2)));
      const m=K; const A=Array.from({length:m},()=>new Array(m).fill(0)); const bvec=new Array(m).fill(0);
      for(let i=0;i<data.length;i++)for(let a=0;a<m;a++){for(let b=0;b<m;b++)A[a][b]+=Phi[i][a]*Phi[i][b];bvec[a]+=Phi[i][a]*data[i][1];}
      for(let k=0;k<m;k++)A[k][k]+=lam;
      const w=solveLin(A,bvec); return {ctr,w}; }
    function draw(){ p.clear(); p.axes({zero:true,xlabel:'x'});
      const {ctr,w}=fit();
      if(showBasis) ctr.forEach((mu,j)=>p.fnCurve(x=>w[j]*Math.exp(-gamma*(x-mu)**2),{stroke:'rgba(167,139,250,.5)',width:1.3}));
      p.fnCurve(x=>ctr.reduce((s,mu,j)=>s+w[j]*Math.exp(-gamma*(x-mu)**2),0),{stroke:COL.accent,width:2.8});
      data.forEach(d=>p.dot(d[0],d[1],{r:4.5,fill:COL.c1}));
      ctr.forEach(mu=>p.dot(mu,-1.5,{r:3,fill:COL.accent2}));
    }
    slider(row,{label:'počet bází K',min:2,max:12,step:1,value:K,oninput:v=>{K=v;draw();}});
    slider(row,{label:'šířka γ',min:3,max:120,step:1,value:gamma,oninput:v=>{gamma=v;draw();}});
    checkC(row,{label:'ukázat jednotlivé báze',value:true,oninput:v=>{showBasis=v;draw();}});
    p.redraw(draw);
    legend(c,[{c:COL.accent2,t:'jednotlivé RBF báze'},{c:COL.accent,t:'jejich vážený součet = model'},{c:COL.c1,t:'data'}]);
    note(c,'Hodně bází + malá regularizace = model si sedne na šum. Tohle je přesně lineární model v novém příznakovém prostoru φ(x).');
  }
});

/* Jádrový trik — lift 1D -> 2D */
VIZ.add('reg',{ id:'kerneltrick', title:'Jádrový trik (zvednutí do vyšší dimenze)', ref:'§2.5', hint:'Dole je 1D úloha, kterou <b>nejde rozdělit jedním bodem</b> (oranžová uprostřed, modrá po krajích). Mapování φ(x)=(x, x²) je <b>zvedne do 2D</b>, kde už je oddělí přímka. To dělá jádro — implicitně.',
  build(host){
    const c=cardEl(host,'Z 1D do 2D: φ(x) = (x, x²)');
    const row=controlsRow(c);
    const p=new Plot(c,{height:380}); p.world(-2.4,2.4,-0.6,5);
    let t=0; // 0 = 1D, 1 = lifted
    const pts=[]; for(let i=0;i<17;i++){const x=-2+ i*0.25; pts.push({x, cls: Math.abs(x)<1?1:0});}
    const thresh=1; // x^2 = 1 boundary
    function colr(cl){return cl?COL.c1:COL.c2;}
    function draw(){ p.clear(); p.axes({zero:true,xlabel:'x',ylabel:'φ₂ = x²'});
      if(t>0.05){ p.seg(-2.4,thresh, 2.4,thresh,{stroke:COL.good,width:2,dash:[6,4]});
        p.text(-2.3,thresh+0.12,'dělicí přímka (x²=1)',{fill:COL.good,font:'12px sans-serif'}); }
      pts.forEach(d=>{ const y=t*(d.x*d.x); p.dot(d.x,y,{r:6,fill:colr(d.cls),stroke:'#0a0e13',sw:1.5}); });
      if(t<0.05) p.text(0,-0.4,'1D: žádný jediný bod neoddělí oranžové od modrých',{align:'center',fill:COL.muted,font:'12px sans-serif'});
    }
    const sl=slider(row,{label:'zvednutí do 2D',min:0,max:1,step:0.02,value:0,fmt:v=>Math.round(v*100)+'%',oninput:v=>{t=v;draw();}});
    button(row,{label:'▶ animovat zvednutí',primary:true,onclick:()=>{ let v=0; const id=setInterval(()=>{v+=0.04;if(v>=1){v=1;clearInterval(id);}sl.set(v);t=v;draw();},25); }});
    button(row,{label:'zpět na 1D',onclick:()=>{t=0;sl.set(0);draw();}});
    p.redraw(draw);
    note(c,'V duální reprezentaci se body vyskytují jen ve skalárních součinech, takže φ stačí nahradit jádrem k(x,y)=φ(x)ᵀφ(y) a do té vyšší dimenze nemusíme vůbec počítat.');
  }
});

/* Jádrová regrese */
VIZ.add('reg',{ id:'kernelreg', title:'Jádrová regrese', ref:'§2.4', hint:'Predikce = <b>vážený součet jader</b> ze všech trénovacích bodů: f(x)=Σ αᵢ·k(xᵢ,x). Měň šířku γ Gaussova jádra a regularizaci λ. Slabé křivky jsou příspěvky jednotlivých bodů.',
  build(host){
    const c=cardEl(host,'Predikce jako vážená kombinace jader');
    const row=controlsRow(c);
    const p=new Plot(c,{height:360}); p.world(0,1,-1.7,1.7);
    const r=rng(11); const f=x=>Math.sin(2*Math.PI*x);
    const data=[]; for(let i=0;i<12;i++){const x=i/11;data.push([x,f(x)+0.2*randnFrom(r)]);}
    let gamma=60, lam=0.05, showK=true;
    function solveAlpha(){ const n=data.length; const G=Array.from({length:n},(_,i)=>data.map(d=>Math.exp(-gamma*(data[i][0]-d[0])**2)));
      const A=G.map((row,i)=>row.map((v,j)=>v+(i===j?lam:0))); return {alpha:solveLin(A,data.map(d=>d[1]))}; }
    function draw(){ p.clear(); p.axes({zero:true,xlabel:'x'});
      const {alpha}=solveAlpha();
      if(showK) data.forEach((d,i)=>p.fnCurve(x=>alpha[i]*Math.exp(-gamma*(x-d[0])**2),{stroke:'rgba(52,211,153,.35)',width:1.1}));
      p.fnCurve(x=>data.reduce((s,d,i)=>s+alpha[i]*Math.exp(-gamma*(x-d[0])**2),0),{stroke:COL.accent,width:2.8});
      data.forEach(d=>p.dot(d[0],d[1],{r:4.5,fill:COL.c1}));
    }
    slider(row,{label:'šířka jádra γ',min:5,max:300,step:1,value:gamma,oninput:v=>{gamma=v;draw();}});
    slider(row,{label:'regularizace λ',min:0.001,max:1,step:0.005,value:lam,fmt:v=>v.toFixed(3),oninput:v=>{lam=v;draw();}});
    checkC(row,{label:'ukázat příspěvky αᵢ·k',value:true,oninput:v=>{showK=v;draw();}});
    p.redraw(draw);
    legend(c,[{c:COL.c3,t:'příspěvek jednoho bodu αᵢ·k(xᵢ,x)'},{c:COL.accent,t:'predikce f(x)'},{c:COL.c1,t:'data'}]);
    note(c,'Velké γ = úzká jádra = model „skáče“ od bodu k bodu. Malé γ = široká jádra = hladká, ale málo přizpůsobivá predikce. λ tlumí přeučení.');
  }
});
