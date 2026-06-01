/* ===== §8 Vícevrstvé sítě a backprop ===== */

/* Aktivační funkce */
VIZ.add('mlp',{ id:'act', title:'Aktivační funkce', ref:'§8.2', hint:'Bez nelineární aktivace by síť uměla jen lineární model. Vyber funkci a sleduj ji <b>i s derivací</b> (ta je důležitá pro učení — kde je derivace 0, neteče gradient → „mrtvé“ neurony u ReLU v záporu).',
  build(host){
    const c=cardEl(host,'Funkce a její derivace');
    const row=controlsRow(c);
    const p=new Plot(c,{height:340}); p.world(-5,5,-1.6,2.6);
    let which='relu', showD=true;
    const F={
      relu:{f:z=>Math.max(0,z),d:z=>z>0?1:0,n:'ReLU'},
      leaky:{f:z=>z>0?z:0.1*z,d:z=>z>0?1:0.1,n:'Leaky ReLU'},
      sigmoid:{f:z=>1/(1+Math.exp(-z)),d:z=>{const s=1/(1+Math.exp(-z));return s*(1-s);},n:'sigmoida'},
      tanh:{f:z=>Math.tanh(z),d:z=>1-Math.tanh(z)**2,n:'tanh'},
      selu:{f:z=>{const l=1.0507,a=1.6733;return l*(z>0?z:a*(Math.exp(z)-1));},d:z=>{const l=1.0507,a=1.6733;return l*(z>0?1:a*Math.exp(z));},n:'SELU'},
    };
    function draw(){ p.clear(); p.axes({zero:true,nx:10,ny:8,xlabel:'z'});
      const fn=F[which];
      if(showD)p.fnCurve(fn.d,{stroke:COL.accent2,width:1.8,dash:[5,4]});
      p.fnCurve(fn.f,{stroke:COL.accent,width:2.8});
    }
    selectC(row,{label:'aktivace',options:[{value:'relu',label:'ReLU'},{value:'leaky',label:'Leaky ReLU'},{value:'sigmoid',label:'sigmoida'},{value:'tanh',label:'tanh'},{value:'selu',label:'SELU'}],value:which,oninput:v=>{which=v;draw();}});
    checkC(row,{label:'ukázat derivaci',value:true,oninput:v=>{showD=v;draw();}});
    p.redraw(draw);
    legend(c,[{c:COL.accent,t:'g(z)'},{c:COL.accent2,t:"g'(z) — derivace"}]);
    note(c,'ReLU má v záporu derivaci 0 (riziko mrtvých neuronů); Leaky/SELU to opravují. Sigmoida/tanh „saturují“ na okrajích (derivace → 0 → mizející gradient).');
  }
});

/* Ztrátové funkce */
VIZ.add('mlp',{ id:'loss', title:'Ztrátové funkce', ref:'§8.3', hint:'Pro klasifikaci se používá <b>křížová entropie</b>. Vyber skutečnou třídu (0/1) a sleduj, jak ztráta roste podle predikované pravděpodobnosti. Křížová entropie <b>brutálně trestá sebejistý omyl</b> (jde do nekonečna), kvadratická chyba mnohem mírněji.',
  build(host){
    const c=cardEl(host,'Křížová entropie vs. kvadratická chyba');
    const row=controlsRow(c);
    const p=new Plot(c,{height:340}); p.world(0,1,0,5);
    let y=1;
    function draw(){ p.clear(); p.axes({nx:10,ny:5,xlabel:'predikovaná pst. p̂',ylabel:'ztráta'});
      const bce=p_=>-(y*Math.log(Math.max(1e-6,p_))+(1-y)*Math.log(Math.max(1e-6,1-p_)));
      const sq=p_=>(y-p_)**2;
      p.clip(()=>{p.fnCurve(bce,{stroke:COL.c1,width:2.8,n:200});p.fnCurve(sq,{stroke:COL.c2,width:2.2});});
      p.text(0.5,4.6,`skutečná třída Y = ${y}`,{align:'center',fill:COL.muted,font:'12px sans-serif'});
    }
    segC(row,{label:'skutečná třída',options:[{value:'1',label:'Y = 1'},{value:'0',label:'Y = 0'}],value:'1',oninput:v=>{y=+v;draw();}});
    p.redraw(draw);
    legend(c,[{c:COL.c1,t:'křížová entropie −log p̂'},{c:COL.c2,t:'kvadratická (Y−p̂)²'}]);
    note(c,'Pro Y=1: když model řekne p̂→0 (jistý omyl), křížová entropie → ∞. To tlačí síť, aby se „jistě“ nepletla.');
  }
});

