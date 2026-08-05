const escapeHTML=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const planes=()=>'<span class="pleno-button-color__plane"></span>'.repeat(5);
const markup=label=>`<span class="pleno-button-color__bg" aria-hidden="true"><span class="pleno-button-color__side pleno-button-color__side--left">${planes()}</span><span class="pleno-button-color__side pleno-button-color__side--right">${planes()}</span></span><span class="pleno-button-color__corner pleno-button-color__corner--tl" aria-hidden="true">⌜</span><span class="pleno-button-color__corner pleno-button-color__corner--bl" aria-hidden="true">⌞</span><span class="pleno-button-color__label">${[...label].map(char=>`<span class="pleno-button-color__letter">${char===' ' ? '&nbsp;' : escapeHTML(char)}</span>`).join('')}</span><span class="pleno-button-color__corner pleno-button-color__corner--tr" aria-hidden="true">⌝</span><span class="pleno-button-color__corner pleno-button-color__corner--br" aria-hidden="true">⌟</span>`;

export function createPlenoEffect(root,kind,options={}){
  if(kind!=='button-swap')throw new Error(`Unsupported PLENO effect: ${kind}`);
  root=typeof root==='string'?document.querySelector(root):root;
  if(!root)throw new Error('PLENO Button Color root not found');
  const link=root.matches?.('a')?root:root.querySelector('a.target, a.pleno-button-color');
  if(!link)throw new Error('PLENO Button Color requires a link root or a link.target');
  const controller=new AbortController(),{signal}=controller;
  const on=(element,type,handler,options={})=>element?.addEventListener(type,handler,{...options,signal});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const label=options.label||link.dataset.label||link.textContent.trim()||'CONTACT';
  const variant=options.variant||link.dataset.variant;
  link.classList.add('pleno-button-color');
  link.classList.toggle('pleno-button-color--large',variant==='large');
  link.classList.toggle('pleno-button-color--plane',variant==='plane');
  link.setAttribute('aria-label',link.getAttribute('aria-label')||label);
  link.innerHTML=markup(label);
  const letters=[...link.querySelectorAll('.pleno-button-color__letter')];
  const speed=options.speed??80,duration=options.revealDuration??500,intensity=options.intensity??.8,exponent=options.exponent??2.6;
  let timer=0,previewTimer=0;
  const flicker=()=>{
    if(reduced)return;
    clearInterval(timer);const start=performance.now();
    link.classList.remove('is-flickering');void link.offsetWidth;link.classList.add('is-flickering');
    timer=setInterval(()=>{const progress=Math.min(1,(performance.now()-start)/duration);letters.forEach((letter,index)=>{const stagger=index/Math.max(1,letters.length-1);const revealed=Math.min(1,Math.max(0,(progress-stagger*.18)/.82));letter.style.setProperty('--flicker',String(Math.pow(Math.random(),exponent)*intensity*(1-revealed)))});if(progress===1){clearInterval(timer);letters.forEach(letter=>letter.style.removeProperty('--flicker'));link.classList.remove('is-flickering')}},speed);
  };
  const replay=()=>{
    flicker();
    if(reduced)return;
    clearTimeout(previewTimer);link.classList.remove('is-preview');void link.offsetWidth;link.classList.add('is-preview');
    previewTimer=setTimeout(()=>link.classList.remove('is-preview'),1400);
  };
  on(link,'pointerenter',event=>{if(event.pointerType!=='touch')flicker()});on(link,'focusin',flicker);
  on(link,'pointerdown',()=>link.classList.add('is-tap'));on(link,'pointerup',()=>link.classList.remove('is-tap'));on(link,'pointercancel',()=>link.classList.remove('is-tap'));
  const replayButton=root===link?null:root.querySelector('.pleno-button-replay');
  on(replayButton,'click',replay);
  return {root, replay, destroy(){clearInterval(timer);clearTimeout(previewTimer);link.classList.remove('is-preview');controller.abort()}};
}

export default createPlenoEffect;
