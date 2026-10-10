const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
// Génère toutes les icônes (site + Android) à partir de ressources/logo-nalow.jpg :
//   node ressources/generer-icones.cjs
const RACINE=path.join(__dirname,'..'), RES=path.join(RACINE,'android/app/src/main/res');
const taille=(f)=>{const b=fs.readFileSync(f);return [b.readUInt32BE(16),b.readUInt32BE(20)]};
const cibles=[];
for(const f of ['icon-192.png','icon-512.png','apple-touch-icon.png','favicon-32.png','favicon-64.png'])cibles.push({f:path.join(RACINE,'public',f),type:f.startsWith('apple')?'plein':'carre'});
cibles.push({f:path.join(RACINE,'public/icon-maskable-512.png'),type:'masquable'});
for(const d of fs.readdirSync(RES).filter(d=>d.startsWith('mipmap-')&&!d.includes('anydpi'))){
  cibles.push({f:path.join(RES,d,'ic_launcher.png'),type:'carre'});
  cibles.push({f:path.join(RES,d,'ic_launcher_round.png'),type:'rond'});
  cibles.push({f:path.join(RES,d,'ic_launcher_foreground.png'),type:'premier-plan'});
}
for(const c of cibles)c.t=taille(c.f);
(async()=>{const b=await chromium.launch();const p=await b.newPage();
const src='data:image/jpeg;base64,'+fs.readFileSync(path.join(__dirname,'logo-nalow.jpg')).toString('base64');
const r=await p.evaluate(async({src,cibles})=>{const i=new Image();i.src=src;await i.decode();
 const W=i.width,H=i.height;const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.drawImage(i,0,0);
 const d=g.getImageData(0,0,W,H),px=d.data;
 // fond blanc autour du carré arrondi : rendu transparent depuis les bords
 const blanc=(k)=>Math.min(px[k],px[k+1],px[k+2])>215&&Math.max(px[k],px[k+1],px[k+2])-Math.min(px[k],px[k+1],px[k+2])<25;
 const vu=new Uint8Array(W*H),pile=[];for(let x=0;x<W;x++)pile.push(x,(H-1)*W+x);for(let y=0;y<H;y++)pile.push(y*W,y*W+W-1);
 while(pile.length){const k=pile.pop();if(vu[k])continue;vu[k]=1;if(!blanc(k*4))continue;px[k*4+3]=0;const x=k%W,y=(k/W)|0;if(x>0)pile.push(k-1);if(x<W-1)pile.push(k+1);if(y>0)pile.push(k-W);if(y<H-1)pile.push(k+W);}
 g.putImageData(d,0,0);
 let x0=W,x1=0,y0=H,y1=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(px[(y*W+x)*4+3]>200){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
 const L=Math.max(x1-x0,y1-y0)+1;
 const logo=document.createElement('canvas');logo.width=L;logo.height=L;logo.getContext('2d').drawImage(c,x0,y0,x1-x0+1,y1-y0+1,(L-(x1-x0+1))/2,(L-(y1-y0+1))/2,x1-x0+1,y1-y0+1);
 // bleu du fond (intérieur, à gauche au milieu)
 const j=((y0+Math.round(L*0.5))*W+x0+Math.round(L*0.06))*4;const bleu=`rgb(${px[j]},${px[j+1]},${px[j+2]})`;
 // intérieur sans rebord, pour l'icône Apple (carré plein)
 const marge=Math.round(L*0.035);
 const out={bleu};
 for(const {f,type,t:[w,h]} of cibles){const k=document.createElement('canvas');k.width=w;k.height=h;const kg=k.getContext('2d');kg.imageSmoothingQuality='high';
  if(type==='carre')kg.drawImage(logo,0,0,w,h);
  else if(type==='plein'){kg.drawImage(logo,marge,marge,L-2*marge,L-2*marge,0,0,w,h)}
  else if(type==='masquable'){kg.fillStyle=bleu;kg.fillRect(0,0,w,h);const s=w*0.86;kg.drawImage(logo,(w-s)/2,(h-s)/2,s,s)}
  else if(type==='rond'){kg.fillStyle=bleu;kg.beginPath();kg.arc(w/2,h/2,w/2,0,7);kg.fill();kg.save();kg.clip();const s=w*0.9;kg.drawImage(logo,(w-s)/2,(h-s)/2,s,s);kg.restore()}
  else{const s=w*0.6;kg.drawImage(logo,(w-s)/2,(h-s)/2,s,s)}
  out[f]=k.toDataURL('image/png').split(',')[1]}
 // logo sur fond blanc, pour l'écran d'ouverture (generer-lancement.cjs)
 const wb=document.createElement('canvas');wb.width=W;wb.height=H;const wg=wb.getContext('2d');wg.fillStyle='#fff';wg.fillRect(0,0,W,H);wg.drawImage(i,0,0);out.webp=wb.toDataURL('image/webp',0.95).split(',')[1];
 return out},{src,cibles});
for(const {f} of cibles)fs.writeFileSync(f,Buffer.from(r[f],'base64'));
fs.writeFileSync(path.join(__dirname,'logo-nalow.webp'),Buffer.from(r.webp,'base64'));
console.log('bleu',r.bleu,cibles.length,'icônes');await b.close()})();
