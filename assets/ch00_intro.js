/* ===== Úvod ===== */
VIZ.add('intro',{ id:'how', title:'Jak to funguje', ref:'celá skripta', hint:'Tahle stránka je jen na vyzkoušení ovládání. <b>Chytni modrý bod a táhni ho</b> — vlevo se vykreslí parabola, která jím prochází. Tak nějak fungují všechny vizualizace: táhneš, posouváš, mačkáš.',
  build(host){
    const c=cardEl(host,'Vyzkoušej tažení myší');
    const p=new Plot(c,{height:340}); p.world(-3,3,-1,9);
    let h={x:1.4,y:2}; let drag=false;
    const ro=readout(c);
    function draw(){ p.clear(); p.axes({zero:true,xlabel:'x',ylabel:'y'});
      const a=h.y/Math.max(0.04,h.x*h.x); // parabola y=a x^2 through handle
      p.fnCurve(x=>a*x*x,{stroke:COL.accent,width:2.5});
      p.dot(h.x,h.y,{r:8,fill:COL.c1,stroke:'#fff',sw:2});
      p.text(h.x,h.y,'  táhni mě',{fill:COL.txt,font:'12px sans-serif',baseline:'middle'});
      ro.set(`bod: <b>x=${h.x.toFixed(2)}, y=${h.y.toFixed(2)}</b> &nbsp; křivka: <b>y = ${a.toFixed(2)}·x²</b>`);
    }
    p.redraw(draw);
    p.on('pointerdown',e=>{ if(Math.hypot(p.X(e.x)-p.X(h.x),p.Y(e.y)-p.Y(h.y))<16)drag=true; });
    p.on('pointermove',e=>{ if(drag){h.x=clamp(e.x,-3,3);h.y=clamp(e.y,-1,9);draw();} });
    window.addEventListener('pointerup',()=>drag=false);
    note(c,'Vlevo nahoře je vždy odkaz na příslušnou sekci skript. Vyhledávací pole v menu filtruje témata.');
  }
});
