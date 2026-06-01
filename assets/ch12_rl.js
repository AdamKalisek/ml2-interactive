/* ===== §12 Posilované učení ===== */

/* Explore vs exploit — commute Monte Carlo */
VIZ.add('rl',{ id:'explore', title:'Explorace vs. exploatace', ref:'§12.2', hint:'Cesta do školy 30 dní, 3 dopravní prostředky s neznámou spolehlivostí. Nejdřív <b>zkoušíš</b> (explorace), pak jezdíš tím nejlepším (exploatace). Křivka ukazuje průměrný počet včasných příchodů podle toho, <b>jak dlouho zkoušíš</b> — moc málo i moc dlouho je špatně.',
  build(host){
    const c=cardEl(host,'Kolik dní věnovat zkoušení?');
    const row=controlsRow(c);
    const p=new Plot(c,{height:360}); p.world(0,30,0,26);
    const ro=readout(c);
    let probs=[0.3,0.5,0.9], seed=1;
    function sim(E,r){ const days=30,n=3; let onTime=0; const succ=[0,0,0],cnt=[0,0,0];
      for(let d=0;d<days;d++){ let arm; if(d<E){arm=d%n;} else { let best=0,bv=-1; for(let a=0;a<n;a++){const q=cnt[a]?succ[a]/cnt[a]:0; if(q>bv){bv=q;best=a;}} arm=best; }
        const ok=r()<probs[arm]?1:0; onTime+=ok; if(d<E){succ[arm]+=ok;cnt[arm]++;} }
      return onTime; }
    function curve(){ const pts=[]; for(let E=0;E<=30;E+=3){ let tot=0; const r=rng(seed*1000+E); for(let s=0;s<400;s++)tot+=sim(E,r); pts.push([E,tot/400]); } return pts; }
    function draw(){ p.clear(); p.axes({nx:10,ny:13,xlabel:'dní explorace (z 30)',ylabel:'včas'});
      const pts=curve(); p.clip(()=>p.path(pts,{stroke:COL.accent,width:2.8})); pts.forEach(pt=>p.dot(pt[0],pt[1],{r:3,fill:COL.accent}));
      let best=pts[0];pts.forEach(pt=>{if(pt[1]>best[1])best=pt;}); p.dot(best[0],best[1],{r:7,fill:COL.good,stroke:'#fff',sw:1.5});
      // reference: pure exploit-ish (E=3) and pure random (E=30)
      ro.set(`pravd. včas: pěšky <b>${(probs[0]*100)|0}%</b>, kolo <b>${(probs[1]*100)|0}%</b>, metro <b>${(probs[2]*100)|0}%</b> · nejlepší délka explorace ≈ <b style="color:${COL.good}">${best[0]} dní</b> → ${best[1].toFixed(1)} včas`);
    }
    slider(row,{label:'P(včas) pěšky',min:0.05,max:0.95,step:0.05,value:probs[0],fmt:v=>v.toFixed(2),oninput:v=>{probs[0]=v;draw();}});
    slider(row,{label:'P(včas) kolo',min:0.05,max:0.95,step:0.05,value:probs[1],fmt:v=>v.toFixed(2),oninput:v=>{probs[1]=v;draw();}});
    slider(row,{label:'P(včas) metro',min:0.05,max:0.95,step:0.05,value:probs[2],fmt:v=>v.toFixed(2),oninput:v=>{probs[2]=v;draw();}});
    button(row,{label:'🎲 znovu',onclick:()=>{seed++;draw();}});
    p.redraw(draw);
    note(c,'Vlevo (málo explorace) se snadno upneš na špatnou volbu; vpravo (samá explorace) plýtváš dny na horší prostředky. Optimum je uprostřed — to je celé dilema explorace vs. exploatace.');
  }
});

