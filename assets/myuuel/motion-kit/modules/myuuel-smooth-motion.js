/* Myuuel-only fork: reviewed face pivots, no color-inferred eye rotation.
   Original AI Discussion and its copied painter remain byte-identical. */
(() => {
  'use strict';
  const poses = new Map(), width = 384, height = 512;
  const ease = t => { t = Math.max(0, Math.min(1, t)); return t*t*(3-2*t); };
  const weight = y => 1-ease((y-190)/170); // Exactly zero from y=360 through both soles.
  function reviewedEdges(action,edges) {
    if(action.transitionEdges)return action.transitionEdges;
    const sequences=action.phrases?.map(p=>p.map(b=>b[0]))||[action.frames],result=[];
    for(const frames of sequences)for(let i=1;i<frames.length;i++)result.push([frames[i-1],frames[i]]);
    if(action.mode==='pingpong')result.push(...result.map(([a,b])=>[b,a]));
    return result;
  }
  function sampleAction(action,ms) {
    let beats=action.phrases?.flat()||action.frames.map((frame,i)=>[frame,action.durationsMs[i]]);
    if(!action.phrases?.length&&action.mode==='pingpong')beats=beats.concat(beats.slice(1,-1).reverse());
    const total=beats.reduce((sum,b)=>sum+b[1],0);let t=((ms%total)+total)%total;
    for(let i=0;i<beats.length;i++){const [frame,duration]=beats[i];if(t<duration)return{frame,previousFrame:beats[(i+beats.length-1)%beats.length][0],elapsedMs:t};t-=duration;}
    return{frame:beats[0][0],previousFrame:null,elapsedMs:Infinity};
  }
  function pose(image, action, frame) {
    const key = action.sheet+':'+frame+':'+JSON.stringify([action.registration[frame],action.headPivots?.[frame]||null]);
    if (poses.has(key)) return poses.get(key);
    const canvas = document.createElement('canvas'); canvas.width=width; canvas.height=height;
    const ctx=canvas.getContext('2d',{willReadFrequently:true}), r=action.registration[frame];
    ctx.drawImage(image,...r.crop,r.tx,r.ty,r.crop[2]*r.scale,r.crop[3]*r.scale);
    // Source-space landmarks are authored and reviewed per Myuuel drawing.
    // Other sheets retain the existing alpha-centroid placement fallback, but
    // no sheet uses colored image components to infer face angle.
    const authored=action.headPivots?.[frame];
    let head;
    if(authored){head=[r.tx+authored[0]*r.scale,r.ty+authored[1]*r.scale];}
    else {
      const pixels=ctx.getImageData(0,0,width,210).data;let total=0,x=0,y=0;
      for(let row=0;row<210;row++)for(let col=0;col<width;col++){
        const a=pixels[(row*width+col)*4+3];total+=a;x+=col*a;y+=row*a;
      }
      head=[total?x/total:192,total?y/total:130];
    }
    const result={canvas,head,angle:null,eyes:[],headSource:authored?'reviewed-face-pivot':'alpha-centroid-fallback'};
    poses.set(key,result); return result;
  }
  function offset(clockMs, moving=true) {
    if(!moving)return [0,0];
    const t=clockMs/1000;
    // Two slow rhythms avoid an obvious metronome. No canvas translation or scaling.
    return [2.5*Math.sin(t*1.13)+.65*Math.sin(t*2.07),
      -.9*Math.sin(t*1.39)+.25*Math.sin(t*2.31)];
  }
  function drawPose(ctx,image,action,frame,{clockMs=0,elapsedMs=Infinity,previousFrame=null,
    moving=true,smooth=true,edges=[],transition=null,squish=0}={}) {
    const current=pose(image,action,frame), [ambientX,ambientY]=offset(clockMs,moving);
    let dx=0,dy=0,angle=0;
    if(smooth&&transition) {
      const left=1-ease(elapsedMs/180);[dx,dy,angle]=transition.map(v=>v*left);
    } else if(smooth&&previousFrame!==null&&reviewedEdges(action,edges).some(e=>e[0]===previousFrame&&e[1]===frame)) {
      const previous=pose(image,action,previousFrame), left=1-ease(elapsedMs/180);
      dx=Math.max(-16,Math.min(16,previous.head[0]-current.head[0]))*left;
      dy=Math.max(-12,Math.min(12,previous.head[1]-current.head[1]))*left;
      if(current.angle!==null&&previous.angle!==null)angle=Math.max(-.15,Math.min(.15,previous.angle-current.angle))*left;
    }
    drawDeformed(ctx,current.canvas,dx+ambientX,dy+ambientY,angle+(moving ? .008*Math.sin(clockMs/1000*.91) : 0),current.head,moving?squish:0);
  }
  function transitionBetween(previous,next,residual,compatible) {
    if(!compatible)return[0,0,0];
    return [Math.max(-16,Math.min(16,previous.head[0]+residual[0]-next.head[0])),
      Math.max(-12,Math.min(12,previous.head[1]+residual[1]-next.head[1])),
      previous.angle!==null&&next.angle!==null?Math.max(-.15,Math.min(.15,previous.angle+residual[2]-next.angle)):0];
  }
  function registerTrack(image,action,beats,{edges=[]}={}) {
    let current=null,transition=[0,0,0],start=0;
    for(const beat of beats) {
      if(current?.frame!==beat.frame) {
        const next=pose(image,action,beat.frame),left=1-ease((beat.start-start)/180);
        const compatible=current&&reviewedEdges(action,edges).some(e=>e[0]===current.frame&&e[1]===beat.frame);
        transition=transitionBetween(current?.pose,next,transition.map(v=>v*left),compatible);
        current={pose:next,frame:beat.frame};start=beat.start;
      }
      beat.transition=[...transition];
    }
  }
  function triangle(ctx,source,s,d) {
    const ux=s[1][0]-s[0][0],uy=s[1][1]-s[0][1],vx=s[2][0]-s[0][0],vy=s[2][1]-s[0][1],det=ux*vy-uy*vx;
    const Ux=d[1][0]-d[0][0],Uy=d[1][1]-d[0][1],Vx=d[2][0]-d[0][0],Vy=d[2][1]-d[0][1];
    const a=(Ux*vy-Vx*uy)/det,c=(Vx*ux-Ux*vx)/det,b=(Uy*vy-Vy*uy)/det,e=(Vy*ux-Uy*vx)/det;
    const sign=Math.sign((d[1][0]-d[0][0])*(d[2][1]-d[0][1])-(d[1][1]-d[0][1])*(d[2][0]-d[0][0]));
    const normals=d.map((p,i)=>{const q=d[(i+1)%3],x=q[0]-p[0],y=q[1]-p[1],len=Math.hypot(x,y);return[sign*y/len,-sign*x/len];});
    ctx.save();ctx.beginPath();d.forEach((p,i)=>{const a=normals[(i+2)%3],b=normals[i],f=1.1/(1+a[0]*b[0]+a[1]*b[1]),x=p[0]+(a[0]+b[0])*f,y=p[1]+(a[1]+b[1])*f;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.clip();
    ctx.transform(a,b,c,e,d[0][0]-a*s[0][0]-c*s[0][1],d[0][1]-b*s[0][0]-e*s[0][1]);ctx.drawImage(source,0,0);ctx.restore();
  }
  function drawDeformed(ctx,source,dx,dy,angle=0,pivot=[192,150],squish=0,wind=null) {
    squish=Number.isFinite(squish)?Math.max(-.012,Math.min(.032,squish)):0;
    if(Math.abs(dx)+Math.abs(dy)+Math.abs(angle)+Math.abs(squish)<.00001){
      if(wind?.enabled&&window.MyuuelDressWind){ctx.drawImage(source,0,0,width,360,0,0,width,360);window.MyuuelDressWind.drawLower(ctx,source,wind);}
      else ctx.drawImage(source,0,0);return;
    }
    const point=(x,y)=>{const w=weight(y),a=angle*w,c=Math.cos(a),s=Math.sin(a),xx=x-pivot[0],yy=y-pivot[1];return[pivot[0]+c*xx-s*yy+dx*w+xx*squish*.65*w,pivot[1]+s*xx+c*yy+dy*w+(360-y)*squish*w];};
    // A continuous texture mesh eases inclination as well as placement. Expanded
    // clips avoid hairline seams between triangles. Body motion stops at y=360;
    // separate Myuuel cloth wind may move only the free lower side panels.
    ctx.save();ctx.beginPath();ctx.rect(0,0,width,360);ctx.clip();
    for(let y=0;y<360;y+=12)for(let x=0;x<width;x+=96) {
      const p=[[x,y],[x+96,y],[x,y+12],[x+96,y+12]],d=p.map(([x,y])=>point(x,y));
      triangle(ctx,source,[p[0],p[1],p[2]],[d[0],d[1],d[2]]);
      triangle(ctx,source,[p[2],p[1],p[3]],[d[2],d[1],d[3]]);
    }
    ctx.restore();
    if(wind?.enabled&&window.MyuuelDressWind)window.MyuuelDressWind.drawLower(ctx,source,wind);
    else ctx.drawImage(source,0,360,width,height-360,0,360,width,height-360);
  }
  // Two front-facing (viewer-attending / viewer-facing) sheets of one character share a head registration, so the head may
  // ease across that sheet change. A front <-> 3/4 change is a deliberate turn and always cuts.
  const frontSheet=sheet=>/(^|\/)viewer-(attending|facing)-[^/]*$/.test(String(sheet||''))&&!/3q/.test(String(sheet));
  const sheetFolder=sheet=>String(sheet||'').replace(/[^/]*$/,'');
  const frontPair=(a,b)=>frontSheet(a?.sheet)&&frontSheet(b?.sheet)&&sheetFolder(a.sheet)===sheetFolder(b.sheet);
  function createPainter(canvas,{edges=[]}={}) {
    const ctx=canvas.getContext('2d'); let current=null,clock=0,elapsed=Infinity,dx=0,dy=0,angle=0,squish=0;
    let wind={enabled:false,clockMs:0,strength:1};
    function residual(){const left=1-ease(elapsed/180);return [dx*left,dy*left,angle*left];}
    function setPose(image,action,frame,{facing='front',smooth=true}={}) {
      if(current?.action.sheet===action.sheet&&current.frame===frame&&current.facing===facing){if(!smooth){dx=dy=angle=0;}return;}
      const next=pose(image,action,frame), previous=current?.pose, [rx,ry,ra]=residual();
      const compatible=smooth&&current&&current.facing===facing&&(current.action.sheet===action.sheet?
        reviewedEdges(action,edges).some(e=>e[0]===current.frame&&e[1]===frame):frontPair(current.action,action));
      [dx,dy,angle]=transitionBetween(previous,next,[rx,ry,ra],compatible);
      elapsed=0;current={image,action,frame,facing,pose:next};
    }
    function draw({moving=true}={}) {
      if(!current)return;
      ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,width,height);
      ctx.save(); if(current.facing==='left'){ctx.translate(width,0);ctx.scale(-1,1);}
      const [rx,ry,ra]=moving?residual():[0,0,0],[ax,ay]=offset(clock,moving);
      drawDeformed(ctx,current.pose.canvas,rx+ax,ry+ay,ra+(moving ? .008*Math.sin(clock/1000*.91) : 0),current.pose.head,moving?squish:0,current.action.clothWind?wind:null);ctx.restore();
    }
    function advance(ms,{moving=true}={}) {
      if(!Number.isFinite(ms)||ms<0)throw Error('Invalid sprite motion time');
      if(moving){clock+=ms;elapsed+=ms;}draw({moving});
    }
    return {setPose,advance,draw,setWind:value=>{wind={enabled:!!value.enabled,clockMs:Number.isFinite(value.clockMs)?Math.max(0,value.clockMs):0,strength:Number.isFinite(value.strength)?Math.max(0,Math.min(2,value.strength)):1};},setSquish:value=>{squish=Number.isFinite(value)?Math.max(-.012,Math.min(.032,value)):0;},snapshot:()=>({clockMs:clock,elapsedMs:elapsed,frame:current?.frame,squish,wind:{...wind},
      residual:residual(),head:current?.pose.head,headSource:current?.pose.headSource,angleCorrection:angle,footDisplacement:[0,0],cachedPoses:poses.size})};
  }
  window.MyuuelSmoothMotion={createPainter,drawPose,pose,offset,weight,sampleAction,registerTrack};
})();
