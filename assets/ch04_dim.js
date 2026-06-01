/* ===== §4 Redukce dimenzionality ===== */

/* Ortogonální projekce */
VIZ.add('dim',{ id:'proj', title:'Ortogonální projekce', ref:'§4.2', hint:'<b>Otáčej přímkou</b> (osou projekce). Body se promítnou kolmo na ni — červené úsečky jsou <b>chyba projekce</b> (co zahodíme). Sleduj, jak se mění součet čtverců chyb; nejmenší je přesně ve směru největšího rozptylu.',
  build(host){
    const c=cardEl(host,'Promítnutí na 1D podprostor');
    const row=controlsRow(c);
    const p=new Plot(c,{height:400}); p.world(-4,4,-4,4);
    const ro=readout(c);
    const r=rng(5); const data=[]; for(let i=0;i<40;i++){const t=randnFrom(r)*1.9; data.push([t+0.5*randnFrom(r), 0.6*t+0.5*randnFrom(r)]);}
    const mx=data.reduce((s,d)=>s+d[0],0)/data.length, my=data.reduce((s,d)=>s+d[1],0)/data.length;
    let theta=0.2;
    function optAngle(){ let a=0,b=0,cc=0; data.forEach(d=>{const x=d[0]-mx,y=d[1]-my;a+=x*x;b+=x*y;cc+=y*y;}); const e=eigSym2(a/(data.length-1),b/(data.length-1),b/(data.length-1),cc/(data.length-1)); return Math.atan2(e.v1[1],e.v1[0]); }
    function draw(){ p.clear(); p.axes({nx:8,ny:8,zero:true});
      const u=[Math.cos(theta),Math.sin(theta)];
      p.seg(mx-6*u[0],my-6*u[1],mx+6*u[0],my+6*u[1],{stroke:COL.accent2,width:2});
      let err=0;
      data.forEach(d=>{ const cx=d[0]-mx,cy=d[1]-my; const t=cx*u[0]+cy*u[1]; const px=mx+t*u[0],py=my+t*u[1];
        p.seg(d[0],d[1],px,py,{stroke:'rgba(248,113,113,.6)',width:1}); err+=(d[0]-px)**2+(d[1]-py)**2;
        p.dot(px,py,{r:3,fill:COL.accent2}); p.dot(d[0],d[1],{r:4,fill:COL.c2}); });
      ro.set(`úhel osy: <b>${(theta*180/Math.PI).toFixed(0)}°</b> · součet čtverců chyb projekce: <b style="color:${COL.bad}">${err.toFixed(1)}</b>`);
    }
    const sl=slider(row,{label:'úhel osy',min:-1.57,max:1.57,step:0.01,value:theta,fmt:v=>(v*180/Math.PI).toFixed(0)+'°',oninput:v=>{theta=v;draw();}});
    button(row,{label:'➜ minimum chyby (PCA směr)',primary:true,onclick:()=>{theta=optAngle();sl.set(theta);draw();}});
    p.redraw(draw);
    legend(c,[{c:COL.c2,t:'původní body'},{c:COL.accent2,t:'projekce na osu'},{c:COL.bad,t:'chyba projekce'}]);
    note(c,'Minimalizace chyby projekce = maximalizace rozptylu projekcí. Optimální osa je první hlavní komponenta (tlačítko).');
  }
});

