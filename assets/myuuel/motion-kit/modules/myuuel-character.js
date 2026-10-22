/* Memory-practice copy: one change (2026-10-21) — `registeredFacePivots?.` is optional, so a phrase-only profile
   (custom clip order without reviewed pivots) falls back to the painter's own head estimate instead of throwing;
   and an optional `sizes` map {sheetId: scale} draws each sheet at a per-sheet scale around the floor anchor, the way
   AI Discussion's registration carries a scale, so she is the same size in every pose.
   Public adapter: no page selectors, rAF ownership, chat, backend or audio capture.
   One update(deltaMs) call per host frame. Canvas output is always 384 x 512. */
(() => {
  'use strict';
  function create(canvas,{registration=window.MyuuelRegistration,profiles=window.MyuuelMotionProfiles,sizes=null,reducedMotion=false}={}){
    canvas.width=384;canvas.height=512;
    const painter=MyuuelSmoothMotion.createPainter(canvas),audio=MyuuelAudioMotion.createReactor();
    let sheet=null,image=null,frame=0,beat=0,elapsed=0,clock=0;
    const settings={paused:false,motion:true,wind:true,windStrength:1,reducedMotion};
    const beats=()=>profiles?.[sheet?.id]?.beats||sheet.durations.map((ms,i)=>[i,ms]);
    const target=()=>[192,sheet?.support==='stool'?360:464];
    function action(){
      const support=target(),anchors=registration?.[sheet.id],profile=profiles?.[sheet.id],phrase=beats();
      const headPivots=profile?.registeredFacePivots?.map((p,i)=>{const a=anchors?.[i]||sheet.anchor;return[p[0]-support[0]+a[0],p[1]-support[1]+a[1]];});
      return {sheet:sheet.id+':'+(sheet.sha256||'')+':'+sheet.image,frames:[0,1,2,3,4,5,6,7],durationsMs:sheet.durations,headPivots,clothWind:!!sheet.clothWind,
        transitionEdges:phrase.map((b,i)=>[b[0],phrase[(i+1)%phrase.length][0]]),
        registration:Array.from({length:8},(_,i)=>{const a=anchors?.[i]||sheet.anchor;return{crop:[i%4*384,Math.floor(i/4)*512,384,512],tx:support[0]-a[0]*(sizes?.[sheet.id]||1),ty:support[1]-a[1]*(sizes?.[sheet.id]||1),scale:sizes?.[sheet.id]||1};})};
    }
    function render(ms=0){
      if(!sheet)return;
      const moving=!settings.paused&&settings.motion&&!settings.reducedMotion;
      const response=audio.advance(ms,{enabled:moving});
      painter.setPose(image,action(),frame,{smooth:moving});
      painter.setWind({enabled:!!sheet.clothWind&&settings.wind&&!settings.reducedMotion,clockMs:clock,strength:settings.windStrength});
      painter.setSquish(response.squish);painter.advance(ms,{moving});
    }
    function configure(next={}){
      for(const k of ['paused','motion','wind','reducedMotion'])if(k in next)settings[k]=!!next[k];
      if('windStrength' in next){if(!Number.isFinite(next.windStrength))throw Error('Wind strength must be finite');settings.windStrength=Math.max(0,Math.min(2,next.windStrength));}
      render(0);return snapshot();
    }
    function setSheet(descriptor,loadedImage){
      if(!descriptor?.id||!Array.isArray(descriptor.durations)||descriptor.durations.length!==8||descriptor.durations.some(v=>!Number.isFinite(v)||v<=0))throw Error('Expected eight positive frame durations');
      if((loadedImage.naturalWidth||loadedImage.width)!==1536||(loadedImage.naturalHeight||loadedImage.height)!==1024)throw Error('Expected a 1536 x 1024 sheet');
      if(!Array.isArray(descriptor.anchor)||descriptor.anchor.length!==2||descriptor.anchor.some(v=>!Number.isFinite(v)))throw Error('Expected a source contact anchor');
      sheet=descriptor;image=loadedImage;frame=beat=elapsed=0;render(0);return snapshot();
    }
    function update(ms){
      if(!Number.isFinite(ms)||ms<0)throw Error('Delta must be finite nonnegative milliseconds');
      const dt=Math.min(ms,60); // Match the reviewed demo's background-tab clamp.
      if(sheet&&!settings.paused&&!settings.reducedMotion){
        clock+=dt;elapsed+=dt;const phrase=beats();
        while(elapsed>=phrase[beat][1]){elapsed-=phrase[beat][1];beat=(beat+1)%phrase.length;frame=phrase[beat][0];}
        render(dt);
      } // A paused actor reuses its rendered canvas; configure/setFrame draw immediately.
    }
    function setFrame(value){
      if(!Number.isInteger(value)||value<0||value>7)throw Error('Frame must be 0..7');
      frame=value;elapsed=0;beat=beats().findIndex(b=>b[0]===value);if(beat<0)beat=0;
      settings.paused=true;render(0);return snapshot();
    }
    function snapshot(){return{sheet:sheet?.id||null,frame,beat,elapsedMs:elapsed,clockMs:clock,target:target(),settings:{...settings},audio:audio.snapshot(),painter:painter.snapshot()};}
    return{canvas,audio,setSheet,configure,update,render:()=>render(0),setFrame,step:()=>setFrame((frame+1)%8),snapshot};
  }
  window.MyuuelCharacter={create};
})();
