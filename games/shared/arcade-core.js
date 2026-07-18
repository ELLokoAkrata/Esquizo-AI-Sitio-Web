(function(global){
  'use strict';

  function clone(value){
    if(value===undefined) return undefined;
    try{return JSON.parse(JSON.stringify(value))}catch(e){return value}
  }

  const storage={
    load(key,fallback){
      const base=clone(fallback);
      try{
        const raw=localStorage.getItem(key);
        if(!raw) return base;
        const parsed=JSON.parse(raw);
        if(base&&typeof base==='object'&&!Array.isArray(base)&&parsed&&typeof parsed==='object'&&!Array.isArray(parsed)){
          return Object.assign(base,parsed);
        }
        return parsed;
      }catch(e){return base}
    },
    save(key,value){
      try{localStorage.setItem(key,JSON.stringify(value));return true}catch(e){return false}
    }
  };

  function bindHoldButton(button,onPress,options){
    const opts=Object.assign({repeat:false,delay:260,interval:85},options||{});
    let delayId=0,repeatId=0,active=false;
    const stop=()=>{
      active=false;clearTimeout(delayId);clearInterval(repeatId);
      button.classList.remove('pressed');
      if(opts.onRelease) opts.onRelease();
    };
    button.addEventListener('pointerdown',event=>{
      event.preventDefault();
      active=true;
      try{button.setPointerCapture(event.pointerId)}catch(e){}
      button.classList.add('pressed');
      onPress(event);
      if(opts.repeat){
        delayId=setTimeout(()=>{
          if(!active)return;
          repeatId=setInterval(()=>{if(active)onPress(event)},opts.interval);
        },opts.delay);
      }
    });
    button.addEventListener('pointerup',stop);
    button.addEventListener('pointercancel',stop);
    button.addEventListener('lostpointercapture',stop);
    return stop;
  }

  function bindPressState(button,onChange){
    let active=false;
    const stop=()=>{
      if(!active)return;
      active=false;button.classList.remove('pressed');onChange(false);
    };
    button.addEventListener('pointerdown',event=>{
      event.preventDefault();active=true;
      try{button.setPointerCapture(event.pointerId)}catch(e){}
      button.classList.add('pressed');onChange(true);
    });
    button.addEventListener('pointerup',stop);
    button.addEventListener('pointercancel',stop);
    button.addEventListener('lostpointercapture',stop);
    return stop;
  }

  function bindLongPress(element,onTap,onLongPress,options){
    const opts=Object.assign({duration:430,tolerance:12},options||{});
    let timer=0,active=false,longFired=false,startX=0,startY=0;
    const clear=()=>{clearTimeout(timer);timer=0};
    const cancel=()=>{active=false;clear();element.classList.remove('pressed')};
    element.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      event.preventDefault();active=true;longFired=false;startX=event.clientX;startY=event.clientY;
      try{element.setPointerCapture(event.pointerId)}catch(e){}
      element.classList.add('pressed');
      timer=setTimeout(()=>{if(!active)return;longFired=true;onLongPress(event)},opts.duration);
    });
    element.addEventListener('pointermove',event=>{
      if(!active)return;
      if(Math.hypot(event.clientX-startX,event.clientY-startY)>opts.tolerance)cancel();
    });
    element.addEventListener('pointerup',event=>{
      if(!active)return;
      active=false;clear();element.classList.remove('pressed');
      if(!longFired)onTap(event);
    });
    element.addEventListener('pointercancel',cancel);
    element.addEventListener('lostpointercapture',cancel);
    element.addEventListener('contextmenu',event=>event.preventDefault());
    return cancel;
  }

  function watchPause(onPause){
    const blur=()=>onPause('blur');
    const visibility=()=>{if(document.hidden)onPause('hidden')};
    window.addEventListener('blur',blur);
    document.addEventListener('visibilitychange',visibility);
    return()=>{window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility)};
  }

  function focusApp(target){
    const element=typeof target==='string'?document.getElementById(target):target;
    if(!element)return false;
    try{element.focus({preventScroll:true});return true}catch(e){try{element.focus();return true}catch(_){return false}}
  }

  function createToneBus(){
    let ctx=null,muted=false;
    const ensure=()=>{if(!ctx)ctx=new(global.AudioContext||global.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();return ctx};
    function tone(freq,duration=.06,volume=.05,type='square',endFreq){
      if(muted)return;
      try{
        const c=ensure(),osc=c.createOscillator(),gain=c.createGain();
        osc.type=type;osc.frequency.setValueAtTime(freq,c.currentTime);
        if(endFreq)osc.frequency.exponentialRampToValueAtTime(Math.max(1,endFreq),c.currentTime+duration);
        gain.gain.setValueAtTime(volume,c.currentTime);gain.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);
        osc.connect(gain);gain.connect(c.destination);osc.start();osc.stop(c.currentTime+duration);
      }catch(e){}
    }
    function noise(duration=.08,volume=.035){
      if(muted)return;
      try{
        const c=ensure(),length=Math.max(1,Math.floor(c.sampleRate*duration)),buffer=c.createBuffer(1,length,c.sampleRate),data=buffer.getChannelData(0);
        for(let i=0;i<length;i++)data[i]=Math.random()*2-1;
        const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
        source.buffer=buffer;filter.type='bandpass';filter.frequency.value=1100;filter.Q.value=.8;
        gain.gain.setValueAtTime(volume,c.currentTime);gain.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);
        source.connect(filter);filter.connect(gain);gain.connect(c.destination);source.start();source.stop(c.currentTime+duration);
      }catch(e){}
    }
    return{
      tone,noise,
      toggle(){muted=!muted;if(!muted)tone(440,.07,.04);return muted},
      setMuted(value){muted=Boolean(value)},
      resume(){if(!muted)try{ensure()}catch(e){}},
      get muted(){return muted}
    };
  }

  global.EsquizoArcade=Object.freeze({
    version:'1.1.0',storage,bindHoldButton,bindPressState,bindLongPress,watchPause,focusApp,createToneBus,
    clamp:(value,min,max)=>Math.max(min,Math.min(max,value)),
    random:(min,max)=>min+Math.random()*(max-min)
  });
})(window);
