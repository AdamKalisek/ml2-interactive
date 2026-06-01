/* ===== §6 Generativní/diskriminativní, LDA ===== */

/* LDA vs QDA boundary */
VIZ.add('lda',{ id:'qda', title:'LDA vs. QDA (tvar rozhodovací hranice)', ref:'§6.4–6.5', hint:'Každá třída = vícerozměrné Gaussovo rozdělení. Když mají třídy <b>stejnou kovarianci → hranice je přímka (LDA)</b>. Když různou → hranice je <b>zakřivená (QDA)</b>. Přepínej režim a měň natočení/protažení kovariance.',
  build(host){
    const c=cardEl(host,'Stejná vs. různá kovariance tříd');
    const row=controlsRow(c);
    const p=new Plot(c,{height:420}); p.world(-2,8,-2,8);
    const ro=readout(c);
    let mode='lda', rot=0.6, elong=2.2;
    const m0=[2,2.4], m1=[5,5];
    function covFrom(rot,sx,sy){const c0=Math.cos(rot),s0=Math.sin(rot);const a=c0*c0*sx+s0*s0*sy,b=c0*s0*(sx-sy),d=s0*s0*sx+c0*c0*sy;return [[a,b],[b,d]];}
    function draw(){ p.clear();
      const S0=covFrom(0.3,1.2,1.2);
      const S1= mode==='lda'? S0 : covFrom(rot,elong,0.6);
      const Suse0= mode==='lda'? S0:S0, Suse1=S1;
      const g0=gauss2(m0,Suse0), g1=gauss2(m1,Suse1);
      const nx=72,ny=60,cw=p.plotW/nx,chh=p.plotH/ny;
      p.clip(()=>{for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const wx=p.ix(p.padL+(i+.5)*cw),wy=p.iy(p.padT+(j+.5)*chh);const a=g0(wx,wy),b=g1(wx,wy);const col=b>a?'251,146,60':'96,165,250';const conf=Math.abs(b-a)/(a+b+1e-12);p.pxRect(p.padL+i*cw,p.padT+j*chh,cw+1,chh+1,{fill:`rgba(${col},${0.06+0.26*conf})`});}});
      p.axes({nx:10,ny:10});
      // sample points
      const r=rng(4); function spread(m,S){const e=eigSym2(S[0][0],S[0][1],S[1][0],S[1][1]);const pts=[];for(let i=0;i<40;i++){const a=randnFrom(r)*Math.sqrt(e.l1),b=randnFrom(r)*Math.sqrt(e.l2);pts.push([m[0]+a*e.v1[0]+b*e.v2[0],m[1]+a*e.v1[1]+b*e.v2[1]]);}return pts;}
      spread(m0,Suse0).forEach(pt=>p.dot(pt[0],pt[1],{r:3,fill:COL.c2})); spread(m1,Suse1).forEach(pt=>p.dot(pt[0],pt[1],{r:3,fill:COL.c1}));
      p.dot(m0[0],m0[1],{r:5,fill:COL.c2,stroke:'#fff',sw:1.5});p.dot(m1[0],m1[1],{r:5,fill:COL.c1,stroke:'#fff',sw:1.5});
      ro.set(`režim: <b>${mode==='lda'?'LDA — shodné Σ → lineární hranice':'QDA — různé Σ → kvadratická hranice'}</b>`);
    }
    segC(row,{label:'režim',options:[{value:'lda',label:'LDA (stejná Σ)'},{value:'qda',label:'QDA (různá Σ)'}],value:mode,oninput:v=>{mode=v;draw();}});
    slider(row,{label:'natočení Σ₁ (QDA)',min:0,max:3.14,step:0.02,value:rot,fmt:v=>v.toFixed(2),oninput:v=>{rot=v;draw();}});
    slider(row,{label:'protažení Σ₁ (QDA)',min:0.6,max:4,step:0.05,value:elong,fmt:v=>v.toFixed(1),oninput:v=>{elong=v;draw();}});
    p.redraw(draw);
    note(c,'V režimu LDA se kvadratický člen mezi třídami vykrátí (obě Σ stejné) → zbude lineární hranice. To je přesně ten předpis P(Y=1|x)=σ(wᵀx+w₀) jako u logistické regrese.');
  }
});