/* PCA */
VIZ.add('dim',{ id:'pca', title:'Analýza hlavních komponent (PCA)', ref:'§4.3', hint:'PCA najde <b>směry největšího rozptylu</b> = vlastní vektory kovarianční matice. Měň <b>korelaci</b> dat a sleduj, jak se hlavní osy natáčejí. Délka šipky ∝ √(vlastní číslo) = směrodatná odchylka v tom směru.',
  build(host){
    const c=cardEl(host,'Hlavní osy = vlastní vektory kovariance');
    const row=controlsRow(c);
    const p=new Plot(c,{height:400}); p.world(-4,4,-4,4);
    const ro=readout(c);
    let corr=0.8, spread=1.0, data=[];
    function gen(){ const r=rng(9); data=[]; for(let i=0;i<120;i++){const a=randnFrom(r),b=randnFrom(r); data.push([2*spread*a, spread*(corr*a+Math.sqrt(1-corr*corr)*b)]);}}
    function draw(){ p.clear(); p.axes({nx:8,ny:8,zero:true});
      const mx=data.reduce((s,d)=>s+d[0],0)/data.length, my=data.reduce((s,d)=>s+d[1],0)/data.length;
      let a=0,b=0,cc=0; data.forEach(d=>{const x=d[0]-mx,y=d[1]-my;a+=x*x;b+=x*y;cc+=y*y;}); const n=data.length-1; a/=n;b/=n;cc/=n;
      const e=eigSym2(a,b,b,cc);
      data.forEach(d=>p.dot(d[0],d[1],{r:3,fill:'rgba(96,165,250,.8)'}));
      const s1=Math.sqrt(Math.max(0,e.l1)),s2=Math.sqrt(Math.max(0,e.l2));
      p.arrow(mx,my,mx+e.v1[0]*s1*2,my+e.v1[1]*s1*2,{stroke:COL.c1,width:3,head:10});
      p.arrow(mx,my,mx+e.v2[0]*s2*2,my+e.v2[1]*s2*2,{stroke:COL.accent2,width:3,head:10});
      p.text(mx+e.v1[0]*s1*2,my+e.v1[1]*s1*2,' PC1',{fill:COL.c1,font:'600 12px sans-serif'});
      const tot=e.l1+e.l2;
      ro.set(`λ₁=<b>${e.l1.toFixed(2)}</b> (PC1), λ₂=<b>${e.l2.toFixed(2)}</b> (PC2) · PC1 vysvětluje <b style="color:${COL.c1}">${(100*e.l1/tot).toFixed(1)}%</b> rozptylu`);
    }
    slider(row,{label:'korelace příznaků',min:-0.98,max:0.98,step:0.02,value:corr,fmt:v=>v.toFixed(2),oninput:v=>{corr=v;gen();draw();}});
    slider(row,{label:'rozptyl',min:0.3,max:2,step:0.05,value:spread,fmt:v=>v.toFixed(2),oninput:v=>{spread=v;gen();draw();}});
    gen(); p.redraw(draw);
    legend(c,[{c:COL.c1,t:'1. hlavní komponenta (max rozptyl)'},{c:COL.accent2,t:'2. hlavní komponenta'}]);
    note(c,'Při korelaci ≈0 jsou λ₁≈λ₂ (žádný výrazný směr). Při silné korelaci nese PC1 skoro všechen rozptyl — druhou dimenzi lze zahodit.');
  }
});

/* Manifold / LLE — swiss roll unroll */
VIZ.add('dim',{ id:'lle', title:'Manifold learning (rozbalení variety)', ref:'§4.1, §4.4', hint:'„Švýcarská rolka“: data leží na <b>stočené 2D ploše</b> ve vyšší dimenzi. Lineární projekce (PCA) ji rozmáčkne, ale manifold learning (LLE) ji umí <b>rozbalit</b> a zachovat lokální sousedství (barvy). Klikni na rozbalení.',
  build(host){
    const c=cardEl(host,'Stočená varieta a její rozbalení');
    const row=controlsRow(c);
    const p=new Plot(c,{height:420}); p.world(-1.2,1.2,-1.2,1.2);
    let t=0; const N=420; const pts=[];
    const r=rng(2); for(let i=0;i<N;i++){const u=r();const v=r();const phi=1.5*Math.PI*(1+2*u); pts.push({phi,u,v});}
    function hsl(u){const h=240-220*u;return `hsl(${h},70%,60%)`;}
    function draw(){ p.clear(); p.axes({nx:6,ny:6,zero:true});
      pts.forEach(pt=>{ // rolled: spiral radius~phi; unrolled: x = arclength(phi)
        const rad=pt.phi/(1.5*Math.PI*3); // 0..1
        const rx=rad*Math.cos(pt.phi), ry=rad*Math.sin(pt.phi);
        const ux=(pt.phi/(1.5*Math.PI*3))*2-1, uy=(pt.v-0.5)*1.8; // unrolled rectangle
        const x=rx*(1-t)+ux*t, y=ry*(1-t)+uy*t;
        p.dot(x,y,{r:3,fill:hsl(pt.u)});
      });
      p.text(0,1.15,t<0.5?'stočená rolka (PCA by ji slepila)':'rozbalená varieta (sousedé zůstali sousedy)',{align:'center',fill:COL.muted,font:'12px sans-serif'});
    }
    const sl=slider(row,{label:'rozbalení',min:0,max:1,step:0.02,value:0,fmt:v=>Math.round(v*100)+'%',oninput:v=>{t=v;draw();}});
    button(row,{label:'▶ rozbalit (LLE)',primary:true,onclick:()=>{let v=t;const id=setInterval(()=>{v+=0.03;if(v>=1){v=1;clearInterval(id);}t=v;sl.set(v);draw();},25);}});
    button(row,{label:'↺ stočit zpět',onclick:()=>{let v=t;const id=setInterval(()=>{v-=0.03;if(v<=0){v=0;clearInterval(id);}t=v;sl.set(v);draw();},25);}});
    p.redraw(draw);
    note(c,'Barva = poloha podél rolky. Dvě barevně blízké tečky jsou na varietě sousedé; LLE zachová tyto lokální vztahy i v rozbalené reprezentaci. (Zjednodušená 2D ilustrace.)');
  }
});
