/* ===== §11 NLP ===== */

/* Bag of words + tf-idf */
VIZ.add('nlp',{ id:'tfidf', title:'Bag of words a tf-idf', ref:'§11.2–11.4', hint:'Dokumenty = vektory počtů slov. <b>Přepni na tf-idf</b> a sleduj, jak slova, která jsou skoro <b>všude</b> (stopword „kočka“), dostanou nízkou váhu, zatímco <b>charakteristická</b> slova vyniknou. Najeď myší na buňku pro hodnotu.',
  build(host){
    const c=cardEl(host,'Term-dokumentová matice: počty vs. tf-idf');
    const row=controlsRow(c);
    const p=new Plot(c,{height:330});
    const docs=[['pes','štěká','kočka'],['kočka','loví','myš'],['pes','kočka','spí'],['myš','utíká','kočka']];
    const vocab=[...new Set(docs.flat())].sort();
    let mode='count', hover=null;
    const D=docs.length;
    function tf(d,w){return docs[d].filter(x=>x===w).length;}
    function df(w){return docs.filter(d=>d.includes(w)).length;}
    function val(d,w){ if(mode==='count')return tf(d,w); return tf(d,w)*Math.log(D/df(w)); }
    function draw(){ p.clear(); const ctx=p.ctx;
      const cw=Math.min(78,(p.W-150)/vocab.length), ch=40, x0=120, y0=56;
      ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillStyle=COL.muted;
      vocab.forEach((w,j)=>{ctx.save();ctx.translate(x0+j*cw+cw/2,y0-8);ctx.rotate(-0.4);ctx.fillText(w,0,0);ctx.restore();});
      let mx=0;for(let d=0;d<D;d++)for(const w of vocab)mx=Math.max(mx,val(d,w));
      for(let d=0;d<D;d++){ ctx.textAlign='right';ctx.fillStyle=COL.txt;ctx.fillText('dok '+(d+1),x0-10,y0+d*ch+ch/2+4);
        vocab.forEach((w,j)=>{ const v=val(d,w); const t=mx?v/mx:0; const isHover=hover&&hover.d===d&&hover.j===j;
          ctx.fillStyle=v>0?`rgba(56,189,248,${0.12+0.8*t})`:'#11161d'; ctx.fillRect(x0+j*cw,y0+d*ch,cw-2,ch-2);
          if(isHover){ctx.strokeStyle=COL.warn;ctx.lineWidth=2;ctx.strokeRect(x0+j*cw,y0+d*ch,cw-2,ch-2);}
          ctx.fillStyle=t>0.5?'#06131c':COL.txt;ctx.textAlign='center';ctx.fillText(mode==='count'?v:(v.toFixed(2)),x0+j*cw+cw/2-1,y0+d*ch+ch/2+4); });
      }
      ctx.fillStyle=COL.muted;ctx.textAlign='left';
      vocab.forEach((w,j)=>{ if(df(w)===D){ctx.fillStyle=COL.bad;ctx.save();ctx.translate(x0+j*cw+cw/2,y0+D*ch+16);ctx.fillText('ve všech →idf 0',-30,0);ctx.restore();} });
    }
    segC(row,{label:'hodnota v buňce',options:[{value:'count',label:'počty (bag of words)'},{value:'tfidf',label:'tf-idf'}],value:'count',oninput:v=>{mode=v;draw();}});
    p.redraw(draw);
    p.on('pointermove',e=>{const cw=Math.min(78,(p.W-150)/vocab.length),ch=40,x0=120,y0=56;const j=Math.floor((e.px-x0)/cw),d=Math.floor((e.py-y0)/ch);hover=(d>=0&&d<D&&j>=0&&j<vocab.length)?{d,j}:null;draw();});
    note(c,'idf = log(počet dokumentů / počet dokumentů se slovem). Slovo „kočka“ je ve všech 4 dokumentech → idf = 0 → tf-idf = 0 (jako stopword). Tak tf-idf automaticky potlačí nezajímavá slova.');
  }
});