/* k-armed bandit */
VIZ.add('rl',{ id:'bandit', title:'k-ruký bandita (ε-greedy a UCB)', ref:'§12.3–12.4', hint:'k automatů se skrytými pravděpodobnostmi výhry. Algoritmus odhaduje hodnotu Q(a) a vybírá akce. <b>ε-greedy</b> občas zkusí náhodu; <b>UCB</b> systematicky preferuje málo prozkoumané. Spusť a sleduj, jak se odhady (modré) blíží pravdě (zelené) a roste průměrná odměna.',
  build(host){
    const c=cardEl(host,'Učení hodnoty akcí a růst odměny');
    const row=controlsRow(c);
    const p=new Plot(c,{height:400});
    const ro=readout(c);
    const k=6; let trueP=[], Q=[],N=[], t=0, sumR=0, optCount=0, hist=[], strat='eps', eps=0.1, cc=1.0, timer=null,playing=false,last=-1;
    let R=rng(7);
    function reset(){ R=rng(Math.floor(Math.random()*1e6)+1); trueP=[];for(let a=0;a<k;a++)trueP.push(0.1+0.8*R()); Q=new Array(k).fill(0);N=new Array(k).fill(0);t=0;sumR=0;optCount=0;hist=[];last=-1; }
    function bestArm(){let b=0;for(let a=1;a<k;a++)if(trueP[a]>trueP[b])b=a;return b;}
    function step(){ t++; let a;
      if(strat==='eps'){ if(R()<eps)a=Math.floor(R()*k); else {let b=0,bv=-1;for(let i=0;i<k;i++){if(Q[i]>bv){bv=Q[i];b=i;}}a=b;} }
      else { let b=0,bv=-1e9; for(let i=0;i<k;i++){const bonus=N[i]===0?1e6:cc*Math.sqrt(Math.log(t)/N[i]);const u=Q[i]+bonus;if(u>bv){bv=u;b=i;}}a=b; }
      const r=R()<trueP[a]?1:0; N[a]++; Q[a]+=(r-Q[a])/N[a]; sumR+=r; if(a===bestArm())optCount++; last=a; hist.push(sumR/t); if(hist.length>400)hist.shift(); draw(); }
    function draw(){ p.clear(); const ctx=p.ctx;
      // top: avg reward curve
      const topH=110, x0=46, w=p.W-70;
      ctx.strokeStyle='#3a4654';ctx.strokeRect(x0,14,w,topH);
      ctx.fillStyle=COL.muted;ctx.font='11px sans-serif';ctx.textAlign='left';ctx.fillText('průměrná odměna v čase',x0+4,12);
      // optimal line
      const opt=trueP[bestArm()]; ctx.strokeStyle='rgba(52,211,153,.5)';ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(x0,14+topH-opt*topH);ctx.lineTo(x0+w,14+topH-opt*topH);ctx.stroke();ctx.setLineDash([]);
      if(hist.length>1){ctx.strokeStyle=COL.accent;ctx.lineWidth=2;ctx.beginPath();hist.forEach((v,i)=>{const xx=x0+i/(hist.length-1)*w,yy=14+topH-v*topH;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);});ctx.stroke();}
      // bottom: arms
      const by0=150, bh=p.H-by0-30, bw=w/k;
      for(let a=0;a<k;a++){ const bx=x0+a*bw+6, ww=bw-12;
        ctx.fillStyle='#1c232d';ctx.fillRect(bx,by0,ww,bh);
        ctx.fillStyle=a===last?COL.accent:'rgba(56,189,248,.6)';ctx.fillRect(bx,by0+bh*(1-Q[a]),ww,bh*Q[a]);
        // true prob marker
        const ty=by0+bh*(1-trueP[a]);ctx.strokeStyle=COL.good;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bx,ty);ctx.lineTo(bx+ww,ty);ctx.stroke();
        ctx.fillStyle=COL.muted;ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText('akce '+(a+1),bx+ww/2,by0+bh+14);ctx.fillText('N='+N[a],bx+ww/2,by0+bh+27);
      }
      ro.set(`strategie: <b>${strat==='eps'?'ε-greedy':'UCB'}</b> · krok <b>${t}</b> · průměrná odměna <b style="color:${COL.accent}">${t?(sumR/t).toFixed(3):'0'}</b> · % optimální akce <b style="color:${COL.good}">${t?(100*optCount/t).toFixed(0):0}%</b>`);
    }
    segC(row,{label:'strategie',options:[{value:'eps',label:'ε-greedy'},{value:'ucb',label:'UCB'}],value:'eps',oninput:v=>{strat=v;draw();}});
    slider(row,{label:'ε (explorace)',min:0,max:0.5,step:0.01,value:eps,fmt:v=>v.toFixed(2),oninput:v=>eps=v});
    slider(row,{label:'c (UCB)',min:0.1,max:3,step:0.1,value:cc,fmt:v=>v.toFixed(1),oninput:v=>cc=v});
    button(row,{label:'1 krok',onclick:step});
    const pb=button(row,{label:'▶ spustit',primary:true,onclick:()=>{playing=!playing;pb.textContent=playing?'⏸':'▶ spustit';if(playing)timer=setInterval(step,60);else clearInterval(timer);}});
    button(row,{label:'reset',onclick:()=>{reset();draw();}});
    reset(); p.redraw(draw);
    legend(c,[{c:COL.accent,t:'odhad Q(a)'},{c:COL.good,t:'skutečná pravděpodobnost'}]);
    note(c,'Q(a) se inkrementálně aktualizuje: Q ← Q + 1/N·(R − Q). UCB bonus √(ln t / N(a)) je velký pro málo zkoušené akce → systematická explorace bez náhody.');
  }
});

