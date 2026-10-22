/* Numeric RMS spring extracted without changing its function body. */
(() => {
  'use strict';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const level=v=>Number.isFinite(v)?clamp(v,0,1):0;
  function createReactor(){
    let source=null,id=null,rms=0,age=Infinity,envelope=0,q=0,velocity=0,sequence=0;
    function reset(){source=id=null;rms=envelope=q=velocity=0;age=Infinity;sequence++;}
    function begin(kind,key){if(!['input','output'].includes(kind)||typeof key!=='string'||!key)return false;reset();source=kind;id=key;age=0;return true;}
    function sample(kind,key,value){if(kind!==source||key!==id)return false;rms=level(value);age=0;sequence++;return true;}
    function end(kind,key){if(kind!==source||key!==id)return false;source=id=null;rms=0;age=Infinity;sequence++;return true;}
    function advance(ms,{enabled=true}={}){
      if(!Number.isFinite(ms)||ms<0)throw Error('Invalid audio motion time');
      if(!enabled){envelope=q=velocity=0;age+=ms;return snapshot();}
      // Small fixed substeps keep the spring stable across 30/60/120 Hz displays.
      for(let left=ms;left>0;){const dt=Math.min(left,1000/240);left-=dt;age+=dt;
        const value=age>180?0:rms,gate=source==='input'?.009:.007;
        const target=value<=gate?0:clamp(Math.log1p((value-gate)*18)/Math.log1p(18*.32),0,1);
        envelope+=(target-envelope)*(1-Math.exp(-dt/(target>envelope?45:170)));
        const wanted=envelope*(source==='input'?.013:.024),omega=2*Math.PI*3.1;
        velocity+=(omega*omega*(wanted-q)-2*.62*omega*velocity)*dt/1000;
        q=clamp(q+velocity*dt/1000,-.012,.032);
      }return snapshot();
    }
    function snapshot(){return{source,rms:age>180?0:rms,envelope,squish:q,sequence};}
    return{begin,sample,end,reset,advance,snapshot};
  }
  window.MyuuelAudioMotion={createReactor};
})();
