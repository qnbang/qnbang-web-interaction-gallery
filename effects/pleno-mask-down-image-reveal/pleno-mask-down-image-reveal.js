import { createPlenoEffect } from './runtime.js';
export class PlenoMaskDownImageReveal{constructor(root,options={}){this.instance=createPlenoEffect(root,'mask-down',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoMaskDownImageReveal;
