import { createPlenoEffect } from './runtime.js';
export class PlenoButtonHoverSwap{constructor(root,options={}){this.instance=createPlenoEffect(root,'button-swap',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoButtonHoverSwap;