/* Word embeddings */
VIZ.add('nlp',{ id:'embed', title:'Vektorová reprezentace slov (embeddings)', ref:'§11.7', hint:'Slova jsou body v prostoru, kde <b>podobná slova leží blízko</b>. Vztahy jsou pak směry: <b>král − muž + žena ≈ královna</b>. Vyber analogii a sleduj, jak vektorová aritmetika trefí správné slovo.',
  build(host){
    const c=cardEl(host,'Význam jako geometrie: analogie = vektory');
    const row=controlsRow(c);
    const p=new Plot(c,{height:420}); p.world(-1,7,-1,6);
    const W={ 'muž':[1,1],'žena':[1,2.6],'král':[3.6,1],'královna':[3.6,2.6],'princ':[3,0.2],'princezna':[3,1.8],
      'pes':[0.2,4.6],'kočka':[1.0,5.0],'štěně':[0.2,3.8],'kotě':[1.0,4.2],
      'Francie':[5.2,1.2],'Paříž':[5.2,2.6],'Itálie':[6.2,0.7],'Řím':[6.2,2.1] };
    const analogies={ a1:['král','muž','žena'], a2:['Paříž','Francie','Itálie'], a3:['královna','žena','muž'] };
    let cur='a1';
    function draw(){ p.clear(); p.axes({nx:8,ny:7});
      // clusters tint
      Object.entries(W).forEach(([w,pt])=>{ const cl = ['pes','kočka','štěně','kotě'].includes(w)?COL.c3 : ['Francie','Paříž','Itálie','Řím'].includes(w)?COL.c4 : COL.c2;
        p.dot(pt[0],pt[1],{r:5,fill:cl}); p.text(pt[0]+0.12,pt[1]+0.12,w,{fill:COL.txt,font:'12px sans-serif'}); });
      const [a,b,c2]=analogies[cur]; const va=W[a],vb=W[b],vc=W[c2]; const res=[va[0]-vb[0]+vc[0],va[1]-vb[1]+vc[1]];
      p.arrow(vb[0],vb[1],va[0],va[1],{stroke:COL.warn,width:2}); // b->a (e.g. muž->král)
      p.arrow(vc[0],vc[1],res[0],res[1],{stroke:COL.accent,width:2,head:9}); // c-> result
      p.ring(res[0],res[1],{r:12,stroke:COL.accent,width:2});
      // nearest word to res
      let best=null,bd=1e9;Object.entries(W).forEach(([w,pt])=>{const dd=Math.hypot(pt[0]-res[0],pt[1]-res[1]);if(dd<bd&&![a,b,c2].includes(w)){bd=dd;best=w;}});
      p.text(res[0]+0.15,res[1]-0.2,'≈ '+best,{fill:COL.accent,font:'600 13px sans-serif'});
    }
    selectC(row,{label:'analogie',options:[{value:'a1',label:'král − muž + žena'},{value:'a2',label:'Paříž − Francie + Itálie'},{value:'a3',label:'královna − žena + muž'}],value:cur,oninput:v=>{cur=v;draw();}});
    p.redraw(draw);
    legend(c,[{c:COL.c2,t:'osoby'},{c:COL.c3,t:'zvířata'},{c:COL.c4,t:'města/země'},{c:COL.accent,t:'výsledek aritmetiky'}]);
    note(c,'Vektory se učí z velkých textů (word2vec): slova v podobných kontextech mají podobné vektory. Slabina statických embeddings: jedno slovo = jeden vektor bez ohledu na kontext (to řeší self-attention).');
  }
});

