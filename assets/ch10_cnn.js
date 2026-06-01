/* ===== §10 Konvoluční a rekurentní sítě ===== */

/* Konvoluce */
VIZ.add('cnn',{ id:'conv', title:'Konvoluce (posuvné jádro)', ref:'§10.1', hint:'Malé <b>jádro (filtr)</b> kloužeme po obrázku a v každé pozici počítáme vážený součet pixelů pod ním → výstupní „mapa příznaků“. Vyber filtr (rozmazání / detekce hran…) a <b>najeď myší na výstup</b>, ať vidíš jeho oblast vnímání vlevo.',
  build(host){
    const c=cardEl(host,'Filtr klouže po obrázku → mapa příznaků');
    const row=controlsRow(c);
    const p=new Plot(c,{height:360});
    let kname='edgex', hover=null;
    const n=16; const img=[]; for(let r=0;r<n;r++){img.push([]);for(let cc=0;cc<n;cc++){ const dx=cc-6,dy=r-9; const disk=(dx*dx+dy*dy<14)?1:0; const edge=cc>9?0.85:0.1; img[r].push(Math.max(disk?0.95:0,edge)); }}
    const kernels={ identity:[[0,0,0],[0,1,0],[0,0,0]], blur:[[1,1,1],[1,1,1],[1,1,1]].map(r=>r.map(v=>v/9)),
      edgex:[[-1,0,1],[-2,0,2],[-1,0,1]], edgey:[[-1,-2,-1],[0,0,0],[1,2,1]], sharpen:[[0,-1,0],[-1,5,-1],[0,-1,0]] };
    function conv(){ const K=kernels[kname]; const o=n-2; const out=[]; for(let r=0;r<o;r++){out.push([]);for(let cc=0;cc<o;cc++){let s=0;for(let a=0;a<3;a++)for(let b=0;b<3;b++)s+=img[r+a][cc+b]*K[a][b];out[r].push(s);}} return out; }
    function draw(){ p.clear(); const ctx=p.ctx; const out=conv();
      const cell=14, ix0=46, iy0=46, ox0=ix0+n*cell+70, o=n-2;
      ctx.font='12px sans-serif'; ctx.fillStyle=COL.muted; ctx.textAlign='left';
      ctx.fillText('vstupní obrázek',ix0,iy0-12); ctx.fillText('mapa příznaků',ox0,iy0-12);
      // input
      for(let r=0;r<n;r++)for(let cc=0;cc<n;cc++){const v=img[r][cc];const g=Math.round(v*220+15);ctx.fillStyle=`rgb(${g},${g},${g})`;ctx.fillRect(ix0+cc*cell,iy0+r*cell,cell-1,cell-1);}
      // output (normalize)
      let mn=1e9,mx=-1e9;out.forEach(rw=>rw.forEach(v=>{mn=Math.min(mn,v);mx=Math.max(mx,v);}));
      for(let r=0;r<o;r++)for(let cc=0;cc<o;cc++){const v=(out[r][cc]-mn)/((mx-mn)||1);const g=Math.round(v*220+15);ctx.fillStyle=`rgb(${g},${g},${g})`;ctx.fillRect(ox0+cc*cell,iy0+r*cell,cell-1,cell-1);}
      // hover receptive field
      if(hover){const{r,cc}=hover;ctx.strokeStyle=COL.accent;ctx.lineWidth=2;ctx.strokeRect(ix0+cc*cell-1,iy0+r*cell-1,3*cell,3*cell);ctx.strokeStyle=COL.c1;ctx.strokeRect(ox0+cc*cell-1,iy0+r*cell-1,cell+1,cell+1);}
      // kernel
      const K=kernels[kname],kc=22,kx=ix0,ky=iy0+n*cell+22; ctx.fillStyle=COL.muted;ctx.fillText('jádro 3×3:',kx,ky-6);
      for(let a=0;a<3;a++)for(let b=0;b<3;b++){ctx.strokeStyle='#3a4654';ctx.strokeRect(kx+b*kc,ky+a*kc,kc,kc);ctx.fillStyle=COL.txt;ctx.textAlign='center';ctx.fillText(K[a][b].toFixed(K[a][b]%1?2:0),kx+b*kc+kc/2,ky+a*kc+kc/2+4);ctx.textAlign='left';}
      ctx.fillStyle=COL.muted;ctx.fillText(`výstup ${o}×${o} (vstup ${n}×${n} − jádro 3 + 1)`,ox0,iy0+n*cell+22);
    }
    selectC(row,{label:'filtr',options:[{value:'edgex',label:'detekce hran ↕'},{value:'edgey',label:'detekce hran ↔'},{value:'blur',label:'rozmazání'},{value:'sharpen',label:'doostření'},{value:'identity',label:'identita'}],value:kname,oninput:v=>{kname=v;draw();}});
    p.redraw(draw);
    p.on('pointermove',e=>{const cell=14,ox0=46+n*cell+70,iy0=46,o=n-2;const cc=Math.floor((e.px-ox0)/cell),r=Math.floor((e.py-iy0)/cell);hover=(r>=0&&r<o&&cc>=0&&cc<o)?{r,cc}:null;draw();});
    note(c,'Sdílení parametrů: jedno jádro pro celý obrázek (málo parametrů). Omezené spojení: každý výstupní pixel závisí jen na malé oblasti vstupu (oblast vnímání = modrý rámeček).');
  }
});