/* MLP učí nelineární hranici */
VIZ.add('mlp',{ id:'mlpfit', title:'Vícevrstvá síť se učí (live)', ref:'§8.1, §8.4', hint:'Malá síť 2→H→1 trénovaná <b>zpětným šířením chyby</b>. Spusť trénink a sleduj, jak se rozhodovací hranice <b>sama tvaruje</b> kolem dat. Zkus XOR — to perceptron neuměl, ale dvouvrstvá síť ano!',
  build(host){
    const c=cardEl(host,'Trénink MLP backpropem');
    const row=controlsRow(c);
    const p=new Plot(c,{height:420}); p.world(-3,3,-3,3);
    const ro=readout(c);
    let kind='xor',H=8,lr=0.1,X=[],Y=[],net=null,epoch=0,timer=null,playing=false;
    function gen(){ const r=rng(23); X=[];Y=[];
      if(kind==='xor'){const cc=[[-1.3,-1.3,1],[1.3,1.3,1],[-1.3,1.3,0],[1.3,-1.3,0]];cc.forEach(c0=>{for(let i=0;i<14;i++){X.push([c0[0]+0.5*randnFrom(r),c0[1]+0.5*randnFrom(r)]);Y.push(c0[2]);}});}
      else if(kind==='kruhy'){for(let i=0;i<28;i++){const a=r()*6.28,rad=0.4+0.5*r();X.push([rad*Math.cos(a),rad*Math.sin(a)]);Y.push(1);}for(let i=0;i<32;i++){const a=r()*6.28,rad=1.7+0.5*r();X.push([rad*Math.cos(a),rad*Math.sin(a)]);Y.push(0);}}
      else {for(let i=0;i<30;i++){X.push([-1.1+0.7*randnFrom(r),-0.5+0.7*randnFrom(r)]);Y.push(0);}for(let i=0;i<30;i++){X.push([1.1+0.7*randnFrom(r),0.6+0.7*randnFrom(r)]);Y.push(1);}}
    }
    function initNet(){ const r=rng(99); const W1=[],b1=[],W2=[]; for(let h=0;h<H;h++){W1.push([randnFrom(r)*0.8,randnFrom(r)*0.8]);b1.push(0);W2.push(randnFrom(r)*0.8);} net={W1,b1,W2,b2:0}; epoch=0; }
    function fwd(x){ const a1=net.W1.map((w,h)=>Math.tanh(w[0]*x[0]+w[1]*x[1]+net.b1[h])); let z2=net.b2; for(let h=0;h<H;h++)z2+=net.W2[h]*a1[h]; const out=1/(1+Math.exp(-z2)); return {a1,out}; }
    function trainEpoch(){ let loss=0; for(let i=0;i<X.length;i++){ const {a1,out}=fwd(X[i]); const y=Y[i]; loss+=-(y*Math.log(out+1e-9)+(1-y)*Math.log(1-out+1e-9));
        const dz2=out-y; for(let h=0;h<H;h++){ const dW2=dz2*a1[h]; const da1=dz2*net.W2[h]; const dz1=da1*(1-a1[h]*a1[h]);
          net.W1[h][0]-=lr*dz1*X[i][0]; net.W1[h][1]-=lr*dz1*X[i][1]; net.b1[h]-=lr*dz1; net.W2[h]-=lr*dW2; }
        net.b2-=lr*dz2; } epoch++; return loss/X.length; }
    function draw(loss){ p.clear();
      const nx=66,ny=54,cw=p.plotW/nx,chh=p.plotH/ny;
      p.clip(()=>{for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const wx=p.ix(p.padL+(i+.5)*cw),wy=p.iy(p.padT+(j+.5)*chh);const o=fwd([wx,wy]).out;const col=o>=0.5?'251,146,60':'96,165,250';const conf=Math.abs(o-0.5)*2;p.pxRect(p.padL+i*cw,p.padT+j*chh,cw+1,chh+1,{fill:`rgba(${col},${0.05+0.28*conf})`});}});
      p.axes({nx:6,ny:6});
      X.forEach((x,i)=>p.dot(x[0],x[1],{r:5,fill:Y[i]?COL.c1:COL.c2,stroke:'#0a0e13',sw:1.2}));
      if(loss!=null)ro.set(`H = <b>${H}</b> neuronů · epocha <b>${epoch}</b> · ztráta <b>${loss.toFixed(3)}</b>`);
    }
    selectC(row,{label:'data',options:[{value:'xor',label:'XOR'},{value:'kruhy',label:'kruhy'},{value:'skvrny',label:'dvě skvrny'}],value:kind,oninput:v=>{kind=v;gen();initNet();draw(null);}});
    slider(row,{label:'skryté neurony H',min:2,max:24,step:1,value:H,oninput:v=>{H=v;initNet();draw(null);}});
    slider(row,{label:'learning rate',min:0.01,max:0.5,step:0.01,value:lr,fmt:v=>v.toFixed(2),oninput:v=>lr=v});
    const pb=button(row,{label:'▶ trénovat',primary:true,onclick:()=>{playing=!playing;pb.textContent=playing?'⏸ pauza':'▶ trénovat';if(playing)timer=setInterval(()=>{let l;for(let k=0;k<4;k++)l=trainEpoch();draw(l);},40);else clearInterval(timer);}});
    button(row,{label:'reset',onclick:()=>{initNet();draw(null);}});
    gen(); initNet(); p.redraw(()=>draw(null));
    note(c,'Skryté neurony si síť „vymýšlí“ jako příznaky. U XOR potřebuješ aspoň 2-3 neurony; u kruhů víc. Backprop = řetězové pravidlo počítané od výstupu zpět.');
  }
});