/* MDP gridworld */
VIZ.add('rl',{ id:'mdp', title:'Markovský rozhodovací proces (MDP)', ref:'§12.5', hint:'Agent se pohybuje po mřížce ke <b>cíli (+1)</b>, vyhýbá se <b>jámě (−1)</b>, každý krok stojí −0.04. Spusť rollout a sleduj <b>váženou odměnu</b> Gₜ = Σ γᵏ Rₜ. Měň <b>discount γ</b> — čím menší, tím míň agentovi záleží na vzdálené budoucnosti.',
  build(host){
    const c=cardEl(host,'Stavy, akce, odměny a vážená odměna Gₜ');
    const row=controlsRow(c);
    const p=new Plot(c,{height:380}); p.world(0,6,0,6);
    const ro=readout(c);
    const W=6,H=6; const goal=[5,5],pit=[3,3],walls=[[2,2],[2,3],[4,1]];
    let gamma=0.9, step=0, timer=null;
    // greedy-ish path to goal avoiding walls/pit (precomputed manhattan walk)
    const path=[[0,0],[1,0],[1,1],[3,0],[3,0]]; // placeholder, recompute properly
    function plan(){ // BFS shortest path avoiding walls and pit
      const blocked=s=>walls.concat([pit]).some(w=>w[0]===s[0]&&w[1]===s[1]);
      const key=s=>s[0]+','+s[1]; const start=[0,0]; const q=[[start]]; const seen={[key(start)]:1};
      while(q.length){const pth=q.shift();const s=pth[pth.length-1];if(s[0]===goal[0]&&s[1]===goal[1])return pth;
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const ns=[s[0]+d[0],s[1]+d[1]];if(ns[0]<0||ns[1]<0||ns[0]>=W||ns[1]>=H)return;if(blocked(ns))return;if(seen[key(ns)])return;seen[key(ns)]=1;q.push(pth.concat([ns]));});}
      return [start]; }
    const P=plan();
    function rewardAt(s){ if(s[0]===goal[0]&&s[1]===goal[1])return 1; if(s[0]===pit[0]&&s[1]===pit[1])return -1; return -0.04; }
    function draw(){ p.clear();
      for(let x=0;x<W;x++)for(let y=0;y<H;y++){ let fill='#11161d';
        if(walls.some(w=>w[0]===x&&w[1]===y))fill='#2a323d'; if(x===goal[0]&&y===goal[1])fill='rgba(52,211,153,.35)'; if(x===pit[0]&&y===pit[1])fill='rgba(248,113,113,.35)';
        p.pxRect(p.X(x)+2,p.Y(y+1)+2,p.plotW/W-4,p.plotH/H-4,{fill,stroke:'#1c232d',width:1});
      }
      p.text(goal[0]+0.5,goal[1]+0.55,'+1',{align:'center',baseline:'middle',fill:COL.good,font:'600 14px sans-serif'});
      p.text(pit[0]+0.5,pit[1]+0.55,'−1',{align:'center',baseline:'middle',fill:COL.bad,font:'600 14px sans-serif'});
      // path so far
      for(let i=0;i<=Math.min(step,P.length-1);i++){const s=P[i];p.dot(s[0]+0.5,s[1]+0.5,{r:4,fill:i===step?COL.accent:'rgba(56,189,248,.4)'});}
      const cur=P[Math.min(step,P.length-1)]; p.dot(cur[0]+0.5,cur[1]+0.5,{r:9,fill:COL.accent,stroke:'#fff',sw:2});
      // discounted return from start along full path
      let G=0; for(let i=1;i<P.length;i++)G+=Math.pow(gamma,i-1)*rewardAt(P[i]);
      ro.set(`γ = <b>${gamma.toFixed(2)}</b> · délka cesty <b>${P.length-1}</b> kroků · vážená odměna G₀ = Σ γᵏRₖ = <b style="color:${G>0?COL.good:COL.bad}">${G.toFixed(3)}</b>`);
    }
    slider(row,{label:'discount γ',min:0,max:1,step:0.02,value:gamma,fmt:v=>v.toFixed(2),oninput:v=>{gamma=v;draw();}});
    button(row,{label:'▶ rollout',primary:true,onclick:()=>{step=0;draw();clearInterval(timer);timer=setInterval(()=>{step++;if(step>=P.length-1){step=P.length-1;clearInterval(timer);}draw();},350);}});
    p.redraw(draw);
    note(c,'Markovská vlastnost: další stav závisí jen na aktuálním stavu a akci, ne na historii cesty. Malé γ (zkus 0,3) sráží hodnotu vzdáleného cíle — agent by pak preferoval rychlý drobný zisk před dalekou velkou odměnou.');
  }
});
