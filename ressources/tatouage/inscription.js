// Génère inscription.json : transcription Tengwar (paquet npm tengwar@1.2.6) + contours de la police Tengwar Annatar (opentype.js).
// Usage : node inscription.js <tengwar-annatar.woff> > inscription.json  (depuis un dossier contenant package/ = tengwar extrait)
const T=require('./package/index.js'),G=require('./package/general-use'),F=require('./package/tengwar-annatar');
const opentype=require('opentype.js');
const font=opentype.loadSync(process.argv[2]);
const parts={
  ring1:'ash nazg durbatulûk', ring2:'ash nazg gimbatul',
  side1:'ash nazg thrakatulûk', side2:'agh burzum-ishi krimpatul'};
const out={};
for (const [k,s] of Object.entries(parts)) {
  const txt=T.transcribe(s,G,F).replace(/=/g,'');
  const size=100, p=font.getPath(txt,0,0,size);
  const subs=[]; let cur=null, last=[0,0];
  const push=(x,y)=>{cur.push([+x.toFixed(2),+y.toFixed(2)]); last=[x,y];};
  for (const c of p.commands) {
    if (c.type==='M'){cur=[];subs.push(cur);push(c.x,c.y);}
    else if (c.type==='L') push(c.x,c.y);
    else if (c.type==='Q'){const [x0,y0]=last;for(let i=1;i<=8;i++){const t=i/8,m=1-t;push(m*m*x0+2*m*t*c.x1+t*t*c.x,m*m*y0+2*m*t*c.y1+t*t*c.y);}}
    else if (c.type==='C'){const [x0,y0]=last;for(let i=1;i<=10;i++){const t=i/10,m=1-t;push(m*m*m*x0+3*m*m*t*c.x1+3*m*t*t*c.x2+t*t*t*c.x,m*m*m*y0+3*m*m*t*c.y1+3*m*t*t*c.y2+t*t*t*c.y);}}
  }
  out[k]={text:txt,width:font.getAdvanceWidth(txt,size),subs};
}
console.log(JSON.stringify(out));