/* Výpočetní graf forward/backward */
VIZ.add('mlp',{ id:'graph', title:'Výpočetní graf: dopředný a zpětný chod', ref:'§8.4', hint:'Jeden neuron f = g(w·x + w₀) se ztrátou L. <b>Dopředný chod</b> počítá hodnoty zdola nahoru. <b>Zpětný chod</b> počítá gradienty shora dolů (řetězové pravidlo). Měň vstupy a přepínej chod.',
  build(host){
    const c=cardEl(host,'Řetězové pravidlo na malém grafu');
    const row=controlsRow(c);
    const p=new Plot(c,{height:420}); p.world(0,10,0,10);
    let x=1.5,w=0.8,w0=-0.5,y=1,mode='fwd';
    function draw(){ p.clear();
      const sig=z=>1/(1+Math.exp(-z));
      const u=w*x, z=u+w0, f=sig(z), L=(f-y)**2;
      // gradients
      const dL_df=2*(f-y), df_dz=f*(1-f), dL_dz=dL_df*df_dz, dL_dw=dL_dz*x, dL_dw0=dL_dz, dL_dx=dL_dz*w;
      const nodes={ x:[1.5,2,`x=${x.toFixed(2)}`,COL.c2], w:[4,2,`w=${w.toFixed(2)}`,COL.c2], w0:[7.2,4.5,`w₀=${w0.toFixed(2)}`,COL.c2],
        mul:[2.8,4.5,`× → ${u.toFixed(2)}`,COL.accent], add:[5.2,6,`+ → z=${z.toFixed(2)}`,COL.accent], g:[5.2,8,`g → f=${f.toFixed(3)}`,COL.accent2], L:[5.2,9.6,`L=${L.toFixed(3)}`,COL.c1] };
      function edge(a,b){p.seg(nodes[a][0],nodes[a][1]+0.35,nodes[b][0],nodes[b][1]-0.35,{stroke:'#3a4654',width:1.5});}
      edge('x','mul');edge('w','mul');edge('mul','add');edge('w0','add');edge('add','g');edge('g','L');
      function box(n,grad){const [bx,by,t,col]=nodes[n]; const W=2.0; p.pxRect(p.X(bx)-46,p.Y(by)-14,92,28,{fill:'#11161d',stroke:col,width:1.5});
        p.text(bx,by,t,{align:'center',baseline:'middle',fill:'#dce3ea',font:'12px sans-serif'});
        if(mode==='bwd'&&grad!=null)p.text(bx,by+0.55,'∂L=' + grad,{align:'center',baseline:'middle',fill:COL.warn,font:'11px sans-serif'}); }
      box('x',dL_dx.toFixed(3));box('w',dL_dw.toFixed(3));box('w0',dL_dw0.toFixed(3));box('mul',dL_dz.toFixed(3));box('add',dL_dz.toFixed(3));box('g',dL_df.toFixed(3));box('L','1');
      p.text(0.2,0.4,mode==='fwd'?'▲ dopředný chod: hodnoty zdola nahoru':'▼ zpětný chod: gradienty shora dolů (žlutě)',{fill:COL.muted,font:'12px sans-serif'});
    }
    slider(row,{label:'x',min:-3,max:3,step:0.1,value:x,fmt:v=>v.toFixed(1),oninput:v=>{x=v;draw();}});
    slider(row,{label:'w',min:-3,max:3,step:0.1,value:w,fmt:v=>v.toFixed(1),oninput:v=>{w=v;draw();}});
    slider(row,{label:'w₀',min:-3,max:3,step:0.1,value:w0,fmt:v=>v.toFixed(1),oninput:v=>{w0=v;draw();}});
    segC(row,{label:'chod',options:[{value:'fwd',label:'dopředný'},{value:'bwd',label:'zpětný'}],value:'fwd',oninput:v=>{mode=v;draw();}});
    p.redraw(draw);
    note(c,'Zpětný chod: ∂L/∂w = ∂L/∂f · g′(z) · x. Každý uzel jen vynásobí příchozí gradient svou lokální derivací — to je celá podstata backpropu.');
  }
});
