import { createPlenoEffect } from './runtime.js';
export class PlenoFlickerTextReveal{constructor(root,options={}){this.instance=createPlenoEffect(root,'flicker-text',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoFlickerTextReveal;
