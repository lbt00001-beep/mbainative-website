import { normalize, pickVoice, browserFamily, PlaybackGate } from './core.mjs';

export const widgetStyles=`
:host{position:fixed;z-index:90;bottom:max(12px,env(safe-area-inset-bottom));right:18px;display:block;width:min(430px,calc(100vw - 36px));font:15px/1.5 Inter,Segoe UI,Arial,sans-serif;color:#edf6ff;color-scheme:dark}
*{box-sizing:border-box}button,select,input{font:inherit}button{cursor:pointer;min-height:44px;border:1px solid #50728e;background:#19344a;color:#eef8ff;border-radius:8px;padding:9px 13px}button:disabled{opacity:.45;cursor:default}button:hover:not(:disabled){background:#294d65}button:focus-visible,select:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid #91d6ff;outline-offset:3px}button.primary{background:#86e4ca;color:#072821;border-color:#86e4ca;font-weight:700}button.primary:hover:not(:disabled){background:#b7f2e2}.launcher{margin-left:auto;display:block;box-shadow:0 8px 30px #0006;font-weight:650;background:#17394a;border:1px solid #80cfcd;padding:12px 18px}.panel{border:1px solid #608699;border-radius:15px;background:#102537;box-shadow:0 10px 45px #0007;max-height:75dvh;overflow:auto;padding:18px}.top{display:flex;justify-content:space-between;align-items:center;gap:14px}.top strong{font-size:17px}.close{min-width:44px;font-size:19px;padding:4px}.subtitle{font-size:13px;color:#b7d1e5;margin:4px 0 12px}.chapter{font-size:17px;margin:12px 0 6px;font-weight:650;overflow-wrap:anywhere}.counter{font-size:13px;color:#9abbd4}.controls{display:flex;flex-wrap:wrap;gap:7px;margin:14px 0}.controls button{flex:1;padding:9px 10px;font-size:14px}.navigation{display:flex;align-items:center;gap:10px}.navigation button{padding:8px 13px;flex:1;font-size:14px}.status{color:#a7dfe0;font-size:13px;margin:10px 0;min-height:20px}.caption{font-size:16px;line-height:1.7;border-left:2px solid #86e4ca;padding-left:12px;margin:14px 0;max-height:160px;overflow:auto;color:#dfedf9}.follow{display:flex;align-items:center;gap:10px;font-size:14px;margin:12px 0}.follow input{width:18px;height:18px;accent-color:#86e4ca}details{border-top:1px solid #36566e;padding-top:10px;margin-top:10px}summary{cursor:pointer;color:#b4d4e9;font-size:14px;min-height:34px;padding:5px 0}.field{display:grid;gap:6px;margin:12px 0}.field label{font-size:14px}.field select{width:100%;min-width:0;background:#0e2030;color:#e7f5ff;border:1px solid #53778e;border-radius:7px;padding:10px;font-size:14px}.help{font-size:13px;color:#adc5d9;line-height:1.6;margin:12px 0 0}[hidden]{display:none!important}
@media(max-width:540px){:host{right:10px;width:calc(100vw - 20px)}.panel{padding:14px;max-height:65dvh}.caption{max-height:110px;font-size:15px}.chapter{font-size:16px}.launcher{font-size:14px}.controls{gap:5px}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
:host([expanded]){inset:auto 0 0;width:100%;height:min(260px,40dvh)}
:host([expanded]) .panel{height:100%;max-height:none;border-radius:0;border-bottom:0;display:flex;flex-direction:column;overflow:hidden;padding:10px 18px max(10px,env(safe-area-inset-bottom))}
.top,.controls{flex-shrink:0}.top-actions{display:flex;gap:6px;align-items:center}.minimize{font-size:13px;padding:7px 10px}.content{overflow:auto;min-height:0;overscroll-behavior:contain;padding:0 4px 8px}.controls{margin:8px 0}.content .subtitle{margin-top:4px}.caption{max-height:none}.top strong{font-size:15px}
@media(min-width:1500px){:host([expanded]){inset:0 0 0 auto;width:360px;height:100dvh}:host([expanded]) .panel{border-top:0;padding:18px}.top{flex-wrap:wrap}.top strong{font-size:17px}}
`;