/* Pooling + stride */
VIZ.add('cnn',{ id:'pool', title:'Pooling, stride, padding', ref:'§10.2', hint:'<b>Max pooling</b> zmenší mapu tím, že z každého okénka vezme maximum (a přidá invarianci vůči malým posunům). <b>Stride</b> = o kolik okénko posouváme. Sleduj, jak se mění velikost výstupu.',
  build(host){
    const c=cardEl(host,'Max pooling 2×2 s volitelným krokem');
    const row=controlsRow(c);
    const p=new Plot(c,{height:340});
    let stride=2,k=2; const n=8; const r=rng(5); const grid=[];for(let i=0;i<n;i++){grid.push([]);for(let j=0;j<n;j++)grid[i].push(r());}
    function pool(){ const o=Math.floor((n-k)/stride)+1; const out=[]; for(let i=0;i<o;i++){out.push([]);for(let j=0;j<o;j++){let m=-1;for(let a=0;a<k;a++)for(let b=0;b<k;b++)m=Math.max(m,grid[i*stride+a][j*stride+b]);out[i].push(m);}} return {out,o}; }
    function draw(){ p.clear(); const ctx=p.ctx; const{out,o}=pool();
      const cell=26,ix0=40,iy0=50,ox0=ix0+n*cell+80;
      ctx.font='12px sans-serif';ctx.fillStyle=COL.muted;ctx.textAlign='left';ctx.fillText(`vstup ${n}×${n}`,ix0,iy0-12);ctx.fillText(`výstup ${o}×${o}`,ox0,iy0-12);
      for(let i=0;i<n;i++)for(let j=0;j<n;j++){const v=grid[i][j];const g=Math.round(v*200+25);ctx.fillStyle=`rgb(${g},${Math.round(g*0.8)},${Math.round(g*0.5)})`;ctx.fillRect(ix0+j*cell,iy0+i*cell,cell-1,cell-1);}
      // highlight pooling windows
      for(let i=0;i<o;i++)for(let j=0;j<o;j++){ctx.strokeStyle='rgba(56,189,248,.5)';ctx.lineWidth=1;ctx.strokeRect(ix0+j*stride*cell,iy0+i*stride*cell,k*cell-1,k*cell-1);}
      for(let i=0;i<o;i++)for(let j=0;j<o;j++){const v=out[i][j];const g=Math.round(v*200+25);ctx.fillStyle=`rgb(${g},${Math.round(g*0.8)},${Math.round(g*0.5)})`;ctx.fillRect(ox0+j*cell,iy0+i*cell,cell-1,cell-1);}
      ctx.fillStyle=COL.muted;ctx.fillText(`⌊(${n}−${k})/${stride}⌋+1 = ${o}`,ox0,iy0+o*cell+24);
    }
    slider(row,{label:'stride (krok)',min:1,max:4,step:1,value:stride,oninput:v=>{stride=v;draw();}});
    slider(row,{label:'velikost okénka k',min:2,max:4,step:1,value:k,oninput:v=>{k=v;draw();}});
    p.redraw(draw);
    note(c,'Větší stride = menší výstup (downsampling). Padding (doplnění nul kolem okrajů) by naopak výstup zvětšil, takže by se rozměr nezmenšoval.');
  }
});

