/* ===== §7 Perceptron ===== */

/* Perceptron training animation */
VIZ.add('perc',{ id:'train', title:'Trénink perceptronu (krok po kroku)', ref:'§7.2', hint:'Perceptron prochází body a po každém <b>špatně klasifikovaném</b> posune dělicí přímku směrem ke správné odpovědi. Mačkej <b>1 krok</b> nebo spusť animaci. Na lineárně separabilních datech vždy doběhne (věta o konvergenci).',
  build(host){
    const c=cardEl(host,'Inkrementální update vah');
    const row=controlsRow(c);
    const p=new Plot(c,{height:420}); p.world(-1,6,-1,6);
    const ro=readout(c);
    let X=[],Y=[],w=[0,0,0],idx=0,playing=false,timer=null,steps=0,curr=-1;
    function gen(){ const r=rng(17); X=[];Y=[];
      for(let i=0;i<10;i++){X.push([1,0.6+1.2*r(),3.4+1.4*r()]);Y.push(1);}
      for(let i=0;i<10;i++){X.push([1,2.8+1.6*r(),0.5+1.3*r()]);Y.push(0);}
      w=[0,0,0];idx=0;steps=0;curr=-1; }
    function pred(i){return (w[0]*X[i][0]+w[1]*X[i][1]+w[2]*X[i][2])>=0?1:0;}
    function step(){ // find next, do one update pass on current idx
      curr=idx; const yh=pred(idx); const err=Y[idx]-yh;
      if(err!==0){ w[0]+=err*X[idx][0]; w[1]+=err*X[idx][1]; w[2]+=err*X[idx][2]; steps++; }
      idx=(idx+1)%X.length; draw(); }
    function errors(){let e=0;for(let i=0;i<X.length;i++)if(pred(i)!==Y[i])e++;return e;}
    function draw(){ p.clear(); p.axes({nx:7,ny:7});
      // decision line w0 + w1 x + w2 y = 0
      if(Math.abs(w[2])>1e-6){ const f=x=>-(w[0]+w[1]*x)/w[2]; p.clip(()=>p.path([[-1,f(-1)],[6,f(6)]],{stroke:COL.txt,width:2}));
        // shaded side
      } else if(Math.abs(w[1])>1e-6){ const xv=-w[0]/w[1]; p.seg(xv,-1,xv,6,{stroke:COL.txt,width:2}); }
      X.forEach((x,i)=>{ const wrong=pred(i)!==Y[i]; p.dot(x[1],x[2],{r: i===curr?7:5,fill:Y[i]?COL.c1:COL.c2,stroke:i===curr?COL.warn:(wrong?COL.bad:'#0a0e13'),sw:i===curr?3:(wrong?2.5:1.2)}); });
      const e=errors();
      ro.set(`updaty: <b>${steps}</b> · chybně klasifikováno: <b style="color:${e?COL.bad:COL.good}">${e}</b>/${X.length} ${e===0?'✓ hotovo (separováno)':''} · w=(${w.map(v=>v.toFixed(1)).join(', ')})`);
    }
    button(row,{label:'1 krok',onclick:step});
    const pb=button(row,{label:'▶ spustit',primary:true,onclick:()=>{playing=!playing;pb.textContent=playing?'⏸ pauza':'▶ spustit';if(playing)timer=setInterval(()=>{if(errors()===0){playing=false;pb.textContent='▶ spustit';clearInterval(timer);return;}step();},120);else clearInterval(timer);}});
    button(row,{label:'nová data',onclick:()=>{gen();draw();}});
    gen(); p.redraw(draw);
    legend(c,[{c:COL.c1,t:'třída 1'},{c:COL.c2,t:'třída 0'},{c:COL.warn,t:'právě zpracovávaný bod'},{c:COL.bad,t:'aktuálně špatně'}]);
    note(c,'Update: w ← w + (Y−Ŷ)·x̃. Když je predikce správná, nemění se nic. Žlutě je bod, který se právě používá.');
  }
});

/* XOR */
VIZ.add('perc',{ id:'xor', title:'Problém XOR', ref:'§7.3', hint:'XOR má třídu 1 na úhlopříčce, 0 v rozích. <b>Táhni koncové body přímky</b> a přesvědč se, že <b>žádná jediná přímka</b> neklasifikuje všechny 4 body správně (max 3/4). Proto perceptron na XOR selže — potřebuje víc vrstev.',
  build(host){
    const c=cardEl(host,'Jedna přímka XOR nezvládne');
    const p=new Plot(c,{height:380}); p.world(-0.6,1.6,-0.6,1.6);
    const ro=readout(c);
    const pts=[{x:0,y:0,c:0},{x:1,y:1,c:0},{x:0,y:1,c:1},{x:1,y:0,c:1}];
    let h1={x:-0.4,y:0.5},h2={x:1.4,y:0.5},drag=null;
    function draw(){ p.clear(); p.axes({nx:6,ny:6});
      // line + side coloring
      const dx=h2.x-h1.x,dy=h2.y-h1.y; const w=[dy,-dx]; const w0=-(w[0]*h1.x+w[1]*h1.y);
      p.seg(h1.x-3*dx,h1.y-3*dy,h2.x+3*dx,h2.y+3*dy,{stroke:COL.txt,width:2});
      let correct=0; pts.forEach(pt=>{ const side=(w[0]*pt.x+w[1]*pt.y+w0)>=0?1:0; const ok=side===pt.c; if(ok)correct++;
        p.dot(pt.x,pt.y,{r:9,fill:pt.c?COL.c1:COL.c2,stroke:ok?COL.good:COL.bad,sw:3}); });
      p.dot(h1.x,h1.y,{r:6,fill:COL.warn});p.dot(h2.x,h2.y,{r:6,fill:COL.warn});
      ro.set(`správně klasifikováno: <b style="color:${correct===4?COL.good:COL.bad}">${correct}/4</b> ${correct<4?'— víc než 3 jednou přímkou nedáš':'(jak?! to nejde 🙂)'}`);
    }
    p.redraw(draw);
    p.on('pointerdown',e=>{if(Math.hypot(p.X(e.x)-p.X(h1.x),p.Y(e.y)-p.Y(h1.y))<16)drag=h1;else if(Math.hypot(p.X(e.x)-p.X(h2.x),p.Y(e.y)-p.Y(h2.y))<16)drag=h2;});
    p.on('pointermove',e=>{if(drag){drag.x=clamp(e.x,-0.6,1.6);drag.y=clamp(e.y,-0.6,1.6);draw();}});
    window.addEventListener('pointerup',()=>drag=null);
    legend(c,[{c:COL.c1,t:'třída 1 (úhlopříčka)'},{c:COL.c2,t:'třída 0 (rohy)'},{c:COL.good,t:'správně'},{c:COL.bad,t:'špatně'}]);
    note(c,'XOR vyřeší až vícevrstvá síť (dva perceptrony AND/NOR + jeden nad nimi) — viz další kapitola.');
  }
});