// The page and assistant occupy disjoint viewports; neither scrolls over the other.
export const pageStyles=`
[data-mbai-narrating]{outline:3px solid #70dcc5!important;outline-offset:7px!important;scroll-margin-top:120px}
.mbai-guide-reserved{padding-bottom:var(--mbai-guide-space,80px)!important}
html.mbai-guide-open{overflow:hidden!important}
body.mbai-guide-docked{position:fixed!important;inset:0 0 min(260px,40dvh)!important;width:auto!important;height:auto!important;margin:0!important;overflow:auto!important;overscroll-behavior:contain;scroll-padding-top:0}
@media(min-width:1500px){body.mbai-guide-docked{inset:0 360px 0 0!important}.mbai-guide-docked .site-header{right:360px}}
@media print{mbai-assistant{display:none!important}html.mbai-guide-open{overflow:visible!important}body.mbai-guide-docked{position:static!important;inset:auto!important;overflow:visible!important}.mbai-guide-reserved{padding-bottom:0!important}}
`;

if(typeof window!=='undefined'&&!customElements.get('mbai-assistant')){
  class PageGuide extends HTMLElement{
    constructor(){
      super();this.attachShadow({mode:'open'});this.gate=new PlaybackGate();this.state='idle';this.chapter=0;this.chunk=0;this.offset=0;this.rate=1.15;this.follow=true;this.voiceId='browser';this.chapters=[];this.voices=[];this.expanded=false;this.urls=new Map();this.path=location.pathname;this.userAgent=window.navigator?.userAgent||'';
    }
    connectedCallback(){
      this.shadowRoot.innerHTML=`<style>${widgetStyles}</style><button class="launcher" aria-label="Reproducir el asistente de esta página">▶ Asistente de esta página</button><section class="panel" aria-label="Asistente de lectura guiada" hidden><div class="top"><strong>Asistente de esta página</strong><button class="close" title="Cerrar y detener" aria-label="Cerrar y detener el asistente">×</button></div><p class="subtitle">Una explicación, apartado a apartado.</p><div class="counter"></div><div class="chapter"></div><div class="controls"><button class="primary play">▶ Reproducir</button><button class="pause">Ⅱ Pausa</button><button class="stop">■ Stop</button></div><div class="navigation"><button class="previous">← Anterior</button><button class="next">Siguiente →</button></div><p class="status" role="status" aria-live="polite"></p><p class="caption" aria-label="Texto de la explicación"></p><label class="follow"><input type="checkbox" checked>Seguir el recorrido en la página</label><details><summary>Voz, velocidad y apartados</summary><div class="field"><label for="guide-voice">Voz</label><select id="guide-voice"></select></div><div class="field"><label for="guide-rate">Velocidad</label><select id="guide-rate"><option value="0.8">Pausada · 0,8×</option><option value="0.95">Tranquila · 0,95×</option><option value="1">Normal · 1×</option><option value="1.15" selected>Ágil · 1,15×</option></select></div><div class="field"><label for="guide-chapter">Ir a un apartado</label><select id="guide-chapter"></select></div><p class="help">Las voces del navegador dependen de tu dispositivo y pueden utilizar un servicio remoto. Las voces profesionales de Google Cloud o Microsoft Azure aparecen cuando están activadas. Se narra un guion público, sin leer formularios ni documentos del visitante.</p></details></section>`;
      const top=this.shadowRoot.querySelector('.top');const actions=document.createElement('div');actions.className='top-actions';const minimize=document.createElement('button');minimize.className='minimize';minimize.textContent='Minimizar';minimize.setAttribute('aria-label','Minimizar el asistente sin detener la voz');actions.append(minimize,top.querySelector('.close'));top.append(actions);
      const panel=this.shadowRoot.querySelector('.panel');const content=document.createElement('div');content.className='content';const controls=panel.querySelector('.controls');for(const child of [...panel.children])if(child!==top&&child!==controls)content.append(child);panel.append(controls,content);
      this.ui={};for(const name of ['launcher','panel','play','pause','stop','previous','next','status','caption','chapter','counter','close','minimize'])this.ui[name]=this.shadowRoot.querySelector('.'+name);
      this.ui.launcher.onclick=()=>{this.expand(true);this.play();};this.ui.close.onclick=()=>{this.stop();this.expand(false);this.ui.launcher.focus();};
      this.ui.minimize.onclick=()=>{this.expand(false);this.ui.launcher.focus();};
      this.ui.play.onclick=()=>this.play();this.ui.pause.onclick=()=>this.pause();this.ui.stop.onclick=()=>this.stop();this.ui.previous.onclick=()=>this.selectChapter(this.chapter-1);this.ui.next.onclick=()=>this.selectChapter(this.chapter+1);
      this.shadowRoot.querySelector('.follow input').onchange=e=>{this.follow=e.target.checked;};
      this.shadowRoot.querySelector('#guide-chapter').onchange=e=>this.selectChapter(Number(e.target.value));
      this.shadowRoot.querySelector('#guide-voice').onchange=e=>{this.pause();this.clearAudio();this.voiceId=e.target.value;this.offset=0;this.message('Voz seleccionada. Pulsa Reproducir para continuar.');};
      this.shadowRoot.querySelector('#guide-rate').onchange=e=>{const playing=this.state==='playing';this.rate=Number(e.target.value);if(this.audio)this.audio.playbackRate=this.rate;else if(playing){this.pause();this.play();}};
      this.onVoices=()=>this.renderVoices();window.speechSynthesis?.addEventListener('voiceschanged',this.onVoices);
      this.onPageHide=()=>{this.stop();this.expand(false);};window.addEventListener('pagehide',this.onPageHide);
      this.onPop=()=>{if(location.pathname!==this.path){this.stop();this.expand(false);this.path=location.pathname;this.load();}};window.addEventListener('popstate',this.onPop);
      this.onManual=e=>{if(this.state==='playing'&&this.follow&&!e.composedPath().includes(this)){this.follow=false;this.shadowRoot.querySelector('.follow input').checked=false;this.message('Desplazamiento manual. La explicación continúa.');}};
      window.addEventListener('wheel',this.onManual,{passive:true});window.addEventListener('touchstart',this.onManual,{passive:true});
      this.onNavigate=e=>{const a=e.target.closest?.('a[href]');if(a&&a.origin===location.origin&&a.pathname!==location.pathname){this.stop();this.expand(false);}};document.addEventListener('click',this.onNavigate);
      this.onKey=e=>{if(e.key==='Escape'&&this.expanded){this.stop();this.expand(false);this.ui.launcher.focus();}};this.shadowRoot.addEventListener('keydown',this.onKey);
      if(!document.getElementById('mbai-guide-highlight-style')){const style=document.createElement('style');style.id='mbai-guide-highlight-style';style.textContent=pageStyles;document.head.append(style);}
      document.body.classList.add('mbai-guide-reserved');if(window.ResizeObserver){this.resize=new ResizeObserver(()=>this.reserve());this.resize.observe(this);}this.reserve();this.load();
    }
    disconnectedCallback(){
      this.stop();this.expand(false);this.loadController?.abort();this.resize?.disconnect();for(const url of this.urls.values())URL.revokeObjectURL(url);this.urls.clear();
      window.speechSynthesis?.removeEventListener('voiceschanged',this.onVoices);window.removeEventListener('pagehide',this.onPageHide);window.removeEventListener('popstate',this.onPop);window.removeEventListener('wheel',this.onManual);window.removeEventListener('touchstart',this.onManual);document.removeEventListener('click',this.onNavigate);document.body.classList.remove('mbai-guide-reserved');document.body.style.removeProperty('--mbai-guide-space');
    }
    reserve(){document.body.style.setProperty('--mbai-guide-space',this.expanded?'0px':Math.ceil(this.getBoundingClientRect().height+30)+'px');}
    expand(value){
      if(this.expanded===value)return;
      const top=value?(window.scrollY||0):(document.body.scrollTop||0);const left=value?(window.scrollX||0):(document.body.scrollLeft||0);
      this.expanded=value;this.toggleAttribute('expanded',value);this.ui.panel.hidden=!value;this.ui.launcher.hidden=value;
      document.documentElement.classList.toggle('mbai-guide-open',value);document.body.classList.toggle('mbai-guide-docked',value);this.reserve();
      if(value){document.body.scrollTop=top;document.body.scrollLeft=left;}
      else window.scrollTo?.({top:this.path===location.pathname?top:0,left,behavior:'instant'});
      this.render();
    }
    async load(){
      this.ready=false;this.render();this.loadController?.abort();const controller=new AbortController();this.loadController=controller;
      try{const response=await fetch('/api/assistant/config?path='+encodeURIComponent(this.path),{signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error('guide');const result=await response.json();if(controller.signal.aborted||!this.isConnected)return;
        this.chapters=result.chapters;this.voices=result.voices;this.voiceId=browserFamily(this.userAgent)?'browser':this.voices[0]?.id||'browser';this.ready=true;
        const select=this.shadowRoot.querySelector('#guide-chapter');select.replaceChildren();this.chapters.forEach((c,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=(i+1)+'. '+c.title;select.append(option);});
        this.renderVoices();this.message('Pulsa Reproducir para comenzar.');this.render();
        if(this.pendingPlay){this.pendingPlay=false;this.state='idle';this.play();}
      }catch{if(!controller.signal.aborted){this.message('No se pudo cargar el recorrido. Recarga la página para reintentarlo.');this.render();}}
    }
    renderVoices(){
      const select=this.shadowRoot.querySelector('#guide-voice');if(!select)return;const selected=this.voiceId;select.replaceChildren();
      const options=[...this.voices];const local=window.speechSynthesis?.getVoices()||[];this.browserVoices=local.filter(v=>/^es[-_]/i.test(v.lang));
      const best=pickVoice(local,this.userAgent);options.push({id:'browser',label:best?'Navegador · '+best.name:'Navegador · voz española automática'});
      for(const v of this.browserVoices)options.push({id:'browser:'+v.voiceURI,label:'Navegador · '+v.name});
      for(const v of options){const option=document.createElement('option');option.value=v.id;option.textContent=v.label;select.append(option);}select.value=options.some(v=>v.id===selected)?selected:'browser';this.voiceId=select.value;
    }
    message(text){if(this.ui)this.ui.status.textContent=text;}
    render(){
      if(!this.ui)return;const chapter=this.chapters[this.chapter];this.ui.chapter.textContent=chapter?.title||'Preparando el recorrido…';this.ui.counter.textContent=chapter?'Apartado '+(this.chapter+1)+' de '+this.chapters.length:'';
      this.ui.launcher.textContent=this.state==='playing'?'▣ Mostrar asistente · Reproduciendo':'▶ Asistente de esta página';this.ui.launcher.setAttribute('aria-label',this.state==='playing'?'Mostrar el asistente sin interrumpir la narración':'Abrir el asistente de esta página');
      this.ui.play.disabled=!this.ready||this.state==='playing'||this.state==='loading';this.ui.play.textContent=this.state==='paused'?'▶ Reanudar':this.state==='ended'?'▶ Repetir':'▶ Reproducir';this.ui.pause.disabled=!['playing','loading'].includes(this.state);this.ui.stop.disabled=this.state==='idle';this.ui.previous.disabled=!this.ready||this.chapter===0;this.ui.next.disabled=!this.ready||this.chapter>=this.chapters.length-1;
      const select=this.shadowRoot.querySelector('#guide-chapter');if(chapter)select.value=String(this.chapter);
    }
    clearAudio(){if(this.audio){this.audio.onended=null;this.audio.onerror=null;this.audio.pause();this.audio.removeAttribute('src');this.audio.load();this.audio=null;}this.audioKey=null;}
    halt(){this.gate.next();clearTimeout(this.timer);this.fetchController?.abort();this.fetchController=null;if(this.utterance){this.utterance.onend=null;this.utterance.onerror=null;this.utterance.onboundary=null;window.speechSynthesis?.cancel();this.utterance=null;}if(this.audio)this.audio.pause();}
    pause(){if(!['playing','loading'].includes(this.state))return;this.pendingPlay=false;this.halt();this.state='paused';this.message('En pausa. Puedes continuar cuando quieras.');this.render();}
    stop(){this.pendingPlay=false;this.halt();this.clearAudio();this.state='idle';this.chapter=0;this.chunk=0;this.offset=0;this.clearHighlight();if(this.ui){this.ui.caption.textContent='';this.message('Recorrido detenido. Reproducir comienza desde el principio.');this.render();}}
    clearHighlight(){this.highlight?.removeAttribute('data-mbai-narrating');this.highlight=null;}
    selectChapter(index){if(index<0||index>=this.chapters.length)return;const wasPlaying=['playing','loading'].includes(this.state);this.halt();this.clearAudio();this.chapter=index;this.chunk=0;this.offset=0;this.state='paused';this.clearHighlight();this.ui.caption.textContent=this.chapters[index].chunks[0]?.text||'';this.scrollToChapter();this.render();if(wasPlaying)this.play();else this.message('Apartado seleccionado. Pulsa Reproducir.');}
    scrollToChapter(){
      if(!this.follow)return;const c=this.chapters[this.chapter];let target;
      if(c.selector){try{target=document.querySelector(c.selector);}catch{target=null;}}
      if(!target&&c.match){const headings=[...document.querySelectorAll('#contenido h1,#contenido h2,#contenido h3,#contenido h4,main h1,main h2,main h3,main h4')].filter(h=>normalize(h.textContent)===normalize(c.match));target=headings[c.occurrence||0];}
      if(!target)target=document.querySelector('#contenido h1,main h1,iframe,main');
      if(!target)return;const details=target.closest('details');if(details&&!details.open)details.open=true;
      if(!target.getClientRects().length)return;this.clearHighlight();target.setAttribute('data-mbai-narrating','');this.highlight=target;
      target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    }
    async play(){
      if(!this.ready){this.pendingPlay=true;this.state='loading';this.render();this.message('Preparando la guía…');return;}
      if(this.state==='playing'||this.state==='loading')return;if(this.state==='ended'){this.chapter=0;this.chunk=0;this.offset=0;}
      const c=this.chapters[this.chapter];const chunk=c?.chunks[this.chunk];if(!chunk)return;
      const token=this.gate.next();this.state='loading';this.render();this.ui.caption.textContent=chunk.text;this.ui.caption.scrollTop=0;
      if(this.chunk===0)this.scrollToChapter();
      if(this.voiceId.startsWith('browser')){this.speakBrowser(chunk.text,token);return;}
      const key=this.voiceId+':'+chunk.id;
      try{
        if(this.audioKey!==key){this.clearAudio();let url=this.urls.get(key);
          if(!url){this.message('Preparando la voz profesional…');const controller=new AbortController();this.fetchController=controller;const response=await fetch('/api/assistant/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:chunk.id,voice:this.voiceId}),signal:controller.signal});if(!this.gate.valid(token))return;if(!response.ok){const error=await response.json().catch(()=>({}));throw Error(error.error||'La voz profesional no está disponible.');}url=URL.createObjectURL(await response.blob());if(!this.gate.valid(token)){URL.revokeObjectURL(url);return;}this.urls.set(key,url);if(this.urls.size>12){const oldest=this.urls.keys().next().value;URL.revokeObjectURL(this.urls.get(oldest));this.urls.delete(oldest);}}
          this.audio=new Audio(url);this.audioKey=key;
        }
        this.audio.playbackRate=this.rate;this.audio.onended=()=>{if(this.gate.valid(token))this.advance();};this.audio.onerror=()=>{if(this.gate.valid(token)){this.pause();this.message('No se pudo reproducir el audio. Reintenta o cambia la voz.');this.clearAudio();}};
        const activeAudio=this.audio;await activeAudio.play();if(!this.gate.valid(token)){activeAudio.pause();return;}this.state='playing';this.message(this.voices.find(v=>v.id===this.voiceId)?.label||'Voz profesional');this.render();
      }catch(error){if(!this.gate.valid(token))return;this.state='paused';this.message(error.name==='NotAllowedError'?'El navegador necesita otro clic. Pulsa Reanudar para escuchar.':error.message);this.render();}
    }
    speakBrowser(text,token){
      if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){this.state='paused';this.message('Este navegador no ofrece síntesis de voz. Puedes leer la explicación o utilizar otro navegador.');this.render();return;}
      const voices=window.speechSynthesis.getVoices();const voice=this.voiceId.startsWith('browser:')?voices.find(v=>v.voiceURI===this.voiceId.slice(8)):pickVoice(voices,this.userAgent);
      if(voices.length&&!voice){this.state='paused';this.message('No hay una voz española disponible. Activa una en tu dispositivo o elige una voz profesional si aparece en la lista.');this.render();return;}
      const base=this.offset;const utterance=new SpeechSynthesisUtterance(text.slice(base));this.utterance=utterance;utterance.lang='es-ES';utterance.rate=this.rate;if(voice)utterance.voice=voice;
      utterance.onboundary=e=>{if(this.gate.valid(token)&&e.name==='word')this.offset=base+e.charIndex;};utterance.onend=()=>{if(this.gate.valid(token)){this.utterance=null;this.advance();}};utterance.onerror=e=>{if(this.gate.valid(token)&&!['canceled','interrupted'].includes(e.error)){this.state='paused';this.message('La voz del navegador se ha interrumpido. Pulsa Reanudar o elige otra voz.');this.render();}};
      this.state='playing';this.message('Voz del navegador'+(voice?' · '+voice.name:''));this.render();window.speechSynthesis.resume();window.speechSynthesis.speak(utterance);
    }
    advance(){
      this.clearAudio();this.offset=0;this.chunk++;let chapterChanged=false;
      if(this.chunk>=this.chapters[this.chapter].chunks.length){this.chunk=0;this.chapter++;chapterChanged=true;}
      if(this.chapter>=this.chapters.length){this.chapter=this.chapters.length-1;this.chunk=0;this.state='ended';this.clearHighlight();this.message('Recorrido terminado. Puedes repetirlo o elegir un apartado.');this.render();return;}
      this.state='playing';this.render();const token=this.gate.value;this.timer=setTimeout(()=>{if(this.gate.valid(token)){this.state='paused';this.play();}},chapterChanged?1000:300);
    }
  }
  customElements.define('mbai-assistant',PageGuide);
  if(document.querySelector('script[data-mbai-auto]')){const mount=()=>{if(!document.querySelector('mbai-assistant'))document.body.append(document.createElement('mbai-assistant'));};if(document.readyState==='complete')mount();else window.addEventListener('load',mount,{once:true});}
}