/* Self-attention */
VIZ.add('nlp',{ id:'attn', title:'Self-attention (kontextová pozornost)', ref:'§11.7', hint:'Každé slovo si „všímá“ ostatních různě podle kontextu. <b>Klikni na slovo</b> a uvidíš, kolik pozornosti věnuje ostatním (tloušťka oblouku, výška sloupce). Přepni větu a sleduj, jak „kohoutek“ mění význam.',
  build(host){
    const c=cardEl(host,'Kolik pozornosti věnuje slovo ostatním');
    const row=controlsRow(c);
    const p=new Plot(c,{height:300}); p.world(0,10,0,10);
    const S={ vana:{toks:['otevřel','kohoutek','a','napustil','vanu'], attn:{1:[0.1,0.1,0.05,0.35,0.4],0:[0.4,0.2,0.05,0.25,0.1]}},
      dvur:{toks:['kohoutek','na','dvoře','hlasitě','kokrhal'], attn:{0:[0.1,0.05,0.3,0.15,0.4]}} };
    let sent='vana', sel=1;
    function attnFor(i,toks){ if(S[sent].attn[i])return S[sent].attn[i]; // default: similarity by distance
      const w=toks.map((_,j)=>Math.exp(-0.6*Math.abs(i-j))); const s=w.reduce((a,b)=>a+b,0); return w.map(v=>v/s); }
    function draw(){ p.clear(); const toks=S[sent].toks; const n=toks.length; const dx=9/(n); const y=6;
      const a=attnFor(sel,toks);
      // arcs from sel to others
      toks.forEach((t,j)=>{ if(j===sel)return; const x1=0.6+sel*dx+dx/2, x2=0.6+j*dx+dx/2; const mid=(x1+x2)/2, h=y+1.4+Math.abs(j-sel)*0.5;
        const ctx=p.ctx;ctx.strokeStyle=`rgba(56,189,248,${0.15+0.8*a[j]})`;ctx.lineWidth=1+8*a[j];ctx.beginPath();ctx.moveTo(p.X(x1),p.Y(y+0.4));ctx.quadraticCurveTo(p.X(mid),p.Y(h),p.X(x2),p.Y(y+0.4));ctx.stroke(); });
      toks.forEach((t,j)=>{ const x=0.6+j*dx+dx/2; const on=j===sel;
        p.pxRect(p.X(x)-dx*16,p.Y(y)-16,dx*32,32,{fill:on?'#15303d':'#11161d',stroke:on?COL.accent:'#3a4654',width:on?2:1});
        p.text(x,y+0.05,t,{align:'center',baseline:'middle',fill:on?COL.accent:COL.txt,font:(on?'600 ':'')+'13px sans-serif'});
        // weight bar below
        p.pxRect(p.X(x)-dx*16,p.Y(y)+24,dx*32,7,{fill:'#1c232d'}); p.pxRect(p.X(x)-dx*16,p.Y(y)+24,dx*32*a[j],7,{fill:COL.accent});
        p.text(x,y-1.2,a[j].toFixed(2),{align:'center',fill:COL.muted,font:'10px sans-serif'});
      });
      p.text(0.3,9.4,'klikni na slovo → jeho pozornost k ostatním (Q·K → softmax)',{fill:COL.muted,font:'11px sans-serif'});
    }
    segC(row,{label:'věta',options:[{value:'vana',label:'…napustil vanu'},{value:'dvur',label:'…na dvoře kokrhal'}],value:'vana',oninput:v=>{sent=v;sel=0;draw();}});
    p.redraw(draw);
    p.on('pointerdown',e=>{const toks=S[sent].toks,n=toks.length,dx=9/n;const j=Math.floor((e.x-0.6)/dx);if(j>=0&&j<n){sel=j;draw();}});
    note(c,'„kohoutek“ ve větě o vaně věnuje pozornost slovu „napustil/vanu“ (vodovodní), v druhé větě „dvoře/kokrhal“ (zvíře). Proto je výsledný embedding kontextový. (Zjednodušená ilustrace — váhy jsou ruční.)');
  }
});
