const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
// Génère l'écran d'ouverture plein écran à partir du logo : node ressources/generer-lancement.cjs
const RES=path.join(__dirname, '../android/app/src/main/res');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
const src='data:image/webp;base64,'+fs.readFileSync(path.join(__dirname, 'logo-malow.webp')).toString('base64');
const tailles={};for(const d of fs.readdirSync(RES).filter(d=>d.startsWith('drawable'))){const f=path.join(RES,d,'splash.png');if(fs.existsSync(f)){const buf=fs.readFileSync(f);tailles[d]=[buf.readUInt32BE(16),buf.readUInt32BE(20)]}}
const out=await p.evaluate(async({src,tailles})=>{const img=new Image();img.src=src;await img.decode();
 const W=img.width,H=img.height;const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.drawImage(img,0,0);const d=g.getImageData(0,0,W,H).data;
 const px=(x,y)=>{const i=(y*W+x)*4;return [d[i],d[i+1],d[i+2]]};
 const bleu=(x,y)=>{const [r,gg,bb]=px(x,y);return bb>r+40&&bb>200};
 let x0=0;while(!bleu(x0,H>>1))x0++;let x1=W-1;while(!bleu(x1,H>>1))x1--;let y0=0;while(!bleu(W>>1,y0))y0++;let y1=H-1;while(!bleu(W>>1,y1))y1--;
 // côtés : on enlève le rebord ; haut/bas gardés (prolongés plus bas)
 const ix=Math.round((x1-x0)*0.04);x0+=ix;x1-=ix;
 const sw=x1-x0+1,sh=y1-y0+1;
 // couleur de référence du fond (intérieur du carré, près du bord gauche)
 const ref=(y)=>px(x0+Math.round(sw*0.05),y);
 const refH=ref(y0+Math.round(sh*0.08)),refB=ref(y0+Math.round(sh*0.93));
 const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
 // image étirée : hauteur 2,4 × la largeur (assez pour tous les téléphones)
 const EW=sw,EH=Math.round(sw*2.4),oy=Math.round((EH-sh)/2);
 const e=document.createElement('canvas');e.width=EW;e.height=EH;const eg=e.getContext('2d');
 const ed=eg.createImageData(EW,EH),o=ed.data;
 // bord intérieur de chaque colonne : premier pixel bleu « stable » après le rebord
 const estBleu=(c)=>c[2]>c[0]+60;
 const stable=(sx,y,pas)=>{const a=px(sx,y),b2=px(sx,y+pas);return estBleu(a)&&estBleu(b2)&&dist(a,b2)<5};
 const limite=Math.round(sh*0.2);
 const hauts=[],bas=[];
 for(let x=0;x<EW;x++){const sx=x0+x;
  let ht=null;for(let y=y0+4;y<y0+limite;y++)if(stable(sx,y,8)){ht=y;break}
  let hb=null;for(let y=y1-4;y>y1-limite;y--)if(stable(sx,y,-8)){hb=y;break}
  hauts.push(ht);bas.push(hb)}
 // colonnes sans réponse (oreille, lettres…) : valeur de la voisine
 const combler=(t)=>{for(let x=1;x<t.length;x++)if(t[x]==null)t[x]=t[x-1];for(let x=t.length-2;x>=0;x--)if(t[x]==null)t[x]=t[x+1];return t};
 combler(hauts);combler(bas);
 // marge de sécurité et lissage
 for(let x=0;x<EW;x++){hauts[x]+=6;bas[x]-=6}
 // couleur d'extension par colonne : pixels trop éloignés du fond rejetés, puis moyenne glissante large (pas de traînées)
 const brutes=(t,sens)=>{const cs=t.map((y,x)=>{let r=[0,0,0],n=0;for(let k=0;k<20;k++){const c=px(x0+x,y+sens*k);if(estBleu(c)){r[0]+=c[0];r[1]+=c[1];r[2]+=c[2];n++}}return n>10?r.map(v=>v/n):null});return combler(cs)};
 const lisser=(cs)=>cs.map((_,x)=>{let r=[0,0,0],n=0;for(let k=-30;k<=30;k++){const c=cs[Math.min(cs.length-1,Math.max(0,x+k))];r[0]+=c[0];r[1]+=c[1];r[2]+=c[2];n++}return r.map(v=>v/n)});
 const couleursH=lisser(brutes(hauts,1)),couleursB=lisser(brutes(bas,-1));
 const BANDE=45;
 for(let x=0;x<EW;x++){
  const sx=x0+x,ht=hauts[x],hb=bas[x];
  // couleur d'extension = moyenne sur 9 colonnes (évite les traînées)
  const cH=couleursH[x],cB=couleursB[x];
  for(let y=0;y<EH;y++){const sy=y-oy+y0;let col;
   if(sy<ht){const t=Math.min(1,(ht-sy)/(sh*0.35));col=cH.map((v,k)=>v+(refH[k]-v)*t)}
   else if(sy>hb){const t=Math.min(1,(sy-hb)/(sh*0.35));col=cB.map((v,k)=>v+(refB[k]-v)*t)}
   else{col=px(sx,sy);
    // fondu entre l'extension et l'image près du bord (seulement sur le fond bleu)
    // reflets blancs du rebord juste sous la ligne de raccord : remplacés par le fond
    const blanchatre=Math.min(...col)>170&&Math.max(...col)-Math.min(...col)<70;
    if(blanchatre&&(sy<ht+16||sy>hb-16))col=(sy<ht+16?cH:cB).slice();
    else if(estBleu(col)){if(sy<ht+BANDE){const t=(sy-ht)/BANDE;col=cH.map((v,k)=>v+(col[k]-v)*t)}else if(sy>hb-BANDE){const t=(hb-sy)/BANDE;col=cB.map((v,k)=>v+(col[k]-v)*t)}}}
   const i=(y*EW+x)*4;o[i]=col[0];o[i+1]=col[1];o[i+2]=col[2];o[i+3]=255}}
 eg.putImageData(ed,0,0);
 const composer=(w,h,type='image/png',q)=>{const k=document.createElement('canvas');k.width=w;k.height=h;const kg=k.getContext('2d');kg.imageSmoothingQuality='high';
  // « cover » centré
  const s=Math.max(w/EW,h/EH);const dw=EW*s,dh=EH*s;kg.drawImage(e,(w-dw)/2,(h-dh)/2,dw,dh);return k.toDataURL(type,q).split(',')[1]};
 const r={etire:e.toDataURL('image/webp',0.88).split(',')[1],apercu:composer(390*2,844*2),apercu2:composer(360*2,640*2),fond:[refH,refB]};
 for(const [dir,[w,h]] of Object.entries(tailles))r[dir]=composer(w,h);return r},{src,tailles});
fs.writeFileSync(path.join(__dirname, '../public/lancement.webp'),Buffer.from(out.etire,'base64'));

for(const dir of Object.keys(tailles))fs.writeFileSync(path.join(RES,dir,'splash.png'),Buffer.from(out[dir],'base64'));
console.log('fond',JSON.stringify(out.fond));await b.close();})();