/* PCA vs LDA direction */
VIZ.add('lda',{ id:'flda', title:'PCA vs. LDA (Fisher) jako redukce dimenze', ref:'§6.6', hint:'Obě promítají do 1D, ale jinak. <b>PCA</b> hledá směr největšího rozptylu (ignoruje třídy). <b>LDA</b> hledá směr, kde se <b>třídy nejlépe oddělí</b>. Měň posun tříd a sleduj, jak projekce na zelenou osu (LDA) drží třídy oddělené, kdežto na fialovou (PCA) se můžou překrýt.',
  build(host){
    const c=cardEl(host,'Dva směry projekce: rozptyl vs. oddělitelnost');
    const row=controlsRow(c);
    const p=new Plot(c,{height:420}); p.world(-6,6,-6,6);
    const ro=readout(c);
    let sep=2.2, data0=[],data1=[];
    function gen(){ const r=rng(8); data0=[];data1=[]; for(let i=0;i<60;i++){const a=randnFrom(r)*2.4,b=randnFrom(r)*0.6; data0.push([a-sep,b-0.0]); data1.push([a+sep,b+0.0]);} }
    function mean(d){return [d.reduce((s,x)=>s+x[0],0)/d.length,d.reduce((s,x)=>s+x[1],0)/d.length];}
    function draw(){ p.clear(); p.axes({nx:12,ny:12,zero:true});
      const all=data0.concat(data1); const m=mean(all);
      let a=0,b=0,cc=0; all.forEach(d=>{const x=d[0]-m[0],y=d[1]-m[1];a+=x*x;b+=x*y;cc+=y*y;}); const e=eigSym2(a,b,b,cc);
      const pcaDir=e.v1;
      // LDA: Sw^{-1}(m1-m0)
      const m0=mean(data0),m1=mean(data1); let sw=[[0,0],[0,0]];
      [[data0,m0],[data1,m1]].forEach(([d,mm])=>d.forEach(x=>{const dx=x[0]-mm[0],dy=x[1]-mm[1];sw[0][0]+=dx*dx;sw[0][1]+=dx*dy;sw[1][0]+=dx*dy;sw[1][1]+=dy*dy;}));
      const det=sw[0][0]*sw[1][1]-sw[0][1]*sw[1][0]; const inv=[[sw[1][1]/det,-sw[0][1]/det],[-sw[1][0]/det,sw[0][0]/det]];
      const diff=[m1[0]-m0[0],m1[1]-m0[1]]; let ldaDir=[inv[0][0]*diff[0]+inv[0][1]*diff[1],inv[1][0]*diff[0]+inv[1][1]*diff[1]];
      const ln=Math.hypot(...ldaDir)||1; ldaDir=[ldaDir[0]/ln,ldaDir[1]/ln];
      data0.forEach(d=>p.dot(d[0],d[1],{r:3,fill:COL.c2})); data1.forEach(d=>p.dot(d[0],d[1],{r:3,fill:COL.c1}));
      // axes through mean
      p.seg(m[0]-7*pcaDir[0],m[1]-7*pcaDir[1],m[0]+7*pcaDir[0],m[1]+7*pcaDir[1],{stroke:COL.accent2,width:2.5});
      p.seg(m[0]-7*ldaDir[0],m[1]-7*ldaDir[1],m[0]+7*ldaDir[0],m[1]+7*ldaDir[1],{stroke:COL.good,width:2.5});
      // projections onto LDA axis (shown as small ticks just off the axis)
      function projTicks(dir,off){ const perp=[-dir[1],dir[0]]; [[data0,COL.c2],[data1,COL.c1]].forEach(([d,col])=>d.forEach(x=>{const t=(x[0]-m[0])*dir[0]+(x[1]-m[1])*dir[1];const bx=m[0]+t*dir[0]+perp[0]*off,by=m[1]+t*dir[1]+perp[1]*off;p.dot(bx,by,{r:2,fill:col});})); }
      projTicks(ldaDir,0);
      ro.set(`<span style="color:${COL.accent2}">PCA směr</span> = max rozptyl (nevidí třídy) · <span style="color:${COL.good}">LDA směr</span> = max oddělení tříd. Body podél zelené osy = projekce — třídy se nepřekrývají.`);
    }
    slider(row,{label:'posun tříd',min:0.3,max:4,step:0.05,value:sep,fmt:v=>v.toFixed(2),oninput:v=>{sep=v;gen();draw();}});
    gen(); p.redraw(draw);
    legend(c,[{c:COL.c2,t:'třída 0'},{c:COL.c1,t:'třída 1'},{c:COL.accent2,t:'PCA osa'},{c:COL.good,t:'LDA osa'}]);
    note(c,'Data jsou protažená napříč třídami: PCA si vybere podélný směr (velký rozptyl, ale třídy splývají), LDA zvolí směr napříč, kde jdou třídy od sebe.');
  }
});
