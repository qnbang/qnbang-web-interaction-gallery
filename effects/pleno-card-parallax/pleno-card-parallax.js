import { createPlenoEffect } from './runtime.js';
export class PlenoCardParallax{constructor(root,options={}){this.instance=createPlenoEffect(root,'card-parallax',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoCardParallax;
