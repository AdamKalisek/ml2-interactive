/* ===== §3 Metoda podpůrných vektorů ===== */

/* Princip největšího odstupu — interaktivní přímka */
VIZ.add('svm',{ id:'margin', title:'Princip největšího odstupu', ref:'§3.1–3.2', hint:'<b>Táhni koncové body přímky</b> a zkus najít takovou polohu, aby byl <b>pás (margin) co nejširší</b> a žádný bod v něm nebyl. Nejbližší body určující pás jsou <b>podpůrné vektory</b> (zakroužkované).',
  build(host){
    const c=cardEl(host,'Najdi nejširší pás mezi třídami');
    const p=new Plot(c,{height:420}); p.world(-1,5,-1,5);
    const ro=readout(c);
    const A=[[1,1],[1.4,2.1],[0.6,2.6],[1.8,1.2],[0.7,1.5]]; // class -1
    const B=[[3.5,3.2],[3,4],[4,2.6],[3.2,2.6],[4.1,3.6]];   // class +1
    // line via two draggable handles
    let h1={x:0.6,y:4.2}, h2={x:4.4,y:0.6}, drag=null;
    function lineWb(){ // from handles -> w (normal), w0 so that w·x+w0=0 is the line
      const dx=h2.x-h1.x, dy=h2.y-h1.y; let w=[dy,-dx]; const nrm=Math.hypot(w[0],w[1])||1; w=[w[0]/nrm,w[1]/nrm];
      const w0=-(w[0]*h1.x+w[1]*h1.y); return {w,w0}; }
    function draw(){ p.clear(); p.axes({nx:6,ny:6});
      const {w,w0}=lineWb();
      const fval=pt=>w[0]*pt[0]+w[1]*pt[1]+w0;
      // signed distances; orient so B is positive
      let sB=B.reduce((s,pt)=>s+fval(pt),0); const sgn=sB>=0?1:-1;
      const all=A.map(pt=>({pt,y:-1,d:sgn*fval(pt)})).concat(B.map(pt=>({pt,y:1,d:sgn*fval(pt)})));
      let margin=Math.min(...all.map(o=>o.d)); // smallest signed dist (can be negative if misclassified)
      // draw decision line + margin band: line is f=0; band at distance |margin|
      const drawLineAt=off=>{ // points where sgn*f = off  -> f = off/sgn ; param along line
        const c0=-w0 - (off/sgn) ; // not used; instead sample two far points on shifted line
      };
      // shifted lines: f = ±margin*sgn ... draw via two points
      function lineForOffset(o){ // returns two endpoints of {x: sgn*f(x)=o}
        // pick param t along line direction d=(-w[1],w[0])
        const dir=[-w[1],w[0]]; const base=[-(w0)*w[0]+ (o/sgn)*w[0], -(w0)*w[1]+(o/sgn)*w[1]];
        // base point on shifted line: solve w·x = -w0 + o/sgn, choose x=base
        const c1=-w0+o/sgn; const bx=c1*w[0], by=c1*w[1];
        return [[bx-6*dir[0],by-6*dir[1]],[bx+6*dir[0],by+6*dir[1]]];
      }
      if(margin>0){ const lo=lineForOffset(margin),hi=lineForOffset(-margin);
        p.clip(()=>{ p.poly([lo[0],lo[1],hi[1],hi[0]],{fill:'rgba(56,189,248,.10)'}); });
        const ls=lineForOffset(margin); p.seg(ls[0][0],ls[0][1],ls[1][0],ls[1][1],{stroke:'rgba(56,189,248,.5)',width:1,dash:[5,4]});
        const hs=lineForOffset(-margin); p.seg(hs[0][0],hs[0][1],hs[1][0],hs[1][1],{stroke:'rgba(56,189,248,.5)',width:1,dash:[5,4]});
      }
      const l0=lineForOffset(0); p.seg(l0[0][0],l0[0][1],l0[1][0],l0[1][1],{stroke:COL.txt,width:2});
      // points
      all.forEach(o=>{ const isSV=Math.abs(o.d-margin)<0.06; p.dot(o.pt[0],o.pt[1],{r:6,fill:o.y>0?COL.c1:COL.c2,stroke:o.d<0?COL.bad:'#0a0e13',sw:o.d<0?2.5:1.5}); if(isSV&&margin>0)p.ring(o.pt[0],o.pt[1],{r:11,stroke:COL.accent,width:2}); });
      p.dot(h1.x,h1.y,{r:7,fill:COL.warn,stroke:'#fff',sw:1.5}); p.dot(h2.x,h2.y,{r:7,fill:COL.warn,stroke:'#fff',sw:1.5});
      const ok=margin>0;
      ro.set(`odstup (margin): <b style="color:${ok?COL.good:COL.bad}">${margin.toFixed(3)}</b> ${ok?'(½ šířky pásu)':'⚠ body na špatné straně'} · maximalizací odstupu minimalizujeme ‖w‖`);
    }
    p.redraw(draw);
    p.on('pointerdown',e=>{ if(Math.hypot(p.X(e.x)-p.X(h1.x),p.Y(e.y)-p.Y(h1.y))<16)drag=h1; else if(Math.hypot(p.X(e.x)-p.X(h2.x),p.Y(e.y)-p.Y(h2.y))<16)drag=h2; });
    p.on('pointermove',e=>{ if(drag){drag.x=clamp(e.x,-1,5);drag.y=clamp(e.y,-1,5);draw();} });
    window.addEventListener('pointerup',()=>drag=null);
    legend(c,[{c:COL.c2,t:'třída −1'},{c:COL.c1,t:'třída +1'},{c:COL.warn,t:'táhni mě (přímka)'},{c:COL.accent,t:'podpůrné vektory'}]);
    note(c,'Nekonečně mnoho přímek odděluje data — SVM vybírá tu s největším odstupem (nejrobustnější). Šťouchni bod přes přímku a uvidíš varování.');
  }
});

