import { createPlenoEffect } from './runtime.js';
export class PlenoTextMaskReveal{constructor(root,options={}){this.instance=createPlenoEffect(root,'text-mask',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoTextMaskReveal;
