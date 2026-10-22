/* Compositing only: support furniture never enters the actor deformation mesh. */
(() => {
  'use strict';
  function draw(canvas,actorCanvas,{support='platform',standing=true,stool=null,showSupport=true,scale=1}={}){
    const ctx=canvas.getContext('2d'),width=canvas.width,height=canvas.height;
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,width,height);
    const perched=support==='stool',target=[192,perched?360:464];
    const unit=height/800*1.4*scale,base=height*(perched?.58:.88);
    ctx.save();ctx.translate(width/2,base);ctx.scale(unit,unit);
    if(showSupport){
      if(perched&&stool&&(stool.complete||stool.width)&&stool.width){
        const w=160,h=240*w/576;ctx.drawImage(stool,224,161,576,240,-w/2,-39,w,h);ctx.drawImage(stool,224,401,576,970,-w/2,-39+h,w,970*w/576*.55);
      }else if(!perched){
        const w=standing?126:159;ctx.fillStyle='#b77b36';ctx.beginPath();ctx.ellipse(0,8,w,24,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#f1dcae';ctx.beginPath();ctx.ellipse(0,0,w-2,20,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#b77b36';ctx.lineWidth=1.5;ctx.stroke();
      }
    }
    ctx.drawImage(actorCanvas,-target[0],-target[1]);ctx.restore();
  }
  window.MyuuelStage={draw};
})();
