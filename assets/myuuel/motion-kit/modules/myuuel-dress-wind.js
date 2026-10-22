/* Myuuel standing cloth only. A continuous lower-panel warp, no detached copies.
   Hip band y<=360 and the entire knee/boot corridor x=135..245 stay fixed. */
(() => {
  'use strict';
  const width=384,height=512,pinY=360,leftInner=135,rightInner=245,falloffHeight=52;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const ease=v=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
  function displacement(x,y,clockMs,strength=1){
    if(y<=pinY||x>=leftInner&&x<=rightInner||!strength)return[0,0];
    const side=x<leftInner?-1:1;
    // Each narrow horizontal band is affine about the pinned inner seam.
    // Empty outer margins may move more; painted cloth stays close to the seam.
    const seam=(side<0?leftInner-x:x-rightInner)/48;
    // Spread influence through more of each panel, with the same pinned join
    // and the same maximum hem motion as the original 86-pixel falloff.
    const u=ease((y-pinY)/falloffHeight),t=clockMs/1000;
    const gust=.82+.18*Math.sin(t*.58-.7);
    const phase=t*1.46-.4*u+(side<0?0:.16);
    const ripple=.16*Math.sin(t*2.37-.65*u+.9);
    const amp=3*clamp(strength,0,2)*seam*u;
    return [amp*gust*(Math.sin(phase)+ripple),0];
  }
  function drawStrip(ctx,source,left,clockMs,strength){
    const start=left?0:rightInner,w=left?leftInner:width-rightInner;
    ctx.save();ctx.beginPath();ctx.rect(start,pinY,w,height-pinY);ctx.clip();
    // Four-pixel bands avoid hundreds of clipped full-image triangle draws.
    // Adjacent bands never overlap, so soft alpha cannot accumulate at mesh seams.
    for(let y=pinY;y<height;y+=4){
      const h=Math.min(4,height-y),edge=left?0:width,dx=displacement(edge,y,clockMs,strength)[0];
      ctx.drawImage(source,start,y,w,h,left?dx:start,y,left?w-dx:w+dx,h);
    }ctx.restore();
  }
  function drawLower(ctx,source,{enabled=false,clockMs=0,strength=1}={}){
    if(!enabled||strength<=0){ctx.drawImage(source,0,pinY,width,height-pinY,0,pinY,width,height-pinY);return;}
    // The body corridor is sampled once at identity: no wind touches legs/boots.
    ctx.drawImage(source,leftInner,pinY,rightInner-leftInner,height-pinY,leftInner,pinY,rightInner-leftInner,height-pinY);
    drawStrip(ctx,source,true,clockMs,strength);drawStrip(ctx,source,false,clockMs,strength);
  }
  window.MyuuelDressWind={displacement,drawLower,pinY,falloffHeight,protectedCorridor:[leftInner,rightInner],maxStrength:2};
})();
