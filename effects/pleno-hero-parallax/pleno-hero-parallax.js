import { createPlenoEffect } from './runtime.js';
export class PlenoHeroParallax{constructor(root,options={}){this.instance=createPlenoEffect(root,'hero-parallax',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoHeroParallax;