/* RNN unroll */
VIZ.add('cnn',{ id:'rnn', title:'Rekurentní síť (rozbalení v čase)', ref:'§10.3', hint:'RNN má <b>skrytý stav h</b> = paměť, která se předává z kroku na krok: h_t = f(h_{t−1}, x_t). Klikni „pustit sekvenci“ a sleduj, jak stavem protéká informace zleva doprava. Tak síť zpracuje text/časovou řadu libovolné délky.',
  build(host){
    const c=cardEl(host,'h_t = f(h_{t−1}, x_t) rozbalené přes čas');
    const row=controlsRow(c);
    const p=new Plot(c,{height:340}); p.world(0,10,0,10);
    let T=5, active=-1, hvals=[], timer=null;
    const seq=[0.6,-0.3,0.8,0.1,-0.6,0.4,0.2,-0.5];
    function compute(){ hvals=[0]; for(let t=0;t<T;t++){const h=Math.tanh(0.9*hvals[t]+0.8*seq[t]); hvals.push(h);} }
    function draw(){ p.clear(); compute(); const ctx=p.ctx;
      const x0=1.2, dx=(8.2)/(T-1||1), yh=5;
      for(let t=0;t<T;t++){ const cx=x0+t*dx;
        if(t>0){const c0=x0+(t-1)*dx;p.arrow(c0+0.45,yh,cx-0.45,yh,{stroke:active>=t?COL.accent:'#3a4654',width:active>=t?2.5:1.5});}
        // box
        const on=active>=t; p.pxRect(p.X(cx)-26,p.Y(yh)-20,52,40,{fill:on?'#15303d':'#11161d',stroke:on?COL.accent:'#3a4654',width:1.5});
        p.text(cx,yh+0.1,'h'+(t+1),{align:'center',baseline:'middle',fill:COL.txt,font:'13px sans-serif'});
        // hidden value bar
        const h=hvals[t+1]; p.pxRect(p.X(cx)-26,p.Y(yh)+22,52,8,{fill:'#1c232d'}); p.pxRect(p.X(cx)-1,p.Y(yh)+22, h*25,8,{fill:h>0?COL.c3:COL.c1});
        // input arrow
        p.arrow(cx,2.4,cx,yh-0.55,{stroke:on?COL.c2:'#3a4654',width:on?2:1.2});
        p.dot(cx,2.0,{r:4,fill:on?COL.c2:'#445'}); p.text(cx,1.4,'x'+(t+1),{align:'center',fill:COL.muted,font:'11px sans-serif'});
        // output arrow
        p.arrow(cx,yh+0.55,cx,8.4,{stroke:on?COL.c1:'#3a4654',width:on?2:1.2}); p.text(cx,8.9,'o'+(t+1),{align:'center',fill:COL.muted,font:'11px sans-serif'});
      }
      p.text(0.2,9.6,'výstupy o_t',{fill:COL.muted,font:'11px sans-serif'}); p.text(0.2,0.7,'vstupy x_t',{fill:COL.muted,font:'11px sans-serif'});
    }
    slider(row,{label:'délka sekvence T',min:2,max:8,step:1,value:T,oninput:v=>{T=v;active=-1;draw();}});
    button(row,{label:'▶ pustit sekvenci',primary:true,onclick:()=>{active=0;draw();clearInterval(timer);timer=setInterval(()=>{active++;if(active>=T){clearInterval(timer);}draw();},500);}});
    p.redraw(draw);
    note(c,'Stejné parametry f se použijí v každém kroku (sdílení v čase). Po „rozbalení“ je to hluboká síť → odtud problémy s mizejícím gradientem a dalekodosahovými závislostmi (řeší LSTM).');
  }
});