/* SVM s jádrem (SMO) */
VIZ.add('svm',{ id:'kernelsvm', title:'SVM s jádrem a parametrem C', ref:'§3.3–3.4', hint:'Skutečné SVM (řešené algoritmem SMO). Přepni <b>jádro</b> (lineární vs. RBF), měň <b>C</b> (velké C = málo tolerance k chybám, slabší regularizace) a šířku γ. Zakroužkované body jsou podpůrné vektory.',
  build(host){
    const c=cardEl(host,'Rozhodovací oblasti, podpůrné vektory, vliv C');
    const row=controlsRow(c);
    const p=new Plot(c,{height:430}); p.world(-3,3,-3,3);
    const ro=readout(c);
    let kind='kruhy', kernel='rbf', C=5, gamma=1, X=[],Y=[];
    function gen(){ const r=rng(42); X=[];Y=[];
      if(kind==='skvrny'){ for(let i=0;i<22;i++){X.push([-1.2+0.7*randnFrom(r),-0.6+0.7*randnFrom(r)]);Y.push(-1);} for(let i=0;i<22;i++){X.push([1.2+0.7*randnFrom(r),0.7+0.7*randnFrom(r)]);Y.push(1);} }
      else if(kind==='kruhy'){ for(let i=0;i<24;i++){const a=r()*6.28,rad=0.5+0.5*r();X.push([rad*Math.cos(a),rad*Math.sin(a)]);Y.push(1);} for(let i=0;i<28;i++){const a=r()*6.28,rad=1.8+0.5*r();X.push([rad*Math.cos(a),rad*Math.sin(a)]);Y.push(-1);} }
      else { const ctr=[[-1.3,-1.3,1],[1.3,1.3,1],[-1.3,1.3,-1],[1.3,-1.3,-1]]; ctr.forEach(cc=>{for(let i=0;i<12;i++){X.push([cc[0]+0.55*randnFrom(r),cc[1]+0.55*randnFrom(r)]);Y.push(cc[2]);}}); }
    }
    function K(a,b){ if(kernel==='lin')return a[0]*b[0]+a[1]*b[1]+1; const dx=a[0]-b[0],dy=a[1]-b[1]; return Math.exp(-gamma*(dx*dx+dy*dy)); }
    function smo(){ const n=X.length; const KM=Array.from({length:n},(_,i)=>X.map(xj=>K(X[i],xj)));
      let al=new Array(n).fill(0),b=0; const tol=1e-3; const rr=rng(7); let passes=0,iter=0;
      const f=i=>{let s=b;for(let k=0;k<n;k++)s+=al[k]*Y[k]*KM[k][i];return s;};
      while(passes<5&&iter<4000){ let ch=0;
        for(let i=0;i<n;i++){ iter++; const Ei=f(i)-Y[i];
          if((Y[i]*Ei<-tol&&al[i]<C)||(Y[i]*Ei>tol&&al[i]>0)){
            let j=i;while(j===i)j=Math.floor(rr()*n); const Ej=f(j)-Y[j]; const ai=al[i],aj=al[j]; let L,H;
            if(Y[i]!==Y[j]){L=Math.max(0,aj-ai);H=Math.min(C,C+aj-ai);}else{L=Math.max(0,ai+aj-C);H=Math.min(C,ai+aj);}
            if(L===H)continue; const eta=2*KM[i][j]-KM[i][i]-KM[j][j]; if(eta>=0)continue;
            let ajn=clamp(aj-Y[j]*(Ei-Ej)/eta,L,H); if(Math.abs(ajn-aj)<1e-5)continue;
            const ain=ai+Y[i]*Y[j]*(aj-ajn);
            const b1=b-Ei-Y[i]*(ain-ai)*KM[i][i]-Y[j]*(ajn-aj)*KM[i][j];
            const b2=b-Ej-Y[i]*(ain-ai)*KM[i][j]-Y[j]*(ajn-aj)*KM[j][j];
            al[i]=ain;al[j]=ajn; b=(ain>0&&ain<C)?b1:(ajn>0&&ajn<C)?b2:(b1+b2)/2; ch++; }
        }
        if(ch===0)passes++;else passes=0; }
      return {al,b}; }
    function draw(){ p.clear();
      const {al,b}=smo();
      const dec=pt=>{let s=b;for(let k=0;k<X.length;k++)s+=al[k]*Y[k]*K(X[k],pt);return s;};
      // region fill
      const nx=72,ny=58; const cw=p.plotW/nx, chh=p.plotH/ny;
      p.clip(()=>{ for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){ const wx=p.ix(p.padL+(i+0.5)*cw), wy=p.iy(p.padT+(j+0.5)*chh); const v=dec([wx,wy]);
        const col=v>=0?'251,146,60':'96,165,250'; const a=Math.min(0.32,0.10+0.22*Math.min(1,Math.abs(v))); p.pxRect(p.padL+i*cw,p.padT+j*chh,cw+1,chh+1,{fill:`rgba(${col},${a})`}); } });
      p.axes({nx:6,ny:6});
      let nsv=0; X.forEach((x,i)=>{ const sv=al[i]>1e-4; if(sv)nsv++; p.dot(x[0],x[1],{r:5.5,fill:Y[i]>0?COL.c1:COL.c2,stroke:'#0a0e13',sw:1.2}); if(sv)p.ring(x[0],x[1],{r:9,stroke:COL.accent,width:1.8}); });
      ro.set(`jádro: <b>${kernel==='lin'?'lineární':'RBF'}</b> · C=<b>${C}</b> · podpůrných vektorů: <b>${nsv}</b> / ${X.length}`);
    }
    selectC(row,{label:'dataset',options:[{value:'kruhy',label:'kruhy'},{value:'skvrny',label:'dvě skvrny'},{value:'xor',label:'XOR'}],value:kind,oninput:v=>{kind=v;gen();draw();}});
    segC(row,{label:'jádro',options:[{value:'rbf',label:'RBF'},{value:'lin',label:'lineární'}],value:kernel,oninput:v=>{kernel=v;draw();}});
    slider(row,{label:'C (regularizace)',min:0.1,max:50,step:0.1,value:C,fmt:v=>v.toFixed(1),oninput:v=>{C=v;draw();}});
    slider(row,{label:'γ (jen RBF)',min:0.1,max:5,step:0.1,value:gamma,fmt:v=>v.toFixed(1),oninput:v=>{gamma=v;draw();}});
    gen(); p.redraw(draw);
    note(c,'Lineární jádro „kruhy“ ani „XOR“ neoddělí — přepni na RBF. Malé C = širší, hladší hranice (víc podpůrných vektorů); velké C = hranice lpí na datech.');
  }
});
