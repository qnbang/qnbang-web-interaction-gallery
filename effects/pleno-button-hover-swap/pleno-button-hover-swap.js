import { createPlenoEffect } from './runtime.js';
/** PLENO Button Color: root 또는 그 안의 .target 링크를 초기화합니다. */
export class PlenoButtonHoverSwap{constructor(root,options={}){this.instance=createPlenoEffect(root,'button-swap',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoButtonHoverSwap;
